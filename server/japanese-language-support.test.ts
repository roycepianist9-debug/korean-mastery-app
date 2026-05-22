import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { words, userProgress, userStats, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  getProgressByLevel,
  getProgressByPos,
  getRandomWords,
  getWordStats,
  getUserProgressStats,
} from "./db";

describe("Japanese Language Support", () => {
  let db: any;
  let testUserId: number;
  let testWordId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const openId = `test-japanese-${Date.now()}`;
    await db.insert(users).values({
      openId,
      name: "Test User",
      email: "test@example.com",
    }).catch(() => {}); // Ignore if already exists

    // Get the inserted user ID
    const insertedUsers = await db.select().from(users).where(
      eq(users.openId, openId)
    ).limit(1);
    
    if (insertedUsers.length === 0) {
      throw new Error("Failed to create test user");
    }
    testUserId = insertedUsers[0].id;

    // Create a test Japanese word
    await db.insert(words).values({
      language: "japanese",
      japanese: "子供",
      hiragana: "こども",
      romaji: "kodomo",
      meaning: "child",
      meaningFr: "enfant",
      jlptLevel: "n5",
      pos: "noun",
      japaneseExample: "子供は学校に行きます。",
      exampleRomaji: "Kodomo wa gakkō ni ikimasu.",
      exampleJapaneseFrench: "L'enfant va à l'école.",
    }).catch(() => {}); // Ignore if already exists

    // Get the inserted word ID
    const insertedWords = await db.select().from(words).where(
      and(eq(words.language, "japanese"), eq(words.japanese, "子供"))
    ).limit(1);

    if (insertedWords.length === 0) {
      throw new Error("Failed to create test Japanese word");
    }
    testWordId = insertedWords[0].id;
  });

  afterAll(async () => {
    if (!db) return;

    // Clean up test data
    try {
      await db.delete(userProgress).where(eq(userProgress.userId, testUserId));
      await db.delete(userStats).where(eq(userStats.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
      await db.delete(words).where(eq(words.id, testWordId));
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  describe("getRandomWords", () => {
    it("should return Japanese words when language is 'japanese'", async () => {
      const result = await getRandomWords({
        language: "japanese",
        jlptLevel: "n5",
        limit: 5,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].language).toBe("japanese");
      expect(result[0].jlptLevel).toBe("n5");
      expect(result[0].japanese).toBeDefined();
      expect(result[0].hiragana).toBeDefined();
      expect(result[0].romaji).toBeDefined();
    });

    it("should filter by jlptLevel correctly", async () => {
      const result = await getRandomWords({
        language: "japanese",
        jlptLevel: "n5",
        limit: 10,
      });

      result.forEach((word) => {
        expect(word.jlptLevel).toBe("n5");
      });
    });

    it("should exclude specified word IDs", async () => {
      const result = await getRandomWords({
        language: "japanese",
        limit: 10,
        excludeIds: [testWordId],
      });

      const ids = result.map((w) => w.id);
      expect(ids).not.toContain(testWordId);
    });
  });

  describe("getProgressByLevel", () => {
    it("should return progress grouped by jlptLevel for Japanese", async () => {
      // Create a progress record
      await db.insert(userProgress).values({
        userId: testUserId,
        wordId: testWordId,
        status: "learned",
        timesReviewed: 1,
        timesCorrect: 1,
        lastReviewedAt: new Date(),
      });

      const result = await getProgressByLevel(testUserId, "japanese");

      expect(Array.isArray(result)).toBe(true);
      
      // Check if result contains jlptLevel field (not topikLevel)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("jlptLevel");
        expect(result[0]).not.toHaveProperty("topikLevel");
      }
    });

    it("should correctly aggregate progress by jlptLevel", async () => {
      const result = await getProgressByLevel(testUserId, "japanese");

      // Verify structure
      result.forEach((item) => {
        expect(item).toHaveProperty("jlptLevel");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("count");
        expect(["n5", "n4", "n3", "n2", "n1"]).toContain(item.jlptLevel);
        expect(["new", "reviewing", "learned"]).toContain(item.status);
        expect(typeof item.count).toBe("number");
      });
    });
  });

  describe("getProgressByPos", () => {
    it("should return progress grouped by part of speech for Japanese", async () => {
      const result = await getProgressByPos(testUserId, "japanese");

      expect(Array.isArray(result)).toBe(true);
      
      result.forEach((item) => {
        expect(item).toHaveProperty("pos");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("count");
      });
    });
  });

  describe("getUserProgressStats", () => {
    it("should return progress stats for Japanese language", async () => {
      const result = await getUserProgressStats(testUserId, "japanese");

      expect(result).toHaveProperty("new");
      expect(result).toHaveProperty("reviewing");
      expect(result).toHaveProperty("learned");
      expect(result).toHaveProperty("total");
      expect(typeof result.new).toBe("number");
      expect(typeof result.reviewing).toBe("number");
      expect(typeof result.learned).toBe("number");
      expect(typeof result.total).toBe("number");
    });

    it("should correctly count learned words for Japanese", async () => {
      const result = await getUserProgressStats(testUserId, "japanese");

      // Should have at least 1 learned word from our test data
      expect(result.learned).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getWordStats", () => {
    it("should return word statistics for Japanese", async () => {
      const result = await getWordStats("japanese");

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("byLevel");
      expect(result).toHaveProperty("byPos");
      expect(typeof result.total).toBe("number");
      expect(Array.isArray(result.byLevel)).toBe(true);
      expect(Array.isArray(result.byPos)).toBe(true);
    });

    it("should group Japanese words by jlptLevel, not topikLevel", async () => {
      const result = await getWordStats("japanese");

      result.byLevel.forEach((item) => {
        expect(item).toHaveProperty("level");
        expect(item).toHaveProperty("count");
        // JLPT levels should be n5, n4, n3, n2, n1
        expect(["n5", "n4", "n3", "n2", "n1", null]).toContain(item.level);
      });
    });
  });

  describe("Japanese word data integrity", () => {
    it("should have all required Japanese fields populated", async () => {
      const result = await db.select().from(words).where(
        eq(words.id, testWordId)
      ).limit(1);

      expect(result.length).toBe(1);
      const word = result[0];

      expect(word.japanese).toBeDefined();
      expect(word.japanese).not.toBeNull();
      expect(word.hiragana).toBeDefined();
      expect(word.romaji).toBeDefined();
      expect(word.jlptLevel).toBeDefined();
      expect(word.language).toBe("japanese");
    });

    it("should have Japanese example sentences", async () => {
      const result = await db.select().from(words).where(
        eq(words.id, testWordId)
      ).limit(1);

      expect(result.length).toBe(1);
      const word = result[0];

      expect(word.japaneseExample).toBeDefined();
      expect(word.exampleRomaji).toBeDefined();
      expect(word.exampleJapaneseFrench).toBeDefined();
    });
  });

  describe("Language-specific filtering", () => {
    it("should not return Japanese words when filtering for Korean", async () => {
      const result = await getRandomWords({
        language: "korean",
        limit: 100,
      });

      result.forEach((word) => {
        expect(word.language).toBe("korean");
        // Database returns null for missing fields, not undefined
        expect(word.japanese).toBeNull();
      });
    });

    it("should not return Japanese words when filtering for Chinese", async () => {
      const result = await getRandomWords({
        language: "chinese",
        limit: 100,
      });

      result.forEach((word) => {
        expect(word.language).toBe("chinese");
        // Database returns null for missing fields, not undefined
        expect(word.japanese).toBeNull();
      });
    });
  });
});
