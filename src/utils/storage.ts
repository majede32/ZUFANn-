import { MangaChapter, MangaPageTranslation } from '../types/manga';

export interface HistoryItem {
  id: string;
  title: string;
  titleArabic: string;
  chapterNumber: string;
  coverImage?: string;
  lastPage: number;
  totalPages: number;
  lastReadAt: number;
  sourceUrl?: string;
}

const HISTORY_KEY = 'manga_reader_history_v1';
const FAVORITES_KEY = 'manga_reader_favorites_v1';
const CLIENT_CACHE_KEY_PREFIX = 'manga_page_cache_';

// History Helpers
export function getReadingHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReadingProgress(chapter: MangaChapter, pageNumber: number): void {
  try {
    const list = getReadingHistory();
    const existingIndex = list.findIndex((h) => h.id === chapter.id);
    const item: HistoryItem = {
      id: chapter.id,
      title: chapter.title,
      titleArabic: chapter.titleArabic || chapter.title,
      chapterNumber: chapter.chapterNumber,
      coverImage: chapter.coverImage || chapter.pages[0]?.imageUrl,
      lastPage: pageNumber,
      totalPages: chapter.pages.length,
      lastReadAt: Date.now(),
      sourceUrl: chapter.sourceUrl,
    };

    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
    }
    list.unshift(item);
    // Keep last 30 items
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (err) {
    console.warn('Failed to save reading history', err);
  }
}

export function clearReadingHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('Failed to clear history', err);
  }
}

// Favorites Helpers
export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(chapterId: string): boolean {
  try {
    const favs = getFavorites();
    const index = favs.indexOf(chapterId);
    let isFav = false;
    if (index >= 0) {
      favs.splice(index, 1);
      isFav = false;
    } else {
      favs.push(chapterId);
      isFav = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return isFav;
  } catch {
    return false;
  }
}

// Client-side Page Translation Cache
export function getCachedPageTranslation(cacheKey: string): MangaPageTranslation | null {
  try {
    const raw = localStorage.getItem(CLIENT_CACHE_KEY_PREFIX + cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.translation || null;
  } catch {
    return null;
  }
}

export function setCachedPageTranslation(cacheKey: string, translation: MangaPageTranslation): void {
  try {
    localStorage.setItem(
      CLIENT_CACHE_KEY_PREFIX + cacheKey,
      JSON.stringify({ timestamp: Date.now(), translation })
    );
  } catch (err) {
    // If quota exceeded, clean oldest entries
    console.warn('Client storage full, skipping local cache entry', err);
  }
}
