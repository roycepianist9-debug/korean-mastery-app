import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "wouter";
import {
  Search, ChevronLeft, ChevronRight, BookOpen,
  ArrowLeft, Filter, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import WordDetailSheet from "@/components/WordDetailSheet";

function WordCard({ word, onClick }: { word: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full game-card p-3.5 flex items-center gap-3 press-scale text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        <span className="text-lg font-black text-foreground">{word.korean.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-foreground truncate">{word.korean}</p>
          <span className="text-xs text-muted-foreground shrink-0">{word.romanization}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{word.meaning}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          word.topikLevel === 'beginner' ? 'bg-primary/20 text-primary' :
          word.topikLevel === 'intermediate' ? 'bg-chart-3/20 text-chart-3' :
          'bg-accent/20 text-accent'
        }`}>
          {word.topikLevel === 'beginner' ? 'Beg' :
           word.topikLevel === 'intermediate' ? 'Int' : 'Adv'}
        </span>
        {word.pos && (
          <span className="text-[10px] text-muted-foreground">{word.pos}</span>
        )}
      </div>
    </button>
  );
}

export default function WordList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [posFilter, setPosFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [detailWord, setDetailWord] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const pageSize = 30;

  // Proper debounce with useEffect cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const wordsQuery = trpc.words.search.useQuery({
    query: debouncedQuery || undefined,
    pos: posFilter !== 'all' ? posFilter : undefined,
    topikLevel: levelFilter !== 'all' ? levelFilter : undefined,
    page,
    pageSize,
  });

  const words = wordsQuery.data?.words ?? [];
  const total = wordsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const hasActiveFilters = posFilter !== 'all' || levelFilter !== 'all';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setLocation("/")} className="text-muted-foreground press-scale">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-foreground">Dictionary</h1>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {total.toLocaleString()} words
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Korean, romanization, or English..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border h-10"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full press-scale transition-colors ${
            hasActiveFilters ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
          }`}
        >
          <Filter className="w-3 h-3" />
          Filters {hasActiveFilters && '·'}
          {hasActiveFilters && (
            <span>{[posFilter !== 'all' && posFilter, levelFilter !== 'all' && levelFilter].filter(Boolean).join(', ')}</span>
          )}
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 game-card p-3 space-y-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Level</label>
                <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1); }}>
                  <SelectTrigger className="bg-secondary border-border h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Type</label>
                <Select value={posFilter} onValueChange={(v) => { setPosFilter(v); setPage(1); }}>
                  <SelectTrigger className="bg-secondary border-border h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="noun">Nouns</SelectItem>
                    <SelectItem value="verb">Verbs</SelectItem>
                    <SelectItem value="adjective">Adjectives</SelectItem>
                    <SelectItem value="adverb">Adverbs</SelectItem>
                    <SelectItem value="determiner">Determiners</SelectItem>
                    <SelectItem value="interjection">Interjections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setPosFilter('all'); setLevelFilter('all'); setPage(1); }}
                className="text-xs text-destructive font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Word list */}
      <div className="px-4 space-y-2">
        {wordsQuery.isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="game-card p-3.5 flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))
        ) : words.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No words found</p>
            <p className="text-xs text-muted-foreground mt-1">Try different search terms or filters</p>
          </div>
        ) : (
          words.map((word: any) => (
            <WordCard
              key={word.id}
              word={word}
              onClick={() => { setDetailWord(word); setDetailOpen(true); }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="press-scale"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="press-scale"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <WordDetailSheet
        word={detailWord}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <BottomNav />
    </div>
  );
}
