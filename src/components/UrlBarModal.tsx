import React, { useState } from 'react';
import { X, Globe, ArrowLeft, Sparkles, BookOpen, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { MangaChapter } from '../types/manga';

interface UrlBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFetchUrl: (url: string) => Promise<void>;
  sampleChapters: MangaChapter[];
  onSelectSample: (chapter: MangaChapter) => void;
  isLoading: boolean;
  error?: string;
}

export const UrlBarModal: React.FC<UrlBarModalProps> = ({
  isOpen,
  onClose,
  onFetchUrl,
  sampleChapters,
  onSelectSample,
  isLoading,
  error,
}) => {
  const [inputUrl, setInputUrl] = useState(
    'https://manhuaus.com/manga/becoming-the-cheon-clans-mad-dog/chapter-24/'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onFetchUrl(inputUrl.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              تصفح وجلب فصول المانجا والمانهوا
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              ضع رابط الفصل من موقع مثل Manhuaus أو AsuraScans لترجمته فورياً إلى العربية
            </p>
          </div>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://manhuaus.com/manga/.../chapter-24/"
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-all pl-28 text-left font-mono"
              dir="ltr"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute left-1.5 top-1.5 bottom-1.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 text-neutral-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جلب الفصل...</span>
                </>
              ) : (
                <>
                  <span>جلب وترجمة</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Quick Recommended Manga Chapters */}
        <div className="border-t border-neutral-800/80 pt-5">
          <div className="flex items-center justify-between mb-3 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              فصول جاهزة وعالية الدقة للتجربة الفورية:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sampleChapters.map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  onSelectSample(ch);
                  onClose();
                }}
                className="group p-3 bg-neutral-950 hover:bg-neutral-800/60 border border-neutral-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all flex items-center gap-3"
              >
                {ch.coverImage ? (
                  <img
                    src={ch.coverImage}
                    alt={ch.title}
                    className="w-12 h-16 object-cover rounded-lg border border-neutral-800 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 bg-neutral-900 rounded-lg flex items-center justify-center text-neutral-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {ch.titleArabic || ch.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {ch.chapterTitleArabic || ch.chapterTitle}
                  </p>
                  <span className="text-[10px] text-amber-500/80 mt-1 font-mono">
                    {ch.pages.length} صفحات مجهزة للترجمة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-neutral-800/60 text-center text-[11px] text-neutral-500">
          يدعم التطبيق ترجمة المانهوا الكورية (Korean Manhwa) والمانهو الصينية (Chinese Manhua) والمانغا اليابانية مع تفريغ الحوارات في مكانها المناسب.
        </div>
      </div>
    </div>
  );
};
