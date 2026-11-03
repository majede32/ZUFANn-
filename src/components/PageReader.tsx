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
  MessageSquare,
  Download,
  Plus,
  SlidersHorizontal,
  Edit2
} from 'lucide-react';
import { MangaDialogue, MangaPage, ReaderSettings } from '../types/manga';
import { BubbleOverlay } from './BubbleOverlay';
import { speakArabic } from '../utils/mangaApi';
import { downloadPageAsPng } from '../utils/mangaExporter';

interface PageReaderProps {
  page: MangaPage;
  chapterTitle: string;
  settings: ReaderSettings;
  onTranslatePage: (pageNumber: number) => void;
  onUpdatePageDialogues?: (pageNumber: number, dialogues: MangaDialogue[]) => void;
  onToggleEditMode?: () => void;
}

export const PageReader: React.FC<PageReaderProps> = ({
  page,
  chapterTitle,
  settings,
  onTranslatePage,
  onUpdatePageDialogues,
  onToggleEditMode,
}) => {
  const [hideBubbles, setHideBubbles] = useState(false);
  const [showBottomScript, setShowBottomScript] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // New Bubble state
  const [isAddingBubble, setIsAddingBubble] = useState(false);
  const [newArabicText, setNewArabicText] = useState('');

  const activeTranslations =
    page.translatedData?.dialogues || page.precomputedTranslations || [];
  const isTranslated = activeTranslations.length > 0;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateDialogue = (updated: MangaDialogue) => {
    if (!onUpdatePageDialogues) return;
    const nextDialogues = activeTranslations.map((d) =>
      d.id === updated.id ? updated : d
    );
    onUpdatePageDialogues(page.pageNumber, nextDialogues);
  };

  const handleDeleteDialogue = (id: string) => {
    if (!onUpdatePageDialogues) return;
    const nextDialogues = activeTranslations.filter((d) => d.id !== id);
    onUpdatePageDialogues(page.pageNumber, nextDialogues);
  };

  const handleAddManualBubble = () => {
    if (!newArabicText.trim() || !onUpdatePageDialogues) return;
    const newDialogue: MangaDialogue = {
      id: `manual-${page.pageNumber}-${Date.now()}`,
      box_2d: [350, 250, 450, 750], // Default center bubble
      originalText: '(حوار يدوي)',
      arabicTranslation: newArabicText.trim(),
      speaker: 'حوار',
      type: 'speech',
      tone: 'calm',
    };
    onUpdatePageDialogues(page.pageNumber, [...activeTranslations, newDialogue]);
    setNewArabicText('');
    setIsAddingBubble(false);
  };

  const handleExportPage = async () => {
    try {
      setIsExporting(true);
      await downloadPageAsPng(page, chapterTitle, settings);
    } catch (err: any) {
      alert(`فشل تصدير الصفحة: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const zoomStyle = {
    maxWidth: `${Math.round(settings.zoom * 820)}px`,
  };

  return (
    <div
      id={`manga-page-${page.pageNumber}`}
      className="flex flex-col items-center justify-center my-6 w-full max-w-5xl mx-auto px-2"
    >
      {/* Comic Page Container */}
      <div
        style={zoomStyle}
        className="relative w-full bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col items-center"
      >
        {/* Page Top Action Bar */}
        <div className="w-full bg-neutral-950/95 backdrop-blur-md px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 select-none">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-100 bg-neutral-800 px-2 py-0.5 rounded-lg text-[11px]">
              الصفحة {page.pageNumber}
            </span>
            {page.caption && (
              <span className="text-neutral-400 hidden sm:inline text-[11px] truncate max-w-[150px]">
                {page.caption}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isTranslated ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">مترجمة ({activeTranslations.length} فقاعة)</span>
              </div>
            ) : page.isTranslating ? (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري استخراج وترجمة الحوارات بالذكاء الاصطناعي...</span>
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
              <>
                {/* Adjust Bubbles Mode Toggle */}
                {onToggleEditMode && (
                  <button
                    onClick={onToggleEditMode}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      settings.editMode
                        ? 'bg-amber-500 text-neutral-950'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                    title={settings.editMode ? 'إنهاء وضع ضبط الفقاعات' : 'ضبط مواضع وأبعاد الفقاعات يدوياً'}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">
                      {settings.editMode ? 'تم الضبط' : 'ضبط الفقاعات'}
                    </span>
                  </button>
                )}

                {/* Add Manual Bubble */}
                <button
                  onClick={() => setIsAddingBubble(!isAddingBubble)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                  title="إضافة فقاعة ترجمة يدوياً"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Export Page as PNG */}
                <button
                  disabled={isExporting}
                  onClick={handleExportPage}
                  className="p-1 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  title="تصدير الصفحة كصورة مترجمة (PNG)"
                >
                  <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                </button>

                {/* Hide / Show Bubbles */}
                <button
                  onClick={() => setHideBubbles(!hideBubbles)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title={hideBubbles ? 'إظهار الفقاعات المترجمة' : 'إخفاء الفقاعات لمشاهدة الرسم الأصلي'}
                >
                  {hideBubbles ? (
                    <EyeOff className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Add Manual Bubble Form Modal */}
        {isAddingBubble && (
          <div className="w-full bg-neutral-950 p-3 border-b border-neutral-800 flex flex-col sm:flex-row items-center gap-2 text-xs">
            <span className="font-bold text-amber-400 shrink-0">إضافة فقاعة يدوية:</span>
            <input
              type="text"
              value={newArabicText}
              onChange={(e) => setNewArabicText(e.target.value)}
              placeholder="اكتب النص المترجم بالعربية هنا..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleAddManualBubble}
                className="px-3 py-1.5 bg-amber-500 text-neutral-950 font-bold rounded-lg hover:bg-amber-400"
              >
                إضافة
              </button>
              <button
                onClick={() => setIsAddingBubble(false)}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-400 rounded-lg hover:bg-neutral-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Comic Image with Overlays */}
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

              {/* Speech Bubble Overlays Layer */}
              {!hideBubbles &&
                settings.overlayMode === 'bubble' &&
                activeTranslations.map((dialogue) => (
                  <BubbleOverlay
                    key={dialogue.id}
                    dialogue={dialogue}
                    settings={settings}
                    onUpdateDialogue={handleUpdateDialogue}
                    onDeleteDialogue={handleDeleteDialogue}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Translation Error alert */}
        {page.error && (
          <div className="w-full p-3 bg-red-950/80 border-t border-red-800 text-xs text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{page.error}</span>
            </div>
            <button
              onClick={() => onTranslatePage(page.pageNumber)}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* ALWAYS VISIBLE ARABIC DIALOGUE BOX */}
        <div className="w-full bg-neutral-950 border-t border-neutral-800 text-neutral-200">
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
            <div className="p-3 md:p-4 flex flex-col gap-2.5 max-h-[400px] overflow-y-auto">
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
                    className="p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800/80 hover:border-amber-500/40 transition-all flex flex-col gap-1.5"
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
                          className="p-1 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                          title="نطق الحوار"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyText(dlg.id || String(idx), dlg.arabicTranslation)}
                          className="p-1 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                          title="نسخ الحوار"
                        >
                          {copiedId === (dlg.id || String(idx)) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-white leading-relaxed text-right font-cairo">
                      {dlg.arabicTranslation}
                    </div>

                    {dlg.originalText && (
                      <div
                        className="text-[11px] text-neutral-400 font-mono text-left bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800/60 mt-0.5"
                        dir="ltr"
                      >
                        {dlg.originalText}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
