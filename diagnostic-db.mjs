import { drizzle } from 'drizzle-orm/mysql2';
import { words } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

// Check Chinese character
const chinese = await db.select().from(words).where(eq(words.chinese, '到')).limit(1);
console.log('=== CHINESE 到 ===');
console.log(JSON.stringify(chinese[0], null, 2));

// Check Korean word
const korean = await db.select().from(words).where(eq(words.korean, '양복')).limit(1);
console.log('\n=== KOREAN 양복 ===');
console.log(JSON.stringify(korean[0], null, 2));

process.exit(0);
