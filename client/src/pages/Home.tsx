import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "wouter";
import {
  Flame, Zap, Trophy, BookOpen, Gamepad2, Target,
  ChevronRight, Star, TrendingUp, Sparkles, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

function LevelBadge({ level, title }: { level: number; title: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/50 flex items-center justify-center game-card-glow">
        <span className="text-3xl font-black text-accent level-glow">{level}</span>
      </div>
      <span className="mt-1.5 text-xs font-bold text-accent uppercase tracking-wider">{title}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, glow }: {
  icon: any; label: string; value: string | number; color: string; glow?: string;
}) {
  return (
    <div className="game-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-xl font-black ${glow || ''}`}>{value}</p>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

function AnimatedBar({ value, max, color, delay = 0 }: {
  value: number; max: number; color: string; delay?: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{
          width: `${pct}%`,
          transition: `width 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`,
        }}
      />
    </div>
  );
}

function ProgressSection({ label, value, max, color, delay }: {
  label: string; value: number; max: number; color: string; delay?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{value.toLocaleString()}</span>
      </div>
      <AnimatedBar value={value} max={max} color={color} delay={delay} />
    </div>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const wordStats = trpc.words.stats.useQuery();
  const gameStats = trpc.gamification.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const progressStats = trpc.progress.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const progressByLevel = trpc.progress.getByLevel.useQuery(undefined, { enabled: isAuthenticated });
  const progressByPos = trpc.progress.getByPos.useQuery(undefined, { enabled: isAuthenticated });

  // Aggregate progress by level
  const levelBreakdown = useMemo(() => {
    if (!progressByLevel.data || !wordStats.data) return [];
    const levels = ['beginner', 'intermediate', 'advanced'] as const;
    const labels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
    const colors = {
      beginner: 'bg-gradient-to-r from-primary to-primary/70',
      intermediate: 'bg-gradient-to-r from-chart-3 to-chart-3/70',
      advanced: 'bg-gradient-to-r from-accent to-accent/70',
    };

    return levels.map(level => {
      const rows = progressByLevel.data.filter((r: any) => r.topikLevel === level);
      const learned = rows.find((r: any) => r.status === 'learned')?.count ?? 0;
      const reviewing = rows.find((r: any) => r.status === 'reviewing')?.count ?? 0;
      const total = wordStats.data.byLevel?.find((l: any) => l.level === level)?.count ?? 1;
      return {
        level,
        label: labels[level],
        learned,
        reviewing,
        total,
        color: colors[level],
      };
    });
  }, [progressByLevel.data, wordStats.data]);

  // Aggregate progress by POS
  const posBreakdown = useMemo(() => {
    if (!progressByPos.data || !wordStats.data) return [];
    const posTypes = ['noun', 'verb', 'adjective', 'adverb'];
    const colors: Record<string, string> = {
      noun: 'bg-gradient-to-r from-primary to-primary/70',
      verb: 'bg-gradient-to-r from-chart-3 to-chart-3/70',
      adjective: 'bg-gradient-to-r from-accent to-accent/70',
      adverb: 'bg-gradient-to-r from-muted-foreground to-muted-foreground/70',
    };

    return posTypes.map(pos => {
      const rows = progressByPos.data.filter((r: any) => r.pos === pos);
      const learned = rows.find((r: any) => r.status === 'learned')?.count ?? 0;
      const total = wordStats.data.byPos?.find((p: any) => p.pos === pos)?.count ?? 1;
      return { pos, label: pos.charAt(0).toUpperCase() + pos.slice(1) + 's', learned, total, color: colors[pos] || colors.adverb };
    });
  }, [progressByPos.data, wordStats.data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Sparkles className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <span className="text-4xl">🇰🇷</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Korean Mastery</h1>
            <p className="text-muted-foreground mt-2">Master 56,000+ Korean words through gamified flashcards</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-left p-3 game-card rounded-xl">
              <Gamepad2 className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">Swipe-based flashcard game</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 game-card rounded-xl">
              <Trophy className="w-5 h-5 text-accent shrink-0" />
              <span className="text-sm">XP, streaks, and level progression</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 game-card rounded-xl">
              <BookOpen className="w-5 h-5 text-chart-3 shrink-0" />
              <span className="text-sm">Full KRDICT dictionary with 56k+ words</span>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full font-bold text-base h-12 press-scale"
            onClick={() => window.location.href = getLoginUrl("/")}
          >
            Start Learning
          </Button>
        </div>
      </div>
    );
  }

  const stats = gameStats.data;
  const progress = progressStats.data;
  const wStats = wordStats.data;
  const xpToNext = stats ? (stats.level * 100) - (stats.xp % 100) : 100;
  const xpProgress = stats ? (stats.xp % 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
            <h1 className="text-xl font-black text-foreground">{user?.name || 'Learner'}</h1>
          </div>
          <LevelBadge level={stats?.level ?? 1} title={stats?.levelTitle ?? 'Beginner'} />
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="px-4 mb-6">
        <div className="game-card p-4 game-card-glow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary xp-glow">{stats?.xp ?? 0} XP</span>
            </div>
            <span className="text-xs text-muted-foreground">{xpToNext} XP to next level</span>
          </div>
          <AnimatedBar value={xpProgress} max={100} color="bg-gradient-to-r from-primary to-primary/70" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 mb-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={stats?.currentStreak ?? 0}
          color="bg-chart-3/20 text-chart-3"
          glow="text-chart-3"
        />
        <StatCard
          icon={Target}
          label="Words Learned"
          value={stats?.totalWordsLearned ?? 0}
          color="bg-primary/20 text-primary"
          glow="text-primary"
        />
      </div>

      {/* Quick Play Button */}
      <div className="px-4 mb-6">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-black press-scale bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          onClick={() => setLocation("/play")}
        >
          <Gamepad2 className="w-6 h-6 mr-2" />
          Start Swipe Session
        </Button>
      </div>

      {/* Overall Progress */}
      <div className="px-4 mb-6">
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Your Progress
            </h2>
            <span className="text-xs text-muted-foreground">
              {(progress?.total ?? 0).toLocaleString()} / {(wStats?.total ?? 0).toLocaleString()} words
            </span>
          </div>
          <div className="space-y-3">
            <ProgressSection
              label="✅ Learned"
              value={progress?.learned ?? 0}
              max={wStats?.total ?? 1}
              color="bg-gradient-to-r from-primary to-primary/70"
              delay={0}
            />
            <ProgressSection
              label="🔄 Reviewing"
              value={progress?.reviewing ?? 0}
              max={wStats?.total ?? 1}
              color="bg-gradient-to-r from-chart-3 to-chart-3/70"
              delay={100}
            />
            <ProgressSection
              label="🆕 New"
              value={(wStats?.total ?? 0) - (progress?.total ?? 0)}
              max={wStats?.total ?? 1}
              color="bg-gradient-to-r from-muted-foreground to-muted-foreground/70"
              delay={200}
            />
          </div>
        </div>
      </div>

      {/* Progress by TOPIK Level */}
      {levelBreakdown.length > 0 && (
        <div className="px-4 mb-6">
          <div className="game-card p-4">
            <h2 className="text-base font-bold flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-chart-3" />
              Progress by Level
            </h2>
            <div className="space-y-3">
              {levelBreakdown.map((item, i) => (
                <ProgressSection
                  key={item.level}
                  label={`${item.label} (${item.learned}/${item.total})`}
                  value={item.learned}
                  max={item.total}
                  color={item.color}
                  delay={i * 100}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress by Part of Speech */}
      {posBreakdown.length > 0 && (
        <div className="px-4 mb-6">
          <div className="game-card p-4">
            <h2 className="text-base font-bold flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-accent" />
              Progress by Type
            </h2>
            <div className="space-y-3">
              {posBreakdown.map((item, i) => (
                <ProgressSection
                  key={item.pos}
                  label={`${item.label} (${item.learned}/${item.total})`}
                  value={item.learned}
                  max={item.total}
                  color={item.color}
                  delay={i * 80}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="px-4 mb-6 space-y-3">
        <button
          onClick={() => setLocation("/play?level=beginner")}
          className="w-full game-card p-4 flex items-center justify-between press-scale"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Beginner Words</p>
              <p className="text-xs text-muted-foreground">TOPIK Level 1-2 · {wStats?.byLevel?.find((l: any) => l.level === 'beginner')?.count ?? '~2.5k'} words</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => setLocation("/play?level=intermediate")}
          className="w-full game-card p-4 flex items-center justify-between press-scale"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chart-3/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-chart-3" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Intermediate Words</p>
              <p className="text-xs text-muted-foreground">TOPIK Level 3-4 · {wStats?.byLevel?.find((l: any) => l.level === 'intermediate')?.count ?? '~15k'} words</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => setLocation("/words")}
          className="w-full game-card p-4 flex items-center justify-between press-scale"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Browse All Words</p>
              <p className="text-xs text-muted-foreground">Search & filter the full dictionary</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
