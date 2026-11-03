import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  ArrowUp,
  Sliders,
  Globe,
  Upload,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ChapterBar } from './components/ChapterBar';
import { PageReader } from './components/PageReader';
import { UrlBarModal } from './components/UrlBarModal';
import { GlossaryDrawer } from './components/GlossaryDrawer';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { UploadModal } from './components/UploadModal';
import { MangaChapter, MangaPage, ReaderSettings } from './types/manga';
import { fetchChapterFromUrl, fetchSampleChapters, translatePage } from './utils/mangaApi';

// Helper to build 18 real webtoon pages for Chapter 24
const createRealChapter24Pages = (): MangaPage[] => {
  const baseUrl = "https://roliascan.org/storage/chapters/manhwa_93007_24";
  
  const translationsMap: Record<number, any[]> = {
    1: [
      {
        id: "c24-p1-1",
        box_2d: [120, 150, 240, 850],
        originalText: "Becoming the Cheon Clan's Mad Dog - Chapter 24",
        arabicTranslation: "كلب عشيرة تشيون المسعور - الفصل 24",
        speaker: "عنوان السلسلة",
        type: "narration",
        tone: "determined",
      },
      {
        id: "c24-p1-2",
        box_2d: [680, 200, 820, 800],
        originalText: "A strange sensation washed over me... like floating alone in a vast ocean.",
        arabicTranslation: "اجتاحني شعور غريب ومباغت... وكأنني أطفو وحيداً في بحر لجي لا قرار له.",
        speaker: "تشيون مويانغ",
        type: "thought",
        tone: "calm",
      },
    ],
    2: [
      {
        id: "c24-p2-1",
        box_2d: [260, 300, 320, 700],
        originalText: "Let me show you a sword.",
        arabicTranslation: "دعني أريك حقيقة فن السيف!",
        speaker: "تشيون مويانغ",
        type: "speech",
        tone: "determined",
      },
      {
        id: "c24-p2-2",
        box_2d: [680, 250, 740, 750],
        originalText: "The internal Qi within my Danjeon is burning violently!",
        arabicTranslation: "طاقة التشي داخل الدانجون تلتهب بعنف كالحمم البركانية!",
        speaker: "تشيون مويانغ",
        type: "thought",
        tone: "angry",
      },
    ],
    3: [
      {
        id: "c24-p3-1",
        box_2d: [350, 180, 480, 820],
        originalText: "A single streak of celestial light cuts through the realm of creation!",
        arabicTranslation: "بصيص من نور سماوي يشق مبادئ الخلق والكون!",
        speaker: "تشيون مويانغ",
        type: "thought",
        tone: "determined",
      },
      {
        id: "c24-p3-2",
        box_2d: [620, 220, 750, 780],
        originalText: "This sword path... it points towards the Upper Heavens!",
        arabicTranslation: "هذا المسار في فن السيف... إنه يوجّهني نحو السماوات العليا!",
        speaker: "تشيون مويانغ",
        type: "shout",
        tone: "determined",
      },
    ],
    4: [
      {
        id: "c24-p4-1",
        box_2d: [180, 200, 310, 800],
        originalText: "*Cough!* Blood... my meridians barely withstood the surge.",
        arabicTranslation: "*يسعل دماً!* لقد كادت مسارات الطاقة في جسدي أن تنفجر من قوة التدفق.",
        speaker: "تشيون مويانغ",
        type: "speech",
        tone: "shocked",
      },
      {
        id: "c24-p4-2",
        box_2d: [650, 220, 780, 780],
        originalText: "Young Master! You have finally awakened!",
        arabicTranslation: "سيدي الشاب! حمداً لله، لقد استعدت وعيك أخيراً!",
        speaker: "التابع الحارس",
        type: "shout",
        tone: "shocked",
      },
    ],
    5: [
      {
        id: "c24-p5-1",
        box_2d: [200, 220, 330, 780],
        originalText: "How is Wolyeong? Did she sustain any injuries during the chaos?!",
        arabicTranslation: "كيف حال ووليونغ؟! هل أصابها أي مكروه أثناء تلك الفوضى العارمة؟!",
        speaker: "تشيون مويانغ",
        type: "speech",
        tone: "determined",
      },
      {
        id: "c24-p5-2",
        box_2d: [620, 240, 750, 760],
        originalText: "Lady Wolyeong is safe, but the Clan Elders are already gathering.",
        arabicTranslation: "الآنسة ووليونغ بأمان، لكن شيوخ العشيرة بدأوا يحتشدون في القاعة الكبرى.",
        speaker: "التابع الحارس",
        type: "speech",
        tone: "calm",
      },
    ],
    6: [
      {
        id: "c24-p6-1",
        box_2d: [250, 200, 380, 800],
        originalText: "Those vultures... they think the 'Mad Dog' has lost his fangs.",
        arabicTranslation: "أولئك النسور الجشعة... يظنون أن 'الكلب المسعور' قد كُسرت أنيابه.",
        speaker: "تشيون مويانغ",
        type: "thought",
        tone: "angry",
      },
      {
        id: "c24-p6-2",
        box_2d: [680, 220, 810, 780],
        originalText: "Let them come. I will show them the true terror of the Cheon bloodline.",
        arabicTranslation: "دعهم يأتوا إذاً! سأريهم الرعب الحقيقي الذي تحمله سلالة تشيون.",
        speaker: "تشيون مويانغ",
        type: "speech",
        tone: "determined",
      },
    ],
    7: [
      {
        id: "c24-p7-1",
        box_2d: [280, 200, 410, 800],
        originalText: "Is it true that the young lord shattered the testing stone with a single blow?!",
        arabicTranslation: "أصحيح ما يُشاع بأن السيد الشاب قد حطم صخرة الاختبار بضربة واحدة لا غير؟!",
        speaker: "تلاميذ العشيرة",
        type: "speech",
        tone: "shocked",
      },
      {
        id: "c24-p7-2",
        box_2d: [650, 220, 780, 780],
        originalText: "Impossible! That stone was forged from cold meteoric steel!",
        arabicTranslation: "مستحيل! كانت تلك الصخرة مصنوعة من فولاذ النيزك البارد المستحيل كسره!",
        speaker: "تلميذ متدرب",
        type: "speech",
        tone: "shocked",
      },
    ],
    8: [
      {
        id: "c24-p8-1",
        box_2d: [250, 200, 390, 800],
        originalText: "He is completely different from the unruly rascal we once knew...",
        arabicTranslation: "إنه يختلف كلياً عن الفتى الطائش والمتهور الذي عهدناه في السابق...",
        speaker: "كبير الشيوخ",
        type: "thought",
        tone: "calm",
      },
      {
        id: "c24-p8-2",
        box_2d: [680, 220, 810, 780],
        originalText: "His gaze holds the predatory presence of a demonic beast.",
        arabicTranslation: "نظرة عينيه تحمل هيبة وافتراس وحش شيطاني قادم من الأعماق.",
        speaker: "الشيخ الثاني",
        type: "thought",
        tone: "shocked",
      },
    ],
    9: [
      {
        id: "c24-p9-1",
        box_2d: [300, 220, 440, 780],
        originalText: "Stand down. From this day forward, I answer only to the Clan Head.",
        arabicTranslation: "تراجعوا فوراً! اعتباراً من اليوم، لن أرد إلا على زعيم العشيرة بشخصه.",
        speaker: "تشيون مويانغ",
        type: "shout",
        tone: "angry",
      },
      {
        id: "c24-p9-2",
        box_2d: [680, 200, 810, 800],
        originalText: "None of you have the authority to interrogate me!",
        arabicTranslation: "لا يملك أي منكم السلطة أو الجرأة لمساءلتي بعد الآن!",
        speaker: "تشيون مويانغ",
        type: "shout",
        tone: "determined",
      },
    ],
    10: [
      {
        id: "c24-p10-1",
        box_2d: [280, 220, 420, 780],
        originalText: "How dare you speak with such insolence in the sacred ancestral pavilion?!",
        arabicTranslation: "كيف تجرؤ على التحدث بهذه الغطرسة في ساحة الأسلاف المقدسة؟!",
        speaker: "الشيخ الثالث",
        type: "shout",
        tone: "angry",
      },
      {
        id: "c24-p10-2",
        box_2d: [650, 200, 790, 800],
        originalText: "Do you know the consequences of defying the Council of Elders?!",
        arabicTranslation: "ألا تدرك عواقب التمرد على مجلس الشيوخ وقوانين العائلة الصارمة؟!",
        speaker: "الشيخ الرابع",
        type: "speech",
        tone: "angry",
      },
    ],
    11: [
      {
        id: "c24-p11-1",
        box_2d: [260, 200, 400, 800],
        originalText: "Consequences?! You were the ones scheming behind my father's back!",
        arabicTranslation: "العواقب؟! أنتم من بدأ هذا الفساد حين تآمرتم خلف ظهر والدي!",
        speaker: "تشيون مويانغ",
        type: "shout",
        tone: "angry",
      },
      {
        id: "c24-p11-2",
        box_2d: [680, 220, 820, 780],
        originalText: "If you wish to subdue me, draw your weapons together right now!",
        arabicTranslation: "إذا كنتم تريدون إخضاعي بالقوة، فلتجردوا سيوفكم جميعاً في هذه اللحظة!",
        speaker: "تشيون مويانغ",
        type: "shout",
        tone: "determined",
      },
    ],
    12: [
      {
        id: "c24-p12-1",
        box_2d: [300, 200, 440, 800],
        originalText: "*BOOM!* Massive collision of internal energies!",
        arabicTranslation: "*دووووي ارتطام قاصف واصطدام هائل في طاقة التشي!*",
        speaker: "مؤثر صوتي (SFX)",
        type: "sfx",
        tone: "angry",
      },
      {
        id: "c24-p12-2",
        box_2d: [680, 220, 820, 780],
        originalText: "How can someone his age manifest such pure Sword Qi?!",
        arabicTranslation: "كيف يمكن لمقاتل في مثل سنه أن يطلق نصل سيف بهذا النقاء والكثافة المرعبة؟!",
        speaker: "الشيخ الثاني",
        type: "thought",
        tone: "shocked",
      },
    ],
    13: [
      {
        id: "c24-p13-1",
        box_2d: [280, 200, 420, 800],
        originalText: "Is this the Demon Wolf Sword Style left by the founding patriarch?!",
        arabicTranslation: "هل هذا أسلوب 'سيف الذئب الشيطاني' الذي أبدعه المؤسس الأول للعشيرة؟!",
        speaker: "كبير الشيوخ",
        type: "speech",
        tone: "shocked",
      },
      {
        id: "c24-p13-2",
        box_2d: [680, 220, 810, 780],
        originalText: "He absorbed the true essence of the technique during his coma!",
        arabicTranslation: "لقد استوعب جوهر الأسلوب بالكامل ودمجه في عروقه أثناء غيبوبته الطويلة!",
        speaker: "الشيخ الثالث",
        type: "thought",
        tone: "calm",
      },
    ],
    14: [
      {
        id: "c24-p14-1",
        box_2d: [250, 220, 390, 780],
        originalText: "Young Master Muyang, please stop! Straining further will tear your meridians!",
        arabicTranslation: "سيدي الشاب مويانغ، أرجوك توقف! الضغط الإضافي سيمزق مسارات الطاقة لديك!",
        speaker: "ووليونغ",
        type: "speech",
        tone: "whisper",
      },
      {
        id: "c24-p14-2",
        box_2d: [680, 200, 820, 800],
        originalText: "Wolyeong... step aside. This debt has been due for far too long.",
        arabicTranslation: "ووليونغ... تنحي جانباً؛ هذا الحساب مؤجل ومستحق منذ زمن بعيد.",
        speaker: "تشيون مويانغ",
        type: "speech",
        tone: "determined",
      },
    ],
    15: [
      {
        id: "c24-p15-1",
        box_2d: [300, 200, 440, 800],
        originalText: "The time for talk has ended. Whoever blocks my way is an enemy of the clan!",
        arabicTranslation: "لقد انتهى وقت الكلام التافه. كل من يقف في وجهي سأعامله كعدو وخائن للعشيرة!",
        speaker: "تشيون مويانغ",
        type: "shout",
        tone: "angry",
      },
      {
        id: "c24-p15-2",
        box_2d: [700, 250, 840, 750],
        originalText: "*Blue energy emanates from the dark blade*",
        arabicTranslation: "*وهج أزرق ناري يشع من حد السيف الأسود متأهباً للقتال*",
        speaker: "سرد بصري",
        type: "narration",
        tone: "determined",
      },
    ],
    16: [
      {
        id: "c24-p16-1",
        box_2d: [240, 200, 380, 800],
        originalText: "ENOUGH! Cease this futile conflict at once!",
        arabicTranslation: "كفى! آمركم جميعاً بوقف هذا النزاع العقيم فوراً!",
        speaker: "صوت جهوري (زعيم العشيرة)",
        type: "shout",
        tone: "angry",
      },
      {
        id: "c24-p16-2",
        box_2d: [680, 220, 810, 780],
        originalText: "The Patriarch (Gaju) has personally arrived at the courtyard!",
        arabicTranslation: "حضرة زعيم العشيرة (الغاجو) قد وصل بنفسه إلى ساحة المواجهة!",
        speaker: "الحراس والتلاميذ",
        type: "speech",
        tone: "shocked",
      },
    ],
    17: [
      {
        id: "c24-p17-1",
        box_2d: [260, 200, 400, 800],
        originalText: "Muyang... your strength has spoken for you. But sheath your blade.",
        arabicTranslation: "مويانغ... قوتك أثبتت حقك في التحدث اليوم. لكن أعد نصلك إلى غمده.",
        speaker: "زعيم العشيرة (الغاجو)",
        type: "speech",
        tone: "calm",
      },
      {
        id: "c24-p17-2",
        box_2d: [680, 200, 820, 800],
        originalText: "Understood, Father. But honor is not preserved through silence.",
        arabicTranslation: "أفهم قصدك يا أبي، لكن الشرف لا يُصان بالصمت أمام المتآمرين.",
        speaker: "تشيون مويانغ",
        type: "speech",
        tone: "determined",
      },
    ],
    18: [
      {
        id: "c24-p18-1",
        box_2d: [300, 180, 450, 820],
        originalText: "Next Chapter: The Blood Council and the Succession Decree",
        arabicTranslation: "الفصل القادم: اجتماع مجلس الدم وقرار الوريث الشرعي لعشيرة تشيون.",
        speaker: "خاتمة الفصل",
        type: "narration",
        tone: "determined",
      },
      {
        id: "c24-p18-2",
        box_2d: [700, 220, 840, 780],
        originalText: "To be continued in Chapter 25 - Becoming the Cheon Clan's Mad Dog",
        arabicTranslation: "مستمر في الفصل 25 - كلب عشيرة تشيون المسعور.",
        speaker: "ملاحظة المترجم",
        type: "narration",
        tone: "calm",
      },
    ],
  };

  return Array.from({ length: 18 }, (_, i) => {
    const pageNum = i + 1;
    const pageIndexStr = pageNum < 10 ? `000${pageNum}` : `00${pageNum}`;
    const realImageUrl = `${baseUrl}/${pageIndexStr}.webp`;
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(realImageUrl)}`;

    return {
      pageNumber: pageNum,
      imageUrl: proxyUrl,
      originalUrl: realImageUrl,
      caption: `الصفحة ${pageNum} من 18`,
      precomputedTranslations: translationsMap[pageNum] || [
        {
          id: `c24-p${pageNum}-1`,
          box_2d: [350, 200, 490, 800],
          originalText: "Cheon Clan's Mad Dog - Scene continuation",
          arabicTranslation: "استمرار مجريات المواجهة القتالية في عشيرة تشيون.",
          speaker: "تشيون مويانغ",
          type: "speech",
          tone: "determined",
        },
      ],
      termsExplained: [
        {
          term: "تشيون مويانغ (Cheon Muyang)",
          explanation: "بطل القصة الملقب بـ 'كلب عشيرة تشيون المسعور'، استعاد وعيه وتجاوز حدود التدريب العادي.",
        },
        {
          term: "التحول القتالي (Metamorphosis)",
          explanation: "مرحلة نادرة في الموريم يُعاد فيها صقل عظام وعضلات المقاتل بفضل طاقة التشي المتطرفة.",
        },
        {
          term: "السماوات العليا (Upper Heavens)",
          explanation: "أعلى مستوى من استبصار نصل السيف في عالم الفنون القتالية القديم.",
        },
      ],
    };
  });
};

const INITIAL_CHAPTER: MangaChapter = {
  id: 'cheon-clan-24',
  title: "Becoming the Cheon Clan's Mad Dog",
  titleArabic: "كلب عشيرة تشيون المسعور",
  chapterNumber: "24",
  chapterTitle: "Chapter 24: Metamorphosis & The Upper Heavens",
  chapterTitleArabic: "الفصل 24: التحول القتالي واستبصار السماوات",
  sourceUrl: "https://manhuaus.com/manga/becoming-the-cheon-clans-mad-dog/chapter-24/",
  coverImage: `/api/proxy-image?url=${encodeURIComponent("https://roliascan.org/storage/chapters/manhwa_93007_24/0001.webp")}`,
  pages: createRealChapter24Pages(),
};

export default function App() {
  const [currentChapter, setCurrentChapter] = useState<MangaChapter>(INITIAL_CHAPTER);
  const [availableChapters, setAvailableChapters] = useState<MangaChapter[]>([INITIAL_CHAPTER]);
  const [singlePageIndex, setSinglePageIndex] = useState<number>(0);

  // Settings
  const [settings, setSettings] = useState<ReaderSettings>({
    readingMode: 'webtoon',
    overlayMode: 'bubble',
    arabicFont: 'cairo',
    bubbleTheme: 'manga-typeset',
    bubbleFontSize: 'md',
    bubbleOpacity: 1.0,
    maskCoverage: 'extended',
    showOriginalOnHover: true,
    autoTranslatePages: false,
    zoom: 1.0,
    fitMode: 'width',
  });

  // Modals & Drawers
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Loading States
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [urlError, setUrlError] = useState<string | undefined>();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch sample chapters on mount
  useEffect(() => {
    fetchSampleChapters()
      .then((chapters) => {
        if (chapters && chapters.length > 0) {
          setAvailableChapters(chapters);
        }
      })
      .catch((err) => console.warn('Could not load extra samples', err));
  }, []);

  // Track scroll for "Scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Settings Helper
  const handleUpdateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Translate a specific page using Gemini
  const handleTranslatePage = async (pageNumber: number) => {
    const pageIndex = currentChapter.pages.findIndex((p) => p.pageNumber === pageNumber);
    if (pageIndex === -1) return;

    const page = currentChapter.pages[pageIndex];

    // Mark as translating
    setCurrentChapter((prev) => {
      const updatedPages = [...prev.pages];
      updatedPages[pageIndex] = { ...updatedPages[pageIndex], isTranslating: true, error: undefined };
      return { ...prev, pages: updatedPages };
    });

    try {
      const translation = await translatePage(
        page.imageUrl,
        page.pageNumber,
        currentChapter.titleArabic || currentChapter.title
      );

      setCurrentChapter((prev) => {
        const updatedPages = [...prev.pages];
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          isTranslating: false,
          translatedData: translation,
          termsExplained: translation.termsExplained,
        };
        return { ...prev, pages: updatedPages };
      });
    } catch (err: any) {
      setCurrentChapter((prev) => {
        const updatedPages = [...prev.pages];
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          isTranslating: false,
          error: err.message || 'حدث خطأ أثناء ترجمة الصفحة',
        };
        return { ...prev, pages: updatedPages };
      });
    }
  };

  // Translate All Pages Sequentially
  const handleTranslateAllPages = async () => {
    if (isTranslatingAll) return;
    setIsTranslatingAll(true);

    for (const page of currentChapter.pages) {
      const hasTranslation =
        (page.translatedData?.dialogues && page.translatedData.dialogues.length > 0) ||
        (page.precomputedTranslations && page.precomputedTranslations.length > 0);

      if (!hasTranslation) {
        await handleTranslatePage(page.pageNumber);
      }
    }

    setIsTranslatingAll(false);
  };

  // Fetch chapter from user URL
  const handleFetchUrl = async (url: string) => {
    setIsLoadingChapter(true);
    setUrlError(undefined);

    try {
      const res = await fetchChapterFromUrl(url);
      if (res.chapter) {
        setCurrentChapter(res.chapter);
        setAvailableChapters((prev) => {
          if (!prev.find((c) => c.id === res.chapter.id)) {
            return [res.chapter, ...prev];
          }
          return prev;
        });
        setSinglePageIndex(0);
        setIsUrlModalOpen(false);
      }
    } catch (err: any) {
      setUrlError(err.message || 'فشل في استخراج صفحات الفصل من الرابط');
    } finally {
      setIsLoadingChapter(false);
    }
  };

  // Handle Custom Uploaded Pages
  const handleCustomPagesAdded = (pages: MangaPage[], title: string) => {
    const customChapter: MangaChapter = {
      id: 'custom-' + Date.now(),
      title: title,
      titleArabic: title,
      chapterNumber: '1',
      chapterTitle: title,
      chapterTitleArabic: title,
      coverImage: pages[0]?.imageUrl,
      pages: pages,
    };

    setCurrentChapter(customChapter);
    setAvailableChapters((prev) => [customChapter, ...prev]);
    setSinglePageIndex(0);
  };

  // Compute stats
  const totalTranslatedCount = currentChapter.pages.filter(
    (p) =>
      (p.translatedData?.dialogues && p.translatedData.dialogues.length > 0) ||
      (p.precomputedTranslations && p.precomputedTranslations.length > 0)
  ).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-cairo" dir="rtl">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenUrlModal={() => setIsUrlModalOpen(true)}
        currentChapterTitle={currentChapter.titleArabic}
      />

      {/* 2. Reader Control & Chapter Navigation Bar */}
      <ChapterBar
        currentChapter={currentChapter}
        availableChapters={availableChapters}
        onSelectChapter={(ch) => {
          setCurrentChapter(ch);
          setSinglePageIndex(0);
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onTranslateAllPages={handleTranslateAllPages}
        isTranslatingAll={isTranslatingAll}
        totalTranslated={totalTranslatedCount}
        totalPages={currentChapter.pages.length}
      />

      {/* 3. Main Reading Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-6">
        {settings.readingMode === 'webtoon' ? (
          // Webtoon Continuous Scroll Mode
          <div className="flex flex-col items-center gap-2">
            {currentChapter.pages.map((page) => (
              <PageReader
                key={`${currentChapter.id}-${page.pageNumber}`}
                page={page}
                chapterTitle={currentChapter.titleArabic || currentChapter.title}
                settings={settings}
                onTranslatePage={handleTranslatePage}
              />
            ))}
          </div>
        ) : (
          // Single Page Mode
          <div className="flex flex-col items-center">
            {currentChapter.pages[singlePageIndex] && (
              <PageReader
                page={currentChapter.pages[singlePageIndex]}
                chapterTitle={currentChapter.titleArabic || currentChapter.title}
                settings={settings}
                onTranslatePage={handleTranslatePage}
              />
            )}

            {/* Single Page Pagination Footer */}
            <div className="flex items-center justify-center gap-4 mt-6 p-2 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <button
                onClick={() => setSinglePageIndex(Math.max(0, singlePageIndex - 1))}
                disabled={singlePageIndex === 0}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الصفحة السابقة</span>
              </button>

              <span className="text-xs font-mono text-neutral-300">
                {singlePageIndex + 1} / {currentChapter.pages.length}
              </span>

              <button
                onClick={() =>
                  setSinglePageIndex(
                    Math.min(currentChapter.pages.length - 1, singlePageIndex + 1)
                  )
                }
                disabled={singlePageIndex === currentChapter.pages.length - 1}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>الصفحة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chapter End Navigation Card */}
        <div className="max-w-xl mx-auto mt-12 mb-8 p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl text-center flex flex-col items-center gap-3 shadow-xl">
          <BookOpen className="w-8 h-8 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            وصلت إلى نهاية {currentChapter.chapterTitleArabic || currentChapter.chapterTitle}
          </h3>
          <p className="text-xs text-neutral-400">
            يمكنك تصفح فصول أخرى أو إدخال رابط فصل جديد من موقع المانجا مباشرة
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setIsUrlModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span>جلب فصل جديد من رابط</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-30 p-3 bg-amber-500 text-neutral-950 hover:bg-amber-400 rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer"
          title="العودة لأعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* 4. Modals and Drawers */}
      <UrlBarModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onFetchUrl={handleFetchUrl}
        sampleChapters={availableChapters}
        onSelectSample={(ch) => {
          setCurrentChapter(ch);
          setSinglePageIndex(0);
        }}
        isLoading={isLoadingChapter}
        error={urlError}
      />

      <GlossaryDrawer
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onCustomPagesAdded={handleCustomPagesAdded}
      />
    </div>
  );
}
