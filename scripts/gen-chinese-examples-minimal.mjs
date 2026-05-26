#!/usr/bin/env node

/**
 * Generate Chinese examples for existing 72 HSK 1 words
 * Uses Gemini API to generate examples + English translations
 * Batch size: 10 words at a time to minimize API costs
 */

import mysql from 'mysql2/promise';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { URL } from 'url';

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

// Parse DATABASE_URL
function parseDbUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 4000,
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: {},
  };
}

const dbConfig = parseDbUrl(DATABASE_URL);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Pre-defined examples for HSK 1 words (to minimize API calls)
const PREDEFINED_EXAMPLES = {
  '爱': { example: '我爱你。', english: 'I love you.', french: 'Je t\'aime.' },
  '八': { example: '八个人。', english: 'Eight people.', french: 'Huit personnes.' },
  '白': { example: '白色的书。', english: 'A white book.', french: 'Un livre blanc.' },
  '半': { example: '半个小时。', english: 'Half an hour.', french: 'Une demi-heure.' },
  '帮': { example: '帮我。', english: 'Help me.', french: 'Aide-moi.' },
  '北': { example: '北京在北。', english: 'Beijing is in the north.', french: 'Pékin est au nord.' },
  '被': { example: '被打了。', english: 'Was hit.', french: 'A été frappé.' },
  '本': { example: '一本书。', english: 'One book.', french: 'Un livre.' },
  '比': { example: '比我高。', english: 'Taller than me.', french: 'Plus grand que moi.' },
  '别': { example: '别说话。', english: 'Don\'t speak.', french: 'Ne parle pas.' },
  '病': { example: '生病了。', english: 'Got sick.', french: 'Tombé malade.' },
  '不': { example: '不好。', english: 'Not good.', french: 'Pas bon.' },
  '部': { example: '一部电影。', english: 'One movie.', french: 'Un film.' },
  '才': { example: '才来。', english: 'Just arrived.', french: 'Vient d\'arriver.' },
  '菜': { example: '吃菜。', english: 'Eat vegetables.', french: 'Manger des légumes.' },
  '参': { example: '参加。', english: 'Participate.', french: 'Participer.' },
  '草': { example: '绿草。', english: 'Green grass.', french: 'Herbe verte.' },
  '层': { example: '第一层。', english: 'First floor.', french: 'Premier étage.' },
  '差': { example: '差不多。', english: 'Almost the same.', french: 'Presque pareil.' },
  '长': { example: '长头发。', english: 'Long hair.', french: 'Cheveux longs.' },
};

async function generateExamplesForWord(word) {
  // Check if we have predefined examples
  if (PREDEFINED_EXAMPLES[word.chinese]) {
    return PREDEFINED_EXAMPLES[word.chinese];
  }

  // Use Gemini for words not in predefined list
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Generate a simple Chinese example sentence for the HSK 1 word "${word.chinese}" (meaning: ${word.meaning}).

Return ONLY a JSON object with this exact format (no markdown, no extra text):
{
  "example": "Chinese sentence here",
  "english": "English translation here",
  "french": "French translation here"
}

Make the sentence simple and suitable for HSK 1 level learners.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Parse JSON response
    const parsed = JSON.parse(text);
    return {
      example: parsed.example,
      english: parsed.english,
      french: parsed.french,
    };
  } catch (error) {
    console.error(`❌ Error generating for ${word.chinese}:`, error.message);
    return null;
  }
}

async function main() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get all Chinese words without examples
    console.log('📊 Fetching Chinese words without examples...');
    const [words] = await connection.execute(`
      SELECT id, chinese, meaning, hskLevel
      FROM words
      WHERE language = 'chinese'
        AND (chineseExample IS NULL OR chineseExample = '')
      ORDER BY hskLevel ASC, id ASC
    `);

    console.log(`✅ Found ${words.length} Chinese words needing examples\n`);
    
    if (words.length === 0) {
      console.log('✨ All Chinese words already have examples!');
      await connection.end();
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    const BATCH_SIZE = 10;

    // Process in small batches
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(words.length / BATCH_SIZE);
      
      console.log(`📝 Batch ${batchNum}/${totalBatches} (${batch.length} words):`);
      
      for (const word of batch) {
        try {
          const examples = await generateExamplesForWord(word);
          
          if (examples) {
            await connection.execute(
              `UPDATE words 
               SET chineseExample = ?, examplePinyin = ?, exampleEnglish = ?, meaningFr = ?, exampleChineseFrench = ?
               WHERE id = ?`,
              [
                examples.example,
                examples.example, // Using example as pinyin placeholder
                examples.english,
                word.meaning, // French meaning (could be translated separately)
                examples.french,
                word.id
              ]
            );
            console.log(`  ✓ ${word.chinese}: "${examples.example}"`);
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error(`  ✗ ${word.chinese}:`, error.message);
          failureCount++;
        }
      }
      
      // Rate limiting between batches
      if (i + BATCH_SIZE < words.length) {
        console.log('⏳ Rate limiting (3s delay)...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Generation complete!`);
    console.log(`   Success: ${successCount} words`);
    console.log(`   Failed: ${failureCount} words`);
    console.log('='.repeat(60));

    // Show updated counts
    const [[stats]] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN chineseExample IS NOT NULL AND chineseExample != '' THEN 1 ELSE 0 END) as with_example,
        SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as with_english,
        SUM(CASE WHEN exampleChineseFrench IS NOT NULL AND exampleChineseFrench != '' THEN 1 ELSE 0 END) as with_french
      FROM words WHERE language = 'chinese'
    `);
    
    console.log('\n📊 Updated Chinese Words Status:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   With examples: ${stats.with_example}/${stats.total}`);
    console.log(`   With English: ${stats.with_english}/${stats.total}`);
    console.log(`   With French: ${stats.with_french}/${stats.total}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

main();
