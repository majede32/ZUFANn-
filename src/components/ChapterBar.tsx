import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  SlidersHorizontal,
  Pause,
  CheckCircle2
} from 'lucide-react';
import { MangaChapter, ReaderSettings } from '../types/manga';
import { downloadChapterAsZip } from '../utils/mangaExporter';

interface ChapterBarProps {
  currentChapter: MangaChapter;
  availableChapters: MangaChapter[];
  onSelectChapter: (chapter: MangaChapter) => void;
  onFetchUrl?: (url: string) => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  onTranslateAllPages: () => void;
  onCancelTranslateAll?: () => void;
  isTranslatingAll: boolean;
  translatingProgress?: { current: number; total: number };
  totalTranslated: number;
  totalPages: number;
}

export const ChapterBar: React.FC<ChapterBarProps> = ({
  currentChapter,
  availableChapters,
  onSelectChapter,
  onFetchUrl,
  settings,
  onUpdateSettings,
  onTranslateAllPages,
  onCancelTranslateAll,
  isTranslatingAll,
  translatingProgress,
  totalTranslated,
  totalPages,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  const currentIndex = availableChapters.findIndex((c) => c.id === currentChapter.id);
  const hasInternalPrev = currentIndex > 0;
  const hasInternalNext = currentIndex >= 0 && currentIndex < availableChapters.length - 1;

  const canGoPrev = hasInternalPrev || Boolean(currentChapter.prevChapterUrl);
  const canGoNext = hasInternalNext || Boolean(currentChapter.nextChapterUrl);

  const handlePrev = () => {
    if (hasInternalPrev) {
      onSelectChapter(availableChapters[currentIndex - 1]);
    } else if (currentChapter.prevChapterUrl && onFetchUrl) {
      onFetchUrl(currentChapter.prevChapterUrl);
    }
  };

  const handleNext = () => {
    if (hasInternalNext) {
      onSelectChapter(availableChapters[currentIndex + 1]);
    } else if (currentChapter.nextChapterUrl && onFetchUrl) {
      onFetchUrl(currentChapter.nextChapterUrl);
    }
  };

  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      await downloadChapterAsZip(currentChapter, settings, (current, total) => {
        setExportProgress({ current, total });
      });
    } catch (err: any) {
      alert(`حدث خطأ أثناء تصدير الفصل: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setIsExportingZip(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 md:px-8 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Chapter Title & Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              title={currentChapter.prevChapterUrl ? 'جلب الفصل السابق من المصدر' : 'الفصل السابق'}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <select
              value={currentChapter.id}
              onChange={(e) => {
                const found = availableChapters.find((c) => c.id === e.target.value);
                if (found) onSelectChapter(found);
              }}
              className="bg-neutral-800 text-white text-xs md:text-sm font-semibold rounded-xl px-3 py-1.5 border border-neutral-700 focus:outline-none focus:border-amber-500 max-w-xs truncate cursor-pointer"
            >
              {availableChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.titleArabic || ch.title} - {ch.chapterNumber ? `فصل ${ch.chapterNumber}` : ch.chapterTitle}
                </option>
              ))}
              {!availableChapters.some((c) => c.id === currentChapter.id) && (
                <option value={currentChapter.id}>
                  {currentChapter.titleArabic || currentChapter.title}
                </option>
              )}
            </select>

            <button
              onClick={handleNext}
              disabled={!canGoNext}
              title={currentChapter.nextChapterUrl ? 'جلب الفصل التالي من المصدر' : 'الفصل التالي'}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Metadata badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span className="text-neutral-300 font-medium">{currentChapter.titleArabic}</span>
            <span aria-hidden="true">·</span>
            <span>{totalPages} صفحة</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">{totalTranslated} مترجمة</span>
          </div>

          {currentChapter.sourceUrl && (
            <a
              href={currentChapter.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              title="عرض في الموقع الأصلي"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">المصدر الأصلي</span>
            </a>
          )}
        </div>

        {/* Action Controls & Display Modes */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Reading Mode Switcher */}
          <div className="flex items-center p-0.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => onUpdateSettings({ readingMode: 'webtoon' })}
              className={`px-2.5 py-1 font-medium rounded-lg transition-all ${
                settings.readingMode === 'webtoon'
                  ? 'bg-neutral-800 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="تمرير ويب تون رأسي مستمر"
            >
              شريط ويب تون
            </button>
            <button
              onClick={() => onUpdateSettings({ readingMode: 'single' })}
              className={`px-2.5 py-1 font-medium rounded-lg transition-all ${
                settings.readingMode === 'single'
                  ? 'bg-neutral-800 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="تقليب صفحة بصفحة"
            >
              صفحة واحدة
            </button>
          </div>

          {/* Adjust Bubbles Mode Button */}
          <button
            onClick={() => onUpdateSettings({ editMode: !settings.editMode })}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              settings.editMode
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
            }`}
            title="تفعيل وضع ضبط مواضع وأحجام الفقاعات وتحرير الترجمة مباشرة"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{settings.editMode ? 'إنهاء التعديل' : 'تعديل الفقاعات'}</span>
          </button>

          {/* Export Chapter as ZIP */}
          <button
            disabled={isExportingZip}
            onClick={handleExportZip}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-amber-500/50 hover:text-amber-400 transition-all disabled:opacity-50"
            title="تصدير وتحميل صفحات الفصل المترجمة بالكامل كملف ZIP"
          >
            <Download className={`w-3.5 h-3.5 ${isExportingZip ? 'animate-bounce text-amber-400' : ''}`} />
            <span>
              {isExportingZip && exportProgress
                ? `جاري التصدير (${exportProgress.current}/${exportProgress.total})`
                : 'تصدير ZIP'}
            </span>
          </button>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-950 px-1.5 py-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => onUpdateSettings({ zoom: Math.max(0.6, settings.zoom - 0.1) })}
              className="p-1 text-neutral-400 hover:text-white rounded"
              title="تصغير"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-neutral-300 px-1 tabular-nums">
              {Math.round(settings.zoom * 100)}%
            </span>
            <button
              onClick={() => onUpdateSettings({ zoom: Math.min(1.4, settings.zoom + 0.1) })}
              className="p-1 text-neutral-400 hover:text-white rounded"
              title="تكبير"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto Translate Whole Chapter Button with Concurrency Queue & Progress */}
          {isTranslatingAll ? (
            <div className="flex items-center gap-1 bg-amber-600/20 border border-amber-500/40 rounded-xl px-2.5 py-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="text-xs text-amber-300 font-bold">
                {translatingProgress
                  ? `ترجمة (${translatingProgress.current}/${translatingProgress.total})`
                  : 'جاري الترجمة...'}
              </span>
              {onCancelTranslateAll && (
                <button
                  onClick={onCancelTranslateAll}
                  className="p-1 text-neutral-400 hover:text-white rounded"
                  title="إيقاف الترجمة التلقائية"
                >
                  <Pause className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onTranslateAllPages}
              className="px-3.5 py-1.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ترجمة جميع الصفحات</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
