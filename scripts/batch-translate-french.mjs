#!/usr/bin/env node

/**
 * Batch translate Korean/Chinese words and examples to French using Gemini API
 * Usage: node batch-translate-french.mjs [topikLevel|hskLevel] [limit]
 * Examples:
 *   node batch-translate-french.mjs beginner 100
 *   node batch-translate-french.mjs 1 50  (for HSK level 1)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { URL } from "url";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parse DATABASE_URL (format: mysql://user:password@host:port/database)
function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    port: parseInt(parsed.port || "4000", 10), // TiDB Cloud uses port 4000
  };
}

const dbConfig = process.env.DATABASE_URL
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "korean_mastery",
      port: 3306,
    };

console.log(`Connecting to database at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

const pool = mysql.createPool({
  ...dbConfig,
  ssl: {}, // TiDB Cloud requires SSL (empty object uses default CA)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const BATCH_SIZE = 100; // Translate 100 words per API call (respects 5 req/min limit = 500 words/min)
const DELAY_MS = 12000; // 12 second delay between batches (5 requests per minute)

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWordsToTranslate(language, level, limit) {
  const connection = await pool.getConnection();
  try {
    // Ensure limit is an integer
    const limitInt = Math.max(1, parseInt(limit, 10));
    let query;
    let params;

    if (language === "korean") {
      query = `
        SELECT id, korean, meaning, koreanExample, exampleEnglish, topikLevel
        FROM words
        WHERE language = 'korean' 
          AND topikLevel = ?
          AND (meaningFr IS NULL OR exampleFrench IS NULL)
        LIMIT ${limitInt}
      `;
      params = [level];
    } else if (language === "chinese") {
      query = `
        SELECT id, chinese, meaning, chineseExample, examplePinyin, hskLevel
        FROM words
        WHERE language = 'chinese'
          AND hskLevel = ?
          AND (meaningFr IS NULL OR exampleChineseFrench IS NULL)
        LIMIT ${limitInt}
      `;
      params = [level];
    } else {
      throw new Error(`Unknown language: ${language}`);
    }

    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    connection.release();
  }
}

async function translateBatch(words, language) {
  const wordsList = words
    .map((w) => {
      if (language === "korean") {
        return `ID:${w.id} | Korean: "${w.korean}" (Meaning: ${w.meaning}) | Example: "${w.koreanExample}" (English: ${w.exampleEnglish})`;
      } else {
        return `ID:${w.id} | Chinese: "${w.chinese}" (Meaning: ${w.meaning}) | Example: "${w.chineseExample}" (Pinyin: ${w.examplePinyin})`;
      }
    })
    .join("\n");

  const systemPrompt =
    language === "korean"
      ? `You are a Korean-French translator. Translate the following Korean words and their example sentences to French.
Return a JSON array with objects containing:
- id: the ID number from the input (extract from "ID:123" format)
- meaningFr: French translation of the meaning (1-5 words)
- exampleFrench: French translation of the example sentence (natural, conversational)

Be accurate, concise, and natural. Return ONLY valid JSON, no markdown.`
      : `You are a Chinese-French translator. Translate the following Chinese words and their example sentences to French.
Return a JSON array with objects containing:
- id: the ID number from the input (extract from "ID:123" format)
- meaningFr: French translation of the meaning (1-5 words)
- exampleChineseFrench: French translation of the example sentence (natural, conversational)

Be accurate, concise, and natural. Return ONLY valid JSON, no markdown.`;

  const userPrompt = `Translate these ${language === "korean" ? "Korean" : "Chinese"} words and examples to French:\n\n${wordsList}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const content = response.response.text();

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(`No JSON found in response: ${content}`);
    }

    const translations = JSON.parse(jsonMatch[0]);
    // Ensure all IDs are integers and valid
    return translations
      .map((t) => ({
        ...t,
        id: parseInt(t.id, 10),
      }))
      .filter((t) => !isNaN(t.id) && t.id > 0);
  } catch (error) {
    console.error("Gemini API error:", error.message);
    throw error;
  }
}

async function updateDatabase(translations, language) {
  const connection = await pool.getConnection();
  try {
    for (const trans of translations) {
      // ID should already be validated, but double-check
      const id = trans.id;
      if (!Number.isInteger(id) || id <= 0) {
        console.warn(`Skipping invalid ID: ${trans.id}`);
        continue;
      }

      let query;
      let params;

      if (language === "korean") {
        query = `
          UPDATE words
          SET meaningFr = ?, exampleFrench = ?
          WHERE id = ?
        `;
        params = [trans.meaningFr, trans.exampleFrench, id];
      } else {
        query = `
          UPDATE words
          SET meaningFr = ?, exampleChineseFrench = ?
          WHERE id = ?
        `;
        params = [trans.meaningFr, trans.exampleChineseFrench, id];
      }

      await connection.execute(query, params);
    }
  } finally {
    connection.release();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      "Usage: node batch-translate-french.mjs [topikLevel|hskLevel] [limit]"
    );
    console.log("Examples:");
    console.log("  node batch-translate-french.mjs beginner 100");
    console.log("  node batch-translate-french.mjs 1 50  (for HSK level 1)");
    process.exit(1);
  }

  const level = args[0];
  const limit = parseInt(args[1], 10);

  // Determine language and validate level
  let language;
  if (["beginner", "intermediate", "advanced"].includes(level)) {
    language = "korean";
    console.log(`Translating Korean ${level} level (max ${limit} words)...`);
  } else if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(level)) {
    language = "chinese";
    console.log(`Translating Chinese HSK ${level} (max ${limit} words)...`);
  } else {
    console.error(`Invalid level: ${level}`);
    process.exit(1);
  }

  try {
    // Fetch words that need translation
    const words = await getWordsToTranslate(language, level, limit);
    console.log(`Found ${words.length} words to translate`);

    if (words.length === 0) {
      console.log("No words to translate!");
      process.exit(0);
    }

    let processed = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE);
      console.log(
        `\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(words.length / BATCH_SIZE)} (${batch.length} words)...`
      );

      try {
        const translations = await translateBatch(batch, language);
        if (translations.length === 0) {
          console.warn(`⚠ No valid translations returned for this batch`);
          failed += batch.length;
          continue;
        }
        await updateDatabase(translations, language);
        processed += translations.length;
        console.log(`✓ Updated ${translations.length} words`);

        // Show sample
        if (i === 0 && translations.length > 0) {
          const sample = translations[0];
          console.log(`\nSample translation:`);
          console.log(`  ID: ${sample.id}`);
          console.log(`  Meaning FR: ${sample.meaningFr}`);
          if (language === "korean") {
            console.log(`  Example FR: ${sample.exampleFrench}`);
          } else {
            console.log(`  Example FR: ${sample.exampleChineseFrench}`);
          }
          console.log();
        }
      } catch (error) {
        console.error(`✗ Batch failed: ${error.message}`);
        failed += batch.length;
      }

      // Delay before next batch to avoid rate limits
      if (i + BATCH_SIZE < words.length) {
        await sleep(DELAY_MS);
      }
    }

    console.log(`\n✓ Translation complete!`);
    console.log(`  Processed: ${processed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total: ${processed + failed}`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
