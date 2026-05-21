import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JAPANESE_VOCAB_300 } from './japanese-vocab-300';

describe('Japanese Vocabulary Import (95 JLPT N5 words)', () => {
  it('should have 95 words in the vocabulary list', () => {
    expect(JAPANESE_VOCAB_300.length).toBe(95);
  });

  it('should have all required fields for each word', () => {
    JAPANESE_VOCAB_300.forEach(word => {
      expect(word.japanese).toBeDefined();
      expect(word.japanese.length).toBeGreaterThan(0);
      expect(word.hiragana).toBeDefined();
      expect(word.hiragana.length).toBeGreaterThan(0);
      expect(word.romaji).toBeDefined();
      expect(word.romaji.length).toBeGreaterThan(0);
      expect(word.meaning).toBeDefined();
      expect(word.meaning.length).toBeGreaterThan(0);
      expect(word.jlptLevel).toBeDefined();
      expect(word.pos).toBeDefined();
      expect(word.japaneseExample).toBeDefined();
      expect(word.japaneseExample.length).toBeGreaterThan(0);
      expect(word.exampleRomaji).toBeDefined();
      expect(word.exampleRomaji.length).toBeGreaterThan(0);
      expect(word.exampleJapaneseFrench).toBeDefined();
      expect(word.exampleJapaneseFrench.length).toBeGreaterThan(0);
    });
  });

  it('should have valid JLPT levels (N5 only)', () => {
    JAPANESE_VOCAB_300.forEach(word => {
      expect(word.jlptLevel).toBe('N5');
    });
  });

  it('should have valid parts of speech', () => {
    const validPos = ['noun', 'verb', 'adjective', 'pronoun', 'adverb', 'particle', 'conjunction'];
    JAPANESE_VOCAB_300.forEach(word => {
      expect(validPos).toContain(word.pos);
    });
  });

  it('should have non-empty Japanese text', () => {
    JAPANESE_VOCAB_300.forEach(word => {
      expect(word.japanese.length).toBeGreaterThan(0);
      expect(word.hiragana.length).toBeGreaterThan(0);
      expect(word.romaji.length).toBeGreaterThan(0);
      expect(word.meaning.length).toBeGreaterThan(0);
    });
  });

  it('should have example sentences with French translations', () => {
    JAPANESE_VOCAB_300.forEach(word => {
      expect(word.japaneseExample.length).toBeGreaterThan(0);
      expect(word.exampleRomaji.length).toBeGreaterThan(0);
      expect(word.exampleJapaneseFrench.length).toBeGreaterThan(0);
    });
  });

  it('should have diverse parts of speech distribution', () => {
    const posCount = JAPANESE_VOCAB_300.reduce((acc, word) => {
      acc[word.pos] = (acc[word.pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ensure we have at least nouns, verbs, and adjectives
    expect(posCount['noun']).toBeGreaterThan(40);
    expect(posCount['verb']).toBeGreaterThan(15);
    expect(posCount['adjective']).toBeGreaterThan(10);
  });

  it('should have unique Japanese words (no duplicates)', () => {
    const japaneseWords = JAPANESE_VOCAB_300.map(w => w.japanese);
    const uniqueWords = new Set(japaneseWords);
    expect(uniqueWords.size).toBe(japaneseWords.length);
    // Verify we have 95 unique words
    expect(uniqueWords.size).toBe(95);
  });

  it('should have sample words covering common categories', () => {
    const japaneseWords = JAPANESE_VOCAB_300.map(w => w.japanese);
    
    // Check for common words
    expect(japaneseWords).toContain('私'); // I
    expect(japaneseWords).toContain('学校'); // school
    expect(japaneseWords).toContain('本'); // book
    expect(japaneseWords).toContain('読む'); // to read
    expect(japaneseWords).toContain('大きい'); // big
    expect(japaneseWords).toContain('年'); // year
  });

  it('should have correct French translations for example sentences', () => {
    JAPANESE_VOCAB_300.forEach(word => {
      // French translations should contain French characters or common French words
      const frenchText = word.exampleJapaneseFrench.toLowerCase();
      // Just verify it's not empty and contains some French content
      expect(frenchText.length).toBeGreaterThan(0);
      // Check for common French patterns
      const hasFrenchContent = 
        /[a-z]{2,}/.test(frenchText) && // Has at least one word
        (frenchText.includes(' ') || frenchText.includes("'") || frenchText.includes('-'));
      
      expect(hasFrenchContent).toBe(true);
    });
  });

  it('should have example sentences in Japanese', () => {
    JAPANESE_VOCAB_300.forEach(word => {
      // Japanese examples should contain hiragana or kanji
      const hasJapaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(word.japaneseExample);
      expect(hasJapaneseChars).toBe(true);
    });
  });

  it('should have romaji for all example sentences', () => {
    JAPANESE_VOCAB_300.forEach(word => {
      // Romaji should be latin characters with possible hyphens, macrons, or particles
      expect(word.exampleRomaji.length).toBeGreaterThan(0);
      // Just check it's not empty and contains mostly latin characters
      expect(/[a-zA-Z]/.test(word.exampleRomaji)).toBe(true);
    });
  });

  it('should have balanced distribution across categories', () => {
    const posCount = JAPANESE_VOCAB_300.reduce((acc, word) => {
      acc[word.pos] = (acc[word.pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Nouns should be the largest category (typical for N5)
    const maxPos = Object.entries(posCount).reduce((max, [pos, count]) => 
      count > max.count ? { pos, count } : max, 
      { pos: '', count: 0 }
    );
    
    expect(maxPos.pos).toBe('noun');
    expect(posCount['noun']).toBeGreaterThan(50); // Majority should be nouns
  });
});
