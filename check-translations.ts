import { getDb } from './server/db';

async function checkTranslations() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // Check Korean example translations
  const koreanWithTranslations = await db.execute(`
    SELECT COUNT(*) as count FROM words 
    WHERE language = 'korean' 
      AND koreanExample IS NOT NULL 
      AND exampleFrench IS NOT NULL 
      AND exampleFrench != ''
  `) as any;

  // Check Chinese example translations
  const chineseWithTranslations = await db.execute(`
    SELECT COUNT(*) as count FROM words 
    WHERE language = 'chinese' 
      AND chineseExample IS NOT NULL 
      AND exampleChineseFrench IS NOT NULL 
      AND exampleChineseFrench != ''
  `) as any;

  console.log('Korean example sentences translated:', koreanWithTranslations?.[0]?.count || 0);
  console.log('Chinese example sentences translated:', chineseWithTranslations?.[0]?.count || 0);
}

checkTranslations();
