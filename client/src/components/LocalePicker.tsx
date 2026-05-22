import { useI18n, Locale } from "@/contexts/I18nContext";
import { useState } from "react";

export default function LocalePicker() {
  const { setLocale, setHasChosenLocale } = useI18n();
  const [selected, setSelected] = useState<Locale>("en");

  const handleContinue = () => {
    setLocale(selected);
    setHasChosenLocale(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* App logo/title */}
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">SwipeFluent</h1>
          <p className="text-muted-foreground text-sm">Choose your app language</p>
          <p className="text-muted-foreground text-xs mt-1">Choisissez la langue de l'application</p>
        </div>

        {/* Language options */}
        <div className="space-y-3">
          <button
            onClick={() => setSelected("en")}
            className={`w-full p-4 rounded-2xl border-2 transition-all press-scale flex items-center gap-4 ${
              selected === "en"
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:border-muted-foreground/30"
            }`}
          >
            <span className="text-2xl">🇬🇧</span>
            <div className="text-left">
              <p className="font-bold text-foreground">English</p>
              <p className="text-xs text-muted-foreground">Navigate the app in English</p>
            </div>
            {selected === "en" && (
              <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          <button
            onClick={() => setSelected("fr")}
            className={`w-full p-4 rounded-2xl border-2 transition-all press-scale flex items-center gap-4 ${
              selected === "fr"
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:border-muted-foreground/30"
            }`}
          >
            <span className="text-2xl">🇫🇷</span>
            <div className="text-left">
              <p className="font-bold text-foreground">Français</p>
              <p className="text-xs text-muted-foreground">Naviguer dans l'appli en français</p>
            </div>
            {selected === "fr" && (
              <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base press-scale transition-transform hover:opacity-90"
        >
          {selected === "fr" ? "Continuer" : "Continue"}
        </button>
      </div>
    </div>
  );
}
