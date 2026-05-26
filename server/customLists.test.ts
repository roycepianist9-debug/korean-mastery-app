import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import {
  createCustomList,
  getCustomListsByUser,
  getCustomList,
  updateCustomList,
  deleteCustomList,
  addWordToList,
  removeWordFromList,
  getListWords,
} from './db';
import { users, words } from '../drizzle/schema';

describe('Custom Lists', () => {
  let testUserId: number;
  let testWordId: number;
  let testListId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    });
    testUserId = userResult[0].insertId;

    // Create test word (Chinese)
    const wordResult = await db.insert(words).values({
      language: 'chinese',
      chinese: '测试',
      pinyin: 'cèshì',
      meaning: 'test',
      hskLevel: '1',
    });
    testWordId = wordResult[0].insertId;
  });

  it('should create a custom list', async () => {
    testListId = await createCustomList({
      userId: testUserId,
      name: 'My Test List',
      description: 'A test list',
      language: 'chinese',
      color: '#10b981',
    });
    expect(testListId).toBeGreaterThan(0);
  });

  it('should get custom lists by user', async () => {
    const lists = await getCustomListsByUser(testUserId);
    expect(lists.length).toBeGreaterThan(0);
    expect(lists[0].name).toBe('My Test List');
  });

  it('should get a specific custom list', async () => {
    const list = await getCustomList(testListId);
    expect(list).toBeDefined();
    expect(list?.name).toBe('My Test List');
    expect(list?.userId).toBe(testUserId);
  });

  it('should update a custom list', async () => {
    await updateCustomList(testListId, {
      name: 'Updated List Name',
      color: '#ef4444',
    });
    const list = await getCustomList(testListId);
    expect(list?.name).toBe('Updated List Name');
    expect(list?.color).toBe('#ef4444');
  });

  it('should add a word to a list', async () => {
    await addWordToList(testListId, testWordId);
    const { words: listWords, total } = await getListWords(testListId);
    expect(total).toBe(1);
    expect(listWords[0].id).toBe(testWordId);
  });

  it('should not add duplicate words to a list', async () => {
    await addWordToList(testListId, testWordId);
    const { words: listWords, total } = await getListWords(testListId);
    expect(total).toBe(1); // Still 1, not 2
  });

  it('should remove a word from a list', async () => {
    await removeWordFromList(testListId, testWordId);
    const { words: listWords, total } = await getListWords(testListId);
    expect(total).toBe(0);
  });

  it('should delete a custom list', async () => {
    await deleteCustomList(testListId);
    const list = await getCustomList(testListId);
    expect(list).toBeUndefined();
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    // Cleanup: delete test user (cascade deletes lists)
    await db.delete(users).where(users.id === testUserId);
    await db.delete(words).where(words.id === testWordId);
  });
});
