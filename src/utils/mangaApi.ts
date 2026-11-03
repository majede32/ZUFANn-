import { MangaChapter, MangaPageTranslation } from '../types/manga';

export async function fetchChapterFromUrl(url: string): Promise<{ success: boolean; chapter: MangaChapter; warning?: string }> {
  const response = await fetch('/api/manga/fetch-chapter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'فشل في تحميل الفصل من الرابط المحدد');
  }

  return response.json();
}

export async function fetchSampleChapters(): Promise<MangaChapter[]> {
  const response = await fetch('/api/manga/samples');
  if (!response.ok) {
    throw new Error('فشل في جلب الفصول النموذجية');
  }
  const data = await response.json();
  return data.chapters || [];
}

export async function translatePage(
  imageSource: string,
  pageNumber: number,
  chapterTitle: string
): Promise<MangaPageTranslation> {
  const response = await fetch('/api/manga/translate-page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageSource,
      pageNumber,
      chapterTitle,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'فشلت الترجمة بواسطة Gemini');
  }

  return data.translation;
}

export async function translateCustomText(text: string, context?: string): Promise<string> {
  const response = await fetch('/api/manga/translate-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'فشلت ترجمة النص');
  }

  return data.arabicTranslation;
}

// Browser Text-To-Speech for Arabic dialogue
export function speakArabic(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
