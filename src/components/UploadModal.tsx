import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  FileArchive,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import JSZip from 'jszip';
import { MangaPage } from '../types/manga';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomPagesAdded: (pages: MangaPage[], chapterTitle: string) => void;
}

interface UploadedItem {
  id: string;
  name: string;
  dataUrl: string;
}

// Natural sort for page file names (e.g. 1.jpg, 2.jpg, 10.jpg)
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onCustomPagesAdded,
}) => {
  const [chapterTitle, setChapterTitle] = useState('فصل مانجا مرفوع');
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  // Process raw files (images or zip/cbz archives)
  const processFiles = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    setProgressText('جاري قراءة الملفات...');

    const newItems: UploadedItem[] = [];

    try {
      for (const file of Array.from(fileList)) {
        const lowerName = file.name.toLowerCase();

        // Check if ZIP or CBZ archive
        if (lowerName.endsWith('.zip') || lowerName.endsWith('.cbz')) {
          setProgressText(`جاري فك ضغط الأرشيف: ${file.name}...`);
          const zip = await JSZip.loadAsync(file);
          const imageEntries: { name: string; file: JSZip.JSZipObject }[] = [];

          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
              const ext = relativePath.toLowerCase();
              if (
                ext.endsWith('.jpg') ||
                ext.endsWith('.jpeg') ||
                ext.endsWith('.png') ||
                ext.endsWith('.webp') ||
                ext.endsWith('.avif')
              ) {
                imageEntries.push({ name: relativePath, file: zipEntry });
              }
            }
          });

          // Sort naturally by filename inside archive
          imageEntries.sort((a, b) => naturalSort(a.name, b.name));

          let extracted = 0;
          for (const entry of imageEntries) {
            extracted++;
            setProgressText(
              `استخراج صفحة ${extracted} من ${imageEntries.length} من ${file.name}...`
            );
            const blob = await entry.file.async('blob');
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve((e.target?.result as string) || '');
              reader.readAsDataURL(blob);
            });

            if (dataUrl) {
              newItems.push({
                id: `zip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: entry.name.split('/').pop() || entry.name,
                dataUrl,
              });
            }
          }

          if (!chapterTitle || chapterTitle === 'فصل مانجا مرفوع') {
            setChapterTitle(file.name.replace(/\.(zip|cbz)$/i, ''));
          }
        } else if (file.type.startsWith('image/')) {
          // Regular image file
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.readAsDataURL(file);
          });

          if (dataUrl) {
            newItems.push({
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              dataUrl,
            });
          }
        }
      }

      setItems((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      alert(`حدث خطأ أثناء معالجة الملفات: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setItems((prev) => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartTranslating = () => {
    if (items.length === 0) return;

    const pages: MangaPage[] = items.map((item, idx) => ({
      pageNumber: idx + 1,
      imageUrl: item.dataUrl,
      caption: item.name,
      precomputedTranslations: [],
      termsExplained: [],
    }));

    onCustomPagesAdded(pages, chapterTitle.trim() || 'فصل مرفوع');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                رفع صفحات المانجا أو أرشيف (ZIP / CBZ)
              </h2>
              <p className="text-xs text-neutral-400">
                يدعم رفع حزم الفصول المضغوطة وصور JPG, PNG, WEBP بدقة كاملة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs text-neutral-300 font-semibold mb-1.5 block">
              اسم المانجا / عنوان الفصل:
            </label>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="مثال: Solo Leveling - Chapter 12"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Dropzone */}
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                : 'border-neutral-700 hover:border-amber-500/50 bg-neutral-950/60'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*,.zip,.cbz,application/zip,application/x-zip-compressed"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex items-center gap-3 mb-2">
              <FileArchive className="w-8 h-8 text-amber-400" />
              <ImageIcon className="w-8 h-8 text-neutral-400" />
            </div>
            <span className="text-xs font-bold text-neutral-100 text-center">
              اسحب وأفلت أرشيف ZIP/CBZ أو صور الصفحات هنا
            </span>
            <span className="text-[11px] text-neutral-400 mt-1 text-center">
              سيتم استخراج وترتيب الصفحات تلقائياً بشكل تسلسلي ذكي
            </span>
          </label>

          {/* Processing Status */}
          {isProcessing && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-amber-300 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{progressText}</span>
            </div>
          )}

          {/* Items Preview List with Reordering */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>
                  تم تجهيز <strong className="text-amber-400">{items.length}</strong> صفحة
                  (يمكنك إعادة ترتيبها أو حذف صفحات الغلاف غير المطلوبة)
                </span>
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-red-400 hover:text-red-300 text-[11px]"
                >
                  حذف الكل
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 bg-neutral-950/70 rounded-2xl border border-neutral-800">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 text-xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-6 h-6 rounded-lg bg-neutral-800 text-amber-400 flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={item.dataUrl}
                        alt={`thumb ${idx + 1}`}
                        className="w-8 h-11 object-cover rounded bg-neutral-950 shrink-0 border border-neutral-800"
                      />
                      <span className="text-neutral-300 truncate max-w-[200px] text-[11px]">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, 'up')}
                        className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => moveItem(idx, 'down')}
                        className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors"
                        title="حذف هذه الصفحة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs rounded-xl hover:bg-neutral-700 transition-colors"
          >
            إغلاق
          </button>

          <button
            type="button"
            disabled={items.length === 0 || isProcessing}
            onClick={handleStartTranslating}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>بدء قراءة وترجمة ({items.length}) صفحة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
