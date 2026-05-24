import { getDb } from '../server/db';
import { englishSynonyms } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const ENGLISH_WORDS_V2 = [
  {
    word: 'good',
    pos: 'adjective',
    meaning: 'Positive, satisfactory, or of high quality',
    example: 'That was a good movie.',
    synonyms: [
      { word: 'excellent', register: 'formal' },
      { word: 'great', register: 'casual' },
      { word: 'wonderful', register: 'casual' },
      { word: 'fine', register: 'formal' },
      { word: 'splendid', register: 'sophisticated' },
      { word: 'magnificent', register: 'sophisticated' },
      { word: 'superb', register: 'formal' },
      { word: 'fantastic', register: 'casual' },
      { word: 'awesome', register: 'slang' },
      { word: 'cool', register: 'slang' },
      { word: 'rad', register: 'slang' },
      { word: 'brilliant', register: 'british' },
      { word: 'bonzer', register: 'australian' },
      { word: 'ripper', register: 'australian' },
      { word: 'admirable', register: 'formal' },
      { word: 'commendable', register: 'formal' },
      { word: 'praiseworthy', register: 'formal' },
      { word: 'exemplary', register: 'sophisticated' },
      { word: 'outstanding', register: 'formal' },
      { word: 'exceptional', register: 'formal' },
      { word: 'superior', register: 'formal' },
      { word: 'first-rate', register: 'formal' },
      { word: 'top-notch', register: 'casual' },
      { word: 'ace', register: 'slang' },
      { word: 'sweet', register: 'slang' },
      { word: 'dope', register: 'slang' },
      { word: 'sick', register: 'slang' },
      { word: 'lit', register: 'slang' },
      { word: 'phenomenal', register: 'sophisticated' },
      { word: 'remarkable', register: 'formal' },
    ],
    level: 'beginner',
  },
  {
    word: 'bad',
    pos: 'adjective',
    meaning: 'Not good, unpleasant, or of poor quality',
    example: 'That was a bad decision.',
    synonyms: [
      { word: 'terrible', register: 'casual' },
      { word: 'awful', register: 'casual' },
      { word: 'horrible', register: 'casual' },
      { word: 'dreadful', register: 'formal' },
      { word: 'appalling', register: 'formal' },
      { word: 'atrocious', register: 'sophisticated' },
      { word: 'abysmal', register: 'formal' },
      { word: 'pathetic', register: 'casual' },
      { word: 'wretched', register: 'formal' },
      { word: 'deplorable', register: 'formal' },
      { word: 'lamentable', register: 'formal' },
      { word: 'execrable', register: 'sophisticated' },
      { word: 'ghastly', register: 'formal' },
      { word: 'dismal', register: 'formal' },
      { word: 'dire', register: 'formal' },
      { word: 'poor', register: 'formal' },
      { word: 'inferior', register: 'formal' },
      { word: 'subpar', register: 'formal' },
      { word: 'mediocre', register: 'formal' },
      { word: 'crummy', register: 'slang' },
      { word: 'rubbish', register: 'british' },
      { word: 'rubbish', register: 'australian' },
      { word: 'dodgy', register: 'british' },
      { word: 'grotty', register: 'british' },
      { word: 'naff', register: 'british' },
      { word: 'shocking', register: 'british' },
      { word: 'rotten', register: 'casual' },
      { word: 'lousy', register: 'casual' },
      { word: 'sucky', register: 'slang' },
      { word: 'trash', register: 'slang' },
    ],
    level: 'beginner',
  },
  {
    word: 'beautiful',
    pos: 'adjective',
    meaning: 'Pleasing to the eye or aesthetically attractive',
    example: 'She wore a beautiful dress.',
    synonyms: [
      { word: 'gorgeous', register: 'casual' },
      { word: 'stunning', register: 'casual' },
      { word: 'lovely', register: 'formal' },
      { word: 'exquisite', register: 'sophisticated' },
      { word: 'magnificent', register: 'formal' },
      { word: 'splendid', register: 'formal' },
      { word: 'elegant', register: 'formal' },
      { word: 'graceful', register: 'formal' },
      { word: 'handsome', register: 'formal' },
      { word: 'pretty', register: 'casual' },
      { word: 'cute', register: 'casual' },
      { word: 'radiant', register: 'formal' },
      { word: 'luminous', register: 'sophisticated' },
      { word: 'resplendent', register: 'sophisticated' },
      { word: 'sublime', register: 'sophisticated' },
      { word: 'fair', register: 'archaic' },
      { word: 'comely', register: 'archaic' },
      { word: 'bonny', register: 'british' },
      { word: 'pulchritudinous', register: 'sophisticated' },
      { word: 'aesthetic', register: 'formal' },
      { word: 'picturesque', register: 'formal' },
      { word: 'scenic', register: 'formal' },
      { word: 'divine', register: 'casual' },
      { word: 'heavenly', register: 'casual' },
      { word: 'angelic', register: 'formal' },
      { word: 'ethereal', register: 'sophisticated' },
      { word: 'alluring', register: 'formal' },
      { word: 'captivating', register: 'formal' },
      { word: 'enchanting', register: 'formal' },
      { word: 'bewitching', register: 'formal' },
    ],
    level: 'beginner',
  },
  {
    word: 'happy',
    pos: 'adjective',
    meaning: 'Feeling or showing pleasure and contentment',
    example: 'I am happy to see you.',
    synonyms: [
      { word: 'joyful', register: 'formal' },
      { word: 'cheerful', register: 'formal' },
      { word: 'delighted', register: 'formal' },
      { word: 'pleased', register: 'formal' },
      { word: 'content', register: 'formal' },
      { word: 'satisfied', register: 'formal' },
      { word: 'glad', register: 'formal' },
      { word: 'thrilled', register: 'casual' },
      { word: 'elated', register: 'formal' },
      { word: 'ecstatic', register: 'formal' },
      { word: 'blissful', register: 'formal' },
      { word: 'euphoric', register: 'sophisticated' },
      { word: 'exuberant', register: 'formal' },
      { word: 'buoyant', register: 'formal' },
      { word: 'upbeat', register: 'casual' },
      { word: 'chipper', register: 'casual' },
      { word: 'cheerful', register: 'formal' },
      { word: 'gay', register: 'archaic' },
      { word: 'merry', register: 'archaic' },
      { word: 'jolly', register: 'casual' },
      { word: 'over the moon', register: 'british' },
      { word: 'chuffed', register: 'british' },
      { word: 'stoked', register: 'slang' },
      { word: 'pumped', register: 'slang' },
      { word: 'buzzed', register: 'slang' },
      { word: 'over the top', register: 'nuanced' },
      { word: 'on cloud nine', register: 'casual' },
      { word: 'in seventh heaven', register: 'nuanced' },
      { word: 'tickled pink', register: 'nuanced' },
      { word: 'grinning from ear to ear', register: 'nuanced' },
    ],
    level: 'beginner',
  },
  {
    word: 'important',
    pos: 'adjective',
    meaning: 'Of great significance or consequence',
    example: 'This is an important meeting.',
    synonyms: [
      { word: 'significant', register: 'formal' },
      { word: 'crucial', register: 'formal' },
      { word: 'critical', register: 'formal' },
      { word: 'essential', register: 'formal' },
      { word: 'vital', register: 'formal' },
      { word: 'key', register: 'casual' },
      { word: 'major', register: 'casual' },
      { word: 'principal', register: 'formal' },
      { word: 'primary', register: 'formal' },
      { word: 'paramount', register: 'formal' },
      { word: 'supreme', register: 'formal' },
      { word: 'cardinal', register: 'formal' },
      { word: 'fundamental', register: 'formal' },
      { word: 'central', register: 'formal' },
      { word: 'pivotal', register: 'formal' },
      { word: 'indispensable', register: 'formal' },
      { word: 'irreplaceable', register: 'formal' },
      { word: 'momentous', register: 'sophisticated' },
      { word: 'consequential', register: 'formal' },
      { word: 'weighty', register: 'formal' },
      { word: 'grave', register: 'formal' },
      { word: 'serious', register: 'formal' },
      { word: 'pressing', register: 'formal' },
      { word: 'urgent', register: 'formal' },
      { word: 'top-priority', register: 'casual' },
      { word: 'big-picture', register: 'nuanced' },
      { word: 'game-changing', register: 'casual' },
      { word: 'make-or-break', register: 'nuanced' },
      { word: 'earth-shattering', register: 'casual' },
      { word: 'earth-moving', register: 'casual' },
    ],
    level: 'intermediate',
  },
];

