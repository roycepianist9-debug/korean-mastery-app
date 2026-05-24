import { getDb } from "../server/db";
import { words } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { invokeLLM } from "../server/_core/llm";
import * as fs from "fs";

interface GeneratedExample {
  wordId: number;
  japaneseExample: string;
  exampleRomaji: string;
  exampleEnglish: string;
}

async function generateJapaneseExamples() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  // Get all Japanese words without examples
  const wordList = await db.select()
    .from(words)
    .where(
      and(
        eq(words.language, "japanese"),
        isNull(words.japaneseExample)
      )
    )
    .limit(5000);

  console.log(`Found ${wordList.length} Japanese words needing examples`);

  const results: GeneratedExample[] = [];
  const batchSize = 20;
  let totalProcessed = 0;

  // Process in batches
  for (let i = 0; i < wordList.length; i += batchSize) {
    const batch = wordList.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(wordList.length / batchSize);
    
    console.log(`\n[Batch ${batchNum}/${totalBatches}] Processing ${batch.length} words...`);

    try {
      // Generate examples for this batch
      const prompt = `Generate Japanese example sentences for these words. For each word, provide:
1. A natural Japanese sentence using the word (with kanji and hiragana)
2. The same sentence in romaji (romanized)
3. An English translation of the sentence

Return as JSON array with structure: [{"wordId": number, "japaneseExample": string, "exampleRomaji": string, "exampleEnglish": string}]

Words:
${batch.map((w: any) => `- ID ${w.id}: ${w.japanese} (${w.hiragana}) - meaning: ${w.meaning}`).join('\n')}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a Japanese language expert. Generate natural, contextual example sentences." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "japanese_examples",
            strict: true,
            schema: {
              type: "object",
              properties: {
                examples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      wordId: { type: "number" },
                      japaneseExample: { type: "string" },
                      exampleRomaji: { type: "string" },
                      exampleEnglish: { type: "string" }
                    },
                    required: ["wordId", "japaneseExample", "exampleRomaji", "exampleEnglish"]
                  }
                }
              },
              required: ["examples"]
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      if (parsed.examples && Array.isArray(parsed.examples)) {
        results.push(...parsed.examples);
        totalProcessed += parsed.examples.length;
        console.log(`✓ Generated ${parsed.examples.length} examples (total: ${totalProcessed}/${wordList.length})`);
      }
    } catch (error: any) {
      console.error(`✗ Batch ${batchNum} failed:`, error.message);
    }

    // Rate limit: wait 1 second between batches
    if (i + batchSize < wordList.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save results to file
  const outputFile = "/tmp/japanese-examples-generated.json";
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Generated ${results.length} examples, saved to ${outputFile}`);

  // Now update database with generated examples
  console.log("\nUpdating database with generated examples...");
  let updated = 0;
  
  for (const example of results) {
    try {
      await db.update(words)
        .set({
          japaneseExample: example.japaneseExample,
          exampleRomaji: example.exampleRomaji,
          exampleEnglish: example.exampleEnglish
        })
        .where(eq(words.id, example.wordId));
      updated++;
      
      if (updated % 50 === 0) {
        console.log(`Updated ${updated}/${results.length} words...`);
      }
    } catch (error: any) {
      console.error(`Failed to update word ${example.wordId}:`, error.message);
    }
  }

  console.log(`✅ Updated ${updated} words in database`);
  process.exit(0);
}

generateJapaneseExamples().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
