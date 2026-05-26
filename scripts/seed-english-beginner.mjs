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

// First 100 English beginner words
const ENGLISH_BEGINNER = [
  { word: 'hello', meaning: 'greeting', pos: 'interjection' },
  { word: 'goodbye', meaning: 'farewell', pos: 'interjection' },
  { word: 'please', meaning: 'polite request', pos: 'adverb' },
  { word: 'thank', meaning: 'express gratitude', pos: 'verb' },
  { word: 'yes', meaning: 'affirmative', pos: 'adverb' },
  { word: 'no', meaning: 'negative', pos: 'adverb' },
  { word: 'sorry', meaning: 'apology', pos: 'adjective' },
  { word: 'excuse', meaning: 'pardon', pos: 'verb' },
  { word: 'water', meaning: 'liquid', pos: 'noun' },
  { word: 'food', meaning: 'nourishment', pos: 'noun' },
  { word: 'bread', meaning: 'baked good', pos: 'noun' },
  { word: 'milk', meaning: 'dairy product', pos: 'noun' },
  { word: 'apple', meaning: 'fruit', pos: 'noun' },
  { word: 'banana', meaning: 'yellow fruit', pos: 'noun' },
  { word: 'orange', meaning: 'citrus fruit', pos: 'noun' },
  { word: 'coffee', meaning: 'beverage', pos: 'noun' },
  { word: 'tea', meaning: 'hot drink', pos: 'noun' },
  { word: 'house', meaning: 'dwelling', pos: 'noun' },
  { word: 'door', meaning: 'entrance', pos: 'noun' },
  { word: 'window', meaning: 'opening', pos: 'noun' },
  { word: 'table', meaning: 'furniture', pos: 'noun' },
  { word: 'chair', meaning: 'seat', pos: 'noun' },
  { word: 'bed', meaning: 'sleeping furniture', pos: 'noun' },
  { word: 'book', meaning: 'written work', pos: 'noun' },
  { word: 'pen', meaning: 'writing tool', pos: 'noun' },
  { word: 'paper', meaning: 'writing material', pos: 'noun' },
  { word: 'car', meaning: 'vehicle', pos: 'noun' },
  { word: 'bus', meaning: 'public transport', pos: 'noun' },
  { word: 'train', meaning: 'railway vehicle', pos: 'noun' },
  { word: 'airplane', meaning: 'aircraft', pos: 'noun' },
  { word: 'tree', meaning: 'plant', pos: 'noun' },
  { word: 'flower', meaning: 'bloom', pos: 'noun' },
  { word: 'sun', meaning: 'star', pos: 'noun' },
  { word: 'moon', meaning: 'satellite', pos: 'noun' },
  { word: 'star', meaning: 'celestial body', pos: 'noun' },
  { word: 'sky', meaning: 'atmosphere', pos: 'noun' },
  { word: 'cloud', meaning: 'water vapor', pos: 'noun' },
  { word: 'rain', meaning: 'precipitation', pos: 'noun' },
  { word: 'snow', meaning: 'frozen water', pos: 'noun' },
  { word: 'wind', meaning: 'air movement', pos: 'noun' },
  { word: 'fire', meaning: 'flame', pos: 'noun' },
  { word: 'ice', meaning: 'frozen water', pos: 'noun' },
  { word: 'rock', meaning: 'stone', pos: 'noun' },
  { word: 'sand', meaning: 'granules', pos: 'noun' },
  { word: 'sea', meaning: 'ocean', pos: 'noun' },
  { word: 'river', meaning: 'waterway', pos: 'noun' },
  { word: 'mountain', meaning: 'peak', pos: 'noun' },
  { word: 'valley', meaning: 'depression', pos: 'noun' },
  { word: 'forest', meaning: 'woodland', pos: 'noun' },
  { word: 'beach', meaning: 'shore', pos: 'noun' },
  { word: 'person', meaning: 'human', pos: 'noun' },
  { word: 'man', meaning: 'male adult', pos: 'noun' },
  { word: 'woman', meaning: 'female adult', pos: 'noun' },
  { word: 'child', meaning: 'young person', pos: 'noun' },
  { word: 'boy', meaning: 'young male', pos: 'noun' },
  { word: 'girl', meaning: 'young female', pos: 'noun' },
  { word: 'baby', meaning: 'infant', pos: 'noun' },
  { word: 'mother', meaning: 'female parent', pos: 'noun' },
  { word: 'father', meaning: 'male parent', pos: 'noun' },
  { word: 'sister', meaning: 'female sibling', pos: 'noun' },
  { word: 'brother', meaning: 'male sibling', pos: 'noun' },
  { word: 'friend', meaning: 'companion', pos: 'noun' },
  { word: 'teacher', meaning: 'educator', pos: 'noun' },
  { word: 'doctor', meaning: 'physician', pos: 'noun' },
  { word: 'nurse', meaning: 'caregiver', pos: 'noun' },
  { word: 'police', meaning: 'law enforcement', pos: 'noun' },
  { word: 'soldier', meaning: 'military person', pos: 'noun' },
  { word: 'farmer', meaning: 'agricultural worker', pos: 'noun' },
  { word: 'cook', meaning: 'chef', pos: 'noun' },
  { word: 'dog', meaning: 'canine', pos: 'noun' },
  { word: 'cat', meaning: 'feline', pos: 'noun' },
  { word: 'bird', meaning: 'avian', pos: 'noun' },
  { word: 'fish', meaning: 'aquatic animal', pos: 'noun' },
  { word: 'horse', meaning: 'equine', pos: 'noun' },
  { word: 'cow', meaning: 'bovine', pos: 'noun' },
  { word: 'pig', meaning: 'porcine', pos: 'noun' },
  { word: 'chicken', meaning: 'poultry', pos: 'noun' },
  { word: 'sheep', meaning: 'woolly animal', pos: 'noun' },
  { word: 'bear', meaning: 'ursine', pos: 'noun' },
  { word: 'lion', meaning: 'feline predator', pos: 'noun' },
  { word: 'elephant', meaning: 'large mammal', pos: 'noun' },
  { word: 'monkey', meaning: 'primate', pos: 'noun' },
  { word: 'snake', meaning: 'reptile', pos: 'noun' },
  { word: 'red', meaning: 'color', pos: 'adjective' },
  { word: 'blue', meaning: 'color', pos: 'adjective' },
  { word: 'green', meaning: 'color', pos: 'adjective' },
  { word: 'yellow', meaning: 'color', pos: 'adjective' },
  { word: 'black', meaning: 'color', pos: 'adjective' },
  { word: 'white', meaning: 'color', pos: 'adjective' },
  { word: 'big', meaning: 'large', pos: 'adjective' },
  { word: 'small', meaning: 'tiny', pos: 'adjective' },
  { word: 'hot', meaning: 'high temperature', pos: 'adjective' },
  { word: 'cold', meaning: 'low temperature', pos: 'adjective' },
  { word: 'good', meaning: 'positive', pos: 'adjective' },
  { word: 'bad', meaning: 'negative', pos: 'adjective' },
  { word: 'happy', meaning: 'joyful', pos: 'adjective' },
  { word: 'sad', meaning: 'sorrowful', pos: 'adjective' },
  { word: 'fast', meaning: 'quick', pos: 'adjective' },
  { word: 'slow', meaning: 'leisurely', pos: 'adjective' },
  { word: 'new', meaning: 'recent', pos: 'adjective' },
  { word: 'old', meaning: 'ancient', pos: 'adjective' },
  { word: 'easy', meaning: 'simple', pos: 'adjective' },
  { word: 'hard', meaning: 'difficult', pos: 'adjective' },
];

