/**
 * WordHippo Synonym Scraper
 * Extracts 20-50 synonyms per word with register variety
 * 
 * Usage: npx tsx scripts/scrape-wordhippo-synonyms.ts
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { getDb } from '../server/db';
import { upsertEnglishSynonym } from '../server/db';

// Base vocabulary: 500+ common English words for Polish Your English feature
const BASE_VOCABULARY = [
  // Verbs
  'say', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want',
  'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave',
  'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'talk', 'turn', 'start',
  'show', 'hear', 'play', 'run', 'move', 'like', 'live', 'believe', 'hold', 'bring',
  'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
  'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak',
  'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember',
  'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build',
  'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell',
  'require', 'report', 'decide', 'pull', 'explain', 'develop', 'carry', 'break', 'receive', 'agree',
  
  // Adjectives
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
  'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
  'few', 'public', 'bad', 'same', 'able', 'strong', 'possible', 'political', 'special', 'clear',
  'social', 'financial', 'easy', 'environmental', 'official', 'central', 'free', 'military', 'true', 'whole',
  'natural', 'personal', 'final', 'positive', 'private', 'cultural', 'legal', 'general', 'human', 'medical',
  'physical', 'mental', 'local', 'national', 'international', 'global', 'economic', 'commercial', 'industrial', 'agricultural',
  'beautiful', 'ugly', 'happy', 'sad', 'angry', 'afraid', 'tired', 'sick', 'well', 'healthy',
  'rich', 'poor', 'smart', 'stupid', 'clever', 'foolish', 'brave', 'cowardly', 'kind', 'cruel',
  'honest', 'dishonest', 'loyal', 'disloyal', 'faithful', 'unfaithful', 'generous', 'selfish', 'polite', 'rude',
  'quiet', 'loud', 'soft', 'hard', 'smooth', 'rough', 'clean', 'dirty', 'bright', 'dark',
  
  // Nouns
  'people', 'time', 'year', 'work', 'day', 'thing', 'man', 'world', 'life', 'hand',
  'part', 'place', 'case', 'week', 'company', 'system', 'program', 'question', 'number', 'group',
  'problem', 'fact', 'area', 'family', 'money', 'story', 'side', 'reason', 'body', 'head',
  'room', 'mother', 'father', 'son', 'daughter', 'brother', 'sister', 'friend', 'teacher', 'student',
  'doctor', 'patient', 'lawyer', 'judge', 'police', 'soldier', 'worker', 'boss', 'president', 'king',
  'queen', 'prince', 'princess', 'government', 'country', 'city', 'town', 'street', 'road', 'house',
  'building', 'school', 'hospital', 'church', 'market', 'shop', 'office', 'factory', 'farm', 'garden',
  'park', 'mountain', 'river', 'lake', 'ocean', 'sea', 'beach', 'forest', 'desert', 'island',
  'animal', 'bird', 'fish', 'dog', 'cat', 'horse', 'cow', 'pig', 'chicken', 'sheep',
  'plant', 'flower', 'tree', 'grass', 'food', 'water', 'fire', 'air', 'earth', 'stone',
  
  // More verbs (continued)
  'attack', 'defend', 'protect', 'destroy', 'create', 'produce', 'manufacture', 'construct', 'build', 'demolish',
  'establish', 'found', 'organize', 'manage', 'control', 'govern', 'rule', 'command', 'order', 'direct',
  'guide', 'lead', 'follow', 'support', 'assist', 'help', 'aid', 'encourage', 'inspire', 'motivate',
  'educate', 'teach', 'train', 'instruct', 'inform', 'notify', 'announce', 'declare', 'proclaim', 'publish',
  'broadcast', 'communicate', 'discuss', 'debate', 'argue', 'dispute', 'negotiate', 'bargain', 'trade', 'exchange',
  'buy', 'sell', 'purchase', 'acquire', 'obtain', 'receive', 'accept', 'reject', 'refuse', 'deny',
  'admit', 'confess', 'reveal', 'expose', 'hide', 'conceal', 'cover', 'uncover', 'discover', 'explore',
  'investigate', 'examine', 'inspect', 'analyze', 'study', 'research', 'experiment', 'test', 'prove', 'demonstrate',
  'illustrate', 'show', 'display', 'exhibit', 'present', 'introduce', 'propose', 'suggest', 'recommend', 'advise',
  'warn', 'caution', 'alert', 'notify', 'inform', 'instruct', 'direct', 'guide', 'lead', 'conduct',
  
  // More adjectives (continued)
  'active', 'passive', 'aggressive', 'defensive', 'offensive', 'protective', 'destructive', 'constructive', 'productive', 'unproductive',
  'efficient', 'inefficient', 'effective', 'ineffective', 'successful', 'unsuccessful', 'profitable', 'unprofitable', 'beneficial', 'harmful',
  'useful', 'useless', 'valuable', 'worthless', 'precious', 'common', 'rare', 'unique', 'ordinary', 'extraordinary',
  'normal', 'abnormal', 'regular', 'irregular', 'usual', 'unusual', 'typical', 'atypical', 'standard', 'non-standard',
  'modern', 'ancient', 'contemporary', 'traditional', 'progressive', 'conservative', 'liberal', 'radical', 'moderate', 'extreme',
  'simple', 'complex', 'complicated', 'straightforward', 'obvious', 'subtle', 'clear', 'ambiguous', 'definite', 'indefinite',
  'certain', 'uncertain', 'sure', 'unsure', 'confident', 'doubtful', 'optimistic', 'pessimistic', 'positive', 'negative',
  'realistic', 'idealistic', 'practical', 'theoretical', 'concrete', 'abstract', 'specific', 'general', 'particular', 'universal',
  'permanent', 'temporary', 'lasting', 'fleeting', 'eternal', 'mortal', 'infinite', 'finite', 'endless', 'limited',
  'complete', 'incomplete', 'whole', 'partial', 'full', 'empty', 'filled', 'hollow', 'solid', 'hollow',
  
  // More nouns (continued)
  'art', 'music', 'literature', 'science', 'mathematics', 'history', 'geography', 'language', 'culture', 'religion',
  'philosophy', 'psychology', 'sociology', 'economics', 'politics', 'law', 'medicine', 'technology', 'industry', 'agriculture',
  'commerce', 'trade', 'business', 'finance', 'banking', 'investment', 'stock', 'bond', 'currency', 'coin',
  'paper', 'book', 'magazine', 'newspaper', 'letter', 'email', 'message', 'phone', 'computer', 'internet',
  'website', 'software', 'hardware', 'device', 'machine', 'equipment', 'tool', 'instrument', 'weapon', 'vehicle',
  'car', 'truck', 'bus', 'train', 'plane', 'ship', 'boat', 'bicycle', 'motorcycle', 'scooter',
  'sport', 'game', 'play', 'entertainment', 'movie', 'film', 'theater', 'concert', 'show', 'performance',
  'art', 'painting', 'sculpture', 'drawing', 'photograph', 'image', 'picture', 'video', 'audio', 'sound',
  'music', 'song', 'melody', 'harmony', 'rhythm', 'beat', 'note', 'instrument', 'orchestra', 'band',
  'dance', 'ballet', 'drama', 'comedy', 'tragedy', 'romance', 'adventure', 'mystery', 'horror', 'science fiction',
];

interface SynonymData {
  word: string;
  partOfSpeech: string;
  synonyms: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

async function scrapeWordHippoSynonyms(word: string): Promise<SynonymData | null> {
  try {
    const url = `https://www.wordhippo.com/what-is/synonyms-for/${word}.html`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`[WordHippo] Failed to fetch ${word}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract part of speech
    const posElement = $('span.pos').first().text().trim();
    const partOfSpeech = posElement || 'noun';

    // Extract synonyms from the main synonym section
    const synonyms: string[] = [];
    $('div.synonym-list a').each((_, elem) => {
      const synonym = $(elem).text().trim().toLowerCase();
      if (synonym && synonym.length > 0 && !synonyms.includes(synonym)) {
        synonyms.push(synonym);
      }
    });

    // Also try alternative selectors for robustness
    if (synonyms.length === 0) {
      $('a[href*="/what-is/synonyms-for/"]').each((_, elem) => {
        const synonym = $(elem).text().trim().toLowerCase();
        if (synonym && synonym.length > 2 && !synonyms.includes(synonym) && synonym !== word) {
          synonyms.push(synonym);
        }
      });
    }

    if (synonyms.length === 0) {
      console.warn(`[WordHippo] No synonyms found for ${word}`);
      return null;
    }

    // Limit to 50 synonyms and determine difficulty level
    const limitedSynonyms = synonyms.slice(0, 50);
    const level: 'beginner' | 'intermediate' | 'advanced' = 
      BASE_VOCABULARY.indexOf(word) < 100 ? 'beginner' :
      BASE_VOCABULARY.indexOf(word) < 250 ? 'intermediate' :
      'advanced';

    return {
      word: word.toLowerCase(),
      partOfSpeech,
      synonyms: limitedSynonyms,
      level,
    };
  } catch (error) {
    console.error(`[WordHippo] Error scraping ${word}:`, error);
    return null;
  }
}

async function seedEnglishSynonyms() {
  console.log(`[Seed] Starting English synonyms seeding for ${BASE_VOCABULARY.length} words...`);

  let successCount = 0;
  let failureCount = 0;
  const batchSize = 10;

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < BASE_VOCABULARY.length; i += batchSize) {
    const batch = BASE_VOCABULARY.slice(i, i + batchSize);
    const promises = batch.map(async (word) => {
      try {
        const data = await scrapeWordHippoSynonyms(word);
        if (data) {
          await upsertEnglishSynonym(data);
          console.log(`[Seed] ✓ ${data.word} (${data.synonyms.length} synonyms)`);
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error(`[Seed] Failed to process ${word}:`, error);
        failureCount++;
      }
      // Add delay between requests to be respectful to WordHippo
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    await Promise.all(promises);
    console.log(`[Seed] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(BASE_VOCABULARY.length / batchSize)} complete`);
  }

  console.log(`[Seed] Complete! Success: ${successCount}, Failed: ${failureCount}`);
  process.exit(0);
}

// Run the seeding process
seedEnglishSynonyms().catch(error => {
  console.error('[Seed] Fatal error:', error);
  process.exit(1);
});
