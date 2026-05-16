import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface ClickableExampleProps {
  sentence: string;
}

function TokenWord({ text, wordId, meaning }: { text: string; wordId: number | null; meaning: string | null }) {
  const [, setLocation] = useLocation();

  if (!wordId) {
    return <span className="text-foreground">{text}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-colors font-medium">
          {text}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-auto max-w-64 p-2.5 bg-card border-border"
        style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
      >
        <p className="text-sm font-bold text-foreground">{text}</p>
        {meaning && <p className="text-xs text-muted-foreground mt-0.5">{meaning}</p>}
        <button
          onClick={() => setLocation(`/word/${wordId}`)}
          className="text-[10px] text-primary font-bold mt-1 block"
        >
          View full entry →
        </button>
      </PopoverContent>
    </Popover>
  );
}

export default function ClickableExample({ sentence }: ClickableExampleProps) {
  const tokensQuery = trpc.words.tokenize.useQuery(
    { sentence },
    { enabled: !!sentence, staleTime: 60 * 60 * 1000 }
  );

  if (!sentence) return null;

  if (tokensQuery.isLoading) {
    return (
      <span className="flex items-center gap-1 text-sm text-foreground">
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        {sentence}
      </span>
    );
  }

  if (!tokensQuery.data || tokensQuery.data.length === 0) {
    return <span className="text-sm text-foreground">{sentence}</span>;
  }

  return (
    <span className="text-sm leading-relaxed inline">
      {tokensQuery.data.map((token: any, i: number) => (
        token.isWord ? (
          <TokenWord key={i} text={token.text} wordId={token.wordId} meaning={token.meaning} />
        ) : (
          <span key={i} className="text-foreground">{token.text}</span>
        )
      ))}
    </span>
  );
}
