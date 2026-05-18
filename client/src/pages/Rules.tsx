import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Gamepad2, BookOpen, Home as HomeIcon,
  Smartphone, Hand, CheckCircle2, RotateCcw, Zap, Trophy, CreditCard,
} from "lucide-react";

export default function Rules() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors press-scale mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Back</span>
        </button>
        <h1 className="text-2xl font-black text-foreground">How to Use</h1>
        <p className="text-sm text-muted-foreground mt-1">Master Korean & Chinese vocabulary with swipe-based learning</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Swipe Basics */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-primary" />
            <h2 className="text-base font-black text-foreground">Swipe to Learn</h2>
          </div>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowLeft className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Swipe LEFT = Learned</p>
                <p className="text-xs">You know this word. It moves to your "Learned" pile.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRight className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="font-bold text-foreground">Swipe RIGHT = Review</p>
                <p className="text-xs">Need more practice. It stays in your "Review" pile.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-chart-3" />
            <h2 className="text-base font-black text-foreground">Navigation</h2>
          </div>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <HomeIcon className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Home</p>
                <p className="text-xs">Your dashboard with stats, streaks, and progress overview.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Gamepad2 className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Play</p>
                <p className="text-xs">Start a swipe session. Choose level, card count, and filter (New/Review/Learned).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Words</p>
                <p className="text-xs">Browse the full dictionary. Tap a word for details. Use the green/red buttons to mark words.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress System */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <h2 className="text-base font-black text-foreground">Progress System</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span><span className="font-bold text-foreground">+10 XP</span> for each word learned</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-chart-3" />
              <span><span className="font-bold text-foreground">+3 XP</span> for each word reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Track milestones: <span className="font-bold text-foreground">TOPIK 1-6</span> (Korean) and <span className="font-bold text-foreground">HSK 1-6</span> (Chinese)</span>
            </div>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇰🇷 🇨🇳</span>
            <h2 className="text-base font-black text-foreground">Two Languages</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Toggle between <span className="font-bold text-foreground">Korean</span> and <span className="font-bold text-foreground">Chinese</span> using the flag buttons at the top of the Home screen. Progress is tracked separately for each language.
          </p>
        </div>

        {/* Pro Subscription */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-black text-foreground">Free vs Pro</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p><span className="font-bold text-foreground">Free:</span> Learn up to 150 words per language.</p>
            <p><span className="font-bold text-foreground">Pro ($9.99/mo or $99.99/yr):</span> Unlimited access to the full dictionary (56,000+ Korean words, 4,000+ Chinese words).</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
