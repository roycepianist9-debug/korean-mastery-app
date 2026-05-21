import express from 'express';
import { getDb } from './db';
import { words } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const debugSchemaRouter = express.Router();

debugSchemaRouter.get('/test-schema', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ error: 'Database not available' });
    }

    // Query ONE Chinese word
    const result = await db.select().from(words).where(eq(words.language, 'chinese')).limit(1);

    if (result.length === 0) {
      return res.json({ error: 'No Chinese words found' });
    }

    const row = result[0];
    const keys = Object.keys(row);

    res.json({
      message: 'Single Chinese word row schema',
      keys: keys,
      sampleRow: row,
    });
  } catch (error) {
    res.json({ error: (error as any).message });
  }
});
