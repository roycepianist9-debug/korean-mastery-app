import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sparkles, BookOpen, MessageSquare, Lightbulb,
  Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface WordDetailSheetProps {
  word: {
    id: number;
    korean: string;
    romanization: string;
    pos: string;
    meaning: string;
    koreanExample?: string | null;
    exampleEnglish?: string | null;
    topikLevel: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WordDetailSheet({ word, open, onOpenChange }: WordDetailSheetProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [tipsRequested, setTipsRequested] = useState(false);
  const tipsMutation = trpc.llm.getWordTips.useMutation();

  const handleGetTips = () => {
    if (!word || !isAuthenticated) return;
    setTipsRequested(true);
    tipsMutation.mutate({
      korean: word.korean,
      meaning: word.meaning,
      pos: word.pos,
      koreanExample: word.koreanExample || undefined,
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTipsRequested(false);
      tipsMutation.reset();
    }
    onOpenChange(v);
  };

  if (!word) return null;

  const tips = tipsMutation.data;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              word.topikLevel === 'beginner' ? 'bg-primary/20 text-primary' :
              word.topikLevel === 'intermediate' ? 'bg-chart-3/20 text-chart-3' :
              'bg-accent/20 text-accent'
            }`}>
              {word.topikLevel === 'beginner' ? 'Beginner' :
               word.topikLevel === 'intermediate' ? 'Intermediate' : 'Advanced'}
            </span>
            {word.pos && (
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                {word.pos}
              </span>
            )}
          </div>
          <SheetTitle className="text-4xl font-black text-foreground">{word.korean}</SheetTitle>
          <p className="text-base text-muted-foreground font-medium">{word.romanization}</p>
        </SheetHeader>

        <div className="space-y-3 pt-2 pb-4">
          {/* Meaning */}
          <div className="game-card p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Meaning</span>
            </div>
            <p className="text-base font-bold text-foreground">{word.meaning}</p>
          </div>

          {/* Example */}
          {(word.koreanExample || word.exampleEnglish) && (
            <div className="game-card p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-chart-3" />
                <span className="text-[10px] font-bold text-chart-3 uppercase tracking-wider">Example</span>
              </div>
              {word.koreanExample && (
                <p className="text-sm text-foreground">{word.koreanExample}</p>
              )}
              {word.exampleEnglish && (
                <p className="text-xs text-muted-foreground italic mt-0.5">{word.exampleEnglish}</p>
              )}
            </div>
          )}

          {/* AI Tips */}
          {!tipsRequested ? (
            <Button
              variant="outline"
              className="w-full h-11 press-scale border-accent/30 hover:bg-accent/10"
              onClick={handleGetTips}
              disabled={!isAuthenticated}
            >
              <Sparkles className="w-4 h-4 mr-2 text-accent" />
              <span className="font-bold text-accent text-sm">
                {isAuthenticated ? 'Get AI Grammar Tips' : 'Sign in for AI Tips'}
              </span>
            </Button>
          ) : tipsMutation.isPending ? (
            <div className="game-card p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">AI is thinking...</span>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          ) : tips ? (
            <div className="space-y-2.5 animate-slide-up">
              <div className="game-card p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Grammar Tip</span>
                </div>
                <p className="text-sm text-foreground/90">{tips.grammarTip}</p>
              </div>

              {tips.examples?.length > 0 && (
                <div className="game-card p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">More Examples</span>
                  </div>
                  <div className="space-y-2">
                    {tips.examples.map((ex: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-2.5">
                        <p className="text-sm text-foreground">{ex.korean}</p>
                        <p className="text-xs text-muted-foreground italic">{ex.english}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="game-card p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-chart-3" />
                  <span className="text-[10px] font-bold text-chart-3 uppercase tracking-wider">Usage Note</span>
                </div>
                <p className="text-sm text-foreground/90">{tips.usageNote}</p>
              </div>
            </div>
          ) : tipsMutation.isError ? (
            <div className="game-card p-3.5 text-center">
              <p className="text-xs text-muted-foreground">Could not generate tips.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleGetTips}>Retry</Button>
            </div>
          ) : null}

          {/* Full page link */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => { handleOpenChange(false); setLocation(`/word/${word.id}`); }}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            View Full Page
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
