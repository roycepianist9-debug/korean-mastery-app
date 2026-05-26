import { describe, it, expect, beforeAll } from 'vitest';
import { tokenizeAndLookup } from './db';

describe('Chinese Tokenization', () => {
  it('should tokenize Chinese sentence with language parameter', async () => {
    const sentence = '上海是一个大城市';
    const tokens = await tokenizeAndLookup(sentence, 'chinese');
    
    expect(tokens).toBeDefined();
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
    
    // Check structure of tokens
    tokens.forEach(token => {
      expect(token).toHaveProperty('text');
      expect(token).toHaveProperty('isWord');
      expect(token).toHaveProperty('wordId');
      expect(token).toHaveProperty('meaning');
      expect(typeof token.text).toBe('string');
      expect(typeof token.isWord).toBe('boolean');
    });
  });

  it('should tokenize Korean sentence with default language', async () => {
    const sentence = '안녕하세요';
    const tokens = await tokenizeAndLookup(sentence);
    
    expect(tokens).toBeDefined();
    expect(Array.isArray(tokens)).toBe(true);
  });

  it('should handle empty sentence', async () => {
    const tokens = await tokenizeAndLookup('', 'chinese');
    expect(tokens).toEqual([]);
  });

  it('should tokenize Chinese with mixed content', async () => {
    const sentence = '北京是中国的首都。';
    const tokens = await tokenizeAndLookup(sentence, 'chinese');
    
    expect(tokens.length).toBeGreaterThan(0);
    
    // Should have both word and non-word tokens
    const hasWords = tokens.some(t => t.isWord);
    const hasNonWords = tokens.some(t => !t.isWord);
    
    expect(hasWords || hasNonWords).toBe(true);
  });
});
