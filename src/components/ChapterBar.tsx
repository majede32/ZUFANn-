import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Columns,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { MangaChapter, ReaderSettings } from '../types/manga';

interface ChapterBarProps {
  currentChapter: MangaChapter;
  availableChapters: MangaChapter[];
  onSelectChapter: (chapter: MangaChapter) => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  onTranslateAllPages: () => void;
  isTranslatingAll: boolean;
  totalTranslated: number;
  totalPages: number;
}

export const ChapterBar: React.FC<ChapterBarProps> = ({
  currentChapter,
  availableChapters,
  onSelectChapter,
  settings,
  onUpdateSettings,
  onTranslateAllPages,
  isTranslatingAll,
  totalTranslated,
  totalPages,
}) => {
  const currentIndex = availableChapters.findIndex((c) => c.id === currentChapter.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < availableChapters.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectChapter(availableChapters[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectChapter(availableChapters[currentIndex + 1]);
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Chapter Title & Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              title="الفصل السابق"
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <select
              value={currentChapter.id}
              onChange={(e) => {
                const found = availableChapters.find((c) => c.id === e.target.value);
                if (found) onSelectChapter(found);
              }}
              className="bg-neutral-800 text-white text-xs md:text-sm font-semibold rounded-lg px-3 py-1.5 border border-neutral-700 focus:outline-none focus:border-amber-500 max-w-xs truncate cursor-pointer"
            >
              {availableChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.titleArabic || ch.title} - {ch.chapterNumber ? `فصل ${ch.chapterNumber}` : ch.chapterTitle}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              disabled={!hasNext}
              title="الفصل التالي"
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Clean Unboxed Metadata with · separator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span className="text-neutral-300 font-medium">{currentChapter.titleArabic}</span>
            <span aria-hidden="true">·</span>
            <span>{totalPages} صفحات</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400/90">{totalTranslated} صفحات مترجمة</span>
          </div>

          {currentChapter.sourceUrl && (
            <a
              href={currentChapter.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              title="عرض في الموقع الأصلي (Manhuaus)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">المصدر الأصلي</span>
            </a>
          )}
        </div>

        {/* Action Controls & Display Modes */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Reading Mode Segmented Control */}
          <div className="flex items-center p-0.5 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => onUpdateSettings({ readingMode: 'webtoon' })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                settings.readingMode === 'webtoon'
                  ? 'bg-neutral-800 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="وضع الويب تون: تمرير رأسي مستمر مريح"
            >
              شريط ويب تون
            </button>
            <button
              onClick={() => onUpdateSettings({ readingMode: 'single' })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                settings.readingMode === 'single'
                  ? 'bg-neutral-800 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="وضع الصفحة الواحدة: تقليب الصفحات"
            >
              صفحة واحدة
            </button>
          </div>

          {/* Translation Layout Switcher */}
          <div className="flex items-center p-0.5 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => onUpdateSettings({ overlayMode: 'bubble' })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                settings.overlayMode === 'bubble'
                  ? 'bg-neutral-800 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="تعويض النص الأصلي داخل الفقاعات مباشرة باللغة العربية"
            >
              تعويض الفقاعات
            </button>
            <button
              onClick={() => onUpdateSettings({ overlayMode: 'sideBySide' })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                settings.overlayMode === 'sideBySide'
                  ? 'bg-neutral-800 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="عرض النص العربي في لوحة جانبية منظمة"
            >
              نص جانبي
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-950 px-1 py-0.5 rounded-lg border border-neutral-800">
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

          {/* Auto Translate Whole Chapter Button */}
          <button
            onClick={onTranslateAllPages}
            disabled={isTranslatingAll}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {isTranslatingAll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-200" />
                <span>جاري ترجمة الفصل...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>ترجمة جميع الصفحات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
