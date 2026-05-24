#!/usr/bin/env node
import fs from 'fs';
import { getDb } from '../server/db.ts';

const db = await getDb();

// Read all SQL batch files
const batchFiles = fs.readdirSync('/tmp')
  .filter(f => f.startsWith('insert-jlpt-batch-'))
  .sort();

console.log(`Found ${batchFiles.length} batch files`);

let totalInserted = 0;

for (const file of batchFiles) {
  const filePath = `/tmp/${file}`;
  const sql = fs.readFileSync(filePath, 'utf-8');
  const statements = sql.split('\n').filter(s => s.trim());
  
  console.log(`Processing ${file}: ${statements.length} statements`);
  
  for (const statement of statements) {
    try {
      await db.execute(statement);
      totalInserted++;
    } catch (err) {
      console.error(`Error in ${file}:`, err.message);
      break;
    }
  }
}

console.log(`✅ Inserted ${totalInserted} Japanese words`);
process.exit(0);
