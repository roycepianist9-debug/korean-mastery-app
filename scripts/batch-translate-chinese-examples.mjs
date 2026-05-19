#!/usr/bin/env node

/**
 * Batch script to translate Chinese example sentences to French
 * Runs one-time to populate exampleChineseFrench column
 * Usage: node scripts/batch-translate-chinese-examples.mjs
 */

import mysql from 'mysql2/promise';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

// Parse MySQL connection string
function parseConnectionString(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: {},
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  };
}

const config = parseConnectionString(DATABASE_URL);
const client = new GoogleGenerativeAI(GEMINI_API_KEY);

// Create connection pool with SSL
const pool = mysql.createPool(config);

async function translateSentence(sentence, context) {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Translate this Chinese example sentence to French. Return ONLY the French translation, nothing else.

Context: This is a vocabulary learning example for the word "${context}".
Chinese sentence: ${sentence}

Respond with only the French translation:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } catch (error) {
    console.error(`❌ Translation error for "${sentence}":`, error.message);
    return null;
  }
}

async function main() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await pool.getConnection();
    
    // Get all Chinese words with examples that need translation
    console.log('📊 Fetching Chinese words with examples...');
    const [words] = await connection.query(`
      SELECT id, chinese, chineseExample, hskLevel
      FROM words
      WHERE language = 'chinese'
        AND chineseExample IS NOT NULL
        AND chineseExample != ''
        AND (exampleChineseFrench IS NULL OR exampleChineseFrench = '')
      ORDER BY hskLevel ASC, id ASC
      LIMIT 5000
    `);

    console.log(`✅ Found ${words.length} Chinese words needing French example translations`);
    
    if (words.length === 0) {
      console.log('✨ All Chinese examples already have French translations!');
      await connection.release();
      await pool.end();
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process in batches of 10 to avoid rate limiting
    for (let i = 0; i < words.length; i += 10) {
      const batch = words.slice(i, i + 10);
      
      console.log(`\n📝 Processing batch ${Math.floor(i / 10) + 1}/${Math.ceil(words.length / 10)}...`);
      
      await Promise.all(batch.map(async (word) => {
        try {
          const frenchTranslation = await translateSentence(word.chineseExample, word.chinese);
          
          if (frenchTranslation) {
            await connection.query(
              'UPDATE words SET exampleChineseFrench = ? WHERE id = ?',
              [frenchTranslation, word.id]
            );
            console.log(`  ✓ ${word.chinese} (HSK ${word.hskLevel}): "${word.chineseExample}" → "${frenchTranslation}"`);
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error(`  ✗ Failed to process word ${word.id}:`, error.message);
          failureCount++;
        }
      }));
      
      // Rate limiting delay between batches
      if (i + 10 < words.length) {
        console.log('⏳ Rate limiting delay (2s)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Translation complete!`);
    console.log(`   Success: ${successCount} words`);
    console.log(`   Failed: ${failureCount} words`);
    console.log('='.repeat(60));

    await connection.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    if (connection) await connection.release();
    await pool.end();
    process.exit(1);
  }
}

main();
