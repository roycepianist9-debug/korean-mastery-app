import fs from 'fs';
import { invokeLLM } from '../server/_core/llm';

const HSK_79_TEXT = '/tmp/hsk79.txt';
const BATCH_SIZE = 10;
const OUTPUT_FILE = '/tmp/hsk79-complete.json';

interface Word {
  no: number;
  chinese: string;
  pinyin: string;
}

interface WordResult extends Word {
  meaning: string;
  chineseExample: string;
  exampleEnglish?: string;
}

// Parse the PDF text to extract words
function parseHSKText(): Word[] {
  const text = fs.readFileSync(HSK_79_TEXT, 'utf-8');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const words: Word[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line is a number (word entry number)
    if (/^\d+$/.test(line)) {
      const no = parseInt(line);
      const chinese = lines[i + 1];
      const pinyin = lines[i + 2];
      
      // Validate: pinyin should have tone marks or latin letters
      if (chinese && pinyin && /[ā-ǖ]|[a-z]/.test(pinyin)) {
        words.push({ no, chinese, pinyin });
        i += 3;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return words;
}

// Generate meaning + example in ONE call using JSON schema
async function generateMeaningAndExample(wordBatch: Word[]): Promise<Array<{ meaning: string; chineseExample: string }>> {
  const wordList = wordBatch.map((w, i) => `${i + 1}. ${w.chinese} (${w.pinyin})`).join('\n');
  
  const prompt = `For these Chinese HSK 7-9 words, generate:
1. A concise English meaning (one short phrase)
2. One natural Chinese example sentence using the word

${wordList}

Return a JSON array with objects containing "meaning" and "chineseExample" fields.`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are a Chinese-English translator and language expert. Generate accurate, natural content.' },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'word_data',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            words: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  meaning: { type: 'string' },
                  chineseExample: { type: 'string' }
                },
                required: ['meaning', 'chineseExample'],
                additionalProperties: false
              }
            }
          },
          required: ['words'],
          additionalProperties: false
        }
      }
    }
  });

  try {
    const content = response.choices[0].message.content;
    const parsed = JSON.parse(typeof content === 'string' ? content : '{}');
    return parsed.words || [];
  } catch (e) {
    console.error('Failed to parse JSON response:', (e as Error).message);
    return wordBatch.map(w => ({ meaning: '', chineseExample: '' }));
  }
}

// Batch translate examples to English
async function translateExamples(examples: string[]): Promise<string[]> {
  if (examples.length === 0) return [];
  
  const prompt = `Translate these Chinese sentences to English (one translation per line, no numbering):
${examples.join('\n')}`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are a Chinese-English translator. Provide accurate, natural translations.' },
      { role: 'user', content: prompt }
    ]
  });

  const translations = response.choices[0].message.content
    .split('\n')
    .filter((line: string) => line.trim().length > 0)
    .slice(0, examples.length);

  return translations;
}

// Main process
async function main() {
  console.log('Parsing HSK 7-9 PDF...');
  const words = parseHSKText();
  console.log(`Found ${words.length} words\n`);

  const results: WordResult[] = [];
  const allExamples: string[] = [];
  
  // Phase 1: Generate meanings + examples
  console.log('=== PHASE 1: Generate meanings + examples ===\n');
  
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(words.length / BATCH_SIZE);
    
    console.log(`[Batch ${batchNum}/${totalBatches}] Generating for: ${batch.map(w => w.chinese).join(', ')}`);
    
    try {
      const generated = await generateMeaningAndExample(batch);
      
      batch.forEach((word, idx) => {
        const gen = generated[idx] || {};
        const result: WordResult = {
          ...word,
          meaning: gen.meaning || '',
          chineseExample: gen.chineseExample || ''
        };
        results.push(result);
        allExamples.push(gen.chineseExample || '');
      });
      
      console.log(`✓ Batch ${batchNum} complete. Total: ${results.length}/${words.length}\n`);
      
      // Save progress
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    } catch (error) {
      console.error(`✗ Error in batch ${batchNum}: ${(error as Error).message}\n`);
    }
  }

  // Phase 2: Batch translate examples
  console.log('\n=== PHASE 2: Batch translate examples to English ===\n');
  
  const translations: string[] = [];
  const TRANSLATION_BATCH = 50; // Translate 50 examples per call
  
  for (let i = 0; i < allExamples.length; i += TRANSLATION_BATCH) {
    const batch = allExamples.slice(i, i + TRANSLATION_BATCH);
    const batchNum = Math.floor(i / TRANSLATION_BATCH) + 1;
    const totalBatches = Math.ceil(allExamples.length / TRANSLATION_BATCH);
    
    console.log(`[Translation Batch ${batchNum}/${totalBatches}] Translating ${batch.length} examples...`);
    
    try {
      const batchTranslations = await translateExamples(batch);
      translations.push(...batchTranslations);
      console.log(`✓ Batch ${batchNum} complete. Total: ${translations.length}/${allExamples.length}\n`);
    } catch (error) {
      console.error(`✗ Error in translation batch ${batchNum}: ${(error as Error).message}\n`);
      // Add empty translations as fallback
      translations.push(...batch.map(() => ''));
    }
  }

  // Combine results with translations
  results.forEach((result, idx) => {
    result.exampleEnglish = translations[idx] || '';
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\n✅ Completed! Generated ${results.length} words with meanings + examples + translations`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(console.error);
