import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import BottomNav from "@/components/BottomNav";
import { useLocation, useSearch } from "wouter";
import {
  Search, ChevronLeft, ChevronRight, BookOpen,
  ArrowLeft, Filter, X, Check, RotateCcw, Gamepad2, Volume2,
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
import UpgradeModal from "@/components/UpgradeModal";
import { toast } from "sonner";
import { useAudio } from "@/hooks/useAudio";

/* ─── Word Card Row ─── */
function WordCard({
  word,
  onClick,
  onMarkLearned,
  onMarkReviewing,
  isAuthenticated,
  locale,
}: {
  word: any;
  onClick: () => void;
  onMarkLearned: () => void;
  onMarkReviewing: () => void;
  isAuthenticated: boolean;
  locale: string;
}) {
  const { speak, isSupported } = useAudio();
  const audioSupported = isSupported();
  return (
    <div className="game-card rounded-2xl flex items-center overflow-hidden">
      {/* Left tappable area → opens popup */}
      <button
        onClick={onClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left p-3.5"
      >
        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <span className="text-base font-black text-foreground">
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
            {audioSupported && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(word.korean || word.chinese || '', word.korean ? 'ko-KR' : 'zh-CN');
                }}
                className="p-1 rounded hover:bg-secondary/60 transition-colors active:scale-95 shrink-0"
                title="Pronounce"
              >
                <Volume2 className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {locale === 'fr' && word.meaningFr ? word.meaningFr : word.meaning}
          </p>
        </div>

      </button>

      {/* Action buttons — only shown when authenticated */}
      {isAuthenticated && (
        <div className="flex items-center gap-1.5 pr-3 shrink-0">
          {/* Red = Review */}
          <button
            onClick={(e) => { e.stopPropagation(); onMarkReviewing(); }}
            className="w-9 h-9 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center justify-center press-scale transition-colors hover:bg-destructive/25 active:scale-95"
            title="Mark for review"
          >
            <RotateCcw className="w-4 h-4 text-destructive" />
          </button>
          {/* Green = Learned */}
          <button
            onClick={(e) => { e.stopPropagation(); onMarkLearned(); }}
            className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center press-scale transition-colors hover:bg-primary/25 active:scale-95"
            title="Mark as learned"
          >
            <Check className="w-4 h-4 text-primary" />
          </button>
        </div>
      )}
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
  const { t } = useI18n();
  const toggle = (status: string) => {
    if (selected.includes(status)) {
      onChange(selected.filter(s => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  const statuses = [
    { key: 'new', label: t('words.new'), color: 'text-accent bg-accent/20 border-accent/40' },
    { key: 'reviewing', label: t('words.reviewing'), color: 'text-chart-3 bg-chart-3/20 border-chart-3/40' },
    { key: 'learned', label: t('words.learned'), color: 'text-primary bg-primary/20 border-primary/40' },
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
  const { t, locale } = useI18n();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);

  // Initialize from URL params — if no params at all (bottom nav), default to New + first level
  const hasAnyUrlParam = !!(params.get("pos") || params.get("level") || params.get("hskLevel") || params.get("statuses"));
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const isChinese = language === 'chinese';
  const defaultLevel = hasAnyUrlParam ? "all" : (isChinese ? "1" : "beginner");
  const defaultStatuses = hasAnyUrlParam ? [] : ["new"];
  
  // Load persisted level filter from localStorage
  const getPersistedLevel = () => {
    try {
      const persisted = localStorage.getItem('wordListLevelFilter');
      if (persisted) return persisted;
    } catch {}
    return defaultLevel;
  };
  
  const [posFilter, setPosFilter] = useState(params.get("pos") || "all");
  const [levelFilter, setLevelFilter] = useState(
    params.get("hskLevel") || params.get("level") || getPersistedLevel()
  );
  
  // Persist level filter to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wordListLevelFilter', levelFilter);
    } catch {}
  }, [levelFilter]);
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const s = params.get("statuses");
    return s ? s.split(",").filter(Boolean) : defaultStatuses;
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
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
    language: (language === 'french' ? 'korean' : language) as 'korean' | 'chinese' | undefined,
  });

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<{ learnedCount: number; limit: number } | null>(null);

  const markWord = trpc.progress.markWord.useMutation({
    onSuccess: (data) => {
      if ((data as any).status === 'paywall_blocked') {
        setPaywallInfo({ learnedCount: (data as any).learnedCount, limit: (data as any).limit });
        setPaywallOpen(true);
        return;
      }
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
            <h1 className="text-xl font-black text-foreground">{t('words.dictionary')}</h1>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {total.toLocaleString()} {t('words.wordsCount')}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('words.searchPlaceholder')}
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
            {t('words.filters')}
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
                    <SelectItem value="all">{t('swipe.allLevels')}</SelectItem>
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
                        <SelectItem value="beginner">{t('swipe.beginner')}</SelectItem>
                        <SelectItem value="intermediate">{t('swipe.intermediate')}</SelectItem>
                        <SelectItem value="advanced">{t('swipe.advanced')}</SelectItem>
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
                    <SelectItem value="all">{t('swipe.allTypes')}</SelectItem>
                    <SelectItem value="noun">{t('swipe.noun')}s</SelectItem>
                    <SelectItem value="verb">{t('swipe.verb')}s</SelectItem>
                    <SelectItem value="adjective">{t('swipe.adjective')}s</SelectItem>
                    <SelectItem value="adverb">{t('swipe.adverb')}s</SelectItem>
                    <SelectItem value="determiner">{t('swipe.determiner')}s</SelectItem>
                    <SelectItem value="interjection">{t('swipe.interjection')}s</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setPosFilter('all'); setLevelFilter('all'); setStatusFilter([]); setPage(1); }}
                className="text-xs text-destructive font-medium"
              >
                {t('words.clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* Swipe Mode Button */}
        {isAuthenticated && words.length > 0 && (
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (levelFilter !== 'all') params.set(isChinese ? 'hskLevel' : 'level', levelFilter);
              if (posFilter !== 'all') params.set('pos', posFilter);
              if (statusFilter.length > 0) params.set('statuses', statusFilter.join(','));
              if (isChinese) params.set('lang', 'chinese');
              setLocation(`/play?${params.toString()}`);
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/20 border border-primary/40 text-primary font-bold text-sm press-scale transition-colors hover:bg-primary/30"
          >
            <Gamepad2 className="w-4 h-4" />
            {t('words.swipeMode')}
          </button>
        )}
      </div>

      {/* Word list */}
      <div className="px-4 space-y-2">
        {wordsQuery.isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="game-card p-3.5 flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))
        ) : words.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">{t('words.noWords')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('words.tryDifferent')}</p>
          </div>
        ) : (
          words.map((word: any) => (
            <WordCard
              key={word.id}
              word={word}
              isAuthenticated={isAuthenticated}
              locale={locale}
              onClick={() => { setDetailWord(word); setDetailOpen(true); }}
              onMarkLearned={() => {
                markWord.mutate(
                  { wordId: word.id, status: 'learned', language: (language === 'french' ? 'korean' : language) as 'korean' | 'chinese' },
                  { onSuccess: (data) => {
                    if ((data as any).status !== 'paywall_blocked') {
                      toast.success(`${word.korean || word.chinese} marked as learned ✓`);
                    }
                  }}
                );
              }}
              onMarkReviewing={() => {
                markWord.mutate(
                  { wordId: word.id, status: 'reviewing', language: (language === 'french' ? 'korean' : language) as 'korean' | 'chinese' },
                  { onSuccess: () => toast.success(`${word.korean || word.chinese} added to review`) }
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

      <UpgradeModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        learnedCount={paywallInfo?.learnedCount}
        limit={paywallInfo?.limit}
      />

      <BottomNav />
    </div>
  );
}
