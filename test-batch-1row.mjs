import { getDb } from './server/db.ts';

const db = await getDb();
if (!db) {
  console.error('Database not available');
  process.exit(1);
}

// Test: Get 1 Korean word needing translation
const result = await db.execute(`
  SELECT id, korean, koreanExample, exampleFrench, topikLevel
  FROM words
  WHERE language = 'korean' 
    AND koreanExample IS NOT NULL 
    AND koreanExample != '' 
    AND (exampleFrench IS NULL OR exampleFrench = '')
  LIMIT 1
`) as any;

if (result.length === 0) {
  console.log('No Korean words found needing translation');
  process.exit(0);
}

const word = result[0];
console.log('✓ Found test word:');
console.log(`  ID: ${word.id}`);
console.log(`  Korean: ${word.korean}`);
console.log(`  Example: ${word.koreanExample}`);
console.log(`  Current French: ${word.exampleFrench || 'NULL'}`);
console.log(`  Level: ${word.topikLevel}`);

// Test: Write a test translation
const testTranslation = 'TEST FRENCH TRANSLATION - ' + new Date().toISOString();
const escapedTranslation = testTranslation.replace(/'/g, "\\'");

console.log(`\nAttempting to write test translation...`);
console.log(`  Escaped value: ${escapedTranslation}`);

try {
  await db.execute(`
    UPDATE words 
    SET exampleFrench = '${escapedTranslation}'  
    WHERE id = ${word.id}
  `) as any;
  console.log('✓ Write successful!');
  
  // Verify write
  const verify = await db.execute(`
    SELECT exampleFrench FROM words WHERE id = ${word.id}
  `) as any;
  
  console.log(`\n✓ Verification - exampleFrench now contains:`);
  console.log(`  ${verify[0].exampleFrench}`);
} catch (error) {
  console.error('✗ Write failed:', error.message);
  process.exit(1);
}

console.log('\n✓ 1-row test PASSED');
