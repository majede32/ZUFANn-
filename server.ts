import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { isSafeUrl, createRateLimiter } from './src/server/security.ts';
import { SAMPLE_CHAPTERS } from './src/data/sampleChapters.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enforce safe 15MB payload size limit
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Trust proxy headers for accurate client IP in rate limiting
app.set('trust proxy', 1);

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Translation Cache (In-Memory + Persistent Disk Cache that survives restarts)
interface CachedTranslation {
  timestamp: number;
  data: any;
}
const translationCache = new Map<string, CachedTranslation>();
const CACHE_DIR = path.join(__dirname, 'data', 'cache', 'translations');

try {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} catch (e) {
  console.warn('Failed to initialize cache directory', e);
}

async function getCachedTranslation(hash: string): Promise<any | null> {
  // 1. Check in-memory map
  const mem = translationCache.get(hash);
  if (mem && Date.now() - mem.timestamp < 7 * 24 * 60 * 60 * 1000) {
    return mem.data;
  }

  // 2. Check persistent disk file
  try {
    const filePath = path.join(CACHE_DIR, `${hash}.json`);
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.data && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        translationCache.set(hash, {
          timestamp: parsed.timestamp,
          data: parsed.data,
        });
        return parsed.data;
      }
    }
  } catch (err) {
    console.warn(`Error reading disk cache for hash ${hash}:`, err);
  }
  return null;
}

async function saveCachedTranslation(hash: string, data: any): Promise<void> {
  const item: CachedTranslation = {
    timestamp: Date.now(),
    data,
  };
  translationCache.set(hash, item);
  try {
    const filePath = path.join(CACHE_DIR, `${hash}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(item), 'utf-8');
  } catch (err) {
    console.warn(`Failed to write disk cache for hash ${hash}:`, err);
  }
}

// Rate limiters
const proxyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'تم تجاوز الحد الأقصى لجلب الصور مؤقتاً، يرجى الانتظار دقيقة واحدة.',
});

const scrapeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 25,
  message: 'تم تجاوز الحد المسموح به لجلب الفصول، يرجى الانتظار دقيقة واحدة.',
});

const translateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 35,
  message: 'تم تجاوز الحد المسموح به لطلبات الترجمة مؤقتاً، يرجى الانتظار دقيقة واحدة.',
});

// Helper: Promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = 'انتهت مهلة الطلب'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
  ]);
}

// 1. Image Proxy endpoint with robust SSRF protection and size bounds
app.get('/api/proxy-image', proxyRateLimiter, async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('Image URL parameter is required');
  }

  // SSRF Protection Check
  const urlCheck = await isSafeUrl(imageUrl);
  if (!urlCheck.safe) {
    return res.status(403).send(`Forbidden: ${urlCheck.reason || 'Invalid or prohibited destination URL'}`);
  }

  try {
    const parsed = new URL(imageUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': parsed.origin + '/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: status ${response.status}`);
    }

    // Verify Content-Type is actually an image
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res
        .status(415)
        .send('Unsupported Media Type: The requested resource is not an image');
    }

    // Verify response length under 15MB
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > 15 * 1024 * 1024) {
      return res.status(413).send('Payload Too Large: Image exceeds 15MB limit');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > 15 * 1024 * 1024) {
      return res.status(413).send('Payload Too Large: Image exceeds 15MB limit');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.send(buffer);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(504).send('Gateway Timeout: The target server took too long to respond');
    }
    return res.status(500).send(err.message || 'Error proxying image');
  }
});

