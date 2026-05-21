import { getDb } from "./server/db.js";

const db = await getDb();
if (!db) {
  console.error("Database connection failed");
  process.exit(1);
}

try {
  const rows = await db.query.words.findMany({
    columns: {},
  });

  // Manual count using raw queries
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

  // Extract the first row from result
  if (Array.isArray(result) && result.length > 0) {
    const data = result[0];
    console.log("Translation Status Report:");
    console.log("==========================");
    console.log(`Total words: ${data.total_words}`);
    console.log(`\nKorean Examples:`);
    console.log(`  - Total with examples: ${data.korean_examples}`);
    console.log(`  - Missing English: ${data.korean_missing_english}`);
    console.log(`  - Missing French: ${data.korean_missing_french}`);
    console.log(`\nChinese Examples:`);
    console.log(`  - Total with examples: ${data.chinese_examples}`);
    console.log(`  - Missing French: ${data.chinese_missing_french}`);
  }
} catch (err) {
  console.error("Error:", err.message);
} finally {
  process.exit(0);
}
