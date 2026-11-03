import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Bookmark,
  Trash2,
  BookOpen,
  Calendar,
  ExternalLink,
  Star
} from 'lucide-react';
import {
  getReadingHistory,
  clearReadingHistory,
  getFavorites,
  toggleFavorite,
  HistoryItem
} from '../utils/storage';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChapterUrl?: (url: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectChapterUrl,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const refreshData = () => {
    setHistory(getReadingHistory());
    setFavorites(getFavorites());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
    setFavorites(getFavorites());
  };

  const handleClearHistory = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل القراءة بالكامل؟')) {
      clearReadingHistory();
      setHistory([]);
    }
  };

  const displayedList =
    filter === 'favorites'
      ? history.filter((item) => favorites.includes(item.id))
      : history;

  const formatDate = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start">
      <div
        className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">سجل القراءة والمفضلة</h2>
              <p className="text-[11px] text-neutral-400">
                الفصول التي قمت بتصفحها وترجمتها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 bg-neutral-950/60 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              الكل ({history.length})
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filter === 'favorites'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>المفضلة ({favorites.length})</span>
            </button>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              title="مسح السجل"
            >
              <Trash2 className="w-3 h-3" />
              <span>مسح</span>
            </button>
          )}
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {displayedList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <Bookmark className="w-8 h-8 text-neutral-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold text-neutral-400">
                {filter === 'favorites'
                  ? 'لا توجد فصول مضافة للمفضلة حالياً'
                  : 'سجل القراءة فارغ حالياً'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                عند تصفح أي فصل سيتم حفظ موضع تقدمك تلقائياً هنا
              </p>
            </div>
          ) : (
            displayedList.map((item) => {
              const isFav = favorites.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.sourceUrl && onSelectChapterUrl) {
                      onSelectChapterUrl(item.sourceUrl);
                      onClose();
                    }
                  }}
                  className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 hover:border-amber-500/40 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-lg bg-neutral-900 shrink-0 border border-neutral-800"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {item.titleArabic || item.title}
                      </h3>
                      <span className="text-[11px] text-neutral-400">
                        فصل {item.chapterNumber} · صفحة {item.lastPage} من {item.totalPages}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{formatDate(item.lastReadAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mr-2">
                    <button
                      onClick={(e) => handleToggleFav(e, item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFav
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>

                    {item.sourceUrl && (
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
