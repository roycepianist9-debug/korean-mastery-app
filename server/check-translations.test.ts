import { describe, it, expect } from "vitest";
import { getDb } from "./db";

describe("Translation Status", () => {
  it("should report translation gaps", async () => {
    const db = await getDb();
    if (!db) throw new Error("No database");

    const result = await db.execute(`
      SELECT 
        COUNT(*) as total_words,
        SUM(CASE WHEN koreanExample IS NOT NULL AND koreanExample != '' THEN 1 ELSE 0 END) as korean_examples,
        SUM(CASE WHEN koreanExample IS NOT NULL AND koreanExample != '' AND (exampleEnglish IS NULL OR exampleEnglish = '') THEN 1 ELSE 0 END) as korean_missing_english,
        SUM(CASE WHEN koreanExample IS NOT NULL AND koreanExample != '' AND (exampleFrench IS NULL OR exampleFrench = '') THEN 1 ELSE 0 END) as korean_missing_french,
        SUM(CASE WHEN chineseExample IS NOT NULL AND chineseExample != '' THEN 1 ELSE 0 END) as chinese_examples,
        SUM(CASE WHEN chineseExample IS NOT NULL AND chineseExample != '' AND (exampleChineseFrench IS NULL OR exampleChineseFrench = '') THEN 1 ELSE 0 END) as chinese_missing_french
      FROM words
    `);

    console.log("Translation Status:");
    console.log(JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
  });
});
