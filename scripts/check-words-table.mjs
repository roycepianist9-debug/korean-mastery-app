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

async function checkWordsTable() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    // Check if words table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'words'",
      [config.database]
    );
    
    if (tables.length === 0) {
      console.log('❌ words table does NOT exist');
      return;
    }
    
    console.log('✅ words table EXISTS\n');
    
    // Get word count by language
    const [counts] = await connection.execute(`
      SELECT 
        language,
        COUNT(*) as count
      FROM words
      GROUP BY language
      ORDER BY language
    `);
    
    console.log('📊 Word count by language:');
    let totalWords = 0;
    for (const row of counts) {
      console.log(`   ${row.language}: ${row.count}`);
      totalWords += row.count;
    }
    console.log(`\n   TOTAL: ${totalWords} words\n`);
    
    // Show sample words
    if (totalWords > 0) {
      console.log('📝 Sample words:');
      const [samples] = await connection.execute('SELECT id, korean, chinese, japanese, english, language FROM words LIMIT 5');
      for (const word of samples) {
        console.log(`   ID ${word.id}: ${word.korean || '-'} | ${word.chinese || '-'} | ${word.japanese || '-'} | ${word.english || '-'} (${word.language})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkWordsTable();
