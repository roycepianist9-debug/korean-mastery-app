#!/usr/bin/env node

/**
 * Extract unique Korean words from example sentences and add missing ones to the database
 * Usage: node scripts/extract-and-add-example-words.mjs
 */

import mysql from 'mysql2/promise';

const KOREAN_PARTICLES = [
  '은', '는', '이', '가', '을', '를', '에', '에서', '에게', '에게서',
  '으로', '로', '와', '과', '의', '도', '만', '까지', '부터', '마다',
  '처럼', '같이', '보다', '한테', '한테서', '께', '께서', '이나', '나',
  '이란', '란', '이라', '라', '이며', '며', '이고', '고', '이요', '요',
];

function stripParticles(word) {
  const candidates = [word];
  for (const p of KOREAN_PARTICLES.sort((a, b) => b.length - a.length)) {
    if (word.endsWith(p) && word.length > p.length) {
      candidates.push(word.slice(0, -p.length));
    }
  }
  return Array.from(new Set(candidates));
}

function tokenizeKorean(sentence) {
  if (!sentence) return [];
  const segmenter = new Intl.Segmenter('ko', { granularity: 'word' });
  const segments = Array.from(segmenter.segment(sentence));
  return segments
    .filter(s => s.isWordLike)
    .map(s => s.segment);
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'korean_mastery',
  });

  try {
    console.log('📚 Extracting words from Korean examples...');

    // Get all Korean example sentences
    const [examples] = await connection.query(
      'SELECT DISTINCT koreanExample FROM words WHERE koreanExample IS NOT NULL AND koreanExample != ""'
    );

    console.log(`Found ${examples.length} unique example sentences`);

    // Extract all words from examples
    const allWords = new Set();
    const wordForms = new Map(); // Maps base word to all forms found

    for (const row of examples) {
      const sentence = row.koreanExample;
      const tokens = tokenizeKorean(sentence);

      for (const token of tokens) {
        // Get all candidate forms (with and without particles)
        const candidates = stripParticles(token);
        for (const candidate of candidates) {
          allWords.add(candidate);
          if (!wordForms.has(candidate)) {
            wordForms.set(candidate, []);
          }
          if (!wordForms.get(candidate).includes(token)) {
            wordForms.get(candidate).push(token);
          }
        }
      }
    }

    console.log(`Extracted ${allWords.size} unique words`);

    // Check which words are already in the database
    const existingWords = new Set();
    const [dbWords] = await connection.query(
      'SELECT korean FROM words WHERE korean IS NOT NULL'
    );

    for (const row of dbWords) {
      existingWords.add(row.korean);
    }

    console.log(`Database has ${existingWords.size} words`);

    // Find missing words
    const missingWords = Array.from(allWords).filter(w => !existingWords.has(w));
    console.log(`\n🔍 Found ${missingWords.length} missing words`);

    if (missingWords.length === 0) {
      console.log('✅ All words from examples are already in the database!');
      return;
    }

    // Show sample of missing words
    console.log('\nSample of missing words:');
    missingWords.slice(0, 20).forEach(w => {
      const forms = wordForms.get(w);
      console.log(`  - ${w} (found as: ${forms.join(', ')})`);
    });

    console.log(`\n💡 To add these words, you would need to:
1. Translate each word to English and French
2. Insert them into the words table with language='korean'
3. Re-run the tokenization to make them clickable

Consider using the batch translation system to populate meanings.`);

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
