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

async function checkExamples() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    console.log('\n📊 Example Sentence Coverage Report\n');
    
    // Korean examples
    const [[koreanStats]] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN koreanExample IS NOT NULL AND koreanExample != '' THEN 1 ELSE 0 END) as with_example,
        SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as with_english
      FROM words WHERE language = 'korean'
    `);
    console.log('🇰🇷 Korean Words:');
    console.log(`   Total: ${koreanStats.total}`);
    console.log(`   With koreanExample: ${koreanStats.with_example} (${Math.round(koreanStats.with_example/koreanStats.total*100)}%)`);
    console.log(`   With exampleEnglish: ${koreanStats.with_english} (${Math.round(koreanStats.with_english/koreanStats.total*100)}%)`);
    
    // Chinese examples
    const [[chineseStats]] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN chineseExample IS NOT NULL AND chineseExample != '' THEN 1 ELSE 0 END) as with_example,
        SUM(CASE WHEN examplePinyin IS NOT NULL AND examplePinyin != '' THEN 1 ELSE 0 END) as with_pinyin,
        SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as with_english,
        SUM(CASE WHEN meaningFr IS NOT NULL AND meaningFr != '' THEN 1 ELSE 0 END) as with_fr
      FROM words WHERE language = 'chinese'
    `);
    console.log('\n🇨🇳 Chinese Words:');
    console.log(`   Total: ${chineseStats.total}`);
    console.log(`   With chineseExample: ${chineseStats.with_example} (${Math.round(chineseStats.with_example/chineseStats.total*100)}%)`);
    console.log(`   With examplePinyin: ${chineseStats.with_pinyin} (${Math.round(chineseStats.with_pinyin/chineseStats.total*100)}%)`);
    console.log(`   With exampleEnglish: ${chineseStats.with_english} (${Math.round(chineseStats.with_english/chineseStats.total*100)}%)`);
    console.log(`   With meaningFr: ${chineseStats.with_fr} (${Math.round(chineseStats.with_fr/chineseStats.total*100)}%)`);
    
    // Japanese examples
    const [[japaneseStats]] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN japaneseExample IS NOT NULL AND japaneseExample != '' THEN 1 ELSE 0 END) as with_example,
        SUM(CASE WHEN exampleRomaji IS NOT NULL AND exampleRomaji != '' THEN 1 ELSE 0 END) as with_romaji,
        SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as with_english
      FROM words WHERE language = 'japanese'
    `);
    console.log('\n🇯🇵 Japanese Words:');
    console.log(`   Total: ${japaneseStats.total}`);
    console.log(`   With japaneseExample: ${japaneseStats.with_example} (${Math.round(japaneseStats.with_example/japaneseStats.total*100)}%)`);
    console.log(`   With exampleRomaji: ${japaneseStats.with_romaji} (${Math.round(japaneseStats.with_romaji/japaneseStats.total*100)}%)`);
    console.log(`   With exampleEnglish: ${japaneseStats.with_english} (${Math.round(japaneseStats.with_english/japaneseStats.total*100)}%)`);
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkExamples();
