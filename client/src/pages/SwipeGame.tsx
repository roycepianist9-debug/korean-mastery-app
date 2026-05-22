import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/src/_core/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';
import { useSound } from '@/contexts/SoundContext';
import { useGuestProgress } from '@/hooks/useGuestProgress';
import { SignupPromptModal } from '@/components/SignupPromptModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Volume2, Sparkles, Gamepad2, RotateCcw, ChevronLeft, ChevronRight, Info } from 'lucide-react';

/* ─── Chinese Example with Audio ─── */
function ChineseExampleWithAudio({ sentence }: { sentence: string }) {
  const { speak } = useAudio();
  const { user } = useAuth();
  return (
    <div className="flex items-center justify-center gap-2">
      <p className="text-sm text-foreground leading-relaxed">{sentence}</p>
      <button
        onClick={() => speak(sentence, 'zh-CN')}
        className="inline-flex items-center justify-center w-5 h-5 text-primary hover:text-primary/80 transition-colors flex-shrink-0"
        aria-label="Play audio"
      >
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Flash Card ─── */
function FlashCard({
  word,
  isFlipped,
  onFlip,
  language,
  showTranslation,
}: {
  word: any;
  isFlipped: boolean;
  onFlip: () => void;
  language: 'korean' | 'chinese' | 'japanese';
  showTranslation: boolean;
}) {
  const { speak } = useAudio();
  const isChinese = language === 'chinese';
  const isJapanese = language === 'japanese';

  return (
    <Card
      onClick={onFlip}
      className="w-full aspect-square flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-300 hover:shadow-lg press-scale game-card"
    >
      {isFlipped ? (
        <div className="text-center space-y-4 w-full">
          {/* Front side: Word */}
          <div className="space-y-2">
            <p className="text-3xl font-black text-foreground">
              {isChinese ? word.chinese : isJapanese ? word.japanese : word.korean}
            </p>
            {(isChinese || isJapanese) && (
              <p className="text-lg text-muted-foreground font-medium">
                {isChinese ? word.pinyin : isJapanese ? word.romaji : word.romanization}
              </p>
            )}
          </div>

          {/* Meaning */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Meaning</p>
            <p className="text-lg text-foreground font-semibold">{word.meaning}</p>
          </div>

          {/* Example */}
          {word.exampleEnglish && (
            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase">Example</p>
              {isChinese ? (
                <ChineseExampleWithAudio sentence={word.chineseExample} />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm text-foreground leading-relaxed">
                    {isChinese ? word.chineseExample : isJapanese ? word.japaneseExample : word.koreanExample}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(isChinese ? word.chineseExample : isJapanese ? word.japaneseExample : word.koreanExample, isChinese ? 'zh-CN' : isJapanese ? 'ja-JP' : 'ko-KR');
                    }}
                    className="inline-flex items-center justify-center w-5 h-5 text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                    aria-label="Play audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {showTranslation && word.exampleEnglish && (
                <p className="text-sm text-muted-foreground italic">{word.exampleEnglish}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-4xl font-black text-muted-foreground">?</p>
      )}
    </Card>
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
  const { sfx } = useSound();

  useEffect(() => {
    playVictory();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-center space-y-6 max-w-sm">
        <div className="text-6xl font-black text-primary">✓</div>
        <h1 className="text-3xl font-black text-foreground">{t('swipe.sessionComplete')}</h1>

        <div className="space-y-3 game-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('swipe.learned')}</span>
            <span className="text-2xl font-black text-primary">{results.totalLearned}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('swipe.reviewed')}</span>
            <span className="text-2xl font-black text-foreground">{results.totalReviewed}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-muted-foreground font-medium">{t('swipe.totalXp')}</span>
            <span className="text-2xl font-black text-accent">{results.totalXp} XP</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button size="lg" className="w-full h-12 text-lg font-black press-scale" onClick={() => { sfx.whoosh(); onRestart(); }}>
            <RotateCcw className="w-5 h-5 mr-2" />
            {t('swipe.playAgain')}
          </Button>
          <Button variant="outline" size="lg" className="w-full h-12 text-lg font-black press-scale" onClick={() => { sfx.tap(); onHome(); }}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('swipe.home')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Swipe Game Component ─── */
export function SwipeGame() {
  const { t } = useI18n();
  const { sfx } = useSound();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { speak } = useAudio();

  // Guest mode
  const { isGuestMode, wordsCount, trackWordProgress, showSignupPrompt, setShowSignupPrompt } = useGuestProgress();

  // Game state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [language, setLanguage] = useState<'korean' | 'chinese' | 'japanese'>('korean');
  const [levelFilter, setLevelFilter] = useState('all');
  const [posFilter, setPosFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string[]>(['new']);
  const [deckSize, setDeckSize] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeResults, setSwipeResults] = useState<any[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [showTranslation, setShowTranslation] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<any>(null);

  const isChinese = language === 'chinese';
  const isJapanese = language === 'japanese';

  // Fetch words
  const wordsQuery = trpc.words.random.useQuery(
    {
      language,
      limit: deckSize,
      level: levelFilter === 'all' ? undefined : levelFilter,
      pos: posFilter === 'all' ? undefined : posFilter,
      status: statusFilter.length > 0 ? statusFilter : undefined,
    },
    { enabled: sessionStarted }
  );

  const words = useMemo(() => wordsQuery.data || [], [wordsQuery.data]);

  // Swipe mutation
  const swipeMutation = trpc.progress.batchSwipe.useMutation();

  // Handle swipe
  const handleSwipe = useCallback(
    async (wordId: number, status: 'learned' | 'reviewing') => {
      sfx.cling();
      setSwipeResults((prev) => [...prev, { wordId, status, known: status === 'learned' }]);
      setCurrentIndex((prev) => prev + 1);

      // Track guest progress
      if (isGuestMode) {
        trackWordProgress();
      }

      // Submit to backend
      if (user && !isGuestMode) {
        await swipeMutation.mutateAsync({
          language,
          results: [{ wordId, status }],
        });
      }
    },
    [user, isGuestMode, language, swipeMutation, sfx, trackWordProgress]
  );

  // Check paywall
  useEffect(() => {
    if (user && !isGuestMode && swipeResults.length > 0 && currentIndex >= words.length) {
      const learnedCount = swipeResults.filter((r) => r.status === 'learned').length;
      if (learnedCount > 150) {
        setPaywallOpen(true);
        setPaywallInfo({ learnedCount, limit: 150 });
      }
    }
  }, [currentIndex, words.length, swipeResults, user, isGuestMode]);

  // Session complete
  useEffect(() => {
    if (sessionStarted && currentIndex >= words.length && words.length > 0) {
      setSessionDone(true);
    }
  }, [currentIndex, words.length, sessionStarted]);

  // Main render
  return (
    <>
      <SignupPromptModal
        isOpen={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        wordsLearned={wordsCount}
      />
      <UpgradeModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        learnedCount={paywallInfo?.learnedCount}
        limit={paywallInfo?.limit}
      />

      {!sessionStarted ? (
        /* ─── Session Start Screen ─── */
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
                <label className="text-sm font-bold text-foreground mb-2 block">{isChinese ? 'HSK Level' : isJapanese ? 'JLPT Level' : t('swipe.topikLevel')}</label>
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
                    ) : isJapanese ? (
                      <>
                        <SelectItem value="n5">JLPT N5</SelectItem>
                        <SelectItem value="n4">JLPT N4</SelectItem>
                        <SelectItem value="n3">JLPT N3</SelectItem>
                        <SelectItem value="n2">JLPT N2</SelectItem>
                        <SelectItem value="n1">JLPT N1</SelectItem>
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
                    <SelectItem value="noun">{t('swipe.noun')}</SelectItem>
                    <SelectItem value="verb">{t('swipe.verb')}</SelectItem>
                    <SelectItem value="adjective">{t('swipe.adjective')}</SelectItem>
                    <SelectItem value="adverb">{t('swipe.adverb')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-bold text-foreground mb-3 block">{t('swipe.status')}</label>
                <div className="space-y-2">
                  {['new', 'reviewing', 'learned'].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={statusFilter.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setStatusFilter((prev) => [...prev, status]);
                          } else {
                            setStatusFilter((prev) => prev.filter((s) => s !== status));
                          }
                        }}
                      />
                      <span className="text-sm text-foreground capitalize">{t(`swipe.${status}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{t('swipe.deckSize')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((size) => (
                    <Button
                      key={size}
                      variant={deckSize === size ? 'default' : 'outline'}
                      className="press-scale"
                      onClick={() => setDeckSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

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
      ) : sessionDone ? (
        /* ─── Session Summary ─── */
        <SessionSummary
          results={{
            totalXp: swipeResults.reduce((sum, r) => sum + (r.known ? 10 : 0), 0),
            totalLearned: swipeResults.filter((r) => r.known).length,
            totalReviewed: swipeResults.length,
          }}
          onRestart={() => {
            setSessionDone(false);
            setCurrentIndex(0);
            setSwipeResults([]);
            setHistory([]);
            setSessionStarted(false);
          }}
          onHome={() => setLocation('/')}
          playVictory={() => { sfx.victory(); }}
        />
      ) : !words.length ? (
        /* ─── Empty State ─── */
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
          <p className="text-muted-foreground text-center">{t('swipe.noWordsFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => setSessionStarted(false)}>
            {t('swipe.changeFilters')}
          </Button>
        </div>
      ) : wordsQuery.isLoading ? (
        /* ─── Loading State ─── */
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <Sparkles className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground font-medium">{t('swipe.loadingCards')}</p>
          </div>
        </div>
      ) : (
        /* ─── Gameplay ─── */
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <button
              onClick={() => {
                sfx.tap();
                if (history.length > 0) {
                  const lastIndex = history[history.length - 1];
                  setCurrentIndex(lastIndex);
                  setHistory((prev) => prev.slice(0, -1));
                  setFlippedCards((prev) => {
                    const next = new Set(prev);
                    next.delete(lastIndex);
                    return next;
                  });
                }
              }}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-muted-foreground disabled:opacity-50 press-scale"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{currentIndex + 1} / {words.length}</p>
              <p className="text-xs text-muted-foreground">{((currentIndex / words.length) * 100).toFixed(0)}%</p>
            </div>

            <button
              onClick={() => {
                sfx.tap();
                setLocation("/");
              }}
              className="flex items-center gap-1 text-muted-foreground press-scale"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-2">
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentIndex / words.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card */}
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            {currentIndex < words.length && (
              <FlashCard
                word={words[currentIndex]}
                isFlipped={flippedCards.has(currentIndex)}
                onFlip={() => {
                  sfx.tap();
                  setFlippedCards((prev) => {
                    const next = new Set(prev);
                    if (next.has(currentIndex)) {
                      next.delete(currentIndex);
                    } else {
                      next.add(currentIndex);
                    }
                    return next;
                  });
                }}
                language={language}
                showTranslation={showTranslation}
              />
            )}
          </div>

          {/* Controls */}
          <div className="px-4 pb-24 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 text-lg font-black press-scale"
                onClick={() => {
                  sfx.cling();
                  handleSwipe(words[currentIndex].id, 'reviewing');
                  setHistory((prev) => [...prev, currentIndex]);
                  setFlippedCards((prev) => {
                    const next = new Set(prev);
                    next.delete(currentIndex);
                    return next;
                  });
                }}
              >
                ← {t('swipe.review')}
              </Button>
              <Button
                size="lg"
                className="flex-1 h-12 text-lg font-black press-scale bg-gradient-to-r from-primary to-primary/80"
                onClick={() => {
                  sfx.cling();
                  handleSwipe(words[currentIndex].id, 'learned');
                  setHistory((prev) => [...prev, currentIndex]);
                  setFlippedCards((prev) => {
                    const next = new Set(prev);
                    next.delete(currentIndex);
                    return next;
                  });
                }}
              >
                {t('swipe.learned')} →
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground press-scale"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              <Info className="w-4 h-4 mr-1" />
              {showTranslation ? t('swipe.hideTranslation') : t('swipe.showTranslation')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
