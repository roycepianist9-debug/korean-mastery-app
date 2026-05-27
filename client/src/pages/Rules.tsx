import { useState } from "react";
import { useLocation } from "wouter";
import { useI18n } from "@/contexts/I18nContext";
import {
  ArrowLeft, ArrowRight, Gamepad2, BookOpen, Home as HomeIcon,
  Smartphone, Hand, CheckCircle2, RotateCcw, Zap, Trophy, CreditCard,
} from "lucide-react";

export default function Rules() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors press-scale mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">{t('rules.back')}</span>
        </button>
        <h1 className="text-2xl font-black text-foreground">{t('rules.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('rules.swipeDesc').split('.')[0]}.</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Swipe Basics */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-primary" />
            <h2 className="text-base font-black text-foreground">{t('rules.swipeTitle')}</h2>
          </div>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowLeft className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{t('swipe.swipeLeft')}</p>
                <p className="text-xs">{t('rules.swipeDesc').split('.')[0]}.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRight className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="font-bold text-foreground">{t('swipe.swipeRight')}</p>
                <p className="text-xs">{t('rules.swipeDesc').split('.')[1]}.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-chart-3" />
            <h2 className="text-base font-black text-foreground">{t('rules.navTitle')}</h2>
          </div>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <HomeIcon className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">{t('nav.home')}</p>
                <p className="text-xs">{t('rules.navDesc').split('.')[0]}.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Gamepad2 className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">{t('nav.play')}</p>
                <p className="text-xs">{t('rules.navDesc').split('.')[1]}.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">{t('nav.words')}</p>
                <p className="text-xs">{t('rules.navDesc').split('.')[2]}.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress System */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <h2 className="text-base font-black text-foreground">{t('rules.progressTitle')}</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span><span className="font-bold text-foreground">+10 XP</span> {t('swipe.markedLearned').toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-chart-3" />
              <span><span className="font-bold text-foreground">+3 XP</span> {t('swipe.markedReview').toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>{t('rules.progressDesc')}</span>
            </div>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇰🇷 🇨🇳</span>
            <h2 className="text-base font-black text-foreground">
              {t('rules.progressDesc').includes('coréen') ? 'Deux langues' : 'Two Languages'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('rules.progressDesc')}
          </p>
        </div>

        {/* Pro Subscription */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-black text-foreground">{t('rules.proTitle')}</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p>{t('rules.proDesc')}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
