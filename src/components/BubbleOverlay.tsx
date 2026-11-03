import React, { useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Maximize2
} from 'lucide-react';
import { MangaDialogue, ReaderSettings } from '../types/manga';
import { speakArabic } from '../utils/mangaApi';

interface BubbleOverlayProps {
  dialogue: MangaDialogue;
  settings: ReaderSettings;
  onUpdateDialogue?: (updated: MangaDialogue) => void;
  onDeleteDialogue?: (id: string) => void;
}

export const BubbleOverlay: React.FC<BubbleOverlayProps> = ({
  dialogue,
  settings,
  onUpdateDialogue,
  onDeleteDialogue,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editTextVal, setEditTextVal] = useState(dialogue.arabicTranslation);

  const [ymin, xmin, ymax, xmax] = dialogue.box_2d || [0, 0, 0, 0];

  // Center percentage (0 - 100%)
  const centerY = Math.max(2, Math.min(98, (ymin + ymax) / 20));
  const centerX = Math.max(5, Math.min(95, (xmin + xmax) / 20));

  // Natural width & height percentage from box_2d
  const boxWidthPct = Math.max(12, (xmax - xmin) / 10);
  const boxHeightPct = Math.max(5, (ymax - ymin) / 10);
  const textLength = (dialogue.arabicTranslation || '').length;

  // Mask coverage multiplier
  let coverageMultiplier = 1.05;
  if (settings.maskCoverage === 'snug') coverageMultiplier = 0.95;
  if (settings.maskCoverage === 'full') coverageMultiplier = 1.25;

  // Compute width so text fits horizontally inside standard manga bubbles
  let computedWidthPct = Math.max(boxWidthPct * coverageMultiplier, 16);
  if (textLength > 60) {
    computedWidthPct = Math.max(computedWidthPct, 38);
  } else if (textLength > 30) {
    computedWidthPct = Math.max(computedWidthPct, 28);
  } else if (textLength > 15) {
    computedWidthPct = Math.max(computedWidthPct, 20);
  }
  computedWidthPct = Math.min(92, computedWidthPct);

  // Font family
  const getFontClass = () => {
    switch (settings.arabicFont) {
      case 'amiri':
        return 'font-amiri font-bold';
      case 'tajawal':
        return 'font-tajawal font-black';
      case 'cairo':
      default:
        return 'font-cairo font-black';
    }
  };

  // Adaptive Font Size: ensures text fits inside bubble without overflowing or vertical tower elongation
  const getFontSizeClass = () => {
    let sizeOffset = 0;
    if (settings.bubbleFontSize === 'sm') sizeOffset = -1;
    if (settings.bubbleFontSize === 'lg') sizeOffset = 1;
    if (settings.bubbleFontSize === 'xl') sizeOffset = 2;

    if (textLength > 70) {
      return sizeOffset >= 1 ? 'text-[10px] md:text-[11px] leading-tight' : 'text-[9px] md:text-[10px] leading-tight';
    }
    if (textLength > 40) {
      return sizeOffset >= 1 ? 'text-[11px] md:text-xs leading-tight' : 'text-[10px] md:text-[11px] leading-tight';
    }
    if (textLength > 20) {
      if (sizeOffset === 2) return 'text-xs md:text-sm leading-snug';
      if (sizeOffset === 1) return 'text-[11px] md:text-xs leading-snug';
      return 'text-[10px] md:text-[11px] leading-snug';
    }
    // Punchy short dialogues
    if (sizeOffset === 2) return 'text-sm md:text-base leading-snug';
    if (sizeOffset === 1) return 'text-xs md:text-sm leading-snug';
    return 'text-[11px] md:text-xs leading-snug';
  };

  // Scanlation Typesetting styling: clean opaque inpainting mask that completely replaces foreign text
  const getThemeStyles = () => {
    switch (settings.bubbleTheme) {
      case 'transparent-glow':
        return 'bg-neutral-950/90 text-amber-200 border border-amber-500/40 rounded-2xl shadow-lg';
      case 'tinted-amber':
        return 'bg-amber-950 text-amber-100 border border-amber-700/60 rounded-2xl shadow-lg';
      case 'modern-dark':
        return 'bg-neutral-900 text-neutral-100 border border-neutral-700 rounded-2xl shadow-xl';
      case 'clean-white':
        return 'bg-white text-neutral-950 border border-neutral-300 shadow-md rounded-[22px]';
      case 'manga-typeset':
      default:
        if (dialogue.type === 'shout') {
          return 'bg-white text-neutral-950 border-2 border-neutral-950 shadow-md rounded-2xl font-black ring-1 ring-neutral-400';
        }
        if (dialogue.type === 'thought') {
          return 'bg-white text-neutral-950 border border-neutral-400 shadow-sm rounded-[24px]';
        }
        if (dialogue.type === 'sfx') {
          return 'bg-amber-100 text-amber-950 border border-amber-800 shadow-md rounded-xl font-black';
        }
        // Standard scanlation bubble: 100% opaque pure white masking, clean rounded border, no dashed lines
        return 'bg-white text-neutral-950 border border-neutral-800 shadow-sm rounded-[22px]';
    }
  };

  // Nudge position adjustments
  const handleNudge = (dy: number, dx: number) => {
    if (!onUpdateDialogue) return;
    const newYmin = Math.max(0, Math.min(950, ymin + dy));
    const newYmax = Math.max(50, Math.min(1000, ymax + dy));
    const newXmin = Math.max(0, Math.min(950, xmin + dx));
    const newXmax = Math.max(50, Math.min(1000, xmax + dx));
    onUpdateDialogue({
      ...dialogue,
      box_2d: [newYmin, newXmin, newYmax, newXmax],
    });
  };

  // Resize adjustments
  const handleResize = (scale: number) => {
    if (!onUpdateDialogue) return;
    const curW = xmax - xmin;
    const curH = ymax - ymin;
    const dW = Math.round((curW * (scale - 1)) / 2);
    const dH = Math.round((curH * (scale - 1)) / 2);
    const newYmin = Math.max(0, ymin - dH);
    const newYmax = Math.min(1000, ymax + dH);
    const newXmin = Math.max(0, xmin - dW);
    const newXmax = Math.min(1000, xmax + dW);
    onUpdateDialogue({
      ...dialogue,
      box_2d: [newYmin, newXmin, newYmax, newXmax],
    });
  };

  const handleSaveTextEdit = () => {
    if (onUpdateDialogue && editTextVal.trim()) {
      onUpdateDialogue({
        ...dialogue,
        arabicTranslation: editTextVal.trim(),
      });
    }
    setIsEditingText(false);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(dialogue.arabicTranslation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakArabic(dialogue.arabicTranslation);
  };

  return (
    <div
      style={{
        top: `${centerY}%`,
        left: `${centerX}%`,
        transform: 'translate(-50%, -50%)',
        width: `${computedWidthPct}%`,
        minHeight: '26px',
        opacity: settings.bubbleOpacity,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute z-20 transition-all duration-150 select-text text-center flex flex-col items-center justify-center px-3 py-1.5 md:px-3.5 md:py-2 ${getThemeStyles()} ${
        settings.editMode ? 'ring-2 ring-amber-500 shadow-xl' : isHovered ? 'scale-[1.02] z-30 shadow-2xl ring-2 ring-amber-500/70' : ''
      }`}
      dir="rtl"
    >
      {/* Floating Action Bar (Always visible in editMode, or on hover in normal mode) */}
      {(isHovered || settings.editMode) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 bg-neutral-950/95 text-white px-2.5 py-1 rounded-full border border-neutral-700 shadow-2xl flex items-center gap-1.5 text-[10px] whitespace-nowrap pointer-events-auto"
        >
          {dialogue.speaker && (
            <span className="font-bold text-amber-400 max-w-[70px] truncate">
              {dialogue.speaker}
            </span>
          )}

          {/* Edit / Nudge Controls */}
          {settings.editMode && (
            <>
              <div className="flex items-center gap-0.5 border-r border-neutral-700 pr-1 mr-1">
                <button
                  onClick={() => handleNudge(-15, 0)}
                  className="p-1 hover:text-amber-400 rounded hover:bg-neutral-800"
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleNudge(15, 0)}
                  className="p-1 hover:text-amber-400 rounded hover:bg-neutral-800"
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleNudge(0, 15)}
                  className="p-1 hover:text-amber-400 rounded hover:bg-neutral-800"
                  title="تحريك لليمين"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleNudge(0, -15)}
                  className="p-1 hover:text-amber-400 rounded hover:bg-neutral-800"
                  title="تحريك لليسار"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-0.5 border-r border-neutral-700 pr-1 mr-1">
                <button
                  onClick={() => handleResize(1.15)}
                  className="p-1 hover:text-amber-400 rounded hover:bg-neutral-800"
                  title="توسيع الفقاعة"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleResize(0.85)}
                  className="p-1 hover:text-amber-400 rounded hover:bg-neutral-800"
                  title="تقليص الفقاعة"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => setIsEditingText(true)}
                className="p-1 hover:text-amber-400 rounded hover:bg-neutral-800"
                title="تعديل النص العربي يدوياً"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              {onDeleteDialogue && (
                <button
                  onClick={() => onDeleteDialogue(dialogue.id)}
                  className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-neutral-800"
                  title="حذف هذه الفقاعة"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </>
          )}

          {/* Normal Mode Quick Actions */}
          {!settings.editMode && (
            <>
              {settings.showOriginalOnHover && (
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="p-1 hover:text-amber-400 transition-colors"
                  title={showOriginal ? 'عرض الترجمة العربية' : 'كشف النص الأصلي'}
                >
                  {showOriginal ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                </button>
              )}
              <button
                onClick={handleSpeak}
                className="p-1 hover:text-amber-400 transition-colors"
                title="نطق الحوار بالعربية"
              >
                <Volume2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1 hover:text-amber-400 transition-colors"
                title="نسخ الترجمة"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Arabic Content */}
      <div className="w-full text-center flex items-center justify-center break-words">
        {showOriginal && settings.showOriginalOnHover ? (
          <span
            className="font-mono text-[9px] md:text-[11px] text-neutral-800 leading-tight block select-text font-bold"
            dir="ltr"
          >
            {dialogue.originalText}
          </span>
        ) : (
          <span
            className={`${getFontClass()} ${getFontSizeClass()} tracking-tight block text-center select-text font-black`}
          >
            {dialogue.arabicTranslation}
          </span>
        )}
      </div>

      {/* Inline Quick Text Edit Modal */}
      {isEditingText && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-50 bg-neutral-950 p-2 rounded-2xl flex flex-col gap-1.5 shadow-2xl border border-amber-500"
        >
          <textarea
            value={editTextVal}
            onChange={(e) => setEditTextVal(e.target.value)}
            className="w-full h-full bg-neutral-900 text-white text-xs p-1.5 rounded-lg border border-neutral-700 resize-none focus:outline-none focus:border-amber-400"
            rows={2}
          />
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setIsEditingText(false)}
              className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-[10px] rounded"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveTextEdit}
              className="px-2 py-0.5 bg-amber-500 text-neutral-950 font-bold text-[10px] rounded"
            >
              حفظ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
