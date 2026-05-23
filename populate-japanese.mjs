#!/usr/bin/env node
/**
 * Populate Japanese words with complete data (hiragana, romaji, JLPT levels, examples)
 * Usage: node populate-japanese.mjs
 */

import mysql from 'mysql2/promise';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import https from 'https';

const DB_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DB_URL || !GEMINI_API_KEY) {
  console.error('Missing DATABASE_URL or GEMINI_API_KEY environment variables');
  process.exit(1);
}

// Parse MySQL connection string
function parseDbUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  // Get SSL certificate for TiDB
  const caCert = fs.readFileSync('/etc/ssl/certs/ca-certificates.crt', 'utf8');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: { ca: caCert },
  };
}

const dbConfig = parseDbUrl(DB_URL);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Sample Japanese words with kanji, hiragana, romaji, JLPT level, and example
const JAPANESE_WORDS = [
  { kanji: '水', hiragana: 'みず', romaji: 'mizu', jlpt: 'n5', meaning: 'water', example: '私は水を飲みます。', exampleRomaji: 'Watashi wa mizu wo nomimasu.' },
  { kanji: '火', hiragana: 'ひ', romaji: 'hi', jlpt: 'n5', meaning: 'fire', example: '火をつけてください。', exampleRomaji: 'Hi wo tsukete kudasai.' },
  { kanji: '木', hiragana: 'き', romaji: 'ki', jlpt: 'n5', meaning: 'tree', example: '大きな木があります。', exampleRomaji: 'Ookina ki ga arimasu.' },
  { kanji: '金', hiragana: 'きん', romaji: 'kin', jlpt: 'n5', meaning: 'gold', example: '金色の指輪です。', exampleRomaji: 'Kiniro no yubiwa desu.' },
  { kanji: '土', hiragana: 'つち', romaji: 'tsuchi', jlpt: 'n5', meaning: 'earth', example: '土の中に種があります。', exampleRomaji: 'Tsuchi no naka ni tane ga arimasu.' },
  { kanji: '日', hiragana: 'ひ', romaji: 'hi', jlpt: 'n5', meaning: 'day/sun', example: '毎日勉強します。', exampleRomaji: 'Mainichi benkyou shimasu.' },
  { kanji: '月', hiragana: 'つき', romaji: 'tsuki', jlpt: 'n5', meaning: 'moon', example: '月がきれいです。', exampleRomaji: 'Tsuki ga kirei desu.' },
  { kanji: '山', hiragana: 'やま', romaji: 'yama', jlpt: 'n5', meaning: 'mountain', example: '山に登ります。', exampleRomaji: 'Yama ni noborimasu.' },
  { kanji: '川', hiragana: 'かわ', romaji: 'kawa', jlpt: 'n5', meaning: 'river', example: '川で泳ぎます。', exampleRomaji: 'Kawa de oyogimasu.' },
  { kanji: '人', hiragana: 'ひと', romaji: 'hito', jlpt: 'n5', meaning: 'person', example: '人が多いです。', exampleRomaji: 'Hito ga ooi desu.' },
  { kanji: '手', hiragana: 'て', romaji: 'te', jlpt: 'n5', meaning: 'hand', example: '手を洗ってください。', exampleRomaji: 'Te wo aratte kudasai.' },
  { kanji: '足', hiragana: 'あし', romaji: 'ashi', jlpt: 'n5', meaning: 'foot/leg', example: '足が痛いです。', exampleRomaji: 'Ashi ga itai desu.' },
  { kanji: '目', hiragana: 'め', romaji: 'me', jlpt: 'n5', meaning: 'eye', example: '目が疲れました。', exampleRomaji: 'Me ga tsukaremashita.' },
  { kanji: '口', hiragana: 'くち', romaji: 'kuchi', jlpt: 'n5', meaning: 'mouth', example: '口を開けてください。', exampleRomaji: 'Kuchi wo akete kudasai.' },
  { kanji: '耳', hiragana: 'みみ', romaji: 'mimi', jlpt: 'n5', meaning: 'ear', example: '耳が聞こえません。', exampleRomaji: 'Mimi ga kikoemasen.' },
  { kanji: '頭', hiragana: 'あたま', romaji: 'atama', jlpt: 'n5', meaning: 'head', example: '頭が痛いです。', exampleRomaji: 'Atama ga itai desu.' },
  { kanji: '心', hiragana: 'こころ', romaji: 'kokoro', jlpt: 'n4', meaning: 'heart/mind', example: '心から感謝します。', exampleRomaji: 'Kokoro kara kansha shimasu.' },
  { kanji: '食', hiragana: 'しょく', romaji: 'shoku', jlpt: 'n4', meaning: 'food', example: '食べ物が好きです。', exampleRomaji: 'Tabemono ga suki desu.' },
  { kanji: '飲', hiragana: 'のむ', romaji: 'nomu', jlpt: 'n4', meaning: 'drink', example: 'コーヒーを飲みます。', exampleRomaji: 'Koohii wo nomimasu.' },
  { kanji: '走', hiragana: 'はしる', romaji: 'hashiru', jlpt: 'n4', meaning: 'run', example: '毎朝走ります。', exampleRomaji: 'Maiasa hashirimasu.' },
];

async function generateJapaneseFrench(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`Translate this Japanese text to French (brief, one word or short phrase): "${text}"`);
    return result.response.text().trim();
  } catch (error) {
    console.error(`Translation error for "${text}":`, error.message);
    return text; // Fallback to original
  }
}

async function main() {
  let connection;
  try {
    // Use drizzle ORM connection instead for better TiDB support
    connection = await mysql.createConnection({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });
    console.log('✓ Connected to database');

    // Get existing Japanese words
    const [existingWords] = await connection.query(
      'SELECT id, japanese FROM words WHERE language = "japanese" LIMIT 50'
    );
    console.log(`Found ${existingWords.length} existing Japanese words`);

    // Map kanji to existing word IDs
    const kanjiToId = {};
    existingWords.forEach(row => {
      kanjiToId[row.japanese] = row.id;
    });

    // Populate data for each word
    let updated = 0;
    for (const wordData of JAPANESE_WORDS) {
      const wordId = kanjiToId[wordData.kanji];
      if (!wordId) {
        console.log(`⚠ Skipping ${wordData.kanji} - not found in database`);
        continue;
      }

      // Generate French translations
      const meaningFr = await generateJapaneseFrench(wordData.meaning);
      const exampleFr = await generateJapaneseFrench(wordData.example);

      // Update word
      await connection.query(
        `UPDATE words SET 
          hiragana = ?, 
          romaji = ?, 
          jlptLevel = ?, 
          japaneseExample = ?, 
          exampleRomaji = ?, 
          meaningFr = ?, 
          exampleJapaneseFrench = ?
        WHERE id = ?`,
        [
          wordData.hiragana,
          wordData.romaji,
          wordData.jlpt,
          wordData.example,
          wordData.exampleRomaji,
          meaningFr,
          exampleFr,
          wordId,
        ]
      );

      updated++;
      console.log(`✓ Updated ${wordData.kanji} (${wordData.meaning}) - ${wordData.romaji}`);

      // Rate limit: 1 second between LLM calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✓ Successfully updated ${updated} Japanese words`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
