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

async function showSamples() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    // Total count
    const [[{ total }]] = await connection.execute('SELECT COUNT(*) as total FROM words');
    console.log(`\n📊 Total words in DB: ${total}`);
    
    // Count by language
    const [langCounts] = await connection.execute(`
      SELECT language, COUNT(*) as count FROM words GROUP BY language ORDER BY language
    `);
    console.log('\nWords by language:');
    for (const row of langCounts) {
      console.log(`  ${row.language}: ${row.count}`);
    }
    
    // Show Korean samples
    console.log('\n📝 Korean word samples:');
    const [koreanSamples] = await connection.execute(`
      SELECT id, korean, romanization, meaning FROM words WHERE language = 'korean' LIMIT 5
    `);
    for (const word of koreanSamples) {
      console.log(`  ID ${word.id}: ${word.korean} (${word.romanization}) = ${word.meaning}`);
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

showSamples();
