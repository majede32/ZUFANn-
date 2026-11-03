import React from 'react';
import { BookOpen, Settings, Sliders, Upload, HelpCircle, Layers, Globe } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenGlossary: () => void;
  onOpenUpload: () => void;
  onOpenUrlModal: () => void;
  onOpenHistory?: () => void;
  currentChapterTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenGlossary,
  onOpenUpload,
  onOpenUrlModal,
  onOpenHistory,
  currentChapterTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              ترجمان المانجا
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs lg:text-sm font-medium text-neutral-400">
          <button
            onClick={onOpenUrlModal}
            className="hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>جلب من رابط</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>رفع صور / حزمة ZIP</span>
          </button>
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>سجل القراءة والمفضلة</span>
            </button>
          )}
          <button
            onClick={onOpenGlossary}
            className="hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>قاموس الموريم</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>التخصيص</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUrlModal}
            className="px-4 py-2 text-xs md:text-sm font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-500/10 whitespace-nowrap cursor-pointer flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            <span>جلب فصل من رابط</span>
          </button>
        </div>
      </div>
    </header>
  );
};
