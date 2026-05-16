export interface WordEntry {
  id: number;
  korean: string;
  romanization: string;
  pos: string;
  meaning: string;
  koreanExample: string | null;
  exampleEnglish: string | null;
  topikLevel: 'beginner' | 'intermediate' | 'advanced';
  chineseTerm: string;
  pinyin: string;
  chineseExample: string | null;
  examplePinyin: string | null;
}

export interface WordProgress {
  id: number;
  userId: number;
  wordId: number;
  status: 'new' | 'reviewing' | 'learned';
  timesReviewed: number;
  timesCorrect: number;
  lastReviewedAt: Date | null;
}

export interface GameStats {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  totalWordsLearned: number;
  totalReviews: number;
  level: number;
  levelTitle: string;
}

export interface WordTips {
  grammarTip: string;
  examples: { korean: string; english: string }[];
  usageNote: string;
}
