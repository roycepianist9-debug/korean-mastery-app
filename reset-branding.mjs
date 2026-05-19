import { db } from './server/db.ts';
import { appConfig } from './drizzle/schema.ts';
import { eq, inArray } from 'drizzle-orm';

async function reset() {
  try {
    await db.delete(appConfig).where(
      inArray(appConfig.key, ['taglineEn', 'taglineFr', 'logoUrl'])
    );
    console.log('✓ Branding reset to defaults');
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

reset();
