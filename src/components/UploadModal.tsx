import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { MangaPage } from '../types/manga';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomPagesAdded: (pages: MangaPage[], chapterTitle: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onCustomPagesAdded,
}) => {
  const [chapterTitle, setChapterTitle] = useState('صفحات مرفوعة شخصياً');
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; dataUrl: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newFiles: { name: string; dataUrl: string }[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newFiles.push({
            name: file.name,
            dataUrl: event.target.result as string,
          });
        }
        processedCount++;
        if (processedCount === files.length) {
          setSelectedFiles((prev) => [...prev, ...newFiles]);
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStartTranslating = () => {
    if (selectedFiles.length === 0) return;

    const pages: MangaPage[] = selectedFiles.map((file, idx) => ({
      pageNumber: idx + 1,
      imageUrl: file.dataUrl,
      caption: file.name,
      precomputedTranslations: [],
      termsExplained: [],
    }));

    onCustomPagesAdded(pages, chapterTitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              ترجمة صور مانجا من جهازك
            </h2>
            <p className="text-xs text-neutral-400">
              ارفع لقطات شاشة أو صفحات مانجا وترجمها فورياً
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-neutral-300 font-medium mb-1 block">
              عنوان المانجا / الفصل
            </label>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-neutral-700 hover:border-amber-500/50 bg-neutral-950/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <ImageIcon className="w-8 h-8 text-neutral-500 mb-2" />
            <span className="text-xs font-semibold text-neutral-200">
              انقر لاختيار صور المانجا أو اسحبها هنا
            </span>
            <span className="text-[11px] text-neutral-500 mt-1">
              يدعم PNG, JPG, WEBP
            </span>
          </label>

          {/* Uploaded Files Count */}
          {selectedFiles.length > 0 && (
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-300">
                تم اختيار <strong className="text-amber-400">{selectedFiles.length}</strong> صفحة
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-neutral-500 hover:text-red-400 text-[11px]"
              >
                مسح القائمة
              </button>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs rounded-xl hover:bg-neutral-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={selectedFiles.length === 0 || isProcessing}
              onClick={handleStartTranslating}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>بدء القراءة والترجمة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
