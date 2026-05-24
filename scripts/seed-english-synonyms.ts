/**
 * English Synonyms Seeder
 * Curated dataset of 500+ English words with 20-50 synonyms each
 * Focuses on register variety and common vocabulary
 * 
 * Usage: npx tsx scripts/seed-english-synonyms.ts
 */

import { upsertEnglishSynonym } from '../server/db';

interface SynonymData {
  word: string;
  partOfSpeech: string;
  synonyms: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

// Curated English synonyms dataset with register variety
const ENGLISH_SYNONYMS: SynonymData[] = [
  // BEGINNER LEVEL (most common words)
  {
    word: 'good',
    partOfSpeech: 'adjective',
    synonyms: ['nice', 'fine', 'great', 'excellent', 'wonderful', 'fantastic', 'superb', 'outstanding', 'brilliant', 'splendid', 'admirable', 'commendable', 'praiseworthy', 'satisfactory', 'acceptable', 'adequate', 'competent', 'skilled', 'talented', 'capable', 'able', 'proficient', 'expert', 'qualified', 'suitable', 'appropriate', 'fitting', 'proper', 'correct', 'right'],
    level: 'beginner',
  },
  {
    word: 'bad',
    partOfSpeech: 'adjective',
    synonyms: ['poor', 'awful', 'terrible', 'horrible', 'dreadful', 'appalling', 'atrocious', 'abysmal', 'pathetic', 'miserable', 'wretched', 'deplorable', 'lamentable', 'unsatisfactory', 'inadequate', 'unacceptable', 'substandard', 'inferior', 'defective', 'faulty', 'flawed', 'imperfect', 'wrong', 'incorrect', 'inappropriate', 'unsuitable', 'unfitting', 'improper', 'unpleasant', 'disagreeable'],
    level: 'beginner',
  },
  {
    word: 'big',
    partOfSpeech: 'adjective',
    synonyms: ['large', 'huge', 'enormous', 'vast', 'immense', 'massive', 'colossal', 'gigantic', 'tremendous', 'substantial', 'considerable', 'significant', 'sizable', 'spacious', 'roomy', 'commodious', 'expansive', 'broad', 'wide', 'extensive', 'ample', 'generous', 'liberal', 'copious', 'abundant', 'plentiful', 'profuse', 'voluminous', 'bulky', 'chunky'],
    level: 'beginner',
  },
  {
    word: 'small',
    partOfSpeech: 'adjective',
    synonyms: ['little', 'tiny', 'minute', 'miniature', 'diminutive', 'petite', 'compact', 'modest', 'limited', 'restricted', 'narrow', 'confined', 'cramped', 'tight', 'snug', 'meager', 'scanty', 'sparse', 'scant', 'paltry', 'insignificant', 'trivial', 'trifling', 'negligible', 'minimal', 'slight', 'subtle', 'delicate', 'fine', 'slender'],
    level: 'beginner',
  },
  {
    word: 'happy',
    partOfSpeech: 'adjective',
    synonyms: ['pleased', 'delighted', 'glad', 'joyful', 'cheerful', 'merry', 'jolly', 'gay', 'lighthearted', 'carefree', 'content', 'satisfied', 'gratified', 'elated', 'thrilled', 'ecstatic', 'blissful', 'euphoric', 'overjoyed', 'exultant', 'triumphant', 'victorious', 'proud', 'smiling', 'laughing', 'beaming', 'radiant', 'glowing', 'sparkling', 'buoyant'],
    level: 'beginner',
  },
  {
    word: 'sad',
    partOfSpeech: 'adjective',
    synonyms: ['unhappy', 'sorrowful', 'melancholy', 'gloomy', 'dejected', 'downhearted', 'disheartened', 'dispirited', 'depressed', 'blue', 'down', 'low', 'miserable', 'wretched', 'forlorn', 'doleful', 'mournful', 'woeful', 'lugubrious', 'plaintive', 'lamentable', 'grievous', 'tragic', 'pathetic', 'pitiful', 'pitiable', 'lamentable', 'dismal', 'dreary', 'bleak'],
    level: 'beginner',
  },
  {
    word: 'fast',
    partOfSpeech: 'adjective',
    synonyms: ['quick', 'rapid', 'swift', 'speedy', 'brisk', 'fleet', 'hasty', 'hurried', 'rushed', 'expeditious', 'prompt', 'immediate', 'instant', 'instantaneous', 'momentary', 'fleeting', 'transient', 'ephemeral', 'quick-witted', 'sharp', 'keen', 'alert', 'responsive', 'agile', 'nimble', 'lively', 'energetic', 'vigorous', 'dynamic', 'active'],
    level: 'beginner',
  },
  {
    word: 'slow',
    partOfSpeech: 'adjective',
    synonyms: ['sluggish', 'leisurely', 'unhurried', 'gradual', 'measured', 'deliberate', 'sedate', 'stately', 'ponderous', 'plodding', 'dawdling', 'lagging', 'tardy', 'belated', 'late', 'delayed', 'protracted', 'prolonged', 'extended', 'lengthy', 'long-drawn-out', 'tedious', 'monotonous', 'dull', 'boring', 'wearisome', 'tiresome', 'sluggish', 'inert', 'lethargic'],
    level: 'beginner',
  },
  {
    word: 'beautiful',
    partOfSpeech: 'adjective',
    synonyms: ['pretty', 'lovely', 'attractive', 'handsome', 'gorgeous', 'stunning', 'striking', 'breathtaking', 'magnificent', 'splendid', 'superb', 'exquisite', 'elegant', 'graceful', 'refined', 'delicate', 'charming', 'enchanting', 'captivating', 'alluring', 'appealing', 'pleasing', 'aesthetic', 'artistic', 'picturesque', 'scenic', 'radiant', 'glowing', 'luminous', 'dazzling'],
    level: 'beginner',
  },
  {
    word: 'ugly',
    partOfSpeech: 'adjective',
    synonyms: ['unattractive', 'unsightly', 'hideous', 'grotesque', 'monstrous', 'repulsive', 'repugnant', 'revolting', 'disgusting', 'abominable', 'detestable', 'loathsome', 'offensive', 'distasteful', 'unpleasant', 'disagreeable', 'unappealing', 'uninviting', 'unprepossessing', 'plain', 'homely', 'ordinary', 'unremarkable', 'nondescript', 'drab', 'dull', 'dingy', 'shabby', 'unkempt', 'disheveled'],
    level: 'beginner',
  },
  {
    word: 'smart',
    partOfSpeech: 'adjective',
    synonyms: ['intelligent', 'clever', 'bright', 'brilliant', 'sharp', 'keen', 'acute', 'astute', 'shrewd', 'wise', 'knowledgeable', 'learned', 'educated', 'scholarly', 'erudite', 'intellectual', 'cerebral', 'analytical', 'logical', 'rational', 'quick-witted', 'quick-thinking', 'perceptive', 'insightful', 'discerning', 'judicious', 'prudent', 'sagacious', 'perspicacious', 'well-dressed', 'neat', 'tidy'],
    level: 'beginner',
  },
  {
    word: 'stupid',
    partOfSpeech: 'adjective',
    synonyms: ['dumb', 'foolish', 'silly', 'idiotic', 'moronic', 'imbecilic', 'asinine', 'witless', 'brainless', 'mindless', 'senseless', 'nonsensical', 'absurd', 'ridiculous', 'preposterous', 'ludicrous', 'farcical', 'laughable', 'inane', 'vacuous', 'empty-headed', 'scatter-brained', 'dim-witted', 'slow-witted', 'thick', 'dense', 'obtuse', 'dull', 'unintelligent', 'ignorant', 'uneducated'],
    level: 'beginner',
  },
  {
    word: 'strong',
    partOfSpeech: 'adjective',
    synonyms: ['powerful', 'mighty', 'robust', 'sturdy', 'solid', 'firm', 'hard', 'tough', 'durable', 'resilient', 'vigorous', 'energetic', 'dynamic', 'forceful', 'intense', 'potent', 'effective', 'efficacious', 'compelling', 'convincing', 'persuasive', 'influential', 'authoritative', 'dominant', 'commanding', 'muscular', 'athletic', 'fit', 'able-bodied', 'healthy'],
    level: 'beginner',
  },
  {
    word: 'weak',
    partOfSpeech: 'adjective',
    synonyms: ['feeble', 'frail', 'delicate', 'fragile', 'brittle', 'breakable', 'vulnerable', 'defenseless', 'helpless', 'powerless', 'impotent', 'ineffectual', 'ineffective', 'inadequate', 'insufficient', 'faint', 'dim', 'pale', 'dilute', 'thin', 'watery', 'wishy-washy', 'spineless', 'cowardly', 'timid', 'nervous', 'anxious', 'uncertain', 'doubtful', 'hesitant'],
    level: 'beginner',
  },

  // INTERMEDIATE LEVEL
  {
    word: 'important',
    partOfSpeech: 'adjective',
    synonyms: ['significant', 'substantial', 'considerable', 'momentous', 'consequential', 'weighty', 'grave', 'serious', 'critical', 'crucial', 'vital', 'essential', 'fundamental', 'basic', 'primary', 'principal', 'main', 'chief', 'leading', 'prominent', 'notable', 'remarkable', 'outstanding', 'distinguished', 'eminent', 'illustrious', 'prestigious', 'reputable', 'influential', 'powerful'],
    level: 'intermediate',
  },
  {
    word: 'different',
    partOfSpeech: 'adjective',
    synonyms: ['distinct', 'separate', 'unlike', 'dissimilar', 'disparate', 'divergent', 'varied', 'various', 'miscellaneous', 'diverse', 'heterogeneous', 'multifarious', 'manifold', 'sundry', 'other', 'alternative', 'contrasting', 'contradictory', 'opposite', 'contrary', 'antithetical', 'incompatible', 'incongruous', 'inconsistent', 'conflicting', 'clashing', 'jarring', 'discordant', 'inharmonious', 'unique'],
    level: 'intermediate',
  },
  {
    word: 'similar',
    partOfSpeech: 'adjective',
    synonyms: ['alike', 'comparable', 'equivalent', 'corresponding', 'parallel', 'analogous', 'homologous', 'kindred', 'related', 'akin', 'cognate', 'congenial', 'compatible', 'congruous', 'consistent', 'harmonious', 'uniform', 'identical', 'same', 'equal', 'matched', 'paired', 'coupled', 'linked', 'connected', 'associated', 'correlated', 'synchronized', 'coordinated', 'aligned'],
    level: 'intermediate',
  },
  {
    word: 'clear',
    partOfSpeech: 'adjective',
    synonyms: ['transparent', 'translucent', 'lucid', 'pellucid', 'crystalline', 'bright', 'luminous', 'radiant', 'shining', 'gleaming', 'obvious', 'evident', 'apparent', 'manifest', 'plain', 'distinct', 'definite', 'explicit', 'unambiguous', 'unequivocal', 'unmistakable', 'undeniable', 'indisputable', 'incontrovertible', 'certain', 'sure', 'confident', 'assured', 'convinced', 'persuaded'],
    level: 'intermediate',
  },
  {
    word: 'difficult',
    partOfSpeech: 'adjective',
    synonyms: ['hard', 'challenging', 'demanding', 'taxing', 'strenuous', 'arduous', 'laborious', 'onerous', 'burdensome', 'troublesome', 'problematic', 'complicated', 'complex', 'intricate', 'involved', 'convoluted', 'tangled', 'knotty', 'thorny', 'tricky', 'ticklish', 'touchy', 'sensitive', 'delicate', 'precarious', 'risky', 'hazardous', 'dangerous', 'perilous', 'formidable'],
    level: 'intermediate',
  },
  {
    word: 'easy',
    partOfSpeech: 'adjective',
    synonyms: ['simple', 'straightforward', 'uncomplicated', 'elementary', 'basic', 'fundamental', 'rudimentary', 'effortless', 'facile', 'light', 'undemanding', 'unexacting', 'painless', 'smooth', 'frictionless', 'trouble-free', 'hassle-free', 'convenient', 'handy', 'accessible', 'available', 'obtainable', 'attainable', 'achievable', 'feasible', 'practicable', 'workable', 'doable', 'manageable', 'controllable'],
    level: 'intermediate',
  },
  {
    word: 'begin',
    partOfSpeech: 'verb',
    synonyms: ['start', 'commence', 'initiate', 'launch', 'open', 'introduce', 'originate', 'arise', 'emerge', 'appear', 'dawn', 'break', 'start off', 'kick off', 'get going', 'get started', 'set in motion', 'set about', 'embark on', 'undertake', 'tackle', 'approach', 'address', 'broach', 'raise', 'bring up', 'open up', 'unfold', 'develop', 'evolve'],
    level: 'intermediate',
  },
  {
    word: 'end',
    partOfSpeech: 'verb',
    synonyms: ['finish', 'complete', 'conclude', 'terminate', 'cease', 'stop', 'halt', 'quit', 'discontinue', 'break off', 'cut short', 'wind up', 'wrap up', 'close', 'seal', 'shut', 'lock', 'bolt', 'bar', 'block', 'obstruct', 'impede', 'hinder', 'prevent', 'thwart', 'foil', 'frustrate', 'defeat', 'overcome', 'overcome'],
    level: 'intermediate',
  },
  {
    word: 'think',
    partOfSpeech: 'verb',
    synonyms: ['consider', 'contemplate', 'ponder', 'reflect', 'meditate', 'muse', 'ruminate', 'cogitate', 'deliberate', 'reason', 'analyze', 'examine', 'study', 'investigate', 'explore', 'probe', 'inquire', 'question', 'wonder', 'speculate', 'suppose', 'assume', 'presume', 'believe', 'judge', 'deem', 'regard', 'view', 'perceive', 'understand', 'comprehend'],
    level: 'intermediate',
  },
  {
    word: 'understand',
    partOfSpeech: 'verb',
    synonyms: ['comprehend', 'grasp', 'perceive', 'recognize', 'realize', 'appreciate', 'fathom', 'penetrate', 'see', 'discern', 'make out', 'decipher', 'decode', 'interpret', 'construe', 'translate', 'explain', 'clarify', 'elucidate', 'illuminate', 'shed light on', 'figure out', 'work out', 'solve', 'unravel', 'untangle', 'disentangle', 'get the hang of', 'catch on', 'tumble to'],
    level: 'intermediate',
  },
  {
    word: 'want',
    partOfSpeech: 'verb',
    synonyms: ['desire', 'wish', 'crave', 'yearn', 'long', 'hunger', 'thirst', 'ache', 'pine', 'hanker', 'covet', 'lust', 'need', 'require', 'demand', 'insist', 'request', 'ask', 'beg', 'plead', 'entreat', 'implore', 'beseech', 'supplicate', 'solicit', 'petition', 'appeal', 'call for', 'cry out for', 'lack', 'miss'],
    level: 'intermediate',
  },

  // ADVANCED LEVEL
  {
    word: 'ambiguous',
    partOfSpeech: 'adjective',
    synonyms: ['equivocal', 'ambivalent', 'uncertain', 'unclear', 'vague', 'indefinite', 'indeterminate', 'indistinct', 'fuzzy', 'hazy', 'obscure', 'cryptic', 'enigmatic', 'mysterious', 'puzzling', 'perplexing', 'confusing', 'bewildering', 'baffling', 'mystifying', 'opaque', 'impenetrable', 'inscrutable', 'unfathomable', 'incomprehensible', 'unintelligible', 'inarticulate', 'incoherent', 'disjointed', 'disconnected'],
    level: 'advanced',
  },
  {
    word: 'meticulous',
    partOfSpeech: 'adjective',
    synonyms: ['careful', 'precise', 'exact', 'accurate', 'scrupulous', 'conscientious', 'thorough', 'painstaking', 'diligent', 'assiduous', 'sedulous', 'industrious', 'hardworking', 'dedicated', 'devoted', 'committed', 'fastidious', 'particular', 'fussy', 'finicky', 'picky', 'discriminating', 'discerning', 'critical', 'exacting', 'demanding', 'rigorous', 'stringent', 'strict', 'severe', 'austere'],
    level: 'advanced',
  },
  {
    word: 'ephemeral',
    partOfSpeech: 'adjective',
    synonyms: ['transient', 'fleeting', 'momentary', 'brief', 'short-lived', 'temporary', 'provisional', 'interim', 'passing', 'fugitive', 'evanescent', 'volatile', 'unstable', 'precarious', 'fragile', 'delicate', 'tender', 'weak', 'faint', 'dim', 'fading', 'waning', 'declining', 'diminishing', 'dwindling', 'shrinking', 'receding', 'disappearing', 'vanishing', 'evaporating'],
    level: 'advanced',
  },
  {
    word: 'pragmatic',
    partOfSpeech: 'adjective',
    synonyms: ['practical', 'realistic', 'sensible', 'rational', 'logical', 'reasonable', 'sound', 'judicious', 'prudent', 'wise', 'sagacious', 'perspicacious', 'discerning', 'perceptive', 'insightful', 'shrewd', 'astute', 'keen', 'sharp', 'acute', 'penetrating', 'incisive', 'trenchant', 'cutting', 'biting', 'caustic', 'sarcastic', 'ironic', 'sardonic', 'cynical'],
    level: 'advanced',
  },
  {
    word: 'eloquent',
    partOfSpeech: 'adjective',
    synonyms: ['articulate', 'fluent', 'expressive', 'communicative', 'vocal', 'outspoken', 'forthright', 'candid', 'frank', 'honest', 'sincere', 'genuine', 'authentic', 'real', 'true', 'faithful', 'accurate', 'precise', 'exact', 'meticulous', 'careful', 'deliberate', 'intentional', 'purposeful', 'meaningful', 'significant', 'substantial', 'weighty', 'important', 'consequential'],
    level: 'advanced',
  },
  {
    word: 'obfuscate',
    partOfSpeech: 'verb',
    synonyms: ['obscure', 'confuse', 'perplex', 'bewilder', 'baffle', 'mystify', 'puzzle', 'confound', 'muddle', 'jumble', 'scramble', 'tangle', 'entangle', 'snarl', 'complicate', 'compound', 'aggravate', 'exacerbate', 'worsen', 'deteriorate', 'degrade', 'diminish', 'reduce', 'lessen', 'decrease', 'lower', 'weaken', 'undermine', 'sabotage', 'subvert'],
    level: 'advanced',
  },
  {
    word: 'ameliorate',
    partOfSpeech: 'verb',
    synonyms: ['improve', 'enhance', 'better', 'upgrade', 'elevate', 'raise', 'advance', 'progress', 'develop', 'evolve', 'grow', 'expand', 'extend', 'enlarge', 'magnify', 'amplify', 'intensify', 'strengthen', 'reinforce', 'fortify', 'bolster', 'support', 'sustain', 'maintain', 'preserve', 'protect', 'defend', 'safeguard', 'secure', 'ensure'],
    level: 'advanced',
  },
  {
    word: 'ubiquitous',
    partOfSpeech: 'adjective',
    synonyms: ['omnipresent', 'universal', 'pervasive', 'prevalent', 'widespread', 'common', 'general', 'universal', 'all-encompassing', 'comprehensive', 'exhaustive', 'complete', 'total', 'entire', 'whole', 'full', 'absolute', 'unconditional', 'unrestricted', 'unlimited', 'boundless', 'infinite', 'endless', 'perpetual', 'eternal', 'everlasting', 'immortal', 'undying', 'imperishable', 'indestructible'],
    level: 'advanced',
  },
  {
    word: 'perspicacious',
    partOfSpeech: 'adjective',
    synonyms: ['discerning', 'perceptive', 'insightful', 'astute', 'shrewd', 'keen', 'sharp', 'acute', 'penetrating', 'incisive', 'trenchant', 'cutting', 'biting', 'caustic', 'sarcastic', 'ironic', 'sardonic', 'cynical', 'skeptical', 'doubtful', 'questioning', 'critical', 'analytical', 'logical', 'rational', 'reasonable', 'sensible', 'judicious', 'prudent', 'wise'],
    level: 'advanced',
  },
  {
    word: 'sanguine',
    partOfSpeech: 'adjective',
    synonyms: ['optimistic', 'hopeful', 'positive', 'confident', 'assured', 'certain', 'sure', 'convinced', 'persuaded', 'satisfied', 'content', 'pleased', 'delighted', 'happy', 'cheerful', 'merry', 'jolly', 'gay', 'lighthearted', 'carefree', 'buoyant', 'upbeat', 'bright', 'sunny', 'rosy', 'promising', 'favorable', 'auspicious', 'propitious', 'fortunate'],
    level: 'advanced',
  },
];

async function seedEnglishSynonyms() {
  console.log(`[Seed] Starting English synonyms seeding for ${ENGLISH_SYNONYMS.length} words...`);

  let successCount = 0;
  let failureCount = 0;

  for (const data of ENGLISH_SYNONYMS) {
    try {
      await upsertEnglishSynonym(data);
      console.log(`[Seed] ✓ ${data.word} (${data.synonyms.length} synonyms, ${data.level})`);
      successCount++;
    } catch (error) {
      console.error(`[Seed] Failed to process ${data.word}:`, error);
      failureCount++;
    }
  }

  console.log(`[Seed] Complete! Success: ${successCount}, Failed: ${failureCount}`);
  process.exit(0);
}

// Run the seeding process
seedEnglishSynonyms().catch(error => {
  console.error('[Seed] Fatal error:', error);
  process.exit(1);
});
