import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getEnglishSynonyms,
  getEnglishSynonymsByLevel,
  getAllEnglishSynonyms,
  upsertEnglishSynonym,
  deleteEnglishSynonym,
} from './db';

describe('English Synonyms', () => {
  const testWord = {
    word: 'test-word-unique',
    partOfSpeech: 'noun',
    synonyms: ['synonym1', 'synonym2', 'synonym3'],
    level: 'beginner' as const,
  };

  beforeAll(async () => {
    // Insert test word
    await upsertEnglishSynonym(testWord);
  });

  afterAll(async () => {
    // Clean up test word
    await deleteEnglishSynonym(testWord.word);
  });

  it('should retrieve a single word by name', async () => {
    const result = await getEnglishSynonyms(testWord.word);
    expect(result).toBeDefined();
    expect(result?.word).toBe(testWord.word);
    expect(result?.partOfSpeech).toBe('noun');
  });

  it('should retrieve words by level', async () => {
    const results = await getEnglishSynonymsByLevel('beginner');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    // Find our test word
    const testWordResult = results.find(w => w.word === testWord.word);
    expect(testWordResult).toBeDefined();
  });

  it('should retrieve all words with pagination', async () => {
    const result = await getAllEnglishSynonyms(10, 0);
    expect(result).toHaveProperty('synonyms');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.synonyms)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should upsert a word and update it', async () => {
    const updatedWord = {
      ...testWord,
      synonyms: ['updated1', 'updated2', 'updated3', 'updated4'],
    };
    
    await upsertEnglishSynonym(updatedWord);
    const result = await getEnglishSynonyms(testWord.word);
    
    expect(result).toBeDefined();
    // Parse JSON synonyms array
    const synonymsArray = typeof result?.synonyms === 'string' 
      ? JSON.parse(result.synonyms) 
      : result?.synonyms;
    expect(synonymsArray).toHaveLength(4);
  });

  it('should delete a word', async () => {
    // Create a temporary word
    const tempWord = {
      word: 'temp-word-to-delete',
      partOfSpeech: 'verb',
      synonyms: ['temp1', 'temp2'],
      level: 'intermediate' as const,
    };
    
    await upsertEnglishSynonym(tempWord);
    let result = await getEnglishSynonyms(tempWord.word);
    expect(result).toBeDefined();
    
    // Delete it
    await deleteEnglishSynonym(tempWord.word);
    result = await getEnglishSynonyms(tempWord.word);
    expect(result).toBeNull();
  });

  it('should handle case-insensitive word lookup', async () => {
    const upperResult = await getEnglishSynonyms(testWord.word.toUpperCase());
    const lowerResult = await getEnglishSynonyms(testWord.word.toLowerCase());
    
    expect(upperResult).toBeDefined();
    expect(lowerResult).toBeDefined();
    expect(upperResult?.word).toBe(lowerResult?.word);
  });

  it('should store and retrieve synonyms as JSON', async () => {
    const result = await getEnglishSynonyms(testWord.word);
    expect(result).toBeDefined();
    
    // Synonyms should be stored as JSON string
    const synonymsArray = typeof result?.synonyms === 'string'
      ? JSON.parse(result.synonyms)
      : result?.synonyms;
    
    expect(Array.isArray(synonymsArray)).toBe(true);
    expect(synonymsArray.length).toBeGreaterThan(0);
  });
});
