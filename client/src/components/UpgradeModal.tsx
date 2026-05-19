import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Lock, Sparkles, Zap, Crown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  learnedCount?: number;
  limit?: number;
}

export default function UpgradeModal({ open, onClose, learnedCount, limit = 150 }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const plans = trpc.subscription.getPlans.useQuery(undefined, { enabled: open });
  const checkout = trpc.subscription.createCheckoutSession.useMutation();

  const handleUpgrade = async (priceId: string) => {
    setLoading(priceId);
    try {
      const result = await checkout.mutateAsync({ priceId, origin: window.location.origin });
      if (result.checkoutUrl) {
        toast.info("Redirecting to checkout...");
        // Use location.href to avoid popup blockers on mobile Safari
        window.location.href = result.checkoutUrl;
      } else {
        toast.error("Checkout URL not returned. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  if (!open) return null;

  const proPlans = plans.data?.plans || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 pb-8 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center press-scale"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground">You've reached the limit!</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            You've learned <span className="font-bold text-primary">{learnedCount ?? limit}</span> words.
            Upgrade to Pro for unlimited access.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>Unlimited vocabulary (56,000+ Korean words)</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span>AI-powered translations & grammar tips</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <span>All levels: beginner to advanced</span>
          </div>
        </div>

        {/* Plan buttons */}
        <div className="space-y-2.5">
          {proPlans.map((plan: any) => (
            <Button
              key={plan.stripePriceId}
              onClick={() => handleUpgrade(plan.stripePriceId)}
              disabled={!!loading}
              className={`w-full h-12 text-sm font-bold press-scale ${
                plan.interval === 'year'
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
              }`}
            >
              {loading === plan.stripePriceId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {plan.name} — ${(plan.priceInCents / 100).toFixed(2)}/{plan.interval}
              {plan.interval === 'year' && (
                <span className="ml-2 text-xs opacity-80">(Save 17%)</span>
              )}
            </Button>
          ))}
        </div>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full text-center text-xs text-muted-foreground mt-4 py-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
