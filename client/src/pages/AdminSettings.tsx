import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { Settings, Zap, ZapOff, DollarSign, User, Shield } from "lucide-react";

export default function AdminSettings() {
  const { user, isAuthenticated } = useAuth();
  const config = trpc.admin.getConfig.useQuery(undefined, { enabled: isAuthenticated });
  const toggleBypass = trpc.admin.toggleAdminBypass.useMutation({
    onSuccess: (data) => {
      toast.success(data.wordAccessLimit >= 999999 ? "Admin mode ON — unlimited access" : "Admin mode OFF — 150 word cap");
      config.refetch();
    },
    onError: () => toast.error("Failed to update"),
  });

  const isUnlimited = (config.data?.wordAccessLimit ?? 0) >= 999999;

  if (!isAuthenticated || config.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (config.isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-6">
        <Shield className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">Admin access only. This page is not available for regular users.</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-black text-foreground">Admin Settings</h1>
        </div>
        <p className="text-xs text-muted-foreground">Owner-only controls</p>
      </div>

      <div className="px-4 space-y-3">

        {/* Account Info */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Word access limit</span>
            <span className="font-bold text-foreground">
              {isUnlimited ? "Unlimited" : `${config.data?.wordAccessLimit} words`}
            </span>
          </div>
        </div>

        {/* Admin Bypass Toggle */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {isUnlimited
                ? <Zap className="w-4 h-4 text-primary" />
                : <ZapOff className="w-4 h-4 text-muted-foreground" />
              }
              <span className="text-sm font-bold text-foreground">Unlimited Access</span>
            </div>
            <button
              onClick={() => toggleBypass.mutate({ enabled: !isUnlimited })}
              disabled={toggleBypass.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                isUnlimited ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  isUnlimited ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isUnlimited
              ? "You have unlimited access. Toggle off to test the 150-word paywall."
              : "Toggle on to bypass the 150-word cap for your account."
            }
          </p>
        </div>

        {/* Pricing Info */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Subscription Pricing</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pro Monthly</span>
              <span className="text-sm font-bold text-foreground">
                ${((config.data?.proMonthlyPriceCents ?? 999) / 100).toFixed(2)}/mo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pro Annual</span>
              <span className="text-sm font-bold text-foreground">
                ${((config.data?.proAnnualPriceCents ?? 9999) / 100).toFixed(2)}/yr
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            To change prices, update your Stripe product in the{" "}
            <a
              href="https://dashboard.stripe.com/products"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Stripe Dashboard
            </a>
            {" "}and update the price IDs in Management UI → Settings → Secrets.
          </p>
        </div>

        {/* App Info */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground font-bold uppercase mb-2">App Info</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free word cap</span>
              <span className="font-bold text-foreground">150 words / language</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Korean words</span>
              <span className="font-bold text-foreground">56,556</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chinese words</span>
              <span className="font-bold text-foreground">1,932 (HSK)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Live at</span>
              <a href="https://swipefluent.co" target="_blank" rel="noopener noreferrer" className="font-bold text-primary">swipefluent.co</a>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
