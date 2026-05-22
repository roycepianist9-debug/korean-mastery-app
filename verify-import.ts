import { getDb } from './server/db';
import { words } from './drizzle/schema';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.log('Database not available');
  process.exit(1);
}

const result = await db.select().from(words).where(eq(words.language, 'japanese'));
console.log(`Total Japanese words: ${result.length}`);

// Count by JLPT level
const levels: Record<string, number> = { n5: 0, n4: 0, n3: 0, n2: 0, n1: 0 };
result.forEach(w => {
  if (w.jlptLevel) levels[w.jlptLevel]++;
});

console.log('Words by JLPT level:');
Object.entries(levels).forEach(([level, count]) => {
  if (count > 0) console.log(`  ${level.toUpperCase()}: ${count}`);
});
