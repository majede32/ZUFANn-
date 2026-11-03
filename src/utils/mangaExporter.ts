import JSZip from 'jszip';
import { MangaChapter, MangaDialogue, MangaPage, ReaderSettings } from '../types/manga';

// Helper to load image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('فشل تحميل صورة الصفحة'));
    img.src = src;
  });
}

// Word wrapping helper for Arabic text on canvas
function wrapArabicText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Render a single manga page with burned-in Arabic dialogue onto a canvas
export async function renderPageToCanvas(
  page: MangaPage,
  settings: ReaderSettings
): Promise<HTMLCanvasElement> {
  const img = await loadImage(page.imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('تعذر إنشاء سياق رسم Canvas');
  }

  // 1. Draw base comic image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const dialogues = page.translatedData?.dialogues || page.precomputedTranslations || [];
  if (dialogues.length === 0) {
    return canvas;
  }

  // Choose Font
  const fontFamily =
    settings.arabicFont === 'amiri'
      ? 'Amiri, serif'
      : settings.arabicFont === 'tajawal'
      ? 'Tajawal, sans-serif'
      : 'Cairo, sans-serif';

  // Draw dialogue inpainting masks and Arabic text
  for (const dlg of dialogues) {
    const [ymin, xmin, ymax, xmax] = dlg.box_2d || [0, 0, 0, 0];

    // Compute pixel coordinates
    const top = (ymin / 1000) * canvas.height;
    const left = (xmin / 1000) * canvas.width;
    const rawW = ((xmax - xmin) / 1000) * canvas.width;
    const rawH = ((ymax - ymin) / 1000) * canvas.height;

    // Center point
    const cx = left + rawW / 2;
    const cy = top + rawH / 2;

    // Minimum width based on text length to avoid vertical collapse
    const textLen = (dlg.arabicTranslation || '').length;
    let targetW = Math.max(rawW, canvas.width * 0.18);
    if (textLen > 40) targetW = Math.max(targetW, canvas.width * 0.35);
    else if (textLen > 20) targetW = Math.max(targetW, canvas.width * 0.25);

    // Bounding dimensions with padding
    const padX = 14;
    const padY = 10;
    const boxW = Math.min(canvas.width * 0.92, targetW + padX * 2);

    // Font sizing
    const baseFontSize = Math.max(
      14,
      Math.min(32, Math.round((canvas.width / 800) * (textLen > 50 ? 15 : textLen > 25 ? 18 : 22)))
    );
    const lineHeight = baseFontSize * 1.35;

    ctx.font = `bold ${baseFontSize}px ${fontFamily}`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate wrapped text lines
    const maxTextW = Math.max(40, boxW - padX * 2);
    const lines = wrapArabicText(ctx, dlg.arabicTranslation, maxTextW);
    const textBlockH = lines.length * lineHeight;
    const boxH = Math.max(rawH, textBlockH + padY * 2);

    const bx = cx - boxW / 2;
    const by = cy - boxH / 2;
    const radius = Math.min(boxH / 2, 24);

    // Inpainting Mask (Opaque white background with subtle border)
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = dlg.type === 'shout' ? '#000000' : '#1c1917';
    ctx.lineWidth = dlg.type === 'shout' ? 3 : 1.5;

    // Draw rounded capsule/pill bubble
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, radius);
    ctx.fill();
    ctx.stroke();

    // Draw Arabic Text lines
    ctx.fillStyle = '#0a0a0a';
    const startY = cy - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, cx, startY + index * lineHeight);
    });

    ctx.restore();
  }

  return canvas;
}

// Download canvas as image file
export async function downloadPageAsPng(
  page: MangaPage,
  chapterTitle: string,
  settings: ReaderSettings
): Promise<void> {
  const canvas = await renderPageToCanvas(page, settings);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );

  if (!blob) throw new Error('فشل تصدير الصورة');

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = chapterTitle.replace(/[^\w\u0600-\u06FF-]/g, '_');
  a.download = `${safeName}_صفحة_${page.pageNumber}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download entire chapter as ZIP containing all translated pages
export async function downloadChapterAsZip(
  chapter: MangaChapter,
  settings: ReaderSettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(chapter.titleArabic || chapter.title || 'Manga_Chapter');

  const total = chapter.pages.length;
  for (let i = 0; i < total; i++) {
    const page = chapter.pages[i];
    if (onProgress) onProgress(i + 1, total);

    try {
      const canvas = await renderPageToCanvas(page, settings);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64Data = dataUrl.split(',')[1];
      const pageIndex = String(page.pageNumber).padStart(3, '0');
      folder?.file(`page_${pageIndex}.jpg`, base64Data, { base64: true });
    } catch (err) {
      console.warn(`Could not render page ${page.pageNumber} for ZIP:`, err);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (chapter.titleArabic || chapter.title || 'Manga').replace(
    /[^\w\u0600-\u06FF-]/g,
    '_'
  );
  a.download = `${safeName}_فصل_${chapter.chapterNumber}_مترجم.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
