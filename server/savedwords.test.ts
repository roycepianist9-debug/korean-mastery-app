import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, words } from "../drizzle/schema";
import { addSavedWord, removeSavedWord, getSavedWords, isSavedWord } from "./db";
import { eq } from "drizzle-orm";

describe("Saved Words", () => {
  let db: any;
  let testUserId: number;
  let testWordId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      loginMethod: "test",
    });
    testUserId = userResult[0].insertId || 1;

    // Get first Chinese word for testing
    const wordResult = await db.select()
      .from(words)
      .where(eq(words.language, "chinese"))
      .limit(1);
    
    if (wordResult.length === 0) {
      throw new Error("No Chinese words found in database");
    }
    testWordId = wordResult[0].id;
  });

  it("should add a word to saved words", async () => {
    await addSavedWord(testUserId, testWordId);
    const isSaved = await isSavedWord(testUserId, testWordId);
    expect(isSaved).toBe(true);
  });

  it("should not add duplicate saved words", async () => {
    await addSavedWord(testUserId, testWordId);
    await addSavedWord(testUserId, testWordId); // Try adding again
    
    const saved = await getSavedWords(testUserId, "chinese");
    const count = saved.filter((s: any) => s.saved_words.wordId === testWordId).length;
    expect(count).toBe(1);
  });

  it("should retrieve saved words for a user", async () => {
    const saved = await getSavedWords(testUserId, "chinese");
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[0]).toHaveProperty("words");
  });

  it("should remove a saved word", async () => {
    await removeSavedWord(testUserId, testWordId);
    const isSaved = await isSavedWord(testUserId, testWordId);
    expect(isSaved).toBe(false);
  });

  it("should return false for unsaved words", async () => {
    const isSaved = await isSavedWord(testUserId, testWordId);
    expect(isSaved).toBe(false);
  });

  afterAll(async () => {
    // Cleanup is handled by database transaction rollback
  });
});
