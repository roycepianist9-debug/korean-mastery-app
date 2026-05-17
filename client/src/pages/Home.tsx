import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import BottomNav from "@/components/BottomNav";
import LanguageToggle from "@/components/LanguageToggle";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Flame, Trophy, Star, BookOpen, Zap, Target,
  ChevronRight, TrendingUp, Gamepad2, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";


export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const isChinese = language === 'chinese';

  const wordStats = trpc.words.stats.useQuery({ language });
  const gameStats = trpc.gamification.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const progressStats = trpc.progress.getStats.useQuery({ language }, { enabled: isAuthenticated });
  const progressByLevel = trpc.progress.getByLevel.useQuery({ language }, { enabled: isAuthenticated });
  const progressByPos = trpc.progress.getByPos.useQuery({ language }, { enabled: isAuthenticated });

  const gs = gameStats.data;
  const ps = progressStats.data;
  const ws = wordStats.data;

  // Calculate level progress
  const xpForNextLevel = gs ? (gs.level * 100) : 100;
  const xpInCurrentLevel = gs ? (gs.xp % 100) : 0;
  const levelProgress = (xpInCurrentLevel / 100) * 100;

  // Aggregate progress by level
  const levelData = (() => {
    if (!progressByLevel.data || !ws) return [];

    if (isChinese) {
      const hskLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const levelTotals: Record<string, number> = {};
      for (const item of ws.byLevel) {
        if (item.level) levelTotals[item.level] = item.count;
      }
      return hskLevels
        .filter(level => levelTotals[level] && levelTotals[level] > 0)
        .map(level => {
          const total = levelTotals[level] ?? 0;
          const learned = progressByLevel.data
            .filter((r: any) => r.hskLevel === level && r.status === 'learned')
            .reduce((sum: number, r: any) => sum + r.count, 0);
          return { level, total, learned };
        });
    }

    // Korean
    const levels = ['beginner', 'intermediate', 'advanced'] as const;
    const levelTotals: Record<string, number> = {};
    for (const item of ws.byLevel) {
      if (item.level) levelTotals[item.level] = item.count;
    }
    return levels.map(level => {
      const total = levelTotals[level] ?? 0;
      const learned = progressByLevel.data
        .filter((r: any) => r.topikLevel === level && r.status === 'learned')
        .reduce((sum: number, r: any) => sum + r.count, 0);
      return { level, total, learned };
    });
  })();

  // Aggregate progress by POS
  const posData = (() => {
    if (!progressByPos.data || !ws) return [];
    const posTotals: Record<string, number> = {};
    for (const item of ws.byPos) {
      posTotals[item.pos] = item.count;
    }
    const posTypes = ['noun', 'verb', 'adjective', 'adverb'];
    return posTypes.map(pos => {
      const total = posTotals[pos] ?? 0;
      const learned = progressByPos.data
        .filter((r: any) => r.pos === pos && r.status === 'learned')
        .reduce((sum: number, r: any) => sum + r.count, 0);
      return { pos, total, learned };
    }).filter(p => p.total > 0);
  })();

  const levelLabel = (l: string) => {
    if (isChinese) return `HSK ${l}`;
    return l === 'beginner' ? 'Beginner' : l === 'intermediate' ? 'Intermediate' : 'Advanced';
  };

  const levelColor = (l: string) => {
    if (isChinese) {
      const n = parseInt(l);
      if (n <= 2) return 'text-primary';
      if (n <= 4) return 'text-chart-3';
      return 'text-accent';
    }
    return l === 'beginner' ? 'text-primary' : l === 'intermediate' ? 'text-chart-3' : 'text-accent';
  };

  const levelFilterParam = (l: string) => {
    if (isChinese) return `/words?hskLevel=${l}`;
    return `/words?level=${l}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">
              {isAuthenticated ? `Welcome back!` : isChinese ? 'Chinese Mastery' : 'Korean Mastery'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAuthenticated
                ? 'Ready to learn?'
                : isChinese
                  ? `Master ${ws?.total ? ws.total.toLocaleString() : ''} Chinese words`
                  : `Master ${ws?.total ? ws.total.toLocaleString() : '56,000+'} Korean words`
              }
            </p>
          </div>
          {isAuthenticated && gs && (
            <div className="flex items-center gap-1.5 bg-accent/20 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-sm font-black text-accent">{gs.currentStreak}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-3 mt-2">
        {/* Sign in prompt */}
        {!authLoading && !isAuthenticated && (
          <button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full game-card p-4 flex items-center gap-3 press-scale"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm text-foreground">Sign in to track progress</p>
              <p className="text-xs text-muted-foreground">Save your XP, streaks, and learned words</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Game Stats Row */}
        {isAuthenticated && gs && (
          <div className="grid grid-cols-3 gap-2">
            <div className="game-card p-3 text-center">
              <Zap className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{gs.xp}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">XP</p>
            </div>
            <div className="game-card p-3 text-center">
              <Trophy className="w-5 h-5 text-chart-3 mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">Lv.{gs.level}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">{gs.levelTitle}</p>
            </div>
            <div className="game-card p-3 text-center">
              <Star className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{gs.totalWordsLearned}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Learned</p>
            </div>
          </div>
        )}

        {/* Level Progress Bar */}
        {isAuthenticated && gs && (
          <div className="game-card p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">Level {gs.level} → {gs.level + 1}</span>
              <span className="text-xs font-bold text-accent">{xpInCurrentLevel}/100 XP</span>
            </div>
            <Progress value={levelProgress} className="h-2.5" />
          </div>
        )}

        {/* Quick Start */}
        <Button
          onClick={() => setLocation("/play")}
          className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 press-scale rounded-2xl"
        >
          <Gamepad2 className="w-6 h-6 mr-2" />
          Start Swipe Game
        </Button>

        {/* Clickable Progress Stats */}
        {isAuthenticated && ps && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setLocation("/words?statuses=learned")}
              className="game-card p-3 text-center press-scale"
            >
              <p className="text-lg font-black text-primary">{ps.learned}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Learned</p>
            </button>
            <button
              onClick={() => setLocation("/words?statuses=reviewing")}
              className="game-card p-3 text-center press-scale"
            >
              <p className="text-lg font-black text-chart-3">{ps.reviewing}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Reviewing</p>
            </button>
            <button
              onClick={() => setLocation("/words?statuses=new")}
              className="game-card p-3 text-center press-scale"
            >
              <p className="text-lg font-black text-accent">{(ws?.total ?? 0) - ps.learned - ps.reviewing}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">New</p>
            </button>
          </div>
        )}

        {/* Progress by Level - clickable */}
        {isAuthenticated && levelData.length > 0 && (
          <div className="game-card p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-sm font-black text-foreground">Progress by Level</span>
            </div>
            <div className="space-y-3">
              {levelData.map(item => (
                <button
                  key={item.level}
                  onClick={() => setLocation(levelFilterParam(item.level))}
                  className="w-full text-left press-scale"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${levelColor(item.level)}`}>
                      {levelLabel(item.level)} ({item.learned}/{item.total})
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {item.total > 0 ? Math.round((item.learned / item.total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={item.total > 0 ? (item.learned / item.total) * 100 : 0}
                    className="h-2"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress by Type - clickable */}
        {isAuthenticated && posData.length > 0 && (
          <div className="game-card p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-black text-foreground">Progress by Type</span>
            </div>
            <div className="space-y-3">
              {posData.map(item => (
                <button
                  key={item.pos}
                  onClick={() => setLocation(`/words?pos=${item.pos}`)}
                  className="w-full text-left press-scale"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground capitalize">
                      {item.pos} ({item.learned}/{item.total})
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {item.total > 0 ? Math.round((item.learned / item.total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={item.total > 0 ? (item.learned / item.total) * 100 : 0}
                    className="h-2"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Word Stats (unauthenticated) */}
        {!isAuthenticated && ws && (
          <div className="game-card p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-black text-foreground">Dictionary Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {ws.byLevel.map((item: any) => (
                <div key={item.level}>
                  <p className="text-lg font-black text-foreground">{item.count.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{levelLabel(item.level)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