// 2. Fetch chapter endpoint with SSRF protection, honest error reporting, and no secret fallbacks
app.post('/api/manga/fetch-chapter', scrapeRateLimiter, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'يرجى إدخال رابط الفصل' });
  }

  // SSRF Protection Check
  const urlCheck = await isSafeUrl(url);
  if (!urlCheck.safe) {
    return res.status(403).json({
      success: false,
      error: urlCheck.reason || 'الرابط المدخل غير مسموح به لأسباب أمنية',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const scrapeRes = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': new URL(url).origin,
      },
    });
    clearTimeout(timeoutId);

    const html = await scrapeRes.text();

    // Detect Cloudflare WAF or Turnstile challenge
    if (
      html.includes('Just a moment...') ||
      html.includes('cf_chl') ||
      html.includes('cloudflare') ||
      html.includes('Cloudflare Ray ID')
    ) {
      return res.status(403).json({
        success: false,
        isCloudflareBlocked: true,
        error:
          'الموقع المستهدف محمي بنظام Cloudflare Turnstile ضد السحب البرمجي. يُرجى استخدام ميزة "رفع صفحات المانجا" (Upload) لترجمة أي صورة بدقة عالية وبدون حظر، أو تجربة أحد الفصول النموذجية الجاهزة.',
      });
    }

    const $ = cheerio.load(html);
    const title =
      $('h1#chapter-heading, .entry-title, .breadcrumb li:nth-child(2), h1').first().text().trim() ||
      'Manga Chapter';
    const chapterTitle =
      $('h1#chapter-heading, .breadcrumb li:last-child').first().text().trim() || title;

    const imageUrls: string[] = [];
    const selectors = [
      '.reading-content img',
      '.page-break img',
      '.wp-manga-chapter-img',
      '#readerarea img',
      '.container-chapter-reader img',
      '.reader-area img',
      'img[data-src]',
      'img[src*="chapter"]',
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const src =
          $(el).attr('data-src') || $(el).attr('src') || $(el).attr('data-lazy-src');
        if (src) {
          const cleanSrc = src.trim().split(' ')[0];
          if (
            cleanSrc.startsWith('http') &&
            !imageUrls.includes(cleanSrc) &&
            !cleanSrc.includes('logo') &&
            !cleanSrc.includes('banner')
          ) {
            imageUrls.push(cleanSrc);
          }
        }
      });
      if (imageUrls.length >= 3) break;
    }

    if (imageUrls.length === 0) {
      return res.status(404).json({
        success: false,
        error:
          'لم يتم العثور على صور صفحات في هذا الرابط. قد يحتاج الموقع إلى تسجيل دخول أو استخدام جافاسكريبت معقدة. جرّب رفع الصور مباشرة عبر ميزة الرفع.',
      });
    }

    let prevChapterUrl: string | undefined;
    let nextChapterUrl: string | undefined;

    // Detect next and previous chapter navigation links
    $('a[href*="chapter"], a.next_page, a.prev_page, .nav-previous a, .nav-next a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().toLowerCase();
      const rel = $(el).attr('rel') || '';
      if (href && href.startsWith('http') && href !== url) {
        if (text.includes('next') || text.includes('التالي') || rel.includes('next')) {
          if (!nextChapterUrl) nextChapterUrl = href;
        } else if (text.includes('prev') || text.includes('السابق') || rel.includes('prev')) {
          if (!prevChapterUrl) prevChapterUrl = href;
        }
      }
    });

    const scrapedChapter = {
      id: 'scraped-' + Date.now(),
      title,
      titleArabic: title,
      chapterNumber: '1',
      chapterTitle,
      chapterTitleArabic: chapterTitle,
      sourceUrl: url,
      prevChapterUrl,
      nextChapterUrl,
      coverImage: `/api/proxy-image?url=${encodeURIComponent(imageUrls[0])}`,
      pages: imageUrls.map((img, idx) => ({
        pageNumber: idx + 1,
        imageUrl: `/api/proxy-image?url=${encodeURIComponent(img)}`,
        originalUrl: img,
        caption: `الصفحة ${idx + 1}`,
        precomputedTranslations: [],
        termsExplained: [],
      })),
    };

    return res.json({
      success: true,
      chapter: scrapedChapter,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'انتهت مهلة الاتصال بالموقع (تجاوزت 12 ثانية).',
      });
    }
    return res.status(502).json({
      success: false,
      error: `تعذر الاتصال بالموقع المطلوب: ${err.message || 'خطأ في الشبكة'}`,
    });
  }
});

// 3. Get verified Sample Chapters
app.get('/api/manga/samples', (req, res) => {
  return res.json({
    success: true,
    chapters: SAMPLE_CHAPTERS,
  });
});

