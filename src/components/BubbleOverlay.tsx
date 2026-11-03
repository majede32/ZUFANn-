import React, { useState } from 'react';
import { Volume2, Copy, Check, Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';
import { MangaDialogue, ReaderSettings } from '../types/manga';
import { speakArabic } from '../utils/mangaApi';

interface BubbleOverlayProps {
  dialogue: MangaDialogue;
  settings: ReaderSettings;
  imageDimensions?: { width: number; height: number };
}

export const BubbleOverlay: React.FC<BubbleOverlayProps> = ({
  dialogue,
  settings,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customScale, setCustomScale] = useState(1.0);

  const [ymin, xmin, ymax, xmax] = dialogue.box_2d || [0, 0, 0, 0];

  // Calculate center coordinates (0 - 100%)
  const centerY = Math.max(3, Math.min(97, (ymin + ymax) / 20));
  const centerX = Math.max(10, Math.min(90, (xmin + xmax) / 20));

  // Base raw dimensions from box_2d
  const rawWidth = Math.max(26, (xmax - xmin) / 10);

  // Coverage multiplier to ensure foreign text is 100% erased/covered
  let coverageMultiplier = 1.15;
  let minPaddingClass = 'px-3.5 py-2 md:px-4 md:py-2.5';
  let minHeightStyle = '46px';

  if (settings.maskCoverage === 'snug') {
    coverageMultiplier = 0.95;
    minPaddingClass = 'px-2.5 py-1.5 md:px-3 md:py-2';
    minHeightStyle = '38px';
  } else if (settings.maskCoverage === 'full') {
    coverageMultiplier = 1.35;
    minPaddingClass = 'px-4 py-3 md:px-5 md:py-3.5';
    minHeightStyle = '56px';
  }

  const computedWidth = Math.min(88, Math.max(36, rawWidth * coverageMultiplier * customScale));

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

  // Font size
  const getFontSizeClass = () => {
    switch (settings.bubbleFontSize) {
      case 'sm':
        return 'text-[11px] md:text-xs leading-snug';
      case 'lg':
        return 'text-xs md:text-sm leading-snug';
      case 'xl':
        return 'text-sm md:text-base leading-snug';
      case 'md':
      default:
        return 'text-[11px] md:text-xs leading-snug';
    }
  };

  // Typeset styling: 100% opaque white inpainting mask that erases foreign text
  const isTypeset = settings.bubbleTheme === 'manga-typeset' || settings.bubbleTheme === 'clean-white';

  const getThemeStyles = () => {
    switch (settings.bubbleTheme) {
      case 'transparent-glow':
        return 'bg-neutral-950/85 backdrop-blur-[2px] text-amber-200 border border-amber-500/40 rounded-2xl shadow-lg';
      case 'tinted-amber':
        return 'bg-amber-950 text-amber-100 border border-amber-600/60 rounded-2xl shadow-lg';
      case 'modern-dark':
        return 'bg-neutral-900 text-neutral-100 border border-neutral-700 rounded-2xl shadow-xl';
      case 'clean-white':
        return 'bg-white text-neutral-950 border border-neutral-400 shadow-md rounded-3xl';
      case 'manga-typeset':
      default:
        // Complete Scanlation Inpainting: 100% opaque white erasing mask
        if (dialogue.type === 'shout') {
          return 'bg-white text-neutral-950 border-2 border-neutral-900 shadow-md rounded-2xl ring-2 ring-neutral-300';
        }
        if (dialogue.type === 'thought') {
          return 'bg-white text-neutral-900 border-2 border-dashed border-neutral-700 shadow-sm rounded-3xl';
        }
        if (dialogue.type === 'sfx') {
          return 'bg-amber-100 text-amber-950 border-2 border-amber-800 shadow-md rounded-xl font-black';
        }
        return 'bg-white text-neutral-950 border-2 border-neutral-900/90 shadow-md rounded-3xl';
    }
  };

  return (
    <div
      style={{
        top: `${centerY}%`,
        left: `${centerX}%`,
        transform: 'translate(-50%, -50%)',
        width: `${computedWidth}%`,
        minHeight: minHeightStyle,
        opacity: settings.bubbleOpacity,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setShowOriginal(!showOriginal)}
      className={`absolute z-20 transition-all duration-150 cursor-pointer select-text text-center flex flex-col items-center justify-center ${minPaddingClass} ${getThemeStyles()} ${
        isHovered ? 'scale-[1.03] z-30 shadow-2xl ring-2 ring-amber-500/60' : ''
      }`}
      dir="rtl"
      title="انقر للتبديل بين الترجمة العربية والنص الأصلي"
    >
      {/* Floating Action Tooltip on Hover */}
      {isHovered && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-40 bg-neutral-950/95 text-white px-2.5 py-1 rounded-full border border-neutral-700 shadow-xl flex items-center gap-2 text-[10px] whitespace-nowrap pointer-events-auto"
        >
          {dialogue.speaker && (
            <span className="font-bold text-amber-400 max-w-[85px] truncate">
              {dialogue.speaker}
            </span>
          )}
          <span className="text-neutral-500">·</span>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="p-0.5 hover:text-amber-400 transition-colors"
            title={showOriginal ? 'عرض الترجمة العربية' : 'كشف النص الإنجليزي'}
          >
            {showOriginal ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setCustomScale((s) => Math.min(1.4, s + 0.1))}
            className="p-0.5 hover:text-amber-400 transition-colors"
            title="توسيع رقعة التبييض"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCustomScale((s) => Math.max(0.8, s - 0.1))}
            className="p-0.5 hover:text-amber-400 transition-colors"
            title="تصغير رقعة التبييض"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSpeak}
            className="p-0.5 hover:text-amber-400 transition-colors"
            title="نطق الحوار بالعربية"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="p-0.5 hover:text-amber-400 transition-colors"
            title="نسخ الترجمة"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Main Arabic Text: 100% Replaces and Erases the Foreign Text */}
      <div className="w-full text-center flex items-center justify-center">
        {showOriginal ? (
          <span
            className="font-mono text-[9px] md:text-[11px] text-neutral-800 leading-tight block select-text font-bold"
            dir="ltr"
          >
            {dialogue.originalText}
          </span>
        ) : (
          <span
            className={`${getFontClass()} ${getFontSizeClass()} tracking-tight block text-center select-text font-black ${
              isTypeset ? 'text-neutral-950 font-black' : ''
            }`}
          >
            {dialogue.arabicTranslation}
          </span>
        )}
      </div>
    </div>
  );
};
