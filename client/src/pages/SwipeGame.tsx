import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import BottomNav from "@/components/BottomNav";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Check, X, Undo2, RotateCcw, Zap,
  Trophy, Sparkles, Gamepad2, Info, ChevronRight, LogIn,
  BookOpen, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import WordDetailSheet from "@/components/WordDetailSheet";
import ClickableExample from "@/components/ClickableExample";
import { useSound } from "@/contexts/SoundContext";
import UpgradeModal from "@/components/UpgradeModal";
import { useI18n } from "@/contexts/I18nContext";
import { useAudio } from "@/hooks/useAudio";

interface SwipeResult {
  wordId: number;
  known: boolean;
}

type CardFilter = 'new' | 'reviewing' | 'all';

/* ─── Inline AI Translation Hook ─── */
function useExampleTranslation(
  sentence: string | null | undefined,
  existingEnglish: string | null | undefined,
  language: 'korean' | 'chinese' | undefined,
  enabled: boolean
) {
  const translate = trpc.llm.translateExample.useMutation();
  const [translation, setTranslation] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const attempted = useRef<string | null>(null);

  const doTranslate = useCallback((s: string) => {
    setFailed(false);
    translate.mutate(
      { koreanSentence: s, language },
      {
        onSuccess: (data) => {
          if (data?.translation) setTranslation(data.translation);
          else setFailed(true);
        },
        onError: () => setFailed(true),
      }
    );
  }, [translate, language]);

  useEffect(() => {
    if (!enabled) return;
    if (existingEnglish) {
      setTranslation(existingEnglish);
      setFailed(false);
      return;
    }
    if (!sentence) { setTranslation(null); setFailed(false); return; }
    if (attempted.current === sentence) return;
    attempted.current = sentence;
    doTranslate(sentence);
  }, [enabled, sentence, existingEnglish, doTranslate]);

  const retry = useCallback(() => {
    if (sentence) { attempted.current = null; doTranslate(sentence); }
  }, [sentence, doTranslate]);

  return {
    translation,
    isLoading: translate.isPending && !translation,
    failed,
    retry,
  };
}