async function seedEnglishSynonyms() {
  console.log('🌱 Seeding English synonyms with register tags...');
  const db = await getDb();
  if (!db) {
    console.error('❌ Database connection failed');
    return;
  }
  
  for (const wordData of ENGLISH_WORDS_V2) {
    try {
      // Check if word exists
      const existing = await db
        .select()
        .from(englishSynonyms)
        .where(eq(englishSynonyms.word, wordData.word))
        .limit(1);

      if (existing.length > 0) {
        // Update existing word with new data
        await db
          .update(englishSynonyms)
          .set({
            meaning: wordData.meaning,
            exampleSentence: wordData.example,
            synonyms: wordData.synonyms,
          })
          .where(eq(englishSynonyms.word, wordData.word));
        console.log(`✓ Updated: ${wordData.word}`);
      } else {
        // Insert new word
        await db.insert(englishSynonyms).values({
          word: wordData.word,
          partOfSpeech: wordData.pos,
          meaning: wordData.meaning,
          exampleSentence: wordData.example,
          synonyms: wordData.synonyms,
          level: wordData.level as 'beginner' | 'intermediate' | 'advanced',
        });
        console.log(`✓ Inserted: ${wordData.word}`);
      }
    } catch (error) {
      console.error(`✗ Error seeding ${wordData.word}:`, error);
    }
  }

  console.log('✅ English synonyms seeding complete!');
}

seedEnglishSynonyms().catch(console.error);
