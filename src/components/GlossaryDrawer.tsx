import React, { useState } from 'react';
import { X, Search, BookOpen, Sparkles, Layers } from 'lucide-react';

interface GlossaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GlossaryEntry {
  term: string;
  original: string;
  category: 'موريم وفنون قتالية' | 'رتب وعشائر' | 'طاقة وتدريب' | 'ألقاب كورية';
  arabicExplanation: string;
}

const GLOSSARY_ITEMS: GlossaryEntry[] = [
  {
    term: "عشيرة تشيون (Cheon Clan)",
    original: "천가 (天家)",
    category: "رتب وعشائر",
    arabicExplanation: "إحدى أعرق العائلات النبيلة في عالم الموريم، وتشتهر بتعليم فنون القتال الصارمة وقواعد الشرف والنزاعات الداخلية على وراثة القيادة."
  },
  {
    term: "كلب مسعور (Mad Dog)",
    original: "미친개",
    category: "رتب وعشائر",
    arabicExplanation: "لقب يطلق على المقاتل المندفع الذي لا يهاب الموت ويقاتل حتى الرمق الأخير دون تراجع، وهو لقب بطل القصة تشيون هيوك."
  },
  {
    term: "الموريم (Murim)",
    original: "무림 (武林)",
    category: "موريم وفنون قتالية",
    arabicExplanation: "عالم الفنون القتالية ومجتمع الفرسان والعشائر القتالية المستقلة عن القوانين الإمبراطورية المدنية."
  },
  {
    term: "طاقة التشي (Qi / Ki)",
    original: "기 (氣)",
    category: "طاقة وتدريب",
    arabicExplanation: "الطاقة الحيوية الداخلية التي يتدرب المقاتل على تنميتها وتوجيهها عبر مسارات الطاقة (الميريديان) لتوجيه ضربات خارقة."
  },
  {
    term: "الدانجون (Danjeon)",
    original: "단전 (丹田)",
    category: "طاقة وتدريب",
    arabicExplanation: "مستودع الطاقة الرئيسي الواقع أسفل السرة بحوالي بوصتين، وفيه يتم تخزين التشي وصهره."
  },
  {
    term: "كبير العشيرة / غاجو (Gaju)",
    original: "가주 (家主)",
    category: "ألقاب كورية",
    arabicExplanation: "زعيم العائلة الحاكم، ويمتلك السلطة المطلقة على أفراد العشيرة وشؤونها."
  },
  {
    term: "طائفة الشياطين (Demonic Cult)",
    original: "마교 (魔敎)",
    category: "موريم وفنون قتالية",
    arabicExplanation: "فصيل قتالي عظيم يتميز بالصرامة والقوة الغاشمة، ويقدسون 'الشيطان السماوي' كمصدر لقوتهم."
  },
  {
    term: "الشيطان السماوي (Heavenly Demon)",
    original: "천마 (天魔)",
    category: "رتب وعشائر",
    arabicExplanation: "أعلى وأقوى لقب قتالي في عالم الموريم الشيطاني، يمثل ذروة القوة الفردية المطلقة."
  },
  {
    term: "هيونغ / سا هيونغ (Sahyung)",
    original: "사형 (師兄)",
    category: "ألقاب كورية",
    arabicExplanation: "الأخ الأكبر في طائفة التدريب أو التلميذ الأسبق تحت يد نفس المعلم القتالي."
  },
  {
    term: "نصل التشي (Sword Qi / Ganggi)",
    original: "검기 (劍氣) / 검강",
    category: "طاقة وتدريب",
    arabicExplanation: "تغليف نصل السيف بهالة من الطاقة الداخلية المركزة القادرة على قطع الفولاذ والصخور عن بعد."
  }
];

export const GlossaryDrawer: React.FC<GlossaryDrawerProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  if (!isOpen) return null;

  const categories = ['الكل', 'رتب وعشائر', 'طاقة وتدريب', 'موريم وفنون قتالية', 'ألقاب كورية'];

  const filtered = GLOSSARY_ITEMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.original.toLowerCase().includes(search.toLowerCase()) ||
      item.arabicExplanation.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'الكل' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div
        className="w-full max-w-md bg-neutral-900 border-r border-neutral-800 h-full p-6 flex flex-col shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                قاموس الموريم والمانهوا
              </h3>
              <p className="text-[11px] text-neutral-400">
                مرجع مصطلحات الفنون القتالية والكورية المترجمة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="my-4 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مصطلح (تشي، دانجون، غاجو...)"
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pr-9 pl-4 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Glossary Terms List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              لم يتم العثور على مصطلحات مطابقة للبحث
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">{item.term}</span>
                  <span className="font-mono text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800" dir="ltr">
                    {item.original}
                  </span>
                </div>
                <div className="text-xs text-neutral-300 leading-relaxed">
                  {item.arabicExplanation}
                </div>
                <div className="text-[10px] text-neutral-500 self-start mt-1">
                  تصنيف: {item.category}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
