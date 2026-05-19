import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { Settings, Zap, ZapOff, DollarSign, User, Shield, Save, X, Sparkles, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const { user, isAuthenticated } = useAuth();
  const config = trpc.admin.getConfig.useQuery(undefined, { enabled: isAuthenticated });
  const [monthlyPrice, setMonthlyPrice] = useState<string>("");
  const [annualPrice, setAnnualPrice] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [freeWordCap, setFreeWordCap] = useState<string>("150");
  const [isEditingWordCap, setIsEditingWordCap] = useState(false);
  const [editWordId, setEditWordId] = useState<string>("");
  const [editMeaningFr, setEditMeaningFr] = useState<string>("");
  const [isEditingWord, setIsEditingWord] = useState(false);

  // Populate price fields when config loads
  useEffect(() => {
    if (config.data) {
      setMonthlyPrice((config.data.proMonthlyPriceCents / 100).toFixed(2));
      setAnnualPrice((config.data.proAnnualPriceCents / 100).toFixed(2));
    }
  }, [config.data]);

  const toggleBypass = trpc.admin.toggleAdminBypass.useMutation({
    onSuccess: (data) => {
      toast.success(data.wordAccessLimit >= 999999 ? "Admin mode ON — unlimited access" : "Admin mode OFF — 150 word cap");
      config.refetch();
    },
    onError: () => toast.error("Failed to update"),
  });

  const updatePricing = trpc.admin.updatePricing.useMutation({
    onSuccess: () => {
      toast.success("Pricing updated!");
      setIsEditing(false);
      config.refetch();
    },
    onError: () => toast.error("Failed to update pricing"),
  });

  const batchTranslateChinese = trpc.admin.batchTranslateChinese.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ Chinese: Translated ${data.successCount} words, ${data.failureCount} failed`);
    },
    onError: (error) => toast.error(`Translation failed: ${error.message}`),
  });

  const batchTranslateKorean = trpc.admin.batchTranslateKorean.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ Korean: Translated ${data.successCount} words, ${data.failureCount} failed`);
    },
    onError: (error) => toast.error(`Translation failed: ${error.message}`),
  });

  const updateFreeWordCap = trpc.admin.updateFreeWordCap.useMutation({
    onSuccess: (data) => {
      toast.success(`Free word cap updated to ${data.wordCap}`);
      setIsEditingWordCap(false);
    },
    onError: () => toast.error("Failed to update word cap"),
  });

  const editWordDefinition = trpc.admin.editWordDefinition.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ Word #${data.wordId} updated`);
      setIsEditingWord(false);
      setEditWordId("");
      setEditMeaningFr("");
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const handleSavePricing = () => {
    const monthly = parseFloat(monthlyPrice);
    const annual = parseFloat(annualPrice);
    if (isNaN(monthly) || isNaN(annual) || monthly < 0.50 || annual < 5) {
      toast.error("Invalid prices. Min: $0.50/mo, $5.00/yr");
      return;
    }
    updatePricing.mutate({
      proMonthlyPriceCents: Math.round(monthly * 100),
      proAnnualPriceCents: Math.round(annual * 100),
    });
  };

  const handleSaveWordCap = () => {
    const cap = parseInt(freeWordCap);
    if (isNaN(cap) || cap < 10 || cap > 10000) {
      toast.error("Invalid word cap. Range: 10-10000");
      return;
    }
    updateFreeWordCap.mutate({ wordCap: cap });
  };

  const handleSaveWordDefinition = () => {
    const wordId = parseInt(editWordId);
    if (isNaN(wordId) || wordId < 1) {
      toast.error("Invalid word ID");
      return;
    }
    if (!editMeaningFr.trim()) {
      toast.error("Definition cannot be empty");
      return;
    }
    editWordDefinition.mutate({ wordId, meaningFr: editMeaningFr });
  };

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

        {/* Pricing Config */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Subscription Pricing</span>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-bold">Pro Monthly ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-bold">Pro Annual ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="5.00"
                  value={annualPrice}
                  onChange={(e) => setAnnualPrice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSavePricing}
                  disabled={updatePricing.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setMonthlyPrice((config.data?.proMonthlyPriceCents ?? 999) / 100 + "");
                    setAnnualPrice((config.data?.proAnnualPriceCents ?? 9999) / 100 + "");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm hover:opacity-90"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Batch Translation */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Batch French Translation</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Translate example sentences to French. Each takes a few minutes.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => batchTranslateChinese.mutate()}
              disabled={batchTranslateChinese.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {batchTranslateChinese.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chinese...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Translate Chinese (HSK 1-6)
                </>
              )}
            </button>
            <button
              onClick={() => batchTranslateKorean.mutate()}
              disabled={batchTranslateKorean.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {batchTranslateKorean.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Korean...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Translate Korean (TOPIK 1-6)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Free Word Cap Editor */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Free Word Cap</span>
            </div>
            {!isEditingWordCap && (
              <button
                onClick={() => setIsEditingWordCap(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingWordCap ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-bold">Free Word Limit (10-10000)</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={freeWordCap}
                  onChange={(e) => setFreeWordCap(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWordCap}
                  disabled={updateFreeWordCap.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingWordCap(false);
                    setFreeWordCap("150");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm hover:opacity-90"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm font-bold text-foreground">{freeWordCap} words / language</div>
          )}
        </div>

        {/* Edit Word Definition */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Edit Word Definition</span>
            </div>
            {!isEditingWord && (
              <button
                onClick={() => setIsEditingWord(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingWord ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-bold">Word ID</label>
                <input
                  type="number"
                  min="1"
                  value={editWordId}
                  onChange={(e) => setEditWordId(e.target.value)}
                  placeholder="e.g., 1234"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-bold">French Definition</label>
                <textarea
                  value={editMeaningFr}
                  onChange={(e) => setEditMeaningFr(e.target.value)}
                  placeholder="e.g., passer (un coup de téléphone), téléphoner"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWordDefinition}
                  disabled={editWordDefinition.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {editWordDefinition.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingWord(false);
                    setEditWordId("");
                    setEditMeaningFr("");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm hover:opacity-90"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Click Edit to override a word definition</div>
          )}
        </div>

        {/* App Info */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground font-bold uppercase mb-2">App Info</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free word cap</span>
              <span className="font-bold text-foreground">{freeWordCap} words / language</span>
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
