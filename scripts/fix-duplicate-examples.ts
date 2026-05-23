import { getDb } from '../server/db';
import { words } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function fixDuplicateExamples() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('Scanning for duplicate Korean text in exampleFrench field...');

  // Get all Korean words
  const allWords = await db.select().from(words).where(eq(words.language, 'korean'));

  let fixedCount = 0;
  let duplicatesFound = 0;

  for (const word of allWords) {
    if (!word.exampleFrench || !word.koreanExample) continue;

    // Check if exampleFrench contains the Korean example (duplication)
    if (word.exampleFrench.includes(word.koreanExample)) {
      duplicatesFound++;
      console.log(`\n❌ Duplicate found in word: ${word.korean}`);
      console.log(`   Korean example: ${word.koreanExample}`);
      console.log(`   Current exampleFrench: ${word.exampleFrench}`);

      // Remove the Korean example from exampleFrench
      let cleanedFrench = word.exampleFrench.replace(word.koreanExample, '').trim();
      
      // Remove any leading/trailing separators or extra whitespace
      cleanedFrench = cleanedFrench
        .replace(/^[\s\-─—]+/, '') // Remove leading dashes/separators
        .replace(/[\s\-─—]+$/, '') // Remove trailing dashes/separators
        .trim();

      if (cleanedFrench) {
        // Update the database
        await db.update(words)
          .set({ exampleFrench: cleanedFrench })
          .where(eq(words.id, word.id));

        console.log(`   ✅ Fixed to: ${cleanedFrench}`);
        fixedCount++;
      } else {
        console.log(`   ⚠️  Would be empty after cleanup, skipping`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Duplicates found: ${duplicatesFound}`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   ✅ Cleanup complete!`);
}

fixDuplicateExamples().catch(console.error).finally(() => process.exit(0));