// 3.5. Translate custom or selected text (called by translateCustomText)
app.post('/api/manga/translate-text', translateRateLimiter, async (req, res) => {
  const { text, context } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'النص المطلوب ترجمته فارغ' });
  }

  if (!ai) {
    return res.status(401).json({
      success: false,
      error: 'مفتاح Gemini API غير متوفر في متغيرات البيئة.',
    });
  }

  try {
    const prompt = `You are a professional manga/manhwa typesetter and translator.
Translate this dialogue accurately into natural, evocative Modern Standard Arabic suited for manga/comics.
Original dialogue: "${text}"
${context ? `Context: ${context}` : ''}
Provide only the Arabic translation directly, with no surrounding explanations or quotes.`;

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const response = await withTimeout(geminiCall, 15000, 'انتهت مهلة ترجمة النص');
    const arabicTranslation = response.text ? response.text.trim() : text;

    return res.json({
      success: true,
      arabicTranslation,
    });
  } catch (err: any) {
    console.error('Text translation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'فشلت ترجمة النص',
    });
  }
});

// 4. Translate Manga Page using Gemini Vision with honest errors, persistent SHA-256 caching, and structured schema
app.post('/api/manga/translate-page', translateRateLimiter, async (req, res) => {
  const { imageSource, pageNumber } = req.body;
  const pageNum = parseInt(pageNumber, 10) || 1;

  if (!imageSource || typeof imageSource !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'مصدر صورة الصفحة مطلوب لإجراء الترجمة',
    });
  }

  // Check if Gemini API key is configured
  if (!ai) {
    return res.status(401).json({
      success: false,
      error:
        'مفتاح Gemini API غير متوفر في متغيرات البيئة. يرجى تفعيل أو ربط مفتاحك من قائمة Settings > Secrets في لوحة التحكم لتشغيل الترجمة الآلية.',
    });
  }

  try {
    let base64Data = '';
    let mimeType = 'image/webp';

    if (imageSource.startsWith('data:')) {
      const parts = imageSource.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    } else if (imageSource.startsWith('/api/proxy-image?url=')) {
      const realUrl = decodeURIComponent(imageSource.replace('/api/proxy-image?url=', ''));

      // Validate URL before downloading
      const urlCheck = await isSafeUrl(realUrl);
      if (!urlCheck.safe) {
        return res.status(403).json({
          success: false,
          error: `رابط الصورة غير مسموح به لأسباب أمنية: ${urlCheck.reason}`,
        });
      }

      const imgRes = await fetch(realUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': new URL(realUrl).origin + '/',
        },
      });

      if (!imgRes.ok) {
        return res.status(502).json({
          success: false,
          error: `تعذر تنزيل صورة الصفحة من المصدر (رمز الاستجابة: ${imgRes.status})`,
        });
      }

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      if (buffer.byteLength > 15 * 1024 * 1024) {
        return res.status(413).json({
          success: false,
          error: 'حجم صورة الصفحة يتجاوز الحد المسموح به (15 ميغابايت)',
        });
      }

      base64Data = buffer.toString('base64');
      mimeType = imgRes.headers.get('content-type') || 'image/webp';
    } else if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      const urlCheck = await isSafeUrl(imageSource);
      if (!urlCheck.safe) {
        return res.status(403).json({
          success: false,
          error: `رابط الصورة غير مسموح به لأسباب أمنية: ${urlCheck.reason}`,
        });
      }

      const imgRes = await fetch(imageSource, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': new URL(imageSource).origin + '/',
        },
      });

      if (!imgRes.ok) {
        return res.status(502).json({
          success: false,
          error: `تعذر جلب صورة الصفحة (رمز الاستجابة: ${imgRes.status})`,
        });
      }

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      base64Data = buffer.toString('base64');
      mimeType = imgRes.headers.get('content-type') || 'image/webp';
    }

    if (!base64Data) {
      return res.status(400).json({
        success: false,
        error: 'لم نتمكن من استخراج بيانات الصورة للتحليل',
      });
    }

    // Compute SHA-256 hash for persistent cache lookup
    const imageHash = crypto.createHash('sha256').update(base64Data).digest('hex');
    const cachedData = await getCachedTranslation(imageHash);

    if (cachedData) {
      return res.json({
        success: true,
        translation: cachedData,
        cached: true,
      });
    }

    // Call Gemini with generous 25-second timeout and structured schema
    const promptText = `You are a professional comic and webtoon typesetter and translator.
Task:
1. Examine this comic page image. Detect all speech bubbles, dialogue boxes, thought bubbles, and sound effect texts.
2. For each dialogue, detect its 2D bounding box [ymin, xmin, ymax, xmax] normalized on a scale from 0 to 1000:
   - ymin: top percentage * 10
   - xmin: left percentage * 10
   - ymax: bottom percentage * 10
   - xmax: right percentage * 10
   The box MUST fully enclose all of the original text of that bubble or caption (with a small margin) so it can be completely covered by the Arabic text. Do not omit any text, including captions, narration boxes and sound effects.
3. Extract the original text in the speech bubble.
4. Translate it accurately and naturally into Modern Standard Arabic suited for manga/manhwa. Preserve emotional tone and character personality.
5. Provide a short pageSummary in Arabic, and explain any martial arts, fantasy, or historical terminology in termsExplained.`;

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pageSummary: {
              type: Type.STRING,
              description: 'ملخص موجز لمجريات وأحداث هذه الصفحة باللغة العربية',
            },
            readingDirection: {
              type: Type.STRING,
              description: 'top-down or right-to-left',
            },
            dialogues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] between 0 and 1000',
                  },
                  originalText: { type: Type.STRING },
                  arabicTranslation: { type: Type.STRING },
                  speaker: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    description: 'speech, thought, shout, narration, or sfx',
                  },
                  tone: {
                    type: Type.STRING,
                    description: 'angry, calm, shocked, whisper, or determined',
                  },
                },
                required: ['box_2d', 'originalText', 'arabicTranslation'],
              },
            },
            termsExplained: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['term', 'explanation'],
              },
            },
          },
          required: ['dialogues'],
        },
      },
    });

    const response = await withTimeout(
      geminiCall,
      25000,
      'استغرقت المعالجة بالذكاء الاصطناعي وقتاً أطول من المتوقع (25 ثانية). يرجى الضغط على زر إعادة المحاولة.'
    );

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'لم نتمكن من تحليل استجابة الذكاء الاصطناعي بصيغة JSON صحيحة. يرجى إعادة المحاولة.',
      });
    }

    // Validate dialogues array
    if (!parsed.dialogues || !Array.isArray(parsed.dialogues)) {
      parsed.dialogues = [];
    }

    // Ensure IDs and valid box_2d coordinates
    parsed.dialogues = parsed.dialogues.map((dlg: any, idx: number) => {
      const box = Array.isArray(dlg.box_2d) && dlg.box_2d.length === 4 ? dlg.box_2d : [300, 200, 440, 800];
      return {
        id: dlg.id || `p${pageNum}-d${idx + 1}-${Date.now()}`,
        box_2d: [
          Math.max(0, Math.min(1000, Number(box[0]) || 0)),
          Math.max(0, Math.min(1000, Number(box[1]) || 0)),
          Math.max(0, Math.min(1000, Number(box[2]) || 100)),
          Math.max(0, Math.min(1000, Number(box[3]) || 100)),
        ],
        originalText: dlg.originalText || '',
        arabicTranslation: dlg.arabicTranslation || '',
        speaker: dlg.speaker || 'حوار',
        type: dlg.type || 'speech',
        tone: dlg.tone || 'calm',
      };
    });

    // Save into persistent disk & memory cache
    await saveCachedTranslation(imageHash, parsed);

    return res.json({
      success: true,
      translation: parsed,
      cached: false,
    });
  } catch (err: any) {
    console.error(`Gemini translation error for page ${pageNum}:`, err);

    let clientMessage = err.message || 'حدث خطأ غير متوقع أثناء معالجة الصفحة';
    let statusCode = 502;

    if (clientMessage.includes('PERMISSION_DENIED') || clientMessage.includes('API_KEY_INVALID')) {
      clientMessage =
        'مفتاح Gemini API غير صالح أو غير مصرح له. يرجى التأكد من المفتاح في إعدادات التطبيق Settings > Secrets.';
      statusCode = 403;
    } else if (clientMessage.includes('RESOURCE_EXHAUSTED')) {
      clientMessage =
        'تم استنفاد الحصة المخصصة لنموذج Gemini حالياً. يرجى الانتظار دقيقة ثم إعادة المحاولة، أو الترقية لمفتاح مدفوع.';
      statusCode = 429;
    } else if (clientMessage.includes('مهلة')) {
      statusCode = 504;
    }

    return res.status(statusCode).json({
      success: false,
      error: clientMessage,
    });
  }
});

// Setup Vite middleware or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
