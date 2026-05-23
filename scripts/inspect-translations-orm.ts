/**
 * READ-ONLY INSPECTION SCRIPT (ORM VERSION)
 * Uses Drizzle ORM .select() for typed, schema-aware queries
 * No writes, no modifications
 */

import { getDb } from "../server/db";
import { words } from "../drizzle/schema";
import { sql, eq, and, isNull, isNotNull, ne } from "drizzle-orm";

async function inspectTranslationsORM() {
  console.log("🔍 TRANSLATION FIELD INSPECTION (ORM VERSION)\n");
  console.log("Query method: Drizzle ORM .select()");
  console.log("Tables inspected: words");
  console.log("Columns inspected: exampleEnglish, exampleFrench");
  console.log("=".repeat(80));

  const db = await getDb();
  if (!db) {
    console.error("ERROR: Cannot connect to database");
    process.exit(1);
  }

  try {
    // 1. Total row count
    console.log("\n1️⃣  TOTAL ROW COUNT\n");
    const totalResult = await db
      .select({ total: sql`COUNT(*)` })
      .from(words);
    const totalRows = (totalResult[0] as any)?.total || 0;
    console.log(`Total words in database: ${totalRows}\n`);

    // 2. Sample rows with populated exampleEnglish (Korean)
    console.log("2️⃣  SAMPLE ROWS WITH POPULATED exampleEnglish (Korean, LIMIT 5)\n");
    console.log("Query: .select().from(words).where(and(eq(language, 'korean'), isNotNull(exampleEnglish), ne(exampleEnglish, '')))");
    
    const englishPopulated = await db
      .select({
        id: words.id,
        korean: words.korean,
        meaning: words.meaning,
        exampleEnglish: words.exampleEnglish,
        exampleFrench: words.exampleFrench,
        topikLevel: words.topikLevel,
      })
      .from(words)
      .where(
        and(
          eq(words.language, 'korean'),
          isNotNull(words.exampleEnglish),
          ne(words.exampleEnglish, '')
        )
      )
      .limit(5);

    console.log(`\nResult count: ${englishPopulated.length}\n`);
    
    if (englishPopulated.length > 0) {
      englishPopulated.forEach((row, idx) => {
        console.log(`Row ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Korean: ${row.korean}`);
        console.log(`  Meaning: ${row.meaning}`);
        console.log(`  exampleEnglish type: ${typeof row.exampleEnglish}`);
        console.log(`  exampleEnglish value: "${row.exampleEnglish?.substring(0, 60)}${row.exampleEnglish && row.exampleEnglish.length > 60 ? '...' : ''}"`);
        console.log(`  exampleFrench type: ${typeof row.exampleFrench}`);
        console.log(`  exampleFrench value: ${row.exampleFrench === null ? '(NULL)' : row.exampleFrench === '' ? '(EMPTY STRING)' : `"${row.exampleFrench.substring(0, 60)}..."`}`);
        console.log(`  TOPIK Level: ${row.topikLevel}\n`);
      });
    } else {
      console.log("❌ NO rows found with populated exampleEnglish\n");
    }

    // 3. Sample rows with populated exampleFrench (Korean)
    console.log("3️⃣  SAMPLE ROWS WITH POPULATED exampleFrench (Korean, LIMIT 5)\n");
    console.log("Query: .select().from(words).where(and(eq(language, 'korean'), isNotNull(exampleFrench), ne(exampleFrench, '')))");
    
    const frenchPopulated = await db
      .select({
        id: words.id,
        korean: words.korean,
        meaning: words.meaning,
        exampleEnglish: words.exampleEnglish,
        exampleFrench: words.exampleFrench,
        topikLevel: words.topikLevel,
      })
      .from(words)
      .where(
        and(
          eq(words.language, 'korean'),
          isNotNull(words.exampleFrench),
          ne(words.exampleFrench, '')
        )
      )
      .limit(5);

    console.log(`\nResult count: ${frenchPopulated.length}\n`);
    
    if (frenchPopulated.length > 0) {
      frenchPopulated.forEach((row, idx) => {
        console.log(`Row ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Korean: ${row.korean}`);
        console.log(`  Meaning: ${row.meaning}`);
        console.log(`  exampleEnglish type: ${typeof row.exampleEnglish}`);
        console.log(`  exampleEnglish value: ${row.exampleEnglish === null ? '(NULL)' : row.exampleEnglish === '' ? '(EMPTY STRING)' : `"${row.exampleEnglish.substring(0, 60)}..."`}`);
        console.log(`  exampleFrench type: ${typeof row.exampleFrench}`);
        console.log(`  exampleFrench value: "${row.exampleFrench?.substring(0, 60)}${row.exampleFrench && row.exampleFrench.length > 60 ? '...' : ''}"`);
        console.log(`  TOPIK Level: ${row.topikLevel}\n`);
      });
    } else {
      console.log("❌ NO rows found with populated exampleFrench\n");
    }

    // 4. Sample rows with EMPTY translation fields
    console.log("4️⃣  SAMPLE ROWS WITH BOTH FIELDS EMPTY (Korean, LIMIT 5)\n");
    console.log("Query: .select().from(words).where(and(eq(language, 'korean'), or(isNull(exampleEnglish), eq(exampleEnglish, '')), or(isNull(exampleFrench), eq(exampleFrench, ''))))");
    
    const emptyTranslations = await db
      .select({
        id: words.id,
        korean: words.korean,
        meaning: words.meaning,
        exampleEnglish: words.exampleEnglish,
        exampleFrench: words.exampleFrench,
        topikLevel: words.topikLevel,
      })
      .from(words)
      .where(
        and(
          eq(words.language, 'korean'),
          sql`(${words.exampleEnglish} IS NULL OR ${words.exampleEnglish} = '')`,
          sql`(${words.exampleFrench} IS NULL OR ${words.exampleFrench} = '')`
        )
      )
      .limit(5);

    console.log(`\nResult count: ${emptyTranslations.length}\n`);
    
    if (emptyTranslations.length > 0) {
      emptyTranslations.forEach((row, idx) => {
        console.log(`Row ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Korean: ${row.korean}`);
        console.log(`  Meaning: ${row.meaning}`);
        console.log(`  exampleEnglish: ${row.exampleEnglish === null ? '(NULL)' : row.exampleEnglish === '' ? '(EMPTY STRING)' : `"${row.exampleEnglish}"`}`);
        console.log(`  exampleFrench: ${row.exampleFrench === null ? '(NULL)' : row.exampleFrench === '' ? '(EMPTY STRING)' : `"${row.exampleFrench}"`}`);
        console.log(`  TOPIK Level: ${row.topikLevel}\n`);
      });
    } else {
      console.log("✓ NO rows found with both fields empty\n");
    }

    // 5. Count summary by language
    console.log("5️⃣  TRANSLATION FIELD STATUS BY LANGUAGE\n");
    
    const languages = ['korean', 'chinese', 'japanese'] as const;
    
    for (const lang of languages) {
      console.log(`Language: ${lang}`);
      
      const langRows = await db
        .select({
          id: words.id,
          exampleEnglish: words.exampleEnglish,
          exampleFrench: words.exampleFrench,
          exampleChineseFrench: words.exampleChineseFrench,
          exampleJapaneseFrench: words.exampleJapaneseFrench,
        })
        .from(words)
        .where(eq(words.language, lang));

      const total = langRows.length;
      
      if (lang === 'korean') {
        const englishCount = langRows.filter(r => r.exampleEnglish && r.exampleEnglish.trim() !== '').length;
        const frenchCount = langRows.filter(r => r.exampleFrench && r.exampleFrench.trim() !== '').length;
        console.log(`  Total rows: ${total}`);
        console.log(`  exampleEnglish populated: ${englishCount}`);
        console.log(`  exampleFrench populated: ${frenchCount}`);
      } else if (lang === 'chinese') {
        const englishCount = langRows.filter(r => r.exampleEnglish && r.exampleEnglish.trim() !== '').length;
        const frenchCount = langRows.filter(r => r.exampleChineseFrench && r.exampleChineseFrench.trim() !== '').length;
        console.log(`  Total rows: ${total}`);
        console.log(`  exampleEnglish populated: ${englishCount}`);
        console.log(`  exampleChineseFrench populated: ${frenchCount}`);
      } else if (lang === 'japanese') {
        const englishCount = langRows.filter(r => r.exampleEnglish && r.exampleEnglish.trim() !== '').length;
        const frenchCount = langRows.filter(r => r.exampleJapaneseFrench && r.exampleJapaneseFrench.trim() !== '').length;
        console.log(`  Total rows: ${total}`);
        console.log(`  exampleEnglish populated: ${englishCount}`);
        console.log(`  exampleJapaneseFrench populated: ${frenchCount}`);
      }
      console.log();
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

inspectTranslationsORM();
