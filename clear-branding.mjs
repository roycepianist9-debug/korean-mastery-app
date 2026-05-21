import { getDb } from './server/db.ts';
import { appConfig } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (db) {
  await db.delete(appConfig).where(eq(appConfig.key, 'taglineEn'));
  await db.delete(appConfig).where(eq(appConfig.key, 'taglineFr'));
  console.log('Cleared old branding data');
}
process.exit(0);
