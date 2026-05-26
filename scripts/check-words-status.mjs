#!/usr/bin/env node
import mysql from 'mysql2/promise';
import { URL } from 'url';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')) : true,
};

async function checkStatus() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    // Get total count
    const [[{ count }]] = await connection.execute('SELECT COUNT(*) as count FROM words');
    console.log(`\n📊 Total words in DB: ${count}\n`);
    
    // Get count by language
    const [langCounts] = await connection.execute(`
      SELECT language, COUNT(*) as count FROM words GROUP BY language ORDER BY language
    `);
    console.log('Words by language:');
    for (const row of langCounts) {
      console.log(`  ${row.language}: ${row.count}`);
    }
    
    // Show samples
    console.log('\n📝 Sample words:');
    const [samples] = await connection.execute(`
      SELECT id, chinese, meaning, meaningFr FROM words LIMIT 3
    `);
    for (const word of samples) {
      console.log(`  ID ${word.id}: ${word.chinese} | meaning: ${word.meaning} | meaningFr: ${word.meaningFr}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkStatus();
