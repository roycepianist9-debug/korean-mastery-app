import { GoogleGenerativeAI } from '@google/generative-ai';
import { drizzle } from 'drizzle-orm/mysql2';
import { words } from '../drizzle/schema.ts';
import { eq, and, isNull, ne } from 'drizzle-orm';
import { pinyin } from 'pinyin-pro';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const db = drizzle(process.env.DATABASE_URL);

// Cost estimate: ~0.001 USD per word (Gemini Flash pricing)
const ESTIMATED_COST = 0.001 * 57; // ~$0.06 for 57 words

async function generateExamples() {
  try {
    // Get Chinese words without examples
    const wordsWithoutExamples = await db
      .select()
      .from(words)
      .where(
        and(
          eq(words.language, 'chinese'),
          isNull(words.chineseExample)
        )
      );

    console.log(`\n📊 COST ESTIMATE`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Words to process: ${wordsWithoutExamples.length}`);
    console.log(`Estimated cost: $${ESTIMATED_COST.toFixed(4)}`);
    console.log(`API: Gemini Flash (input: ~$0.075/1M tokens, output: ~$0.30/1M tokens)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (wordsWithoutExamples.length === 0) {
      console.log('✅ All Chinese words already have examples!');
      process.exit(0);
    }

    // Batch process in groups of 5 to avoid rate limits
    const batchSize = 5;
    let processed = 0;

    for (let i = 0; i < wordsWithoutExamples.length; i += batchSize) {
      const batch = wordsWithoutExamples.slice(i, i + batchSize);
      
      for (const word of batch) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          const prompt = `Generate a simple, beginner-friendly example sentence in Chinese for the word "${word.meaning}". 
          
          Requirements:
          - Use HSK 1-2 level vocabulary (simple words)
          - Keep it short (5-10 words)
          - Return ONLY the Chinese sentence, nothing else
          - No explanations, no translations
          
          Word: ${word.meaning}`;

          const result = await model.generateContent(prompt);
          const chineseExample = result.response.text().trim();

          // Generate pinyin immediately
          const pinyinText = pinyin(chineseExample, {
            type: 'tone',
            toneType: 'symbol',
          });

          // Generate English translation
          const translationPrompt = `Translate this Chinese sentence to English (simple, direct translation):
          "${chineseExample}"
          
          Return ONLY the English translation, nothing else.`;

          const translationResult = await model.generateContent(translationPrompt);
          const englishTranslation = translationResult.response.text().trim();

          // Generate French translation
          const frenchPrompt = `Translate this Chinese sentence to French (simple, direct translation):
          "${chineseExample}"
          
          Return ONLY the French translation, nothing else.`;

          const frenchResult = await model.generateContent(frenchPrompt);
          const frenchTranslation = frenchResult.response.text().trim();

          // Update database
          await db
            .update(words)
            .set({
              chineseExample,
              examplePinyin: pinyinText,
              exampleEnglish: englishTranslation,
              exampleFrench: frenchTranslation,
            })
            .where(eq(words.id, word.id));

          processed++;
          console.log(`✅ [${processed}/${wordsWithoutExamples.length}] ${word.meaning}`);
          console.log(`   Example: ${chineseExample}`);
          console.log(`   Pinyin:  ${pinyinText}`);
          console.log(`   English: ${englishTranslation}`);
          console.log(`   French:  ${frenchTranslation}\n`);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Error processing "${word.meaning}":`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully generated examples for ${processed}/${wordsWithoutExamples.length} words`);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

generateExamples();
