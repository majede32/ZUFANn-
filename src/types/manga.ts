export interface MangaDialogue {
  id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  originalText: string;
  arabicTranslation: string;
  speaker?: string;
  type: 'speech' | 'thought' | 'narration' | 'shout' | 'sfx' | string;
  tone?: 'angry' | 'calm' | 'shocked' | 'whisper' | 'determined' | string;
}

export interface MangaTerm {
  term: string;
  explanation: string;
}

export interface MangaPageTranslation {
  pageSummary: string;
  readingDirection?: string;
  dialogues: MangaDialogue[];
  termsExplained?: MangaTerm[];
}

export interface MangaPage {
  pageNumber: number;
  imageUrl: string;
  originalUrl?: string;
  caption?: string;
  precomputedTranslations?: MangaDialogue[];
  termsExplained?: MangaTerm[];
  translatedData?: MangaPageTranslation;
  isTranslating?: boolean;
  error?: string;
}

export interface MangaChapter {
  id: string;
  title: string;
  titleArabic: string;
  chapterNumber: string;
  chapterTitle: string;
  chapterTitleArabic: string;
  sourceUrl?: string;
  coverImage?: string;
  prevChapterUrl?: string;
  nextChapterUrl?: string;
  pages: MangaPage[];
}

export interface ReaderSettings {
  readingMode: 'webtoon' | 'single';
  overlayMode: 'bubble' | 'sideBySide' | 'split';
  arabicFont: 'cairo' | 'tajawal' | 'amiri';
  bubbleTheme: 'manga-typeset' | 'clean-white' | 'modern-dark' | 'tinted-amber' | 'transparent-glow';
  bubbleFontSize: 'sm' | 'md' | 'lg' | 'xl';
  bubbleOpacity: number;
  maskCoverage: 'snug' | 'extended' | 'full';
  showOriginalOnHover: boolean;
  autoTranslatePages: boolean;
  zoom: number; // 60% to 140%
  fitMode: 'width' | 'contain' | 'original';
  editMode?: boolean; // Interactive bubble adjuster mode
}
