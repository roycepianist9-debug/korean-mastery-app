import { getDb } from "../server/db";
import { words } from "../drizzle/schema";
import { isNull, and, eq } from "drizzle-orm";
import { invokeLLM } from "../server/_core/llm";

const db = getDb();

interface TranslationBatch {
  id: number;
  korean: string;
  koreanExample: string | null;
}

/**
 * Batch generate English translations for Korean examples using LLM
 * Processes words with empty exampleEnglish fields
 * Preserves existing French translations
 */
async function generateEnglishTranslations() {
  console.log("🚀 Starting English translation generation...\n");

  // Get all words with empty exampleEnglish
  const emptyEnglish = await db
    .select({
      id: words.id,
      korean: words.korean,
      koreanExample: words.koreanExample,
    })
    .from(words)
    .where(
      and(
        eq(words.language, "korean"),
        isNull(words.exampleEnglish)
      )
    )
    .limit(10000); // Start with first 10k for testing

  console.log(`Found ${emptyEnglish.length} words needing English translations\n`);

  if (emptyEnglish.length === 0) {
    console.log("✅ All words already have English translations!");
    return;
  }

  // Process in batches of 50
  const BATCH_SIZE = 50;
  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < emptyEnglish.length; i += BATCH_SIZE) {
    const batch = emptyEnglish.slice(i, i + BATCH_SIZE);
    
    // Create prompt for batch translation
    const examples = batch
      .map((w) => `Korean: ${w.korean}\nExample: ${w.koreanExample || "(no example)"}`)
      .join("\n\n");

    const prompt = `Translate these Korean example sentences to English. Return ONLY the translations, one per line, in the same order as the input.

${examples}`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a Korean-English translator. Translate Korean example sentences to natural English. Be concise and accurate.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const translationsText =
        typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : "";

      const translations = translationsText
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Update database with translations
      for (let j = 0; j < batch.length && j < translations.length; j++) {
        const word = batch[j];
        const translation = translations[j];

        if (translation && translation.length > 0) {
          await db
            .update(words)
            .set({ exampleEnglish: translation })
            .where(eq(words.id, word.id));

          successful++;
        } else {
          failed++;
        }
      }

      processed += batch.length;
      console.log(
        `Progress: ${processed}/${emptyEnglish.length} (${successful} successful, ${failed} failed)`
      );

      // Rate limit: wait 1 second between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Batch error at index ${i}:`, error);
      failed += batch.length;
      processed += batch.length;
    }
  }

  console.log("\n✅ Translation generation complete!");
  console.log(`Total processed: ${processed}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
}

generateEnglishTranslations().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
