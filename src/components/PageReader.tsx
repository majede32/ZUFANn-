import React, { useState } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { MangaPage, ReaderSettings } from '../types/manga';
import { BubbleOverlay } from './BubbleOverlay';
import { SideScriptPanel } from './SideScriptPanel';
import { speakArabic } from '../utils/mangaApi';

interface PageReaderProps {
  page: MangaPage;
  chapterTitle: string;
  settings: ReaderSettings;
  onTranslatePage: (pageNumber: number) => void;
  onOpenLens?: (imageUrl: string) => void;
}

export const PageReader: React.FC<PageReaderProps> = ({
  page,
  chapterTitle,
  settings,
  onTranslatePage,
}) => {
  const [hideBubbles, setHideBubbles] = useState(false);
  const [showBottomScript, setShowBottomScript] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeTranslations =
    page.translatedData?.dialogues || page.precomputedTranslations || [];
  const terms =
    page.translatedData?.termsExplained || page.termsExplained || [];
  const summary = page.translatedData?.pageSummary;

  const isTranslated = activeTranslations.length > 0;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFontClass = () => {
    switch (settings.arabicFont) {
      case 'amiri':
        return 'font-amiri';
      case 'tajawal':
        return 'font-tajawal';
      case 'cairo':
      default:
        return 'font-cairo';
    }
  };

  // Zoom scale
  const zoomStyle = {
    maxWidth: `${Math.round(settings.zoom * 820)}px`,
  };

  return (
    <div
      id={`manga-page-${page.pageNumber}`}
      className="flex flex-col lg:flex-row items-center justify-center gap-6 my-6 w-full max-w-6xl mx-auto px-2"
    >
      {/* Comic Page Container */}
      <div
        style={zoomStyle}
        className="relative w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col items-center"
      >
        {/* Page Header Bar */}
        <div className="w-full bg-neutral-950/90 backdrop-blur-md px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-100 bg-neutral-800 px-2 py-0.5 rounded text-[11px]">
              الصفحة {page.pageNumber}
            </span>
            {page.caption && (
              <span className="text-neutral-400 hidden sm:inline text-[11px]">
                {page.caption}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isTranslated ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>مترجمة ({activeTranslations.length} حوار)</span>
              </div>
            ) : page.isTranslating ? (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري استخراج الحوارات...</span>
              </div>
            ) : (
              <button
                onClick={() => onTranslatePage(page.pageNumber)}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ترجمة الصفحة الآن</span>
              </button>
            )}

            {isTranslated && (
              <button
                onClick={() => setHideBubbles(!hideBubbles)}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title={hideBubbles ? 'إظهار الفقاعات المترجمة' : 'إخفاء الفقاعات لمشاهدة الرسم الأصلي'}
              >
                {hideBubbles ? (
                  <EyeOff className="w-4 h-4 text-amber-400" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Comic Image with Overlays Layer */}
        <div className="relative w-full select-none flex justify-center bg-black">
          {imageError ? (
            <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-neutral-500 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-neutral-600" />
              <p className="text-sm">تعذر تحميل صورة الصفحة مباشرة</p>
              <button
                onClick={() => setImageError(false)}
                className="px-3 py-1 bg-neutral-800 text-xs rounded text-neutral-300 hover:bg-neutral-700"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <div className="relative inline-block w-full">
              <img
                src={page.imageUrl}
                alt={`Manga Page ${page.pageNumber}`}
                onError={() => setImageError(true)}
                className="w-full h-auto block object-contain mx-auto"
                loading="lazy"
              />

              {/* Speech Bubble Overlays on the Comic Page */}
              {!hideBubbles &&
                settings.overlayMode === 'bubble' &&
                activeTranslations.map((dialogue) => (
                  <BubbleOverlay
                    key={dialogue.id}
                    dialogue={dialogue}
                    settings={settings}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Translation Error alert if any */}
        {page.error && (
          <div className="w-full p-2.5 bg-red-950/60 border-t border-red-800/80 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{page.error}</span>
          </div>
        )}

        {/* ALWAYS VISIBLE ARABIC DIALOGUE BOX (صندوق الترجمة والحوارات المترجمة) */}
        <div className="w-full bg-neutral-950 border-t border-neutral-800/90 text-neutral-200">
          <div
            onClick={() => setShowBottomScript(!showBottomScript)}
            className="w-full px-4 py-2.5 bg-neutral-900/60 hover:bg-neutral-900 flex items-center justify-between cursor-pointer border-b border-neutral-800/60 transition-colors select-none"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <MessageSquare className="w-4 h-4" />
              <span>
                الحوارات المترجمة للصفحة {page.pageNumber} ({activeTranslations.length} حوار باللغة العربية)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>{showBottomScript ? 'طي النصوص' : 'عرض النصوص'}</span>
              {showBottomScript ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          {showBottomScript && (
            <div className="p-3 md:p-4 flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
              {activeTranslations.length === 0 ? (
                <div className="text-center py-4 text-xs text-neutral-400 flex flex-col items-center gap-2">
                  <span>لم يتم ترجمة هذه الصفحة بعد</span>
                  <button
                    onClick={() => onTranslatePage(page.pageNumber)}
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs hover:bg-amber-500/30 transition-colors"
                  >
                    اضغط هنا لترجمة الصفحة فورياً
                  </button>
                </div>
              ) : (
                activeTranslations.map((dlg, idx) => (
                  <div
                    key={dlg.id || idx}
                    className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800/80 hover:border-amber-500/40 transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-neutral-800/60">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-amber-400 text-xs">
                          {dlg.speaker || 'حوار'}
                        </span>
                        {dlg.type && (
                          <span className="text-[10px] text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                            {dlg.type === 'shout'
                              ? 'صرخة'
                              : dlg.type === 'thought'
                              ? 'تفكير'
                              : dlg.type === 'sfx'
                              ? 'مؤثر صوتي'
                              : dlg.type === 'narration'
                              ? 'سرد'
                              : 'حوار'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => speakArabic(dlg.arabicTranslation)}
                          className="p-1 text-neutral-400 hover:text-amber-400 rounded transition-colors"
                          title="استماع للحوار"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyText(dlg.id || String(idx), dlg.arabicTranslation)}
                          className="p-1 text-neutral-400 hover:text-white rounded transition-colors"
                          title="نسخ الترجمة"
                        >
                          {copiedId === (dlg.id || String(idx)) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Arabic Translation Content */}
                    <p
                      className={`${getFontClass()} text-sm text-neutral-100 font-semibold leading-relaxed`}
                    >
                      {dlg.arabicTranslation}
                    </p>

                    {/* Original Source snippet */}
                    {dlg.originalText && (
                      <p
                        className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-800/60 self-start"
                        dir="ltr"
                      >
                        {dlg.originalText}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Side Script Panel (only visible if overlayMode is 'sideBySide') */}
      {settings.overlayMode === 'sideBySide' && (
        <SideScriptPanel
          pageNumber={page.pageNumber}
          dialogues={activeTranslations}
          termsExplained={terms}
          pageSummary={summary}
          settings={settings}
          onTranslatePage={() => onTranslatePage(page.pageNumber)}
          isTranslating={!!page.isTranslating}
        />
      )}
    </div>
  );
};
