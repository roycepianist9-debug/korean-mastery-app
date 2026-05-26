import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Volume2, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useAudio } from "@/hooks/useAudio";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ClickableExampleProps {
  sentence: string;
  language?: 'ko-KR' | 'zh-CN' | 'ja-JP';
}

function TokenWord({ text, wordId, meaning }: { text: string; wordId: number | null; meaning: string | null }) {
  const [, setLocation] = useLocation();
  const [showListModal, setShowListModal] = useState(false);
  const customListsQuery = trpc.customLists.list.useQuery(undefined, { enabled: !!wordId });
  const addWordMutation = trpc.customLists.addWord.useMutation();

  if (!wordId) {
    return <span className="text-foreground">{text}</span>;
  }

  const handleAddToList = async (listId: number) => {
    try {
      await addWordMutation.mutateAsync({ listId, wordId });
      toast.success(`Added "${text}" to list`);
      setShowListModal(false);
    } catch (error) {
      toast.error('Failed to add word to list');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-colors font-medium">
          {text}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-auto max-w-80 p-3 bg-card border-border"
        style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
      >
        <p className="text-sm font-bold text-foreground">{text}</p>
        {meaning && <p className="text-xs text-muted-foreground mt-0.5">{meaning}</p>}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={() => setLocation(`/word/${wordId}`)}
            className="text-[10px] text-primary font-bold px-2 py-1 rounded hover:bg-primary/10 transition-colors flex-1"
          >
            View full entry →
          </button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 gap-1"
            onClick={() => setShowListModal(!showListModal)}
          >
            <Plus className="w-3 h-3" />
            <span className="text-xs">Add</span>
          </Button>
        </div>
        {showListModal && (
          <div className="mt-2 pt-2 border-t border-border">
            {customListsQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading lists...</p>
            ) : customListsQuery.data && customListsQuery.data.length > 0 ? (
              <div className="space-y-1">
                {customListsQuery.data.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleAddToList(list.id)}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors"
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No lists yet. Create one first!</p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function ClickableExample({ sentence, language = 'ko-KR' }: ClickableExampleProps & { language?: 'ko-KR' | 'zh-CN' }) {
  const { speak } = useAudio();
  const tokenLanguage = language === 'zh-CN' ? 'chinese' : 'korean';
  const tokensQuery = trpc.words.tokenize.useQuery(
    { sentence, language: tokenLanguage },
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
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">{sentence}</span>
        <button
          onClick={() => speak(sentence, language)}
          className="inline-flex items-center justify-center w-5 h-5 text-primary hover:text-primary/80 transition-colors"
          aria-label="Play audio"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm leading-relaxed inline">
        {tokensQuery.data.map((token: any, i: number) => (
          token.isWord ? (
            <TokenWord key={i} text={token.text} wordId={token.wordId} meaning={token.meaning} />
          ) : (
            <span key={i} className="text-foreground">{token.text}</span>
          )
        ))}
      </span>
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
