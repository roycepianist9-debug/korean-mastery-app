import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FrenchOnboardingModal() {
  const { locale, setLocale } = useI18n();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already seen the onboarding
    const hasSeenFrenchOnboarding = localStorage.getItem("frenchOnboardingShown");
    
    // Show modal if:
    // 1. User hasn't seen it before
    // 2. Browser language is French (or French variant)
    // 3. Current locale is English
    if (!hasSeenFrenchOnboarding && locale === "en") {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("fr")) {
        setShowModal(true);
      }
    }
  }, [locale]);

  const handleSwitchToFrench = () => {
    setLocale("fr");
    localStorage.setItem("frenchOnboardingShown", "true");
    setShowModal(false);
  };

  const handleStayEnglish = () => {
    localStorage.setItem("frenchOnboardingShown", "true");
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 pb-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground">Bienvenue! 🇫🇷</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We detected French as your browser language. Would you like to use SwipeFluent in French?
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-6 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>All card meanings in French</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Dashboard & menus in French</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Example sentences in French</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <Button
            onClick={handleSwitchToFrench}
            className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Oui, utiliser en Français ✓
          </Button>
          <Button
            onClick={handleStayEnglish}
            variant="outline"
            className="w-full h-12 text-sm font-bold"
          >
            Stay in English
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          You can change this anytime in the hamburger menu (☰)
        </p>
      </div>
    </div>
  );
}
