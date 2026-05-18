import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import BottomNav from "@/components/BottomNav";
import LanguageToggle from "@/components/LanguageToggle";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Flame, Trophy, CalendarDays, BookOpen, Zap, Target,
  ChevronRight, TrendingUp, Gamepad2, LogIn, Volume2, VolumeX, Sun, Moon, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSound } from "@/contexts/SoundContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";



export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { play: sfx, muted, toggleMute } = useSound();
  const { theme, toggleTheme } = useTheme();


  const isChinese = language === 'chinese';

  const wordStats = trpc.words.stats.useQuery({ language });
  const gameStats = trpc.gamification.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const progressStats = trpc.progress.getStats.useQuery({ language }, { enabled: isAuthenticated });
  const progressByLevel = trpc.progress.getByLevel.useQuery({ language }, { enabled: isAuthenticated });
  const progressByPos = trpc.progress.getByPos.useQuery({ language }, { enabled: isAuthenticated });
  const todayCount = trpc.progress.todayCount.useQuery({ language }, { enabled: isAuthenticated });
  const [graphOpen, setGraphOpen] = useState(false);
  const dailyHistory = trpc.progress.dailyHistory.useQuery(
    { language, days: 30 },
    { enabled: isAuthenticated && graphOpen }
  );

  const gs = gameStats.data;
  const ps = progressStats.data;
  const ws = wordStats.data;
  const todayWords = todayCount.data?.count ?? 0;

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

  const langParam = isChinese ? '&lang=chinese' : '';

  const levelFilterParam = (l: string) => {
    if (isChinese) return `/words?hskLevel=${l}&lang=chinese`;
    return `/words?level=${l}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <LanguageToggle />
          <div className="flex items-center gap-2">
            {toggleTheme && (
              <button
                onClick={() => { sfx.pop(); toggleTheme(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary/60 hover:bg-secondary transition-all press-scale"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
              </button>
            )}
            <button
              onClick={() => { sfx.tap(); toggleMute(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary/60 hover:bg-secondary transition-all press-scale"
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
            </button>
          </div>
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
            {/* Today card — opens daily graph */}
            <button
              onClick={() => { sfx.tap(); setGraphOpen(true); }}
              className="game-card p-3 text-center press-scale"
            >
              <CalendarDays className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{todayWords}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Today</p>
            </button>
          </div>
        )}

        {/* Daily Graph Dialog */}
        {graphOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setGraphOpen(false)}
          >
            <div
              className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-5 pb-8 animate-slide-up"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-foreground">Words Learned</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last 30 days · {isChinese ? 'Chinese' : 'Korean'}
                  </p>
                </div>
                <button
                  onClick={() => setGraphOpen(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center press-scale"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {dailyHistory.isLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : dailyHistory.data ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailyHistory.data}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="day"
                          tickFormatter={(v: string) => {
                            const d = new Date(v + 'T00:00:00');
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          interval={4}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--secondary))' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = new Date(label + 'T00:00:00');
                            return (
                              <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
                                <p className="text-[10px] text-muted-foreground">
                                  {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-sm font-black text-primary">
                                  {payload[0].value} learned
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {dailyHistory.data.map((entry, i) => {
                            const isToday = i === dailyHistory.data!.length - 1;
                            return (
                              <Cell
                                key={entry.day}
                                fill={isToday
                                  ? 'hsl(var(--primary))'
                                  : entry.count > 0
                                    ? 'hsl(var(--primary) / 0.5)'
                                    : 'hsl(var(--secondary))'
                                }
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between mt-3 px-1">
                    <div className="text-center">
                      <p className="text-lg font-black text-primary">{todayWords}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-foreground">
                        {dailyHistory.data.reduce((s, d) => s + d.count, 0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">30-day total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-chart-3">
                        {Math.round(dailyHistory.data.reduce((s, d) => s + d.count, 0) / 30)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Daily avg</p>
                    </div>
                  </div>
                </>
              ) : null}
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
          onClick={() => { sfx.whoosh(); setLocation(isChinese ? '/play?lang=chinese' : '/play'); }}
          className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 press-scale rounded-2xl"
        >
          <Gamepad2 className="w-6 h-6 mr-2" />
          Start Swipe Game
        </Button>

        {/* Clickable Progress Stats */}
        {isAuthenticated && ps && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { sfx.tap(); setLocation(`/words?statuses=learned${langParam}`); }}
              className="game-card p-3 text-center press-scale"
            >
              <p className="text-lg font-black text-primary">{ps.learned}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Learned</p>
            </button>
            <button
              onClick={() => { sfx.tap(); setLocation(`/words?statuses=reviewing${langParam}`); }}
              className="game-card p-3 text-center press-scale"
            >
              <p className="text-lg font-black text-chart-3">{ps.reviewing}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Reviewing</p>
            </button>
            <button
              onClick={() => { sfx.tap(); setLocation(`/words?statuses=new${langParam}`); }}
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
                  onClick={() => { sfx.tap(); setLocation(levelFilterParam(item.level)); }}
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
                  onClick={() => { sfx.tap(); setLocation(`/words?pos=${item.pos}${langParam}`); }}
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
