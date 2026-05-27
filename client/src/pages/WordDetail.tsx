import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, BookOpen, MessageSquare,
  Loader2, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio } from "@/hooks/useAudio";

export default function WordDetail() {
  const params = useParams<{ id: string }>();
  const wordId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const wordQuery = trpc.words.getById.useQuery(
    { id: wordId },
    { enabled: wordId > 0 }
  );

  const word = wordQuery.data;

  const isChinese = word?.language === 'chinese';
  const headword = isChinese ? (word?.chinese ?? '') : (word?.korean ?? '');
  const subtext = isChinese ? (word?.pinyin ?? '') : (word?.romanization ?? '');
  const exampleSentence = isChinese ? word?.chineseExample : word?.koreanExample;
  const exampleTranslation = isChinese ? word?.examplePinyin : word?.exampleEnglish;



  if (wordQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-6 space-y-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-16 w-40 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Word not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/words")}>
          Back to Dictionary
        </Button>
      </div>
    );
  }



  // Level badge
  const levelLabel = isChinese
    ? (word.hskLevel ? `HSK ${word.hskLevel}` : null)
    : (word.topikLevel === 'beginner' ? 'Beginner' :
       word.topikLevel === 'intermediate' ? 'Intermediate' : 'Advanced');

  const levelClass = isChinese
    ? 'bg-primary/20 text-primary'
    : (word.topikLevel === 'beginner' ? 'bg-primary/20 text-primary' :
       word.topikLevel === 'intermediate' ? 'bg-chart-3/20 text-chart-3' :
       'bg-accent/20 text-accent');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-muted-foreground mb-4 press-scale">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Word Header */}
      <div className="px-4 text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          {levelLabel && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${levelClass}`}>
              {levelLabel}
            </span>
          )}
          {word.pos && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {word.pos}
            </span>
          )}
        </div>
        <h1 className="text-5xl font-black text-foreground mb-2">{headword}</h1>
        <p className="text-lg text-muted-foreground font-medium">{subtext}</p>
      </div>

      {/* Meaning */}
      <div className="px-4 mb-4">
        <div className="game-card p-4 game-card-glow">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Meaning</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {locale === 'fr' && word.meaningFr ? word.meaningFr : word.meaning}
          </p>
        </div>
      </div>

      {/* Example Sentences */}
      {(exampleSentence || exampleTranslation) && (
        <div className="px-4 mb-4">
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-chart-3" />
              <span className="text-xs font-bold text-chart-3 uppercase tracking-wider">Example</span>
            </div>
            {exampleSentence && (
              <ExampleWithAudio sentence={exampleSentence} language={isChinese ? 'zh-CN' : 'ko-KR'} />
            )}
            {exampleTranslation && (
              <p className="text-sm text-muted-foreground italic mt-2">{exampleTranslation}</p>
            )}
          </div>
        </div>
      )}



    </div>
  );
}

function ExampleWithAudio({ sentence, language }: { sentence: string; language: 'ko-KR' | 'zh-CN' }) {
  const { speak } = useAudio();
  return (
    <div className="flex items-center gap-2">
      <p className="text-sm text-foreground flex-1">{sentence}</p>
      <button
        onClick={() => speak(sentence, language)}
        className="inline-flex items-center justify-center w-5 h-5 text-primary hover:text-primary/80 transition-colors flex-shrink-0"
        aria-label="Play audio"
      >
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
  );
}
