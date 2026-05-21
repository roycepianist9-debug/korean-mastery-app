import { getDb } from './server/db';
import { words } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function inspectRow() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // Get a single Chinese word row
  const result = await db.select().from(words).where(eq(words.language, 'chinese')).limit(1);
  
  if (result.length === 0) {
    console.log('No Chinese words found');
    process.exit(0);
  }

  const row = result[0];
  console.log('\n=== SAMPLE CHINESE WORD ROW ===');
  console.log('All keys available on this object:');
  console.log(Object.keys(row));
  
  console.log('\n=== FULL ROW DATA ===');
  console.log(JSON.stringify(row, null, 2));
}

inspectRow();
