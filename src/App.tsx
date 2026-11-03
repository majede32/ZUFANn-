import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  ArrowUp,
  Sliders,
  Globe,
  Upload,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ChapterBar } from './components/ChapterBar';
import { PageReader } from './components/PageReader';
import { UrlBarModal } from './components/UrlBarModal';
import { GlossaryDrawer } from './components/GlossaryDrawer';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { UploadModal } from './components/UploadModal';
import { MangaChapter, MangaPage, ReaderSettings } from './types/manga';
import { fetchChapterFromUrl, fetchSampleChapters, translatePage } from './utils/mangaApi';
import { SAMPLE_CHAPTERS } from './data/sampleChapters';

const INITIAL_CHAPTER: MangaChapter = SAMPLE_CHAPTERS[0];

export default function App() {
  const [currentChapter, setCurrentChapter] = useState<MangaChapter>(INITIAL_CHAPTER);
  const [availableChapters, setAvailableChapters] = useState<MangaChapter[]>(SAMPLE_CHAPTERS);
  const [singlePageIndex, setSinglePageIndex] = useState<number>(0);

  // Settings
  const [settings, setSettings] = useState<ReaderSettings>({
    readingMode: 'webtoon',
    overlayMode: 'bubble',
    arabicFont: 'cairo',
    bubbleTheme: 'manga-typeset',
    bubbleFontSize: 'md',
    bubbleOpacity: 1.0,
    maskCoverage: 'extended',
    showOriginalOnHover: true,
    autoTranslatePages: false,
    zoom: 1.0,
    fitMode: 'width',
  });

  // Modals & Drawers
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Loading States
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [urlError, setUrlError] = useState<string | undefined>();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch sample chapters on mount
  useEffect(() => {
    fetchSampleChapters()
      .then((chapters) => {
        if (chapters && chapters.length > 0) {
          setAvailableChapters(chapters);
        }
      })
      .catch((err) => console.warn('Could not load extra samples', err));
  }, []);

  // Track scroll for "Scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Settings Helper
  const handleUpdateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Translate a specific page using Gemini
  const handleTranslatePage = async (pageNumber: number) => {
    const pageIndex = currentChapter.pages.findIndex((p) => p.pageNumber === pageNumber);
    if (pageIndex === -1) return;

    const page = currentChapter.pages[pageIndex];

    // Mark as translating
    setCurrentChapter((prev) => {
      const updatedPages = [...prev.pages];
      updatedPages[pageIndex] = { ...updatedPages[pageIndex], isTranslating: true, error: undefined };
      return { ...prev, pages: updatedPages };
    });

    try {
      const translation = await translatePage(
        page.imageUrl,
        page.pageNumber,
        currentChapter.titleArabic || currentChapter.title
      );

      setCurrentChapter((prev) => {
        const updatedPages = [...prev.pages];
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          isTranslating: false,
          translatedData: translation,
          termsExplained: translation.termsExplained,
        };
        return { ...prev, pages: updatedPages };
      });
    } catch (err: any) {
      setCurrentChapter((prev) => {
        const updatedPages = [...prev.pages];
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          isTranslating: false,
          error: err.message || 'حدث خطأ أثناء ترجمة الصفحة',
        };
        return { ...prev, pages: updatedPages };
      });
    }
  };

  // Translate All Pages Sequentially
  const handleTranslateAllPages = async () => {
    if (isTranslatingAll) return;
    setIsTranslatingAll(true);

    for (const page of currentChapter.pages) {
      const hasTranslation =
        (page.translatedData?.dialogues && page.translatedData.dialogues.length > 0) ||
        (page.precomputedTranslations && page.precomputedTranslations.length > 0);

      if (!hasTranslation) {
        await handleTranslatePage(page.pageNumber);
      }
    }

    setIsTranslatingAll(false);
  };

  // Fetch chapter from user URL
  const handleFetchUrl = async (url: string) => {
    setIsLoadingChapter(true);
    setUrlError(undefined);

    try {
      const res = await fetchChapterFromUrl(url);
      if (res.chapter) {
        setCurrentChapter(res.chapter);
        setAvailableChapters((prev) => {
          if (!prev.find((c) => c.id === res.chapter.id)) {
            return [res.chapter, ...prev];
          }
          return prev;
        });
        setSinglePageIndex(0);
        setIsUrlModalOpen(false);
      }
    } catch (err: any) {
      setUrlError(err.message || 'فشل في استخراج صفحات الفصل من الرابط');
    } finally {
      setIsLoadingChapter(false);
    }
  };

  // Handle Custom Uploaded Pages
  const handleCustomPagesAdded = (pages: MangaPage[], title: string) => {
    const customChapter: MangaChapter = {
      id: 'custom-' + Date.now(),
      title: title,
      titleArabic: title,
      chapterNumber: '1',
      chapterTitle: title,
      chapterTitleArabic: title,
      coverImage: pages[0]?.imageUrl,
      pages: pages,
    };

    setCurrentChapter(customChapter);
    setAvailableChapters((prev) => [customChapter, ...prev]);
    setSinglePageIndex(0);
  };

  // Compute stats
  const totalTranslatedCount = currentChapter.pages.filter(
    (p) =>
      (p.translatedData?.dialogues && p.translatedData.dialogues.length > 0) ||
      (p.precomputedTranslations && p.precomputedTranslations.length > 0)
  ).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-cairo" dir="rtl">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenUrlModal={() => setIsUrlModalOpen(true)}
        currentChapterTitle={currentChapter.titleArabic}
      />

      {/* 2. Reader Control & Chapter Navigation Bar */}
      <ChapterBar
        currentChapter={currentChapter}
        availableChapters={availableChapters}
        onSelectChapter={(ch) => {
          setCurrentChapter(ch);
          setSinglePageIndex(0);
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onTranslateAllPages={handleTranslateAllPages}
        isTranslatingAll={isTranslatingAll}
        totalTranslated={totalTranslatedCount}
        totalPages={currentChapter.pages.length}
      />

      {/* 3. Main Reading Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-6">
        {settings.readingMode === 'webtoon' ? (
          // Webtoon Continuous Scroll Mode
          <div className="flex flex-col items-center gap-2">
            {currentChapter.pages.map((page) => (
              <PageReader
                key={`${currentChapter.id}-${page.pageNumber}`}
                page={page}
                chapterTitle={currentChapter.titleArabic || currentChapter.title}
                settings={settings}
                onTranslatePage={handleTranslatePage}
              />
            ))}
          </div>
        ) : (
          // Single Page Mode
          <div className="flex flex-col items-center">
            {currentChapter.pages[singlePageIndex] && (
              <PageReader
                page={currentChapter.pages[singlePageIndex]}
                chapterTitle={currentChapter.titleArabic || currentChapter.title}
                settings={settings}
                onTranslatePage={handleTranslatePage}
              />
            )}

            {/* Single Page Pagination Footer */}
            <div className="flex items-center justify-center gap-4 mt-6 p-2 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <button
                onClick={() => setSinglePageIndex(Math.max(0, singlePageIndex - 1))}
                disabled={singlePageIndex === 0}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الصفحة السابقة</span>
              </button>

              <span className="text-xs font-mono text-neutral-300">
                {singlePageIndex + 1} / {currentChapter.pages.length}
              </span>

              <button
                onClick={() =>
                  setSinglePageIndex(
                    Math.min(currentChapter.pages.length - 1, singlePageIndex + 1)
                  )
                }
                disabled={singlePageIndex === currentChapter.pages.length - 1}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>الصفحة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chapter End Navigation Card */}
        <div className="max-w-xl mx-auto mt-12 mb-8 p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl text-center flex flex-col items-center gap-3 shadow-xl">
          <BookOpen className="w-8 h-8 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            وصلت إلى نهاية {currentChapter.chapterTitleArabic || currentChapter.chapterTitle}
          </h3>
          <p className="text-xs text-neutral-400">
            يمكنك تصفح فصول أخرى أو إدخال رابط فصل جديد من موقع المانجا مباشرة
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setIsUrlModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span>جلب فصل جديد من رابط</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-30 p-3 bg-amber-500 text-neutral-950 hover:bg-amber-400 rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer"
          title="العودة لأعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* 4. Modals and Drawers */}
      <UrlBarModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onFetchUrl={handleFetchUrl}
        sampleChapters={availableChapters}
        onSelectSample={(ch) => {
          setCurrentChapter(ch);
          setSinglePageIndex(0);
        }}
        isLoading={isLoadingChapter}
        error={urlError}
      />

      <GlossaryDrawer
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onCustomPagesAdded={handleCustomPagesAdded}
      />
    </div>
  );
}
