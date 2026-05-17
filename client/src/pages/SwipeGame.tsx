import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import BottomNav from "@/components/BottomNav";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Check, X, Undo2, RotateCcw, Zap,
  Trophy, Sparkles, Gamepad2, Info, Loader2, ChevronRight, LogIn,
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

interface SwipeResult {
  wordId: number;
  known: boolean;
}

/* ─── Inline AI Translation Hook ─── */
function useExampleTranslation(koreanExample: string | null | undefined, existingEnglish: string | null | undefined, language?: 'korean' | 'chinese') {
  const translate = trpc.llm.translateExample.useMutation();
  const [translation, setTranslation] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const attempted = useRef<string | null>(null);

  const doTranslate = useCallback((sentence: string) => {
    setFailed(false);
    translate.mutate(
      { koreanSentence: sentence, language },
      {
        onSuccess: (data) => {
          if (data?.translation) {
            setTranslation(data.translation);
          } else {
            setFailed(true);
          }
        },
        onError: () => {
          setFailed(true);
        },
      }
    );
  }, [translate]);

  useEffect(() => {
    if (existingEnglish) {
      setTranslation(existingEnglish);
      setFailed(false);
      return;
    }
    if (!koreanExample) {
      setTranslation(null);
      setFailed(false);
      return;
    }
    if (attempted.current === koreanExample) return;
    attempted.current = koreanExample;
    doTranslate(koreanExample);
  }, [koreanExample, existingEnglish, doTranslate]);

  const retry = useCallback(() => {
    if (koreanExample) {
      attempted.current = null;
      doTranslate(koreanExample);
    }
  }, [koreanExample, doTranslate]);

  return {
    translation,
    isLoading: translate.isPending && !translation,
    failed,
    retry,
  };
}

