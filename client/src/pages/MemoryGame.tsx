'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ChevronLeft, Volume2, RotateCcw } from 'lucide-react';
import { useRouter } from 'wouter';
import { useState, useEffect, useRef } from 'react';

type Difficulty = '3x4' | '4x4' | '6x6';
type GameStatus = 'settings' | 'playing' | 'completed';

interface MemoryCard {
  id: string;
  content: string;
  isLanguage: boolean; // true = Korean/Chinese, false = French/English
  isFlipped: boolean;
  isMatched: boolean;
  matchId: string; // shared between language pair
}

export default function MemoryGame() {
  const { language } = useLanguage();
  const { play: sfx } = useSound();
  const auth = useAuth();
  const user = auth.user;
  const { navigate } = useRouter();

  // Settings (locked during gameplay)
  const [difficulty, setDifficulty] = useState<Difficulty>('3x4');
  const [level, setLevel] = useState<string>('');
  const [pos, setPos] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('settings');

  // Game state
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState<'match' | 'mismatch' | null>(null);
  const flippedCardsRef = useRef<string[]>([]);

  // Fetch words
  const pairCount = difficulty === '3x4' ? 6 : difficulty === '4x4' ? 8 : 18;
  const { data: words, isLoading } = trpc.words.random.useQuery(
    {
      language: language as 'korean' | 'chinese',
      topikLevel: level || undefined,
      hskLevel: language === 'chinese' ? level : undefined,
      pos: pos || undefined,
      limit: pairCount,
    },
    { enabled: gameStatus === 'playing' }
  );

  // Update user stats mutation
  const updateStats = trpc.progress.batchSwipe.useMutation();

  // Get level options based on language
  const levelOptions = language === 'korean'
    ? ['TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6']
    : ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'];

  const posOptions = ['noun', 'verb', 'adjective', 'adverb'];

  // Initialize game when words are loaded
  useEffect(() => {
    if (words && words.length > 0 && gameStatus === 'playing') {
      const pairs = words.slice(0, pairCount);
      const gameCards: MemoryCard[] = [];

      pairs.forEach((word, idx) => {
        const languageContent = language === 'korean' ? word.korean : word.chinese;
        const translationContent = word.meaningFr || word.meaning;

        // Add language card
        gameCards.push({
          id: `lang-${idx}`,
          content: languageContent,
          isLanguage: true,
          isFlipped: false,
          isMatched: false,
          matchId: `pair-${idx}`,
        });

        // Add translation card
        gameCards.push({
          id: `trans-${idx}`,
          content: translationContent,
          isLanguage: false,
          isFlipped: false,
          isMatched: false,
          matchId: `pair-${idx}`,
        });
      });

      // Shuffle only within each pool to maintain split layout
      const languageCards = gameCards.filter(c => c.isLanguage).sort(() => Math.random() - 0.5);
      const translationCards = gameCards.filter(c => !c.isLanguage).sort(() => Math.random() - 0.5);
      const shuffled = [...languageCards, ...translationCards];

      setCards(shuffled);
      setFlipped(new Set());
      setMatched(new Set());
      setMoves(0);
      setStartTime(Date.now());
      setElapsedTime(0);
      flippedCardsRef.current = [];
    }
  }, [words, gameStatus, difficulty, language, pairCount]);

  // Timer
  useEffect(() => {
    if (gameStatus !== 'playing' || !startTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [gameStatus, startTime]);

  // Check for match
  useEffect(() => {
    if (flippedCardsRef.current.length === 2) {
      const [id1, id2] = flippedCardsRef.current;
      const card1 = cards.find(c => c.id === id1);
      const card2 = cards.find(c => c.id === id2);

      if (card1 && card2) {
        // Check if it's a valid semantic match (different language pools)
        if (
          card1.matchId === card2.matchId &&
          card1.isLanguage !== card2.isLanguage
        ) {
          // Match found
          sfx.pop();
          setFeedback('match');
          setMatched(prev => new Set([...prev, id1, id2]));
          flippedCardsRef.current = [];

          // Check if game is complete
          if (matched.size + 2 === cards.length) {
            setGameStatus('completed');
            // Update stats
            if (user?.id) {
              const results = words!.slice(0, pairCount).map((word, idx) => ({
                wordId: word.id,
                known: true,
              }));
              updateStats.mutate({
                results,
                language: language as 'korean' | 'chinese',
              });
            }
          }

          setTimeout(() => setFeedback(null), 500);
        } else {
          // No match or same-language match (invalid)
          setFeedback('mismatch');
          setTimeout(() => {
            setFlipped(new Set());
            flippedCardsRef.current = [];
            setFeedback(null);
          }, 1000);
        }
      }
      setMoves(prev => prev + 1);
    }
  }, [flipped, cards, matched, user, language, words, pairCount, sfx, updateStats]);

  const handleCardClick = (cardId: string) => {
    if (flipped.has(cardId) || matched.has(cardId) || flippedCardsRef.current.length >= 2) return;

    sfx.pop();
    setFlipped(prev => new Set([...prev, cardId]));
    flippedCardsRef.current.push(cardId);
  };

  const startGame = () => {
    setGameStatus('playing');
  };

  const resetGame = () => {
    setGameStatus('settings');
    setCards([]);
    setFlipped(new Set());
    setMatched(new Set());
    setMoves(0);
    setStartTime(null);
    setElapsedTime(0);
    flippedCardsRef.current = [];
  };

  const gridCols = difficulty === '3x4' ? 'grid-cols-3' : difficulty === '4x4' ? 'grid-cols-4' : 'grid-cols-6';
  const languageCards = cards.filter(c => c.isLanguage);
  const translationCards = cards.filter(c => !c.isLanguage);

  // Settings screen
  if (gameStatus === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/play')}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Memory Game</h1>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'korean' ? 'default' : 'outline'}
                    disabled
                  >
                    🇰🇷 Korean
                  </Button>
                  <Button
                    variant={language === 'chinese' ? 'default' : 'outline'}
                    disabled
                  >
                    🇨🇳 Chinese
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levelOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Part of Speech</label>
                <Select value={pos} onValueChange={setPos}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {posOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {(['3x4', '4x4', '6x6'] as Difficulty[]).map(d => (
                    <Button
                      key={d}
                      variant={difficulty === d ? 'default' : 'outline'}
                      onClick={() => setDifficulty(d)}
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={startGame}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold"
              >
                Start Game
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Playing screen
  if (gameStatus === 'playing') {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      );
    }

    if (cards.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">No cards loaded</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" size="sm" onClick={resetGame}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold">{elapsedTime}s</div>
              <div className="text-sm text-muted-foreground">Moves: {moves}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Language Pool (Top) */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
              {language === 'korean' ? '🇰🇷 Korean' : '🇨🇳 Chinese'}
            </h2>
            <div className={`grid ${gridCols} gap-3`}>
              {languageCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={matched.has(card.id)}
                  className={`aspect-square rounded-lg font-bold text-sm p-2 transition-all transform ${
                    matched.has(card.id)
                      ? 'bg-green-500 text-white scale-95 opacity-75'
                      : flipped.has(card.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                  } ${matched.has(card.id) ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {flipped.has(card.id) || matched.has(card.id) ? (
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                      <span className="text-xs line-clamp-2">{card.content}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-2xl">?</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-muted my-6"></div>

          {/* Translation Pool (Bottom) */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
              {language === 'korean' ? '🇫🇷 French' : '🇬🇧 English'}
            </h2>
            <div className={`grid ${gridCols} gap-3`}>
              {translationCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={matched.has(card.id)}
                  className={`aspect-square rounded-lg font-bold text-sm p-2 transition-all transform ${
                    matched.has(card.id)
                      ? 'bg-green-500 text-white scale-95 opacity-75'
                      : flipped.has(card.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                  } ${matched.has(card.id) ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {flipped.has(card.id) || matched.has(card.id) ? (
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                      <span className="text-xs line-clamp-2">{card.content}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-2xl">?</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`mt-6 text-center text-lg font-bold ${
              feedback === 'match' ? 'text-green-500' : 'text-red-500'
            }`}>
              {feedback === 'match' ? '✓ Match!' : '✗ Try again'}
            </div>
          )}

          {/* Stats */}
          <div className="text-center text-sm text-muted-foreground mt-6">
            Matched: {matched.size / 2} / {cards.length / 2}
          </div>
        </div>
      </div>
    );
  }

  // Completed screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4 flex items-center justify-center">
      <Card className="p-8 text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold">🎉 Game Complete!</h1>
        <div className="space-y-2">
          <p className="text-lg">Time: {elapsedTime}s</p>
          <p className="text-lg">Moves: {moves}</p>
        </div>
        <Button
          onClick={resetGame}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold"
        >
          Play Again
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/play')}
          className="w-full"
        >
          Back to Play
        </Button>
      </Card>
    </div>
  );
}
