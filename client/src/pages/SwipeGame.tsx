import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import BottomNav from "@/components/BottomNav";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Check, X, Undo2, RotateCcw, Zap,
  Trophy, Sparkles, Gamepad2, Info, Loader2, ChevronRight, LogIn,
  BookOpen, Star, Plus,
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

interface SwipeResult {
  wordId: number;
  known: boolean;
}

type CardFilter = 'all' | 'new' | 'reviewing' | 'learned';

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

/* ─── Flash Card ─── */
function FlashCard({
  word,
  onSwipe,
  isTop,
  aiEnabled,
}: {
  word: any;
  onSwipe: (known: boolean) => void;
  isTop: boolean;
  aiEnabled: boolean;
}) {
  const { language } = useLanguage();
  const { t, locale } = useI18n();
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const isChinese = !!word.chinese && !word.korean;
  const exampleForTranslation = isChinese ? word.chineseExample : word.koreanExample;
  const existingTranslation = isChinese ? null : word.exampleEnglish;

  const { translation, isLoading: translationLoading, failed: translationFailed, retry: retryTranslation } = useExampleTranslation(
    isTop && aiEnabled ? exampleForTranslation : null,
    isTop && aiEnabled ? existingTranslation : null,
    isChinese ? 'chinese' : 'korean',
    isTop && aiEnabled
  );

  const SWIPE_THRESHOLD = 80;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!isTop) return;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  }, [isTop]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    setDragX(clientX - startPos.current.x);
    setDragY((clientY - startPos.current.y) * 0.3);
  }, [isDragging, isTop]);

  const handleEnd = useCallback(() => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      const known = dragX < 0; // LEFT = Learned (known=true), RIGHT = Review (known=false)
      setExitDir(known ? 'left' : 'right');
      setTimeout(() => onSwipe(known), 300);
    } else {
      setDragX(0);
      setDragY(0);
    }
  }, [isDragging, isTop, dragX, onSwipe]);

  const onTouchStart = useCallback((e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY), [handleStart]);
  const onTouchMove = useCallback((e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY), [handleMove]);
  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);
  const onMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX, e.clientY); }, [handleStart]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onUp = () => handleEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  const rotation = dragX * 0.08;
  const swipeIndicator = dragX > 30 ? 'right' : dragX < -30 ? 'left' : null;

  const cardStyle: React.CSSProperties = exitDir
    ? {
        transform: `translateX(${exitDir === 'right' ? '150%' : '-150%'}) rotate(${exitDir === 'right' ? '20deg' : '-20deg'})`,
        opacity: 0,
        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s',
      }
    : {
        transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
      };

  if (!isTop) {
    return (
      <div className="absolute inset-0 game-card rounded-2xl p-6 flex items-center justify-center scale-[0.95] opacity-60">
        <span className="text-4xl font-black text-foreground/30">🇰🇷</span>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 select-none touch-none cursor-grab active:cursor-grabbing"
      style={cardStyle}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
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
        {/* Level badge top-right only (no POS) */}
        <div className="absolute top-3 right-3">
          {word.hskLevel ? (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              parseInt(word.hskLevel) <= 2 ? 'bg-primary/20 text-primary' :
              parseInt(word.hskLevel) <= 4 ? 'bg-chart-3/20 text-chart-3' :
              'bg-accent/20 text-accent'
            }`}>
              HSK {word.hskLevel}
            </span>
          ) : (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              word.topikLevel === 'beginner' ? 'bg-primary/20 text-primary' :
              word.topikLevel === 'intermediate' ? 'bg-chart-3/20 text-chart-3' :
              'bg-accent/20 text-accent'
            }`}>
              {word.topikLevel === 'beginner' ? t('swipe.beginner') :
               word.topikLevel === 'intermediate' ? t('swipe.intermediate') : t('swipe.advanced')}
            </span>
          )}
        </div>

        {/* Word display */}
        {word.korean ? (
          <>
            <p className="text-4xl font-black text-foreground mb-1 mt-4">{word.korean}</p>
            <p className="text-sm text-muted-foreground font-medium mb-3">{word.romanization}</p>
          </>
        ) : word.chinese ? (
          <>
            <p className="text-4xl font-black text-foreground mb-1 mt-4">{word.chinese}</p>
            <p className="text-sm text-muted-foreground font-medium mb-3">{word.pinyin}</p>
          </>
        ) : null}

        {/* Meaning */}
        <div className="w-full bg-secondary/50 rounded-xl p-3 mb-3">
          {locale === 'fr' && word.meaningFr ? (
            <p className="text-lg font-bold text-primary text-center leading-snug">{word.meaningFr}</p>
          ) : (
            <p className="text-lg font-bold text-primary text-center leading-snug">{word.meaning}</p>
          )}
        </div>

        {/* Example sentence */}
        {word.koreanExample ? (
          <div className="w-full space-y-1.5 text-center px-1">
            {locale === 'fr' && word.exampleFrench ? (
              <p className="text-sm text-foreground leading-relaxed italic">{word.exampleFrench}</p>
            ) : (
              <>
                <ClickableExample sentence={word.koreanExample} />
                {aiEnabled ? (
                  translation ? (
                    <p className="text-xs text-muted-foreground italic leading-relaxed">{translation}</p>
                  ) : translationLoading ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Translating...</span>
                    </div>
                  ) : translationFailed ? (
                    <p className="text-xs text-muted-foreground/60 italic">Translation unavailable</p>
                  ) : null
                ) : null}
              </>
            )}
          </div>
        ) : word.chineseExample ? (
          <div className="w-full space-y-1.5 text-center px-1">
            {locale === 'fr' && word.exampleChineseFrench ? (
              <p className="text-sm text-foreground leading-relaxed italic">{word.exampleChineseFrench}</p>
            ) : (
              <>
                <p className="text-sm text-foreground leading-relaxed">{word.chineseExample}</p>
                {word.examplePinyin && (
                  <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">{word.examplePinyin}</p>
                )}
                {aiEnabled ? (
                  translation ? (
                    <p className="text-xs text-muted-foreground italic leading-relaxed">{translation}</p>
                  ) : translationLoading ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Translating...</span>
                    </div>
                  ) : translationFailed ? (
                    <p className="text-xs text-muted-foreground/60 italic">Translation unavailable</p>
                  ) : null
                ) : null}
              </>
            )}
          </div>
        ) : null}

        <p className="text-[10px] text-muted-foreground/50 mt-auto pt-2">
          ← Review · Swipe · Know it →
        </p>
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
  {
    key: 'new',
    labelKey: 'words.new',
    icon: <Plus className="w-4 h-4" />,
    descKey: 'swipe.onlyUnseenWords',
  },
  {
    key: 'reviewing',
    labelKey: 'words.reviewing',
    icon: <RotateCcw className="w-4 h-4" />,
    descKey: 'swipe.wordsToReview',
  },
  {
    key: 'learned',
    labelKey: 'words.learned',
    icon: <Star className="w-4 h-4" />,
    descKey: 'swipe.reinforceLearned',
  },
  {
    key: 'all',
    labelKey: 'swipe.allWords',
    icon: <BookOpen className="w-4 h-4" />,
    descKey: 'swipe.allWords',
  },
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
  // AI translation toggle — persisted in localStorage
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('swipe-ai-translation') !== 'off'; } catch { return true; }
  });

  const toggleAi = useCallback(() => {
    setAiEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('swipe-ai-translation', next ? 'on' : 'off'); } catch {}
      return next;
    });
  }, []);

  // Build statuses array from cardFilter for the random query
  const statusesForQuery = useMemo<string[] | undefined>(() => {
    if (cardFilter === 'all') return undefined;
    return [cardFilter];
  }, [cardFilter]);

  const wordsQuery = trpc.words.random.useQuery(
    {
      pos: posFilter !== 'all' ? posFilter : undefined,
      topikLevel: !isChinese && levelFilter !== 'all' ? levelFilter : undefined,
      hskLevel: isChinese && levelFilter !== 'all' ? levelFilter : undefined,
      limit: deckSize,
      language: language === 'french' ? 'korean' : language,
      statuses: statusesForQuery,
    },
    { enabled: sessionStarted, refetchOnWindowFocus: false }
  );

  // Per-swipe progress mutation
  const swipeMutation = trpc.progress.swipe.useMutation();
  const { play: sfx } = useSound();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<{ learnedCount: number; limit: number } | null>(null);
  // Track learned count locally to pre-check paywall without waiting for server
  const localLearnedCount = useRef(0);
  const subscriptionQuery = trpc.subscription.getSubscriptionStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
  const wordLimit = subscriptionQuery.data?.wordAccessLimit ?? 150;

  const words = wordsQuery.data ?? [];

  // Track which wordIds have been persisted so undo can't revert saved progress
  const persistedWordIds = useRef<Set<number>>(new Set());

  const handleSwipe = useCallback((known: boolean) => {
    if (!words[currentIndex]) return;

    // Pre-check paywall: if marking as known and at limit, block immediately
    if (known && isAuthenticated && localLearnedCount.current >= wordLimit) {
      setPaywallInfo({ learnedCount: localLearnedCount.current, limit: wordLimit });
      setPaywallOpen(true);
      return; // Don't advance the card
    }

    if (known) sfx.swipeRight(); else sfx.swipeLeft();

    const wordId = words[currentIndex].id;
    const result = { wordId, known };
    setSwipeResults(prev => [...prev, result]);
    setHistory(prev => [...prev, currentIndex]);

    // Track locally
    if (known) localLearnedCount.current += 1;

    // Save progress immediately after each swipe
    if (isAuthenticated) {
      persistedWordIds.current.add(wordId);
      swipeMutation.mutate(
        { wordId, known, language: language === 'french' ? 'korean' : language },
        {
          onSuccess: (data) => {
            if (data.status === 'paywall_blocked') {
              // Server confirmed block — show modal and revert local count
              localLearnedCount.current -= 1;
              setPaywallInfo({ learnedCount: (data as any).learnedCount, limit: (data as any).limit });
              setPaywallOpen(true);
            }
          },
          onError: () => toast.error("Failed to save this card's progress"),
        }
      );
    }

    if (currentIndex + 1 >= words.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words, isAuthenticated, swipeMutation, language, sfx, wordLimit]);

  // Undo is allowed only if the card being undone hasn't been persisted to the database
  // For authenticated users: undo is disabled for cards in persistedWordIds (already saved)
  // For unauthenticated users: undo is always allowed (no persistence)
  const canUndo = history.length > 0 && (
    !isAuthenticated || !persistedWordIds.current.has(words[history[history.length - 1]]?.id)
  );

  // Tooltip for disabled undo
  const undoTooltip = !canUndo && isAuthenticated && history.length > 0
    ? "Can't undo — this card's progress has been saved"
    : undefined;

  const handleBack = useCallback(() => {
    if (!canUndo) return;
    const prevIndex = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setSwipeResults(prev => prev.slice(0, -1));
    setCurrentIndex(prevIndex);
  }, [history, canUndo]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSwipeResults([]);
    setHistory([]);
    setSessionDone(false);
    setSessionStarted(false);
    setTimeout(() => setSessionStarted(true), 100);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (sessionDone) {
    const totalXp = swipeResults.reduce((sum, r) => sum + (r.known ? 10 : 3), 0);
    const totalLearned = swipeResults.filter(r => r.known).length;
    return (
      <SessionSummary
        results={{ totalXp, totalLearned, totalReviewed: swipeResults.length }}
        onRestart={handleRestart}
        onHome={() => setLocation("/")}
        playVictory={sfx.victory}
      />
    );
  }

  /* ─── Session Start Screen ─── */
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-6 pb-4">
          <button onClick={() => { sfx.tap(); setLocation("/"); }} className="flex items-center gap-1 text-muted-foreground mb-4 press-scale">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t('rules.back')}</span>
          </button>
          <h1 className="text-2xl font-black text-foreground">{t('swipe.startSession')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('swipe.chooseYourDeck')}</p>
        </div>

        <div className="px-4 space-y-4">
          <div className="game-card p-4 space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">{isChinese ? 'HSK Level' : t('swipe.topikLevel')}</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('swipe.allLevels')}</SelectItem>
                  {isChinese ? (
                    <>
                      <SelectItem value="1">HSK 1</SelectItem>
                      <SelectItem value="2">HSK 2</SelectItem>
                      <SelectItem value="3">HSK 3</SelectItem>
                      <SelectItem value="4">HSK 4</SelectItem>
                      <SelectItem value="5">HSK 5</SelectItem>
                      <SelectItem value="6">HSK 6</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="beginner">{t('swipe.beginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('swipe.intermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('swipe.advanced')}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">{t('swipe.partOfSpeech')}</label>
              <Select value={posFilter} onValueChange={setPosFilter}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('swipe.allTypes')}</SelectItem>
                  <SelectItem value="noun">{t('swipe.noun')}s</SelectItem>
                  <SelectItem value="verb">{t('swipe.verb')}s</SelectItem>
                  <SelectItem value="adjective">{t('swipe.adjective')}s</SelectItem>
                  <SelectItem value="adverb">{t('swipe.adverb')}s</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deck Size */}
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">{t('swipe.cardsPerSession')}</label>
              <div className="grid grid-cols-4 gap-2">
                {DECK_SIZE_OPTIONS.map(size => (
                  <button
                    key={size}
                    onClick={() => setDeckSize(size)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 press-scale ${
                      deckSize === size
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Filter — New / Review / Learned / Mixed */}
            {isAuthenticated && (
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{t('swipe.wordSelection')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_FILTER_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setCardFilter(opt.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 press-scale border ${
                        cardFilter === opt.key
                          ? opt.key === 'new' ? 'bg-accent/20 text-accent border-accent/40' :
                            opt.key === 'reviewing' ? 'bg-chart-3/20 text-chart-3 border-chart-3/40' :
                            opt.key === 'learned' ? 'bg-primary/20 text-primary border-primary/40' :
                            'bg-secondary text-foreground border-border'
                          : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary'
                      }`}
                    >
                      {opt.icon}
                      <div className="text-left">
                        <p className="text-xs font-bold leading-none">{t(opt.labelKey as any)}</p>
                        <p className="text-[10px] font-normal opacity-70 mt-0.5">{t(opt.descKey as any)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <button
              onClick={() => { window.location.href = getLoginUrl("/play"); }}
              className="w-full game-card p-3 flex items-center gap-2 press-scale"
            >
              <LogIn className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Sign in to save progress</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
            </button>
          )}

          <Button
            size="lg"
            className="w-full h-14 text-lg font-black press-scale bg-gradient-to-r from-primary to-primary/80"
            onClick={() => { sfx.whoosh(); setSessionStarted(true); }}
          >
            <Gamepad2 className="w-6 h-6 mr-2" />
            {t('swipe.startSession')} ({deckSize} {t('swipe.cards')})
          </Button>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (wordsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Sparkles className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <p className="text-muted-foreground text-center">No words found for this filter. Try different settings.</p>
        <Button variant="outline" className="mt-4" onClick={() => setSessionStarted(false)}>
          Change Filters
        </Button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = (currentIndex / words.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button onClick={() => setSessionStarted(false)} className="text-muted-foreground press-scale">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary">
            +{swipeResults.reduce((s, r) => s + (r.known ? 10 : 3), 0)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-2">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* AI Translation toggle */}
      <div className="px-4 mb-3 flex justify-center">
        <button
          onClick={toggleAi}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all press-scale ${
            aiEnabled
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'bg-secondary text-muted-foreground border-transparent'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {aiEnabled ? 'AI Translation: ON' : 'AI Translation: OFF'}
        </button>
      </div>

      {/* Card area */}
      <div className="flex-1 px-6 pb-6 flex items-center justify-center">
        <div className="relative w-full max-w-[360px] aspect-[3/4]">
          {currentIndex + 1 < words.length && (
            <FlashCard
              key={`next-${words[currentIndex + 1].id}`}
              word={words[currentIndex + 1]}
              onSwipe={() => {}}
              isTop={false}
              aiEnabled={aiEnabled}
            />
          )}
          <FlashCard
            key={`card-${currentWord.id}-${currentIndex}`}
            word={currentWord}
            onSwipe={handleSwipe}
            isTop={true}
            aiEnabled={aiEnabled}
          />
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 flex items-center justify-center gap-4">
        <button
          onClick={() => { sfx.pop(); handleBack(); }}
          disabled={!canUndo}
          title={undoTooltip}
          className={`w-12 h-12 rounded-full flex items-center justify-center press-scale transition-all ${
            canUndo
              ? 'bg-secondary border-2 border-muted-foreground/30 text-foreground'
              : 'bg-secondary/50 border-2 border-transparent text-muted-foreground/30'
          }`}
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleSwipe(false)}
          className="w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center press-scale transition-transform"
        >
          <X className="w-7 h-7 text-destructive" />
        </button>
        <button
          onClick={() => { sfx.tap(); setDetailWord(currentWord); setDetailOpen(true); }}
          className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center press-scale transition-transform"
        >
          <Info className="w-5 h-5 text-accent" />
        </button>
        <button
          onClick={() => handleSwipe(true)}
          className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center press-scale transition-transform"
        >
          <Check className="w-7 h-7 text-primary" />
        </button>
      </div>

      <WordDetailSheet
        word={detailWord}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <UpgradeModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        learnedCount={paywallInfo?.learnedCount}
        limit={paywallInfo?.limit}
      />
    </div>
  );
}
