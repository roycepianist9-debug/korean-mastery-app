import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import BottomNav from "@/components/BottomNav";
import { useLocation, useSearch } from "wouter";
import {
  Search, ChevronLeft, ChevronRight, BookOpen,
  ArrowLeft, Filter, X, Gamepad2, ArrowLeftRight,
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
import { toast } from "sonner";

/* ─── Swipeable Word Card ─── */
function SwipeableWordCard({
  word,
  onClick,
  onMarkLearned,
  onMarkReviewing,
  isAuthenticated,
}: {
  word: any;
  onClick: () => void;
  onMarkLearned: () => void;
  onMarkReviewing: () => void;
  isAuthenticated: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null);
  const THRESHOLD = 70;

  const handleStart = (clientX: number) => {
    if (!isAuthenticated) return;
    isDragging.current = true;
    startX.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current) return;
    setDragX(clientX - startX.current);
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragX > THRESHOLD) {
      setSwiped('right');
      setTimeout(() => {
        onMarkLearned();
        setSwiped(null);
        setDragX(0);
      }, 300);
    } else if (dragX < -THRESHOLD) {
      setSwiped('left');
      setTimeout(() => {
        onMarkReviewing();
        setSwiped(null);
        setDragX(0);
      }, 300);
    } else {
      setDragX(0);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX); };

  useEffect(() => {
    if (!isDragging.current) return;
    const onMove = (e: MouseEvent) => handleMove(e.clientX);
    const onUp = () => handleEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  });

  // Only show subtle border glow while actively dragging past threshold
  const borderColor = dragX > THRESHOLD
    ? 'rgba(34,197,94,0.5)'
    : dragX < -THRESHOLD
    ? 'rgba(249,115,22,0.5)'
    : 'transparent';

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Card */}
      <div
        ref={cardRef}
        className="relative game-card p-3.5 flex items-center gap-3 select-none"
        style={{
          transform: swiped === 'right' ? 'translateX(120%)' : swiped === 'left' ? 'translateX(-120%)' : `translateX(${dragX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.23,1,0.32,1)',
          boxShadow: borderColor !== 'transparent' ? `0 0 0 2px ${borderColor}` : 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <button
          onClick={onClick}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-foreground">
              {word.korean ? word.korean.charAt(0) : word.chinese?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-foreground truncate">
                {word.korean || word.chinese}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {word.romanization || word.pinyin}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{word.meaning}</p>
          </div>
        </button>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            word.topikLevel === 'beginner' ? 'bg-primary/20 text-primary' :
            word.topikLevel === 'intermediate' ? 'bg-chart-3/20 text-chart-3' :
            word.topikLevel === 'advanced' ? 'bg-accent/20 text-accent' :
            word.hskLevel === '1' ? 'bg-primary/20 text-primary' :
            word.hskLevel === '2' ? 'bg-chart-3/20 text-chart-3' :
            'bg-accent/20 text-accent'
          }`}>
            {word.topikLevel === 'beginner' ? 'Beg' :
             word.topikLevel === 'intermediate' ? 'Int' :
             word.topikLevel === 'advanced' ? 'Adv' :
             word.hskLevel ? `HSK${word.hskLevel}` : 'Lvl'}
          </span>
          {word.pos && (
            <span className="text-[10px] text-muted-foreground">{word.pos}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Status Filter Toggle Buttons ─── */
function StatusFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (statuses: string[]) => void;
}) {
  const toggle = (status: string) => {
    if (selected.includes(status)) {
      onChange(selected.filter(s => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  const statuses = [
    { key: 'new', label: 'New', color: 'text-accent bg-accent/20 border-accent/40' },
    { key: 'reviewing', label: 'Reviewing', color: 'text-chart-3 bg-chart-3/20 border-chart-3/40' },
    { key: 'learned', label: 'Learned', color: 'text-primary bg-primary/20 border-primary/40' },
  ];

  return (
    <div className="flex items-center gap-2">
      {statuses.map(s => (
        <button
          key={s.key}
          onClick={() => toggle(s.key)}
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all press-scale ${
            selected.includes(s.key)
              ? s.color
              : 'text-muted-foreground bg-secondary border-transparent'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export default function WordList() {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);

  // Initialize from URL params
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const isChinese = language === 'chinese';
  const [posFilter, setPosFilter] = useState(params.get("pos") || "all");
  // hskLevel from URL for Chinese, level for Korean
  const [levelFilter, setLevelFilter] = useState(
    params.get("hskLevel") || params.get("level") || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const s = params.get("statuses");
    return s ? s.split(",").filter(Boolean) : [];
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(
    !!(params.get("pos") || params.get("level") || params.get("hskLevel") || params.get("statuses"))
  );
  const [detailWord, setDetailWord] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const pageSize = 30;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const wordsQuery = trpc.words.search.useQuery({
    query: debouncedQuery,
    pos: posFilter !== 'all' ? posFilter : undefined,
    topikLevel: !isChinese && levelFilter !== 'all' ? levelFilter : undefined,
    hskLevel: isChinese && levelFilter !== 'all' ? levelFilter : undefined,
    statuses: statusFilter.length > 0 ? statusFilter : undefined,
    page,
    pageSize: 30,
    language,
  });

  const markWord = trpc.progress.markWord.useMutation({
    onSuccess: () => {
      wordsQuery.refetch();
    },
  });

  const words = wordsQuery.data?.words ?? [];
  const total = wordsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const hasActiveFilters = posFilter !== 'all' || levelFilter !== 'all' || statusFilter.length > 0;

  // Build swipe game URL with current filters
  const swipeUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (posFilter !== 'all') p.set('pos', posFilter);
    if (levelFilter !== 'all') {
      if (isChinese) p.set('hskLevel', levelFilter);
      else p.set('level', levelFilter);
    }
    if (isChinese) p.set('lang', 'chinese');
    const qs = p.toString();
    return `/play${qs ? '?' + qs : ''}`;
  }, [posFilter, levelFilter, isChinese]);

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {total.toLocaleString()} words
            </span>
            {/* Persistent Swipe button */}
            <button
              onClick={() => setLocation(swipeUrl)}
              className="flex items-center gap-1 bg-primary/20 text-primary px-2.5 py-1.5 rounded-full press-scale"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Swipe</span>
            </button>
          </div>
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

        {/* Filter toggle + status filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full press-scale transition-colors ${
              hasActiveFilters ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
          {isAuthenticated && (
            <StatusFilter
              selected={statusFilter}
              onChange={(s) => { setStatusFilter(s); setPage(1); }}
            />
          )}
        </div>

        {/* Expanded Filters */}
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
                    {isChinese ? (
                      <>
                        <SelectItem value="1">HSK 1</SelectItem>
                        <SelectItem value="2">HSK 2</SelectItem>
                        <SelectItem value="3">HSK 3</SelectItem>
                        <SelectItem value="4">HSK 4</SelectItem>
                        <SelectItem value="5">HSK 5</SelectItem>
                        <SelectItem value="6">HSK 6</SelectItem>
                        <SelectItem value="7">HSK 7</SelectItem>
                        <SelectItem value="8">HSK 8</SelectItem>
                        <SelectItem value="9">HSK 9</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </>
                    )}
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
                onClick={() => { setPosFilter('all'); setLevelFilter('all'); setStatusFilter([]); setPage(1); }}
                className="text-xs text-destructive font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Swipe hint + icon for authenticated users */}
      {isAuthenticated && words.length > 0 && !wordsQuery.isLoading && (
        <div className="px-4 mb-3">
          <p className="text-[10px] text-muted-foreground text-center">
            Swipe right = <span className="text-primary font-bold">Learned</span> · Swipe left = <span className="text-chart-3 font-bold">Reviewing</span>
          </p>
          {/* Central swipe icon — the core interaction */}
          <div className="flex items-center justify-center gap-3 mt-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 rounded-full bg-chart-3/60" />
              <span className="text-[9px] font-bold text-chart-3 uppercase tracking-wide">Review</span>
            </div>
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md border border-border">
              <ArrowLeftRight className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-primary uppercase tracking-wide">Learned</span>
              <div className="w-8 h-0.5 rounded-full bg-primary/60" />
            </div>
          </div>
        </div>
      )}

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
            <SwipeableWordCard
              key={word.id}
              word={word}
              isAuthenticated={isAuthenticated}
              onClick={() => { setDetailWord(word); setDetailOpen(true); }}
              onMarkLearned={() => {
                markWord.mutate(
                  { wordId: word.id, status: 'learned' },
                  { onSuccess: () => toast.success(`${word.korean} marked as learned`) }
                );
              }}
              onMarkReviewing={() => {
                markWord.mutate(
                  { wordId: word.id, status: 'reviewing' },
                  { onSuccess: () => toast.success(`${word.korean} marked for review`) }
                );
              }}
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
