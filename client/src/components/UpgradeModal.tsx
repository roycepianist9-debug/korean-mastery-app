import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Lock, Sparkles, Zap, Crown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  learnedCount?: number;
  limit?: number;
}

export default function UpgradeModal({ open, onClose, learnedCount, limit = 150 }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { t } = useI18n();
  const plans = trpc.subscription.getPlans.useQuery(undefined, { enabled: open });
  const checkout = trpc.subscription.createCheckoutSession.useMutation();

  const handleUpgrade = async (priceId: string) => {
    setLoading(priceId);
    try {
      const result = await checkout.mutateAsync({ priceId, origin: window.location.origin });
      if (result.checkoutUrl) {
        toast.info(t('upgrade.redirecting'));
        window.location.href = result.checkoutUrl;
      } else {
        toast.error(t('upgrade.failed'));
      }
    } catch (error) {
      toast.error(t('upgrade.failed'));
    } finally {
      setLoading(null);
    }
  };

  if (!open) return null;

  const proPlans = plans.data?.plans || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 pb-6 sm:pb-8 animate-slide-up overflow-hidden"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground">{t('upgrade.limitReached')}</h2>
          <p className="text-sm text-muted-foreground mt-1.5 px-2">
            <span className="font-bold text-primary">{learnedCount ?? limit}</span> {t('upgrade.wordsLearned')}.
            {' '}{t('upgrade.subtitle')}.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>{t('upgrade.unlimitedWords')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span>{t('upgrade.aiTranslations')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <span>{t('upgrade.allLevels')}</span>
          </div>
        </div>

        {/* Plan buttons */}
        <div className="space-y-2">
          {proPlans.map((plan: any) => (
            <Button
              key={plan.stripePriceId}
              onClick={() => handleUpgrade(plan.stripePriceId)}
              disabled={!!loading}
              className={`w-full h-auto py-3 px-3 text-sm font-bold press-scale flex flex-col items-center justify-center gap-1 ${
                plan.interval === 'year'
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
              }`}
            >
              <div className="flex items-center gap-2 w-full justify-center">
                {loading === plan.stripePriceId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                <span className="truncate">
                  {plan.interval === 'year' ? t('upgrade.annual') : t('upgrade.monthly')} — ${(plan.priceInCents / 100).toFixed(2)}{plan.interval === 'year' ? t('upgrade.year') : t('upgrade.month')}
                </span>
              </div>
              {plan.interval === 'year' && (
                <span className="text-xs opacity-80">({t('upgrade.save')})</span>
              )}
            </Button>
          ))}
        </div>


      </div>
    </div>
  );
}
