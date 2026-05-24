import { invokeLLM } from "../server/_core/llm";
import { getDb } from "../server/db";
import * as fs from "fs";

interface JapaneseWord {
  id: number;
  japanese: string;
  hiragana: string;
  romaji: string;
  meaning: string;
}

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
  const words = await db.select()
    .from(db._.words)
    .where(
      db._.and(
        db._.eq(db._.words.language, "japanese"),
        db._.isNull(db._.words.japaneseExample)
      )
    )
    .limit(5000);

  console.log(`Found ${words.length} Japanese words needing examples`);

  const results: GeneratedExample[] = [];
  const batchSize = 10;

  // Process in batches
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(words.length / batchSize)}`);

    // Generate examples for this batch
    const prompt = `Generate Japanese example sentences for these words. For each word, provide:
1. A natural Japanese sentence using the word (with kanji and hiragana)
2. The same sentence in romaji
3. An English translation

Words to generate examples for:
${batch.map((w, idx) => `${idx + 1}. ${w.japanese} (${w.hiragana}) - ${w.meaning}`).join("\n")}

Return as JSON array with this structure:
[
  {
    "wordId": ${batch[0]?.id},
    "japaneseExample": "sentence with kanji and hiragana",
    "exampleRomaji": "romaji version",
    "exampleEnglish": "English translation"
  }
]

Generate exactly ${batch.length} objects, one for each word.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a Japanese language expert. Generate natural, contextual example sentences.",
          },
          {
            role: "user",
            content: prompt,
          },
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
                      exampleEnglish: { type: "string" },
                    },
                    required: ["wordId", "japaneseExample", "exampleRomaji", "exampleEnglish"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["examples"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        results.push(...parsed.examples);
      }
    } catch (error) {
      console.error(`Error generating batch ${i / batchSize + 1}:`, error);
    }

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Save results to file
  fs.writeFileSync(
    "/tmp/japanese-examples.json",
    JSON.stringify(results, null, 2)
  );

  console.log(`Generated ${results.length} examples. Saved to /tmp/japanese-examples.json`);
  console.log("Next: Run batch-update-japanese-examples.ts to update database");
}

generateJapaneseExamples().catch(console.error);