/* ─── One-Sided Flash Card with ClickableExample ─── */
function FlashCard({
  word,
  onSwipe,
  isTop,
}: {
  word: any;
  onSwipe: (known: boolean) => void;
  isTop: boolean;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const isChinese = !!word.chinese && !word.korean;
  // For Chinese: translate the Chinese example sentence; for Korean: translate the Korean example
  const exampleForTranslation = isChinese ? word.chineseExample : word.koreanExample;
  const existingTranslation = isChinese ? null : word.exampleEnglish; // for Chinese we always want AI translation
  const { translation, isLoading: translationLoading, failed: translationFailed, retry: retryTranslation } = useExampleTranslation(
    isTop ? exampleForTranslation : null,
    isTop ? existingTranslation : null,
    isChinese ? 'chinese' : 'korean'
  );

  const SWIPE_THRESHOLD = 80;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!isTop) return;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  }, [isTop]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    setDragX(dx);
    setDragY(dy * 0.3);
  }, [isDragging, isTop]);

  const handleEnd = useCallback(() => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);

    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      const known = dragX > 0;
      setExitDir(known ? 'right' : 'left');
      setTimeout(() => onSwipe(known), 300);
    } else {
      setDragX(0);
      setDragY(0);
    }
  }, [isDragging, isTop, dragX, onSwipe]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

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
      {swipeIndicator === 'right' && (
        <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 border-primary bg-primary/20 rotate-[-12deg] animate-xp-pop">
          <span className="text-primary font-black text-lg">KNOW IT ✓</span>
        </div>
      )}
      {swipeIndicator === 'left' && (
        <div className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 border-destructive bg-destructive/20 rotate-[12deg] animate-xp-pop">
          <span className="text-destructive font-black text-lg">REVIEW ✗</span>
        </div>
      )}

      {/* One-sided card showing all info */}
      <div className="w-full h-full game-card rounded-2xl p-5 flex flex-col items-center justify-center game-card-glow overflow-hidden">
        {/* Level & POS badges */}
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
              {word.topikLevel === 'beginner' ? 'Beginner' :
               word.topikLevel === 'intermediate' ? 'Intermediate' : 'Advanced'}
            </span>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            {word.pos || 'word'}
          </span>
        </div>

        {/* Word display - Korean or Chinese */}
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
          <p className="text-lg font-bold text-primary text-center leading-snug">{word.meaning}</p>
        </div>

        {/* Example sentence */}
        {word.koreanExample ? (
          <div className="w-full space-y-1.5 text-center px-1">
            <ClickableExample sentence={word.koreanExample} />
            {translation ? (
              <p className="text-xs text-muted-foreground italic leading-relaxed">{translation}</p>
            ) : translationLoading ? (
              <div className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Translating...</span>
              </div>
            ) : translationFailed ? (
              <button
                onClick={(e) => { e.stopPropagation(); retryTranslation(); }}
                className="text-xs text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
              >
                Tap to translate
              </button>
            ) : null}
          </div>
        ) : word.chineseExample ? (
          <div className="w-full space-y-1.5 text-center px-1">
            <p className="text-sm text-foreground leading-relaxed">{word.chineseExample}</p>
            {word.examplePinyin && (
              <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">{word.examplePinyin}</p>
            )}
            {translation ? (
              <p className="text-xs text-muted-foreground italic leading-relaxed">{translation}</p>
            ) : translationLoading ? (
              <div className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Translating...</span>
              </div>
            ) : translationFailed ? (
              <button
                onClick={(e) => { e.stopPropagation(); retryTranslation(); }}
                className="text-xs text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
              >
                Tap to translate
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Swipe hint */}
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
}: {
  results: { totalXp: number; totalLearned: number; totalReviewed: number };
  onRestart: () => void;
  onHome: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="animate-xp-pop">
          <Trophy className="w-16 h-16 text-chart-3 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-foreground">Session Complete!</h2>
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
            <p className="text-[10px] text-muted-foreground font-medium">Learned</p>
          </div>
          <div className="game-card p-4 text-center">
            <RotateCcw className="w-5 h-5 text-chart-3 mx-auto mb-1" />
            <p className="text-xl font-black text-chart-3">{results.totalReviewed - results.totalLearned}</p>
            <p className="text-[10px] text-muted-foreground font-medium">To Review</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full font-bold press-scale"
            onClick={onRestart}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full font-bold press-scale"
            onClick={onHome}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Deck Size Options ─── */
const DECK_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/* ─── Main Component ─── */
export default function SwipeGame() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const isChinese = language === 'chinese';
  const [posFilter, setPosFilter] = useState(params.get("pos") || "all");
  // hskLevel from URL for Chinese, level for Korean
  const [levelFilter, setLevelFilter] = useState(
    params.get("hskLevel") || params.get("level") || "all"
  );
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeResults, setSwipeResults] = useState<SwipeResult[]>([]);
  const [history, setHistory] = useState<number[]>([]); // for back/undo
  const [sessionDone, setSessionDone] = useState(false);
  const [deckSize, setDeckSize] = useState<number>(
    DECK_SIZE_OPTIONS.includes(Number(params.get("count")) as any)
      ? Number(params.get("count"))
      : 20
  );
  const [detailWord, setDetailWord] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const wordsQuery = trpc.words.random.useQuery(
    {
      pos: posFilter !== 'all' ? posFilter : undefined,
      topikLevel: !isChinese && levelFilter !== 'all' ? levelFilter : undefined,
      hskLevel: isChinese && levelFilter !== 'all' ? levelFilter : undefined,
      limit: deckSize,
      language,
    },
    { enabled: sessionStarted, refetchOnWindowFocus: false }
  );

  const batchSwipe = trpc.progress.batchSwipe.useMutation();

  const words = wordsQuery.data ?? [];

  const handleSwipe = useCallback((known: boolean) => {
    if (!words[currentIndex]) return;
    const result = { wordId: words[currentIndex].id, known };
    setSwipeResults(prev => [...prev, result]);
    setHistory(prev => [...prev, currentIndex]);

    if (currentIndex + 1 >= words.length) {
      const allResults = [...swipeResults, result];
      if (isAuthenticated) {
        batchSwipe.mutate(
          { results: allResults },
          {
            onSuccess: () => setSessionDone(true),
            onError: () => {
              toast.error("Failed to save progress");
              setSessionDone(true);
            },
          }
        );
      } else {
        setSessionDone(true);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words, swipeResults, isAuthenticated, batchSwipe]);

  // Back/Undo: go back to previous card
  const handleBack = useCallback(() => {
    if (history.length === 0) return;
    const prevIndex = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setSwipeResults(prev => prev.slice(0, -1));
    setCurrentIndex(prevIndex);
  }, [history]);

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
        results={{
          totalXp: batchSwipe.data?.totalXp ?? totalXp,
          totalLearned: batchSwipe.data?.totalLearned ?? totalLearned,
          totalReviewed: batchSwipe.data?.totalReviewed ?? swipeResults.length,
        }}
        onRestart={handleRestart}
        onHome={() => setLocation("/")}
      />
    );
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-6 pb-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-1 text-muted-foreground mb-4 press-scale">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-black text-foreground">Start Session</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose your deck and start swiping</p>
        </div>

        <div className="px-4 space-y-4">
          <div className="game-card p-4 space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">TOPIK Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">Part of Speech</label>
              <Select value={posFilter} onValueChange={setPosFilter}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="noun">Nouns</SelectItem>
                  <SelectItem value="verb">Verbs</SelectItem>
                  <SelectItem value="adjective">Adjectives</SelectItem>
                  <SelectItem value="adverb">Adverbs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deck Size Selector */}
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">Cards per Session</label>
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
            onClick={() => setSessionStarted(true)}
          >
            <Gamepad2 className="w-6 h-6 mr-2" />
            Start ({deckSize} cards)
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
        <p className="text-muted-foreground">No words found for this filter. Try different settings.</p>
        <Button variant="outline" className="mt-4" onClick={() => setSessionStarted(false)}>
          Change Filters
        </Button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex) / words.length) * 100;

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
      <div className="px-4 mb-4">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 px-6 pb-6 flex items-center justify-center">
        <div className="relative w-full max-w-[360px] aspect-[3/4]">
          {/* Next card (behind) */}
          {currentIndex + 1 < words.length && (
            <FlashCard
              key={`next-${words[currentIndex + 1].id}`}
              word={words[currentIndex + 1]}
              onSwipe={() => {}}
              isTop={false}
            />
          )}
          {/* Current card */}
          <FlashCard
            key={`card-${currentWord.id}-${currentIndex}`}
            word={currentWord}
            onSwipe={handleSwipe}
            isTop={true}
          />
        </div>
      </div>

      {/* Bottom buttons with Back/Undo */}
      <div className="px-6 pb-8 flex items-center justify-center gap-4">
        {/* Back / Undo button */}
        <button
          onClick={handleBack}
          disabled={history.length === 0}
          className={`w-12 h-12 rounded-full flex items-center justify-center press-scale transition-all ${
            history.length > 0
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
          onClick={() => { setDetailWord(currentWord); setDetailOpen(true); }}
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
    </div>
  );
}
