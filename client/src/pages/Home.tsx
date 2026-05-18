import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import BottomNav from "@/components/BottomNav";
import UpgradeModal from "@/components/UpgradeModal";
import LanguageToggle from "@/components/LanguageToggle";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Flame, Trophy, CalendarDays, BookOpen, Zap, Target,
  ChevronRight, TrendingUp, Gamepad2, LogIn, Volume2, VolumeX, Sun, Moon, X, Award, CheckCircle2, Circle,
  Menu, Settings, CreditCard, Info, LogOut, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSound } from "@/contexts/SoundContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";



// ─── Milestone Data ─────────────────────────────────────────────────────────

const KOREAN_MILESTONES = [
  { level: 'TOPIK 1', words: 1000, label: 'Basic Understanding' },
  { level: 'TOPIK 2', words: 2000, label: 'Conversational Fluency' },
  { level: 'TOPIK 3', words: 4000, label: 'Advanced Comprehension' },
  { level: 'TOPIK 4', words: 6000, label: 'Professional Proficiency' },
  { level: 'TOPIK 5', words: 8000, label: 'Advanced Proficiency' },
  { level: 'TOPIK 6', words: 10000, label: 'Near-Native Fluency' },
];

const CHINESE_MILESTONES = [
  { level: 'HSK 1', words: 300, label: 'Elementary' },
  { level: 'HSK 2', words: 600, label: 'Elementary+' },
  { level: 'HSK 3', words: 900, label: 'Intermediate' },
  { level: 'HSK 4', words: 1200, label: 'Intermediate+' },
  { level: 'HSK 5', words: 2500, label: 'Advanced Proficiency' },
  { level: 'HSK 6', words: 5000, label: 'Advanced Fluency' },
  { level: 'HSK 7-9', words: 11000, label: 'Near-Native Proficiency' },
];

function MilestoneCard({ language, learnedCount }: { language: string; learnedCount: number }) {
  const milestones = language === 'chinese' ? CHINESE_MILESTONES : KOREAN_MILESTONES;
  const title = language === 'chinese' ? 'HSK Milestones' : 'TOPIK Milestones';

  return (
    <div className="game-card p-3.5">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-chart-3" />
        <span className="text-sm font-black text-foreground">{title}</span>
      </div>
      <div className="space-y-3">
        {milestones.map((m, i) => {
          const prev = i === 0 ? 0 : milestones[i - 1].words;
          const completed = learnedCount >= m.words;
          const inProgress = !completed && learnedCount > prev;
          const pct = inProgress
            ? Math.round(((learnedCount - prev) / (m.words - prev)) * 100)
            : 0;

          return (
            <div key={m.level} className="space-y-1">
              <div className="flex items-center gap-2">
                {completed ? (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                ) : inProgress ? (
                  <div className="w-4 h-4 flex-shrink-0 relative">
                    <Circle className="w-4 h-4 text-chart-3 absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-chart-3" />
                    </div>
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${completed ? 'text-primary' : inProgress ? 'text-chart-3' : 'text-muted-foreground/60'}`}>
                      {m.level} · {m.words.toLocaleString()} words
                    </span>
                    {inProgress && (
                      <span className="text-[10px] font-bold text-chart-3">{pct}%</span>
                    )}
                  </div>
                  <span className={`text-[10px] ${completed ? 'text-muted-foreground' : inProgress ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                    {m.label}
                  </span>
                </div>
              </div>
              {inProgress && (
                <div className="ml-6">
                  <Progress value={pct} className="h-1.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const [menuOpen, setMenuOpen] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openPortalMutation = trpc.subscription.openCustomerPortal.useMutation({
    onSuccess: (data) => {
      if (data.portalUrl) window.open(data.portalUrl, '_blank');
    },
    onError: () => {
      // No Stripe customer yet → show upgrade flow
      setUpgradeOpen(true);
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = '/'; },
  });
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
            <button
              onClick={() => { sfx.tap(); setMenuOpen(true); }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary/60 hover:bg-secondary transition-all press-scale"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Slide-in Menu Overlay */}
          {menuOpen && (
            <div className="fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMenuOpen(false)}
              />
              {/* Menu Panel */}
              <div className="relative ml-auto w-72 h-full bg-background border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-8 pb-4 border-b border-border">
                  <div>
                    <p className="text-sm font-black text-foreground">{user?.name || 'Guest'}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 press-scale"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 px-3 py-4 space-y-1">
                  {/* Manage Subscription */}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        sfx.tap();
                        setMenuOpen(false);
                        openPortalMutation.mutate();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition-all press-scale text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Manage Subscription</p>
                        <p className="text-xs text-muted-foreground">Billing, upgrade, cancel</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  )}

                  {/* Admin Settings */}
                  {isAuthenticated && user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        sfx.tap();
                        setMenuOpen(false);
                        setLocation('/admin');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition-all press-scale text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-chart-3/15 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-chart-3" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Admin Settings</p>
                        <p className="text-xs text-muted-foreground">Pricing, access, config</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  )}

                  {/* Rules */}
                  <button
                    onClick={() => {
                      sfx.tap();
                      setMenuOpen(false);
                      setLocation('/rules');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition-all press-scale text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-chart-3/15 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Rules</p>
                      <p className="text-xs text-muted-foreground">How to use the app</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>

                  {/* About */}
                  <button
                    onClick={() => {
                      sfx.tap();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition-all press-scale text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                      <Info className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">About</p>
                      <p className="text-xs text-muted-foreground">Version 1.0 · Korean & Chinese</p>
                    </div>
                  </button>

                  {/* Guest Sign In */}
                  {!isAuthenticated && (
                    <button
                      onClick={() => {
                        sfx.tap();
                        setMenuOpen(false);
                        window.location.href = getLoginUrl();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition-all press-scale text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <LogIn className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Sign up / Sign in</p>
                        <p className="text-xs text-muted-foreground">Save progress & unlock features</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  )}
                </div>

                {/* Logout */}
                {isAuthenticated && (
                  <div className="px-3 pb-8 border-t border-border pt-3">
                    <button
                      onClick={() => {
                        sfx.tap();
                        setMenuOpen(false);
                        logoutMutation.mutate();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-all press-scale text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-destructive" />
                      </div>
                      <p className="text-sm font-bold text-destructive">Sign Out</p>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">
              {isAuthenticated
                ? (gs && gs.xp > 0 ? 'Welcome back!' : 'Welcome!')
                : isChinese ? 'Chinese Mastery' : 'Korean Mastery'
              }
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAuthenticated
                ? (gs && gs.xp > 0 ? 'Ready to learn more?' : 'Learn languages by swiping!')
                : 'Learn languages by swiping!'
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
              className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-5 pb-safe animate-slide-up overflow-y-auto"
              style={{ maxHeight: 'calc(90dvh - env(safe-area-inset-bottom, 0px))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
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

        {/* Milestone Card — always visible when authenticated */}
        {isAuthenticated && (
          <MilestoneCard language={language} learnedCount={ps?.learned ?? 0} />
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

        {/* Sign in prompt — below dictionary stats */}
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
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        learnedCount={0}
        limit={150}
      />
      <BottomNav />
    </div>
  );
}
