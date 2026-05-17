import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Sparkles, BookOpen, MessageSquare,
  Lightbulb, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";

export default function WordDetail() {
  const params = useParams<{ id: string }>();
  const wordId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [tipsRequested, setTipsRequested] = useState(false);

  const wordQuery = trpc.words.getById.useQuery(
    { id: wordId },
    { enabled: wordId > 0 }
  );

  const tipsMutation = trpc.llm.getWordTips.useMutation();

  const word = wordQuery.data;

  const isChinese = word?.language === 'chinese';
  const headword = isChinese ? (word?.chinese ?? '') : (word?.korean ?? '');
  const subtext = isChinese ? (word?.pinyin ?? '') : (word?.romanization ?? '');
  const exampleSentence = isChinese ? word?.chineseExample : word?.koreanExample;
  const exampleTranslation = isChinese ? word?.examplePinyin : word?.exampleEnglish;

  const handleGetTips = () => {
    if (!word || !isAuthenticated) return;
    setTipsRequested(true);
    tipsMutation.mutate({
      korean: headword,
      meaning: word.meaning,
      pos: word.pos,
      koreanExample: exampleSentence || undefined,
    });
  };

  if (wordQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-6 space-y-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-16 w-40 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-24 w-full" />
        </div>
        <BottomNav />
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
        <BottomNav />
      </div>
    );
  }

  const tips = tipsMutation.data;

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
          <p className="text-lg font-bold text-foreground">{word.meaning}</p>
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
              <p className="text-sm text-foreground mb-1">{exampleSentence}</p>
            )}
            {exampleTranslation && (
              <p className="text-sm text-muted-foreground italic">{exampleTranslation}</p>
            )}
          </div>
        </div>
      )}

      {/* AI Tips Section */}
      <div className="px-4 mb-4">
        {!tipsRequested ? (
          <Button
            variant="outline"
            className="w-full h-12 press-scale border-accent/30 hover:bg-accent/10"
            onClick={handleGetTips}
            disabled={!isAuthenticated}
          >
            <Sparkles className="w-4 h-4 mr-2 text-accent" />
            <span className="font-bold text-accent">
              {isAuthenticated ? 'Get AI Grammar Tips & Usage Notes' : 'Sign in for AI Tips'}
            </span>
          </Button>
        ) : tipsMutation.isPending ? (
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">AI is thinking...</span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ) : tips ? (
          <div className="space-y-3 animate-slide-up">
            <div className="game-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-accent uppercase tracking-wider">Grammar Tip</span>
              </div>
              <p className="text-sm text-foreground/90">{tips.grammarTip}</p>
            </div>

            {tips.examples && tips.examples.length > 0 && (
              <div className="game-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">More Examples</span>
                </div>
                <div className="space-y-3">
                  {tips.examples.map((ex: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <p className="text-sm text-foreground">{ex.korean}</p>
                      <p className="text-xs text-muted-foreground italic mt-0.5">{ex.english}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="game-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-chart-3" />
                <span className="text-xs font-bold text-chart-3 uppercase tracking-wider">Usage Note</span>
              </div>
              <p className="text-sm text-foreground/90">{tips.usageNote}</p>
            </div>
          </div>
        ) : tipsMutation.isError ? (
          <div className="game-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Could not generate tips. Please try again.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleGetTips}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
