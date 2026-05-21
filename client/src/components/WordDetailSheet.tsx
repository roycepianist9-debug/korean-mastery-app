import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BookOpen, MessageSquare,
  Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import ClickableExample from "./ClickableExample";



interface WordDetailSheetProps {
  word: {
    id: number;
    language?: string;
    korean?: string | null;
    romanization?: string;
    chinese?: string | null;
    pinyin?: string | null;
    pos: string;
    meaning: string;
    meaningFr?: string | null;
    koreanExample?: string | null;
    exampleEnglish?: string | null;
    exampleFrench?: string | null;
    chineseExample?: string | null;
    examplePinyin?: string | null;
    topikLevel?: string | null;
    hskLevel?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WordDetailSheet({ word, open, onOpenChange }: WordDetailSheetProps) {
  const { isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const [, setLocation] = useLocation();


  const isChinese = word?.language === 'chinese';
  const headword = isChinese ? (word?.chinese ?? '') : (word?.korean ?? '');
  const subtext = isChinese ? (word?.pinyin ?? '') : (word?.romanization ?? '');
  const exampleSentence = isChinese ? word?.chineseExample : word?.koreanExample;
  const exampleTranslation = isChinese ? word?.examplePinyin : word?.exampleEnglish;



  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
  };

  if (!word) return null;

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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
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
          <SheetTitle className="text-4xl font-black text-foreground">{headword}</SheetTitle>
          <p className="text-base text-muted-foreground font-medium">{subtext}</p>
        </SheetHeader>

        <div className="space-y-3 pt-2 pb-4">
          {/* Meaning */}
          <div className="game-card p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Meaning</span>
            </div>
            <p className="text-base font-bold text-foreground">
              {locale === 'fr' && word.meaningFr ? word.meaningFr : word.meaning}
            </p>
          </div>

          {/* Example */}
          {(exampleSentence || exampleTranslation) && (
            <div className="game-card p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-chart-3" />
                <span className="text-[10px] font-bold text-chart-3 uppercase tracking-wider">Example</span>
              </div>
              {exampleSentence && (
                <div className="mb-1">
                  {isChinese ? (
                    <p className="text-base font-bold text-foreground">{exampleSentence}</p>
                  ) : (
                    <ClickableExample sentence={exampleSentence} />
                  )}
                </div>
              )}
              {/* For Chinese: show pinyin below characters, then AI translation below pinyin */}
              {isChinese && word?.examplePinyin && (
                <p className="text-xs text-muted-foreground font-medium mb-1 leading-relaxed">
                  {word.examplePinyin}
                </p>
              )}

            </div>
          )}



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
