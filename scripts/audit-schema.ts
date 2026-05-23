import { getDb } from '../server/db.ts';

async function auditSchema() {
  const db = await getDb();
  if (!db) {
    console.log('❌ No DB');
    return;
  }

  try {
    const [columns] = await db.execute('DESCRIBE words');
    
    console.log('\n📊 LIVE DATABASE SCHEMA - words table\n');
    console.log('Column Name | Type | Null | Key | Default | Extra');
    console.log('─'.repeat(120));
    
    for (const col of columns as any[]) {
      console.log(`${(col.Field as string).padEnd(25)} | ${(col.Type as string).padEnd(30)} | ${col.Null} | ${col.Key} | ${(col.Default || 'NULL').toString().padEnd(15)} | ${col.Extra}`);
    }
    
    console.log('\n✅ Translation-related columns found:');
    for (const col of columns as any[]) {
      if ((col.Field as string).includes('example') || (col.Field as string).includes('meaning')) {
        console.log(`  • ${col.Field}: ${col.Type}`);
      }
    }
  } catch (error) {
    console.error('❌ Error querying schema:', error);
  }
}

auditSchema().catch(console.error);
