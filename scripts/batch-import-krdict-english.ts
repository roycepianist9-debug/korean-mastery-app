import * as fs from "fs";
import * as path from "path";
import { parseStringPromise } from "xml2js";
import { db } from "../server/db";
import { words } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const API_KEY = "5BD84C751E26EE1699CB2B214C690F5A";
const API_URL = "https://krdict.korean.go.kr/api/search";

interface KrdictItem {
  word: string;
  exampleEnglish: string;
  targetCode?: number;
}

/**
 * Parse KRDICT XML response and extract example English translations
 */
async function parseKrdictResponse(xmlText: string): Promise<KrdictItem[]> {
  try {
    const parsed = await parseStringPromise(xmlText);

    if (!parsed?.channel?.item) {
      return [];
    }

    const items = Array.isArray(parsed.channel.item)
      ? parsed.channel.item
      : [parsed.channel.item];

    const results: KrdictItem[] = [];

    for (const item of items) {
      const word = item.word?.[0];
      if (!word) continue;

      let exampleEnglish = "";

      // Try to extract from example_translation first
      if (item.sense && Array.isArray(item.sense)) {
        for (const sense of item.sense) {
          if (sense.example && Array.isArray(sense.example)) {
            for (const example of sense.example) {
              if (
                example.example_translation &&
                Array.isArray(example.example_translation)
              ) {
                const engTrans = example.example_translation.find(
                  (t: any) =>
                    t.trans_lang?.[0]?.includes("영어") ||
                    t.trans_lang?.[0] === "1"
                );
                if (engTrans?.trans_word?.[0]) {
                  exampleEnglish = engTrans.trans_word[0];
                  break;
                }
              }
            }
          }
          if (exampleEnglish) break;
        }
      }

      // Fallback: try translation field
      if (!exampleEnglish && item.sense && Array.isArray(item.sense)) {
        for (const sense of item.sense) {
          if (sense.translation && Array.isArray(sense.translation)) {
            const engTrans = sense.translation.find(
              (t: any) =>
                t.trans_lang?.[0]?.includes("영어") ||
                t.trans_lang?.[0] === "1"
            );
            if (engTrans?.trans_dfn?.[0]) {
              exampleEnglish = engTrans.trans_dfn[0];
              break;
            }
          }
        }
      }

      if (exampleEnglish) {
        results.push({
          word,
          exampleEnglish: exampleEnglish.trim(),
          targetCode: item.target_code?.[0],
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Parse error:", error);
    return [];
  }
}

/**
 * Fetch single word from KRDICT API
 */
async function fetchFromKrdict(
  koreanWord: string,
  retries = 3
): Promise<KrdictItem | null> {
  const params = new URLSearchParams({
    key: API_KEY,
    q: koreanWord,
    translated: "y",
    trans_lang: "1", // English
    num: "10",
    sort: "dict",
  });

  const url = `${API_URL}?${params.toString()}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, { timeout: 10000 });

      if (!response.ok) {
        if (attempt < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
          continue;
        }
        return null;
      }

      const xmlText = await response.text();
      const items = await parseKrdictResponse(xmlText);

      // Return first item with translation
      return items.find((item) => item.exampleEnglish) || null;
    } catch (error) {
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  return null;
}

/**
 * Load unique Korean words from database
 */
async function loadUniqueKoreanWords(): Promise<string[]> {
  const result = await db.execute(
    `SELECT DISTINCT korean FROM words WHERE korean IS NOT NULL AND korean != '' ORDER BY korean`
  );

  return result.map((row: any) => row.korean);
}

/**
 * Update word with English translation in database
 */
async function updateWordTranslation(
  korean: string,
  exampleEnglish: string
): Promise<boolean> {
  try {
    await db
      .update(words)
      .set({ exampleEnglish })
      .where(eq(words.korean, korean));
    return true;
  } catch (error) {
    console.error(`Failed to update ${korean}:`, error);
    return false;
  }
}

/**
 * Batch fetch and import translations
 */
async function batchImport(
  koreanWords: string[],
  batchSize = 10,
  delayMs = 500,
  startIndex = 0
) {
  const results = {
    total: koreanWords.length,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
  };

  console.log(`\n📊 Batch Import Starting`);
  console.log(`Total words: ${results.total}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Delay between batches: ${delayMs}ms`);
  console.log(`Starting from index: ${startIndex}\n`);

  for (let i = startIndex; i < koreanWords.length; i += batchSize) {
    const batch = koreanWords.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(koreanWords.length / batchSize);

    console.log(
      `\n[Batch ${batchNum}/${totalBatches}] Processing words ${i + 1}-${Math.min(i + batchSize, koreanWords.length)}`
    );

    const batchPromises = batch.map(async (word) => {
      try {
        const translation = await fetchFromKrdict(word);

        if (translation?.exampleEnglish) {
          await updateWordTranslation(word, translation.exampleEnglish);
          results.successful++;
          console.log(
            `  ✓ ${word}: "${translation.exampleEnglish.substring(0, 50)}..."`
          );
        } else {
          results.skipped++;
          console.log(`  - ${word}: No translation found`);
        }
      } catch (error) {
        results.failed++;
        console.log(
          `  ✗ ${word}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      results.processed++;
    });

    await Promise.all(batchPromises);

    // Progress report
    const elapsed = (new Date().getTime() - results.startTime.getTime()) / 1000;
    const rate = results.processed / (elapsed / 60);
    const remaining = results.total - results.processed;
    const eta = remaining / rate;

    console.log(
      `  Progress: ${results.processed}/${results.total} | Rate: ${rate.toFixed(1)} words/min | ETA: ${eta.toFixed(0)}min`
    );

    // Rate limiting between batches
    if (i + batchSize < koreanWords.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const elapsed = (new Date().getTime() - results.startTime.getTime()) / 1000;

  console.log(`\n📈 Import Complete`);
  console.log(`Total processed: ${results.processed}`);
  console.log(`Successful: ${results.successful}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Time elapsed: ${(elapsed / 60).toFixed(1)} minutes`);

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 KRDICT English Translation Batch Importer");
  console.log("==========================================\n");

  const args = process.argv.slice(2);
  const fullRun = args.includes("--full");
  const startIndex = args.includes("--resume")
    ? parseInt(args[args.indexOf("--resume") + 1] || "0")
    : 0;

  if (!fullRun) {
    console.log("📝 TEST MODE - Processing first 10 words");
    console.log("Run with --full flag to process all words\n");
  }

  // Load words
  console.log("Loading unique Korean words from database...");
  const koreanWords = await loadUniqueKoreanWords();
  console.log(`Loaded ${koreanWords.length} unique Korean words`);

  // Determine batch
  const wordsToProcess = fullRun ? koreanWords : koreanWords.slice(0, 10);

  // Run batch import
  await batchImport(wordsToProcess, 10, 500, startIndex);

  console.log("\n✅ Batch import complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
