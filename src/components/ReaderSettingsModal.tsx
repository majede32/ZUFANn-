import React from 'react';
import { X, Sliders, Type, Palette, Eye, Layout } from 'lucide-react';
import { ReaderSettings } from '../types/manga';

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              إعدادات القراءة والترجمة
            </h2>
            <p className="text-xs text-neutral-400">
              تخصيص الخط العربي، مظهر الفقاعات، وطريقة العرض
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* 1. Arabic Font Choice */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-amber-400" />
              <span>نوع الخط العربي للفقاعات</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ arabicFont: 'cairo' })}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  settings.arabicFont === 'cairo'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="font-cairo text-sm mb-1">خط كايرو</div>
                <div className="text-[10px] text-neutral-500">حديث وواضح</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ arabicFont: 'tajawal' })}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  settings.arabicFont === 'tajawal'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="font-tajawal text-sm mb-1">خط تجوال</div>
                <div className="text-[10px] text-neutral-500">هندسي ناعم</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ arabicFont: 'amiri' })}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  settings.arabicFont === 'amiri'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="font-amiri text-sm mb-1">خط أميري</div>
                <div className="text-[10px] text-neutral-500">كلاسيكي سردي</div>
              </button>
            </div>
          </div>

          {/* 2. Bubble Theme Choice */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>مظهر ولون فقاعة الترجمة</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'manga-typeset', name: 'تعويض مباشر (Typeset)', desc: 'تبييض وتغطية النص بالفقاعة' },
                { id: 'clean-white', name: 'ورقي مانجا أبيض', desc: 'إطار خفيف كلاسيكي' },
                { id: 'modern-dark', name: 'بطاقة ليلية', desc: 'خلفية سوداء راقية' },
                { id: 'tinted-amber', name: 'كهرماني موريم', desc: 'طابع قتالي دافئ' },
                { id: 'transparent-glow', name: 'زجاجي شفاف', desc: 'خفيف وشفاف' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ bubbleTheme: theme.id as any })
                  }
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    settings.bubbleTheme === theme.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs text-white mb-0.5">{theme.name}</div>
                  <div className="text-[9px] text-neutral-500">{theme.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Foreign Text Erasing Level (مستوى فسخ النص الأجنبي) */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between mb-2">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                مستوى فسخ ومسح النص الأجنبي بالفقاعة
              </span>
              <span className="text-amber-400 font-mono text-[11px]">
                {settings.maskCoverage === 'extended' ? 'تغطية موسّعة (100% مسح)' : settings.maskCoverage === 'snug' ? 'تغطية مدمجة' : 'تغطية كاملة'}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ maskCoverage: 'snug' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.maskCoverage === 'snug'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs mb-0.5">مسح مدمج</div>
                <div className="text-[9px] text-neutral-500">بمحاذاة الكلمات</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ maskCoverage: 'extended' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.maskCoverage === 'extended'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs mb-0.5 font-bold">مسح موسّع (موصى به)</div>
                <div className="text-[9px] text-neutral-500">محو كامل بدون حجب الرسم</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ maskCoverage: 'full' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.maskCoverage === 'full'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs mb-0.5">تغطية شاملة</div>
                <div className="text-[9px] text-neutral-500">كامل فضاء الفقاعة</div>
              </button>
            </div>
          </div>

          {/* 4. Font Size */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between mb-2">
              <span className="flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                حجم خط الحوارات
              </span>
              <span className="text-amber-400 font-mono text-xs uppercase">
                {settings.bubbleFontSize}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onUpdateSettings({ bubbleFontSize: size })}
                  className={`py-2 rounded-lg border text-center text-xs font-medium transition-all ${
                    settings.bubbleFontSize === size
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {size === 'sm' ? 'صغير' : size === 'md' ? 'متوسط' : size === 'lg' ? 'كبير' : 'ضخم'}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Opacity Slider */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between mb-2">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                شفافية الفقاعة
              </span>
              <span className="font-mono text-xs text-amber-400 tabular-nums">
                {Math.round(settings.bubbleOpacity * 100)}%
              </span>
            </label>
            <input
              type="range"
              min="0.6"
              max="1"
              step="0.05"
              value={settings.bubbleOpacity}
              onChange={(e) =>
                onUpdateSettings({ bubbleOpacity: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer bg-neutral-950 rounded-lg h-2"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
