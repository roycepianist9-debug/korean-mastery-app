import { getDb } from './server/db.ts';
import { words } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.log('Database not available');
  process.exit(1);
}

const result = await db.select().from(words).where(eq(words.language, 'japanese'));
console.log(`Total Japanese words: ${result.length}`);
console.log(`Unique Japanese words: ${new Set(result.map(w => w.japanese)).size}`);
