/**
 * READ-ONLY INSPECTION SCRIPT
 * Inspects translation field status in the database
 * Uses existing app database connection layer
 * No writes, no modifications
 */

import { getDb } from "../server/db";
import { words } from "../drizzle/schema";
import { sql, eq } from "drizzle-orm";

async function inspectTranslations() {
  console.log("🔍 TRANSLATION FIELD INSPECTION\n");
  console.log("Database: Using existing app connection layer");
  console.log("Tables inspected: words");
  console.log("Columns inspected: exampleEnglish, exampleFrench\n");
  console.log("=".repeat(80));

  const db = await getDb();
  if (!db) {
    console.error("ERROR: Cannot connect to database");
    process.exit(1);
  }

  try {
    // 1. Total row count
    console.log("\n1️⃣  TOTAL ROW COUNT\n");
    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as total FROM words`
    );
    const totalRows = (totalResult as any)[0]?.total || 0;
    console.log(`Total words in database: ${totalRows}\n`);

    // 2. Sample rows with populated exampleEnglish
    console.log("2️⃣  SAMPLE ROWS WITH POPULATED exampleEnglish (LIMIT 5)\n");
    const englishPopulated = await db.execute(
      sql`SELECT id, korean, meaning, exampleEnglish, exampleFrench, topikLevel
          FROM words
          WHERE language = 'korean'
            AND exampleEnglish IS NOT NULL
            AND exampleEnglish != ''
          LIMIT 5`
    );

    if ((englishPopulated as any).length > 0) {
      console.log(`Found ${(englishPopulated as any).length} rows with English translations:\n`);
      (englishPopulated as any).forEach((row: any, idx: number) => {
        console.log(`Row ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Korean: ${row.korean}`);
        console.log(`  Meaning: ${row.meaning}`);
        console.log(`  exampleEnglish: "${row.exampleEnglish?.substring(0, 60)}..."`);
        console.log(`  exampleFrench: "${row.exampleFrench?.substring(0, 60) || '(empty)'}..."`);
        console.log(`  TOPIK Level: ${row.topikLevel}\n`);
      });
    } else {
      console.log("❌ NO rows found with populated exampleEnglish\n");
    }

    // 3. Sample rows with populated exampleFrench
    console.log("3️⃣  SAMPLE ROWS WITH POPULATED exampleFrench (LIMIT 5)\n");
    const frenchPopulated = await db.execute(
      sql`SELECT id, korean, meaning, exampleEnglish, exampleFrench, topikLevel
          FROM words
          WHERE language = 'korean'
            AND exampleFrench IS NOT NULL
            AND exampleFrench != ''
          LIMIT 5`
    );

    if ((frenchPopulated as any).length > 0) {
      console.log(`Found ${(frenchPopulated as any).length} rows with French translations:\n`);
      (frenchPopulated as any).forEach((row: any, idx: number) => {
        console.log(`Row ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Korean: ${row.korean}`);
        console.log(`  Meaning: ${row.meaning}`);
        console.log(`  exampleEnglish: "${row.exampleEnglish?.substring(0, 60) || '(empty)'}..."`);
        console.log(`  exampleFrench: "${row.exampleFrench?.substring(0, 60)}..."`);
        console.log(`  TOPIK Level: ${row.topikLevel}\n`);
      });
    } else {
      console.log("❌ NO rows found with populated exampleFrench\n");
    }

    // 4. Sample rows with EMPTY translation fields
    console.log("4️⃣  SAMPLE ROWS WITH EMPTY TRANSLATION FIELDS (LIMIT 5)\n");
    const emptyTranslations = await db.execute(
      sql`SELECT id, korean, meaning, exampleEnglish, exampleFrench, topikLevel
          FROM words
          WHERE language = 'korean'
            AND (exampleEnglish IS NULL OR exampleEnglish = '')
            AND (exampleFrench IS NULL OR exampleFrench = '')
          LIMIT 5`
    );

    if ((emptyTranslations as any).length > 0) {
      console.log(`Found ${(emptyTranslations as any).length} rows with empty translations:\n`);
      (emptyTranslations as any).forEach((row: any, idx: number) => {
        console.log(`Row ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Korean: ${row.korean}`);
        console.log(`  Meaning: ${row.meaning}`);
        console.log(`  exampleEnglish: ${row.exampleEnglish === null ? "(NULL)" : `"${row.exampleEnglish}"`}`);
        console.log(`  exampleFrench: ${row.exampleFrench === null ? "(NULL)" : `"${row.exampleFrench}"`}`);
        console.log(`  TOPIK Level: ${row.topikLevel}\n`);
      });
    } else {
      console.log("✓ NO rows found with both fields empty\n");
    }

    // 5. Counts by field status
    console.log("5️⃣  TRANSLATION FIELD STATUS COUNTS\n");
    const counts = await db.execute(
      sql`SELECT
            SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as english_populated,
            SUM(CASE WHEN exampleEnglish IS NULL OR exampleEnglish = '' THEN 1 ELSE 0 END) as english_empty,
            SUM(CASE WHEN exampleFrench IS NOT NULL AND exampleFrench != '' THEN 1 ELSE 0 END) as french_populated,
            SUM(CASE WHEN exampleFrench IS NULL OR exampleFrench = '' THEN 1 ELSE 0 END) as french_empty
          FROM words
          WHERE language = 'korean'`
    );

    if ((counts as any).length > 0) {
      const c = (counts as any)[0];
      console.log("Korean words (language='korean'):");
      console.log(`  exampleEnglish populated: ${c.english_populated || 0}`);
      console.log(`  exampleEnglish empty: ${c.english_empty || 0}`);
      console.log(`  exampleFrench populated: ${c.french_populated || 0}`);
      console.log(`  exampleFrench empty: ${c.french_empty || 0}\n`);
    }

    // 6. Check Chinese translations
    console.log("6️⃣  CHINESE TRANSLATION FIELD STATUS\n");
    const chineseCounts = await db.execute(
      sql`SELECT
            COUNT(*) as total,
            SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as english_populated,
            SUM(CASE WHEN exampleChineseFrench IS NOT NULL AND exampleChineseFrench != '' THEN 1 ELSE 0 END) as french_populated
          FROM words
          WHERE language = 'chinese'`
    );

    if ((chineseCounts as any).length > 0) {
      const c = (chineseCounts as any)[0];
      console.log("Chinese words (language='chinese'):");
      console.log(`  Total: ${c.total || 0}`);
      console.log(`  exampleEnglish populated: ${c.english_populated || 0}`);
      console.log(`  exampleChineseFrench populated: ${c.french_populated || 0}\n`);
    }

    // 7. Check Japanese translations
    console.log("7️⃣  JAPANESE TRANSLATION FIELD STATUS\n");
    const japaneseCounts = await db.execute(
      sql`SELECT
            COUNT(*) as total,
            SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as english_populated,
            SUM(CASE WHEN exampleJapaneseFrench IS NOT NULL AND exampleJapaneseFrench != '' THEN 1 ELSE 0 END) as french_populated
          FROM words
          WHERE language = 'japanese'`
    );

    if ((japaneseCounts as any).length > 0) {
      const c = (japaneseCounts as any)[0];
      console.log("Japanese words (language='japanese'):");
      console.log(`  Total: ${c.total || 0}`);
      console.log(`  exampleEnglish populated: ${c.english_populated || 0}`);
      console.log(`  exampleJapaneseFrench populated: ${c.french_populated || 0}\n`);
    }

    console.log("=".repeat(80));
    console.log("\n✅ INSPECTION COMPLETE\n");

  } catch (error) {
    console.error("\n❌ ERROR DURING INSPECTION:");
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

inspectTranslations();