function FlashCard({
  word,
  onSwipe,
  isTop,
  aiEnabled,
  showExamples,
  onToggleExamples,
}: {
  word: any;
  onSwipe: (known: boolean) => void;
  isTop: boolean;
  aiEnabled: boolean;
  showExamples: boolean;
  onToggleExamples: () => void;
}) {
  const { language } = useLanguage();
  const { locale } = useI18n();
  const { speak, isSupported } = useAudio();
  const audioSupported = isSupported();
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const isChinese = !!word.chinese && !word.korean;
  const SWIPE_THRESHOLD = 80;

  // Simple drag handlers
  const handleStart = (clientX: number, clientY: number) => {
    if (!isTop) return;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    setDragX(clientX - startPos.current.x);
    setDragY((clientY - startPos.current.y) * 0.3);
  };

  const handleEnd = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      const known = dragX < 0;
      setExitDir(known ? 'left' : 'right');
      setTimeout(() => onSwipe(known), 300);
    } else {
      setDragX(0);
      setDragY(0);
    }
  };

  const rotation = dragX * 0.08;
  const swipeIndicator = dragX > 30 ? 'right' : dragX < -30 ? 'left' : null;

  const cardStyle = exitDir
    ? { transform: `translateX(${exitDir === 'right' ? '150%' : '-150%'}) rotate(${exitDir === 'right' ? '20deg' : '-20deg'})`, opacity: 0 }
    : { transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)` };

  if (!isTop) {
    return <div className="absolute inset-0 game-card rounded-2xl p-6 flex items-center justify-center scale-[0.95] opacity-60"><span className="text-4xl font-black text-foreground/30">🇰🇷</span></div>;
  }

  return (
    <div
      className="absolute inset-0 select-none touch-none cursor-grab active:cursor-grabbing"
      style={cardStyle}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX, e.clientY); }}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
    >
<<<<<<< Updated upstream
      {/* Swipe indicators */}
      {swipeIndicator === 'left' && (
        <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 border-primary bg-primary/20 rotate-[-12deg] animate-xp-pop">
          <span className="text-primary font-black text-lg">LEARNED ✓</span>
        </div>
      )}
      {swipeIndicator === 'right' && (
        <div className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 border-destructive bg-destructive/20 rotate-[12deg] animate-xp-pop">
          <span className="text-destructive font-black text-lg">REVIEW ✗</span>
        </div>
      )}

      {/* Card content */}
      <div className="w-full h-full game-card rounded-2xl p-5 flex flex-col items-center justify-center game-card-glow overflow-hidden">

        {/* Level badge */}
        <div className="absolute top-3 right-3">
          {word.hskLevel ? (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              parseInt(word.hskLevel) <= 2 ? 'bg-primary/20 text-primary' :
              parseInt(word.hskLevel) <= 4 ? 'bg-chart-3/20 text-chart-3' : 'bg-accent/20 text-accent'
            }`}>
              HSK {word.hskLevel}
            </span>
          ) : (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              word.topikLevel === 'beginner' ? 'bg-primary/20 text-primary' :
              word.topikLevel === 'intermediate' ? 'bg-chart-3/20 text-chart-3' : 'bg-accent/20 text-accent'
            }`}>
              {word.topikLevel === 'beginner' ? t('swipe.beginner') :
               word.topikLevel === 'intermediate' ? t('swipe.intermediate') : t('swipe.advanced')}
            </span>
          )}
        </div>

        {/* Word display */}
        {word.korean ? (
          <div className="flex flex-col items-center justify-center gap-1 mb-3 mt-4">
            <div className="flex items-center justify-center gap-3">
              <p className="text-5xl font-black text-foreground">{word.korean}</p>
              {audioSupported && (
                <button onClick={() => speak(word.korean || '', 'ko-KR')} className="p-2 rounded-lg hover:bg-secondary/60 transition-colors active:scale-95">
                  <Volume2 className="w-5 h-5 text-primary" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium">{word.romanization}</p>
          </div>
        ) : word.chinese ? (
          <div className="flex flex-col items-center justify-center gap-1 mb-3 mt-4">
            <div className="flex items-center justify-center gap-3">
              <p className="text-5xl font-black text-foreground">{word.chinese}</p>
              {audioSupported && (
                <button onClick={() => speak(word.chinese || '', 'zh-CN')} className="p-2 rounded-lg hover:bg-secondary/60 transition-colors active:scale-95">
                  <Volume2 className="w-5 h-5 text-primary" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium">{word.pinyin}</p>
          </div>
        ) : null}
=======
      {/* Indicators */}
      {swipeIndicator === 'left' && <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 border-primary bg-primary/20 rotate-[-12deg]">LEARNED ✓</div>}
      {swipeIndicator === 'right' && <div className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 border-destructive bg-destructive/20 rotate-[12deg]">REVIEW ✗</div>}

      <div className="w-full h-full game-card rounded-2xl p-5 flex flex-col items-center justify-center overflow-hidden">

        {/* Word */}
        <div className="mb-4 text-center">
          <div className="text-5xl font-black mb-1">{word.korean || word.chinese}</div>
          <div className="text-sm text-muted-foreground">{word.romanization || word.pinyin}</div>
        </div>
>>>>>>> Stashed changes

        {/* Meaning */}
        <div className="w-full bg-secondary/50 rounded-xl p-4 mb-4 text-center">
          <p className="text-lg font-bold text-primary">
            {locale === 'fr' && word.meaningFr ? word.meaningFr : word.meaning}
          </p>
        </div>

<<<<<<< Updated upstream
        {/* === DEBUG EXAMPLE SECTION === */}
        {showExamples && (word.koreanExample || word.chineseExample) ? (
          <div className="w-full space-y-3 text-center px-1 bg-secondary/30 rounded-xl p-3">
            {/* Original Example */}
            <div className="space-y-1">
              {word.koreanExample ? (
                <ClickableExample sentence={word.koreanExample} />
              ) : word.chineseExample ? (
                <>
                  <p className="text-sm text-foreground">{word.chineseExample}</p>
                  {word.examplePinyin && <p className="text-xs text-muted-foreground">{word.examplePinyin}</p>}
                </>
              ) : null}
            </div>

            {/* What translations exist? */}
            <div className="text-[10px] text-left space-y-1 border-t border-muted pt-2">
              <p><strong>Available:</strong></p>
              {word.exampleEnglish && <p className="text-green-600">✅ English: {word.exampleEnglish}</p>}
              {word.exampleFrench && <p className="text-blue-600">✅ French: {word.exampleFrench}</p>}
              {word.exampleChineseFrench && <p className="text-blue-600">✅ Chinese-French: {word.exampleChineseFrench}</p>}
              {!word.exampleEnglish && !word.exampleFrench && !word.exampleChineseFrench && 
                <p className="text-amber-600">No translations found</p>}
            </div>

            {/* Display based on language */}
            {locale === 'fr' ? (
              <p className="text-sm italic text-blue-600">
                {word.exampleFrench || word.exampleChineseFrench || word.exampleEnglish || "No French translation"}
              </p>
            ) : (
              <p className="text-sm italic text-green-600">
                {word.exampleEnglish || word.exampleFrench || word.exampleChineseFrench || "No English translation"}
              </p>
            )}
=======
        {/* Example + Translation */}
        {showExamples && (word.koreanExample || word.chineseExample) && (
          <div className="w-full text-center space-y-3 px-2">
            <div>
              {word.koreanExample ? (
                <ClickableExample sentence={word.koreanExample} />
              ) : (
                <p className="text-sm">{word.chineseExample}</p>
              )}
            </div>

            <div className="border-t border-muted pt-3">
              <p className="text-sm italic text-foreground">
                {locale === 'fr' 
                  ? (word.exampleFrench || word.exampleChineseFrench || word.exampleEnglish)
                  : (word.exampleEnglish || word.exampleChineseFrench)
                }
              </p>
            </div>
>>>>>>> Stashed changes
          </div>
        )}

        <div className="mt-auto pt-6">
          <button onClick={onToggleExamples} className="text-xs font-bold px-4 py-2 rounded-full" style={{backgroundColor: showExamples ? '#22c55e30' : '#6b728030', color: showExamples ? '#22c55e' : '#6b7280'}}>
            {showExamples ? 'Examples ON' : 'Examples OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Session Summary ─── */
function SessionSummary({
  results,
  onRestart,
  onHome,
  playVictory,
}: {
  results: { totalXp: number; totalLearned: number; totalReviewed: number };
  onRestart: () => void;
  onHome: () => void;
  playVictory: () => void;
}) {
  const { t } = useI18n();
  const hasPlayed = useRef(false);
  useEffect(() => {
    if (!hasPlayed.current) {
      hasPlayed.current = true;
      const timer = setTimeout(() => playVictory(), 200);
      return () => clearTimeout(timer);
    }
  }, [playVictory]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="animate-xp-pop">
          <Trophy className="w-16 h-16 text-chart-3 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-foreground">{t('swipe.sessionComplete')}</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-4 text-center">
            <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-black text-primary xp-glow">+{results.totalXp}</p>
            <p className="text-[10px] text-muted-foreground font-medium">XP Earned</p>
          </div>
          <div className="game-card p-4 text-center">
            <Check className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-black text-primary">{results.totalLearned}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{t('swipe.learned')}</p>
          </div>
          <div className="game-card p-4 text-center">
            <RotateCcw className="w-5 h-5 text-chart-3 mx-auto mb-1" />
            <p className="text-xl font-black text-chart-3">{results.totalReviewed - results.totalLearned}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{t('swipe.review')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button size="lg" className="w-full font-bold press-scale" onClick={onRestart}>
            <Sparkles className="w-5 h-5 mr-2" />
            {t('swipe.playAgain')}
          </Button>
          <Button size="lg" variant="outline" className="w-full font-bold press-scale" onClick={onHome}>
            {t('swipe.backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Deck Size Options ─── */
const DECK_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/* ─── Card Filter Options ─── */
const CARD_FILTER_OPTIONS: { key: CardFilter; labelKey: string; icon: React.ReactNode; descKey: string }[] = [
  { key: 'new', labelKey: 'words.new', icon: <Plus className="w-4 h-4" />, descKey: 'swipe.onlyUnseenWords' },
  { key: 'reviewing', labelKey: 'words.reviewing', icon: <RotateCcw className="w-4 h-4" />, descKey: 'swipe.wordsToReview' },
  { key: 'all', labelKey: 'words.all', icon: <BookOpen className="w-4 h-4" />, descKey: 'swipe.allWords' },
];

/* ─── Main Component ─── */
export default function SwipeGame() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const isChinese = language === 'chinese';
  const [posFilter, setPosFilter] = useState(params.get("pos") || "all");
  const [levelFilter, setLevelFilter] = useState(
    params.get("hskLevel") || params.get("level") ||
    (language === 'chinese' ? '1' : 'beginner')
  );
  const [cardFilter, setCardFilter] = useState<CardFilter>('new');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeResults, setSwipeResults] = useState<SwipeResult[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [deckSize, setDeckSize] = useState<number>(
    DECK_SIZE_OPTIONS.includes(Number(params.get("count")) as any)
      ? Number(params.get("count"))
      : 10
  );
  const [detailWord, setDetailWord] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('swipe-ai-translation') !== 'off'; } catch { return true; }
  });

  const [showExamples, setShowExamples] = useState<boolean>(() => {
    try { return localStorage.getItem('swipe-show-examples') !== 'off'; } catch { return true; }
  });

  const toggleExamples = useCallback(() => {
    setShowExamples(prev => {
      const next = !prev;
      try { localStorage.setItem('swipe-show-examples', next ? 'on' : 'off'); } catch {}
      return next;
    });
  }, []);

  const wordsQuery = trpc.words.random.useQuery(
    {
      pos: posFilter !== 'all' ? posFilter : undefined,
      topikLevel: !isChinese && levelFilter !== 'all' ? levelFilter : undefined,
      hskLevel: isChinese && levelFilter !== 'all' ? levelFilter : undefined,
      limit: deckSize,
      language: language === 'french' ? 'korean' : language,
      statuses: cardFilter === 'all' ? undefined : [cardFilter],
    },
    { enabled: sessionStarted, refetchOnWindowFocus: false }
  );

  // ... (rest of the main component stays the same - I kept it short here for clarity, but you can keep your existing logic for handleSwipe, etc.)

  // Paste the rest of your main component (from "const words = ..." down to the end) if you want me to give the complete thing again.

  // For now, test with this FlashCard fix first.
