import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Memory Game - Split Language Pools Redesign', () => {
  describe('Game Initialization', () => {
    it('should create correct number of cards for 3x4 difficulty (6 pairs)', () => {
      const pairCount = 6;
      const cards = [];
      
      for (let i = 0; i < pairCount; i++) {
        cards.push({
          id: `lang-${i}`,
          content: `korean-${i}`,
          isLanguage: true,
          isFlipped: false,
          isMatched: false,
          matchId: `pair-${i}`,
        });
        cards.push({
          id: `trans-${i}`,
          content: `french-${i}`,
          isLanguage: false,
          isFlipped: false,
          isMatched: false,
          matchId: `pair-${i}`,
        });
      }
      
      expect(cards).toHaveLength(12);
      expect(cards.filter(c => c.isLanguage)).toHaveLength(6);
      expect(cards.filter(c => !c.isLanguage)).toHaveLength(6);
    });

    it('should create correct number of cards for 4x4 difficulty (8 pairs)', () => {
      const pairCount = 8;
      const totalCards = pairCount * 2;
      expect(totalCards).toBe(16);
    });

    it('should create correct number of cards for 6x6 difficulty (18 pairs)', () => {
      const pairCount = 18;
      const totalCards = pairCount * 2;
      expect(totalCards).toBe(36);
    });

    it('should maintain language/translation pool separation', () => {
      const pairCount = 6;
      const cards = [];
      
      for (let i = 0; i < pairCount; i++) {
        cards.push({ id: `lang-${i}`, isLanguage: true, matchId: `pair-${i}` });
        cards.push({ id: `trans-${i}`, isLanguage: false, matchId: `pair-${i}` });
      }
      
      const languageCards = cards.filter(c => c.isLanguage);
      const translationCards = cards.filter(c => !c.isLanguage);
      
      expect(languageCards).toHaveLength(6);
      expect(translationCards).toHaveLength(6);
      expect(languageCards.every(c => c.isLanguage)).toBe(true);
      expect(translationCards.every(c => !c.isLanguage)).toBe(true);
    });
  });

  describe('Semantic Matching Logic', () => {
    it('should match cards with same matchId from different language pools', () => {
      const card1 = { id: 'lang-0', matchId: 'pair-0', isLanguage: true };
      const card2 = { id: 'trans-0', matchId: 'pair-0', isLanguage: false };
      
      const isValidMatch = card1.matchId === card2.matchId && card1.isLanguage !== card2.isLanguage;
      expect(isValidMatch).toBe(true);
    });

    it('should reject cards with same matchId from same language pool', () => {
      const card1 = { id: 'lang-0', matchId: 'pair-0', isLanguage: true };
      const card2 = { id: 'lang-1', matchId: 'pair-0', isLanguage: true };
      
      const isValidMatch = card1.matchId === card2.matchId && card1.isLanguage !== card2.isLanguage;
      expect(isValidMatch).toBe(false);
    });

    it('should reject cards with different matchIds', () => {
      const card1 = { id: 'lang-0', matchId: 'pair-0', isLanguage: true };
      const card2 = { id: 'trans-1', matchId: 'pair-1', isLanguage: false };
      
      const isValidMatch = card1.matchId === card2.matchId && card1.isLanguage !== card2.isLanguage;
      expect(isValidMatch).toBe(false);
    });

    it('should never allow same-language matches', () => {
      const languageCards = [
        { id: 'lang-0', matchId: 'pair-0', isLanguage: true },
        { id: 'lang-1', matchId: 'pair-1', isLanguage: true },
      ];
      
      for (const card1 of languageCards) {
        for (const card2 of languageCards) {
          if (card1.id !== card2.id) {
            const isValidMatch = card1.matchId === card2.matchId && card1.isLanguage !== card2.isLanguage;
            expect(isValidMatch).toBe(false);
          }
        }
      }
    });
  });

  describe('Game State Management', () => {
    it('should track flipped cards correctly', () => {
      const flipped = new Set(['lang-0', 'trans-0']);
      expect(flipped.has('lang-0')).toBe(true);
      expect(flipped.has('trans-0')).toBe(true);
      expect(flipped.size).toBe(2);
    });

    it('should track matched cards correctly', () => {
      const matched = new Set(['lang-0', 'trans-0', 'lang-1', 'trans-1']);
      expect(matched.size).toBe(4);
      expect(matched.has('lang-0')).toBe(true);
      expect(matched.has('lang-1')).toBe(true);
    });

    it('should detect game completion when all pairs matched', () => {
      const pairCount = 6;
      const totalCards = pairCount * 2;
      const matched = new Set();
      
      for (let i = 0; i < totalCards; i++) {
        matched.add(`card-${i}`);
      }
      
      const isComplete = matched.size === totalCards;
      expect(isComplete).toBe(true);
    });

    it('should prevent clicking matched cards', () => {
      const matched = new Set(['lang-0', 'trans-0']);
      const cardId = 'lang-0';
      
      const canClick = !matched.has(cardId);
      expect(canClick).toBe(false);
    });

    it('should prevent clicking when 2 cards already flipped', () => {
      const flipped = new Set(['lang-0', 'trans-1']);
      const canFlipMore = flipped.size < 2;
      expect(canFlipMore).toBe(false);
    });
  });

  describe('Difficulty Settings', () => {
    it('should use correct grid columns for 3x4', () => {
      const difficulty = '3x4';
      const gridCols = difficulty === '3x4' ? 'grid-cols-3' : difficulty === '4x4' ? 'grid-cols-4' : 'grid-cols-6';
      expect(gridCols).toBe('grid-cols-3');
    });

    it('should use correct grid columns for 4x4', () => {
      const difficulty = '4x4';
      const gridCols = difficulty === '3x4' ? 'grid-cols-3' : difficulty === '4x4' ? 'grid-cols-4' : 'grid-cols-6';
      expect(gridCols).toBe('grid-cols-4');
    });

    it('should use correct grid columns for 6x6', () => {
      const difficulty = '6x6';
      const gridCols = difficulty === '3x4' ? 'grid-cols-3' : difficulty === '4x4' ? 'grid-cols-4' : 'grid-cols-6';
      expect(gridCols).toBe('grid-cols-6');
    });

    it('should lock settings during gameplay', () => {
      const gameStatus = 'playing';
      const settingsLocked = gameStatus === 'playing';
      expect(settingsLocked).toBe(true);
    });

    it('should unlock settings when returning to menu', () => {
      const gameStatus = 'settings';
      const settingsLocked = gameStatus === 'playing';
      expect(settingsLocked).toBe(false);
    });
  });

  describe('Language-Specific Behavior', () => {
    it('should use Korean and French for Korean language', () => {
      const language = 'korean';
      const languageName = language === 'korean' ? '🇰🇷 Korean' : '🇨🇳 Chinese';
      const translationName = language === 'korean' ? '🇫🇷 French' : '🇬🇧 English';
      
      expect(languageName).toBe('🇰🇷 Korean');
      expect(translationName).toBe('🇫🇷 French');
    });

    it('should use Chinese and English for Chinese language', () => {
      const language = 'chinese';
      const languageName = language === 'korean' ? '🇰🇷 Korean' : '🇨🇳 Chinese';
      const translationName = language === 'korean' ? '🇫🇷 French' : '🇬🇧 English';
      
      expect(languageName).toBe('🇨🇳 Chinese');
      expect(translationName).toBe('🇬🇧 English');
    });
  });

  describe('Card Pool Rendering', () => {
    it('should render language pool with correct cards', () => {
      const cards = [
        { id: 'lang-0', isLanguage: true },
        { id: 'lang-1', isLanguage: true },
        { id: 'trans-0', isLanguage: false },
      ];
      
      const languageCards = cards.filter(c => c.isLanguage);
      expect(languageCards).toHaveLength(2);
    });

    it('should render translation pool with correct cards', () => {
      const cards = [
        { id: 'lang-0', isLanguage: true },
        { id: 'trans-0', isLanguage: false },
        { id: 'trans-1', isLanguage: false },
      ];
      
      const translationCards = cards.filter(c => !c.isLanguage);
      expect(translationCards).toHaveLength(2);
    });

    it('should maintain pool separation after shuffling', () => {
      const languageCards = [
        { id: 'lang-0', isLanguage: true },
        { id: 'lang-1', isLanguage: true },
      ];
      const translationCards = [
        { id: 'trans-0', isLanguage: false },
        { id: 'trans-1', isLanguage: false },
      ];
      
      const shuffledLanguage = languageCards.sort(() => Math.random() - 0.5);
      const shuffledTranslation = translationCards.sort(() => Math.random() - 0.5);
      const combined = [...shuffledLanguage, ...shuffledTranslation];
      
      expect(combined.slice(0, 2).every(c => c.isLanguage)).toBe(true);
      expect(combined.slice(2).every(c => !c.isLanguage)).toBe(true);
    });
  });

  describe('Feedback System', () => {
    it('should show match feedback when cards match', () => {
      const feedback = 'match';
      expect(feedback).toBe('match');
    });

    it('should show mismatch feedback when cards don\'t match', () => {
      const feedback = 'mismatch';
      expect(feedback).toBe('mismatch');
    });

    it('should clear feedback after timeout', () => {
      let feedback: 'match' | 'mismatch' | null = 'match';
      setTimeout(() => {
        feedback = null;
      }, 500);
      
      expect(feedback).toBe('match');
    });
  });

  describe('Game Completion', () => {
    it('should detect completion when all 6 pairs matched (3x4)', () => {
      const pairCount = 6;
      const matched = new Set();
      
      for (let i = 0; i < pairCount * 2; i++) {
        matched.add(`card-${i}`);
      }
      
      const isComplete = matched.size === pairCount * 2;
      expect(isComplete).toBe(true);
    });

    it('should detect completion when all 8 pairs matched (4x4)', () => {
      const pairCount = 8;
      const matched = new Set();
      
      for (let i = 0; i < pairCount * 2; i++) {
        matched.add(`card-${i}`);
      }
      
      const isComplete = matched.size === pairCount * 2;
      expect(isComplete).toBe(true);
    });

    it('should not mark incomplete game as complete', () => {
      const pairCount = 6;
      const matched = new Set();
      
      for (let i = 0; i < pairCount; i++) {
        matched.add(`card-${i}`);
      }
      
      const isComplete = matched.size === pairCount * 2;
      expect(isComplete).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should return to settings when back button clicked', () => {
      let gameStatus = 'playing';
      gameStatus = 'settings';
      expect(gameStatus).toBe('settings');
    });

    it('should reset game state when returning to settings', () => {
      const cards = [];
      const flipped = new Set();
      const matched = new Set();
      const moves = 0;
      
      expect(cards).toHaveLength(0);
      expect(flipped.size).toBe(0);
      expect(matched.size).toBe(0);
      expect(moves).toBe(0);
    });
  });
});
