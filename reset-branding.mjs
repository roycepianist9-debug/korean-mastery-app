import { getDb } from './server/db.ts';
import { appConfig } from './drizzle/schema.ts';
import { eq, inArray } from 'drizzle-orm';

async function resetBranding() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  try {
    // Delete using Drizzle ORM instead of raw SQL
    await db.delete(appConfig).where(
      inArray(appConfig.key, ['taglineEn', 'taglineFr', 'logoUrl'])
    );
    console.log('✓ Branding reset to defaults');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting branding:', error);
    process.exit(1);
  }
}

resetBranding();
