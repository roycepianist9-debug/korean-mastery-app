import mysql from 'mysql2/promise';

const englishWords = [
  {
    word: 'good',
    partOfSpeech: 'adjective',
    level: 'beginner',
    synonyms: [
      { word: 'excellent', register: 'formal' },
      { word: 'great', register: 'casual' },
      { word: 'wonderful', register: 'sophisticated' },
      { word: 'awesome', register: 'slang' },
      { word: 'fine', register: 'formal' },
      { word: 'nice', register: 'casual' },
      { word: 'splendid', register: 'archaic' },
      { word: 'brilliant', register: 'british' },
      { word: 'bonzer', register: 'australian' },
      { word: 'superb', register: 'sophisticated' },
    ]
  },
  {
    word: 'bad',
    partOfSpeech: 'adjective',
    level: 'beginner',
    synonyms: [
      { word: 'terrible', register: 'formal' },
      { word: 'awful', register: 'casual' },
      { word: 'dreadful', register: 'sophisticated' },
      { word: 'sucks', register: 'slang' },
      { word: 'poor', register: 'formal' },
      { word: 'horrible', register: 'casual' },
      { word: 'abysmal', register: 'sophisticated' },
      { word: 'rubbish', register: 'british' },
      { word: 'shocking', register: 'british' },
      { word: 'atrocious', register: 'archaic' },
    ]
  },
  {
    word: 'beautiful',
    partOfSpeech: 'adjective',
    level: 'intermediate',
    synonyms: [
      { word: 'gorgeous', register: 'casual' },
      { word: 'stunning', register: 'formal' },
      { word: 'exquisite', register: 'sophisticated' },
      { word: 'lovely', register: 'casual' },
      { word: 'pretty', register: 'casual' },
      { word: 'handsome', register: 'formal' },
      { word: 'radiant', register: 'sophisticated' },
      { word: 'fair', register: 'archaic' },
      { word: 'comely', register: 'archaic' },
      { word: 'aesthetic', register: 'nuanced' },
    ]
  },
  {
    word: 'happy',
    partOfSpeech: 'adjective',
    level: 'beginner',
    synonyms: [
      { word: 'joyful', register: 'formal' },
      { word: 'cheerful', register: 'casual' },
      { word: 'delighted', register: 'formal' },
      { word: 'thrilled', register: 'casual' },
      { word: 'elated', register: 'sophisticated' },
      { word: 'blissful', register: 'sophisticated' },
      { word: 'content', register: 'formal' },
      { word: 'pleased', register: 'formal' },
      { word: 'gay', register: 'archaic' },
      { word: 'buoyant', register: 'nuanced' },
    ]
  },
  {
    word: 'important',
    partOfSpeech: 'adjective',
    level: 'intermediate',
    synonyms: [
      { word: 'significant', register: 'formal' },
      { word: 'crucial', register: 'formal' },
      { word: 'vital', register: 'formal' },
      { word: 'essential', register: 'formal' },
      { word: 'critical', register: 'formal' },
      { word: 'key', register: 'casual' },
      { word: 'paramount', register: 'sophisticated' },
      { word: 'momentous', register: 'sophisticated' },
      { word: 'weighty', register: 'nuanced' },
      { word: 'consequential', register: 'sophisticated' },
    ]
  },
  {
    word: 'big',
    partOfSpeech: 'adjective',
    level: 'beginner',
    synonyms: [
      { word: 'large', register: 'formal' },
      { word: 'huge', register: 'casual' },
      { word: 'enormous', register: 'formal' },
      { word: 'massive', register: 'casual' },
      { word: 'gigantic', register: 'casual' },
      { word: 'vast', register: 'formal' },
      { word: 'immense', register: 'sophisticated' },
      { word: 'colossal', register: 'sophisticated' },
      { word: 'whopping', register: 'slang' },
      { word: 'substantial', register: 'formal' },
    ]
  },
  {
    word: 'small',
    partOfSpeech: 'adjective',
    level: 'beginner',
    synonyms: [
      { word: 'tiny', register: 'casual' },
      { word: 'little', register: 'casual' },
      { word: 'miniature', register: 'formal' },
      { word: 'petite', register: 'formal' },
      { word: 'diminutive', register: 'sophisticated' },
      { word: 'compact', register: 'formal' },
      { word: 'minuscule', register: 'sophisticated' },
      { word: 'wee', register: 'british' },
      { word: 'teeny', register: 'casual' },
      { word: 'infinitesimal', register: 'sophisticated' },
    ]
  },
  {
    word: 'smart',
    partOfSpeech: 'adjective',
    level: 'intermediate',
    synonyms: [
      { word: 'intelligent', register: 'formal' },
      { word: 'clever', register: 'casual' },
      { word: 'bright', register: 'casual' },
      { word: 'brilliant', register: 'formal' },
      { word: 'sharp', register: 'casual' },
      { word: 'astute', register: 'sophisticated' },
      { word: 'witty', register: 'formal' },
      { word: 'keen', register: 'formal' },
      { word: 'sage', register: 'archaic' },
      { word: 'perspicacious', register: 'sophisticated' },
    ]
  },
  {
    word: 'fast',
    partOfSpeech: 'adjective',
    level: 'beginner',
    synonyms: [
      { word: 'quick', register: 'casual' },
      { word: 'rapid', register: 'formal' },
      { word: 'swift', register: 'formal' },
      { word: 'speedy', register: 'casual' },
      { word: 'fleet', register: 'archaic' },
      { word: 'hasty', register: 'formal' },
      { word: 'brisk', register: 'formal' },
      { word: 'lightning-fast', register: 'slang' },
      { word: 'expeditious', register: 'sophisticated' },
      { word: 'zippy', register: 'slang' },
    ]
  },
  {
    word: 'slow',
    partOfSpeech: 'adjective',
    level: 'beginner',
    synonyms: [
      { word: 'sluggish', register: 'formal' },
      { word: 'leisurely', register: 'formal' },
      { word: 'gradual', register: 'formal' },
      { word: 'dawdling', register: 'casual' },
      { word: 'tardy', register: 'formal' },
      { word: 'lagging', register: 'casual' },
      { word: 'plodding', register: 'sophisticated' },
      { word: 'dilatory', register: 'sophisticated' },
      { word: 'pokey', register: 'slang' },
      { word: 'unhurried', register: 'formal' },
    ]
  },
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    for (const word of englishWords) {
      const synonymsJson = JSON.stringify(word.synonyms);
      
      const query = `
        INSERT INTO english_synonyms (word, partOfSpeech, synonyms, level, createdAt)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          partOfSpeech = VALUES(partOfSpeech),
          synonyms = VALUES(synonyms),
          level = VALUES(level)
      `;
      
      await connection.execute(query, [
        word.word,
        word.partOfSpeech,
        synonymsJson,
        word.level
      ]);
      
      console.log(`✓ Seeded: ${word.word}`);
    }
    
    console.log('\n✅ All 10 words seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

seed();
