import React from 'react';
import { Volume2, Copy, Check, MessageSquare, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { MangaDialogue, MangaTerm, ReaderSettings } from '../types/manga';
import { speakArabic } from '../utils/mangaApi';

interface SideScriptPanelProps {
  pageNumber: number;
  dialogues: MangaDialogue[];
  termsExplained?: MangaTerm[];
  pageSummary?: string;
  settings: ReaderSettings;
  onTranslatePage: () => void;
  isTranslating: boolean;
}

export const SideScriptPanel: React.FC<SideScriptPanelProps> = ({
  pageNumber,
  dialogues,
  termsExplained = [],
  pageSummary,
  settings,
  onTranslatePage,
  isTranslating,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
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

  return (
    <div className="w-full lg:w-96 shrink-0 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4 self-start sticky top-20 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white">
            سيناريو الصفحة {pageNumber}
          </h3>
        </div>
        <span className="text-xs text-neutral-400">
          {dialogues.length} حوارات
        </span>
      </div>

      {/* Page Summary if available */}
      {pageSummary && (
        <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 text-xs text-neutral-300 leading-relaxed">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ملخص أحداث الصفحة:</span>
          </div>
          <p>{pageSummary}</p>
        </div>
      )}

      {/* Dialogues List */}
      <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
        {dialogues.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            {isTranslating ? (
              <p>جاري استخراج وترجمة حوارات الصفحة بواسطة Gemini...</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p>لم يتم ترجمة هذه الصفحة بعد.</p>
                <button
                  onClick={onTranslatePage}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs hover:bg-amber-500/30 transition-colors"
                >
                  ترجمة الصفحة الآن
                </button>
              </div>
            )}
          </div>
        ) : (
          dialogues.map((dlg, idx) => (
            <div
              key={dlg.id || idx}
              className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center font-mono text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-amber-400">
                    {dlg.speaker || 'حوار'}
                  </span>
                  {dlg.type && (
                    <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                      {dlg.type}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => speakArabic(dlg.arabicTranslation)}
                    className="p-1 text-neutral-400 hover:text-amber-400 rounded transition-colors"
                    title="استماع"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(dlg.id || String(idx), dlg.arabicTranslation)}
                    className="p-1 text-neutral-400 hover:text-white rounded transition-colors"
                    title="نسخ"
                  >
                    {copiedId === (dlg.id || String(idx)) ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Arabic Translation */}
              <div className={`${getFontClass()} text-sm text-neutral-100 font-medium leading-relaxed`}>
                {dlg.arabicTranslation}
              </div>

              {/* Original text snippet */}
              {dlg.originalText && (
                <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800/50" dir="ltr">
                  {dlg.originalText}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Terms Explained section */}
      {termsExplained.length > 0 && (
        <div className="pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 mb-2">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>مصطلحات ومفاهيم الموريم بالصفحة:</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {termsExplained.map((t, i) => (
              <div key={i} className="text-xs bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                <span className="font-bold text-amber-400 ml-1">{t.term}:</span>
                <span className="text-neutral-300">{t.explanation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
