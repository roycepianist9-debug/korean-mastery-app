import * as fs from "fs";
import * as path from "path";
import { parseStringPromise } from "xml2js";

const API_KEY = "5BD84C751E26EE1699CB2B214C690F5A";
const API_URL = "https://krdict.korean.go.kr/api/search";

interface TranslationResult {
  korean: string;
  exampleEnglish: string;
  targetCode?: number;
}

/**
 * Fetch English translations from KRDICT API
 * The API returns XML with translations when translated=y&trans_lang=1 (English)
 */
async function fetchKrdictEnglish(
  koreanWord: string,
  retries = 3
): Promise<TranslationResult | null> {
  const params = new URLSearchParams({
    key: API_KEY,
    q: koreanWord,
    translated: "y",
    trans_lang: "1", // English
    num: "1", // Get top result only
    sort: "dict",
  });

  const url = `${API_URL}?${params.toString()}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `API error for "${koreanWord}": ${response.status} ${response.statusText}`
        );
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }

      const xmlText = await response.text();
      const parsed = await parseStringPromise(xmlText);

      // Navigate XML structure: channel > item > translation
      if (
        parsed?.channel?.item &&
        Array.isArray(parsed.channel.item) &&
        parsed.channel.item.length > 0
      ) {
        const item = parsed.channel.item[0];

        // Extract English translation from example
        let exampleEnglish = "";

        // Try to find translation in the item
        if (item.translation && Array.isArray(item.translation)) {
          const engTranslation = item.translation.find(
            (t: any) => t.trans_lang?.[0] === "1"
          );
          if (engTranslation?.trans_word?.[0]) {
            exampleEnglish = engTranslation.trans_word[0];
          }
        }

        // Also try example_translation if available
        if (!exampleEnglish && item.example_translation) {
          const exTranslations = Array.isArray(item.example_translation)
            ? item.example_translation
            : [item.example_translation];

          for (const exTrans of exTranslations) {
            if (exTrans.trans_lang?.[0] === "1" && exTrans.trans_word?.[0]) {
              exampleEnglish = exTrans.trans_word[0];
              break;
            }
          }
        }

        return {
          korean: koreanWord,
          exampleEnglish: exampleEnglish.trim(),
          targetCode: item.target_code?.[0],
        };
      }

      return null;
    } catch (error) {
      console.error(
        `Fetch error for "${koreanWord}" (attempt ${attempt + 1}/${retries}):`,
        error instanceof Error ? error.message : String(error)
      );

      if (attempt < retries - 1) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  return null;
}

/**
 * Batch fetch translations with rate limiting
 */
async function batchFetchTranslations(
  koreanWords: string[],
  batchSize = 10,
  delayMs = 500
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];
  const failed: string[] = [];

  console.log(
    `Starting batch fetch for ${koreanWords.length} words (batch size: ${batchSize}, delay: ${delayMs}ms)`
  );

  for (let i = 0; i < koreanWords.length; i += batchSize) {
    const batch = koreanWords.slice(i, i + batchSize);
    console.log(
      `\nBatch ${Math.floor(i / batchSize) + 1}/${Math.ceil(koreanWords.length / batchSize)} (words ${i + 1}-${Math.min(i + batchSize, koreanWords.length)})`
    );

    const batchPromises = batch.map(async (word) => {
      try {
        const result = await fetchKrdictEnglish(word);
        if (result) {
          results.push(result);
          console.log(
            `  ✓ ${result.korean}: "${result.exampleEnglish.substring(0, 50)}..."`
          );
        } else {
          console.log(`  ✗ ${word}: No translation found`);
          failed.push(word);
        }
      } catch (error) {
        console.log(
          `  ✗ ${word}: ${error instanceof Error ? error.message : String(error)}`
        );
        failed.push(word);
      }
    });

    await Promise.all(batchPromises);

    // Rate limiting between batches
    if (i + batchSize < koreanWords.length) {
      console.log(`Waiting ${delayMs}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log(
    `\n✅ Batch complete: ${results.length} successful, ${failed.length} failed`
  );

  if (failed.length > 0 && failed.length <= 20) {
    console.log("Failed words:", failed);
  }

  return results;
}

/**
 * Load Korean words from the existing JSON export
 */
function loadKoreanWords(): string[] {
  const jsonPath = "/home/ubuntu/krdict_json/output/all_entries.json";
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Extract unique Korean words
  const words = Array.from(new Set(data.map((entry: any) => entry.korean)));
  return words as string[];
}

/**
 * Main execution
 */
async function main() {
  console.log("🔍 KRDICT English Translation Fetcher");
  console.log("=====================================\n");

  // Load words
  console.log("Loading Korean words from JSON export...");
  const koreanWords = loadKoreanWords();
  console.log(`Loaded ${koreanWords.length} unique Korean words\n`);

  // For testing, use a small sample first
  const testSample = koreanWords.slice(0, 5);
  console.log("Testing with sample of 5 words:");
  const testResults = await batchFetchTranslations(testSample, 1, 1000);

  console.log("\n📊 Test Results:");
  console.log(JSON.stringify(testResults, null, 2));

  // Save test results
  fs.writeFileSync(
    "/home/ubuntu/krdict-test-results.json",
    JSON.stringify(testResults, null, 2)
  );
  console.log("\nTest results saved to /home/ubuntu/krdict-test-results.json");

  console.log("\n⚠️  Next steps:");
  console.log(
    "1. Review the test results to verify API response structure"
  );
  console.log(
    "2. If successful, run full batch: node scripts/fetch-krdict-english.ts --full"
  );
  console.log("3. Pipe results to database import script");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