async function seedEnglish() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    console.log(`🌱 Seeding ${ENGLISH_BEGINNER.length} English beginner words...`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const word of ENGLISH_BEGINNER) {
      try {
        // Check if word already exists
        const [existing] = await connection.execute(
          'SELECT id FROM words WHERE meaning = ? AND language = ? AND pos = ?',
          [word.meaning, 'english', word.pos]
        );
        
        if (existing.length > 0) {
          skipped++;
          continue;
        }
        
        // Insert new word - English words use different schema
        await connection.execute(
          'INSERT INTO words (meaning, language, pos, romanization, chineseTerm) VALUES (?, ?, ?, ?, ?)',
          [word.meaning, 'english', word.pos, word.word, word.word]
        );
        inserted++;
        
        if (inserted % 20 === 0) {
          console.log(`   ✓ Inserted ${inserted} words...`);
        }
      } catch (err) {
        console.error(`❌ Error with word ${word.word}:`, err.message);
      }
    }
    
    console.log(`\n✅ Seeding complete!`);
    console.log(`   ✓ Inserted: ${inserted} words`);
    console.log(`   ⊘ Skipped (already exist): ${skipped} words`);
    
    // Show new total
    const [[{ total }]] = await connection.execute('SELECT COUNT(*) as total FROM words');
    const [[{ english }]] = await connection.execute('SELECT COUNT(*) as english FROM words WHERE language = "english"');
    console.log(`   📊 Total words now: ${total}`);
    console.log(`   📊 Total English words: ${english}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedEnglish();
