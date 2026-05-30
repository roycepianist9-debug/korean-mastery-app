#!/usr/bin/env node
import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Parse DB URL
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    user: u.username,
    password: u.password,
    database: u.pathname.split('/')[1],
    ssl: { rejectUnauthorized: true }
  };
}

async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`API Error: ${result.error.message}`);
  }

  return result.choices[0].message.content;
}

// Extract JSON from response (handles markdown code blocks)
function extractJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try extracting from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e2) {
        throw new Error(`Failed to parse JSON from markdown: ${e2.message}`);
      }
    }
    throw e;
  }
}

async function main() {
  const connection = await mysql.createConnection(parseDbUrl(DATABASE_URL));
  
  // Load missing words
  const missingWords = JSON.parse(fs.readFileSync('/tmp/missing_chinese_words.json', 'utf8'));
  console.log(`\n🚀 Importing ${missingWords.length} missing Chinese words...\n`);

  // Process in batches
  const batchSize = 50;
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < missingWords.length; i += batchSize) {
    const batch = missingWords.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(missingWords.length / batchSize);
    
    try {
      // Generate meanings for batch
      const meaningPrompt = `Generate English meanings for these Chinese words. Return a JSON array with objects {word, meaning}:
${batch.map((w, idx) => `${idx + 1}. ${w}`).join('\n')}

Return ONLY the JSON array, no markdown, no explanation.`;

      console.log(`[${batchNum}/${totalBatches}] Generating meanings...`);
      const meaningResponse = await callOpenRouter(meaningPrompt);
      const meanings = extractJSON(meaningResponse);

      // Generate French translations
      const frenchPrompt = `Translate these English meanings to French. Return a JSON array with objects {meaning, french}:
${meanings.map((m, idx) => `${idx + 1}. ${m.meaning}`).join('\n')}

Return ONLY the JSON array, no markdown, no explanation.`;

      console.log(`[${batchNum}/${totalBatches}] Generating French translations...`);
      const frenchResponse = await callOpenRouter(frenchPrompt);
      const frenchTranslations = extractJSON(frenchResponse);

      // Generate examples
      const examplePrompt = `Generate ONE simple Chinese example sentence for each word. Return a JSON array with objects {word, example}:
${batch.map((w, idx) => `${idx + 1}. ${w}`).join('\n')}

Return ONLY the JSON array, no markdown, no explanation.`;

      console.log(`[${batchNum}/${totalBatches}] Generating examples...`);
      const exampleResponse = await callOpenRouter(examplePrompt);
      const examples = extractJSON(exampleResponse);

      // Insert into DB
      let batchProcessed = 0;
      for (let j = 0; j < batch.length; j++) {
        const word = batch[j];
        const meaning = meanings[j]?.meaning || '';
        const french = frenchTranslations[j]?.french || '';
        const example = examples[j]?.example || '';

        try {
          await connection.query(
            `INSERT INTO words (chinese, meaning, meaningFr, chineseExample, is95Percent, language) 
             VALUES (?, ?, ?, ?, 1, 'chinese')`,
            [word, meaning, french, example]
          );
          processed++;
          batchProcessed++;
        } catch (e) {
          if (!e.message.includes('Duplicate entry')) {
            console.error(`  ✗ Failed to insert ${word}: ${e.message}`);
          }
          errors++;
        }
      }

      console.log(`[${batchNum}/${totalBatches}] ✓ ${batchProcessed}/${batch.length} inserted (total: ${processed})\n`);

    } catch (e) {
      console.error(`[${batchNum}/${totalBatches}] ⚠ Batch error: ${e.message}`);
      errors += batch.length;
    }

    // Rate limit: 2 seconds between batches
    if (i + batchSize < missingWords.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n✓ Import complete: ${processed}/${missingWords.length} words added`);
  if (errors > 0) console.log(`⚠ ${errors} errors encountered`);
  
  await connection.end();
}

main().catch(console.error);
