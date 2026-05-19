import { useLocation } from "wouter";
import { Home, BookOpen, Gamepad2, Settings } from "lucide-react";
import { useSound } from "@/contexts/SoundContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { play: sfx } = useSound();
  const { user } = useAuth();

  // Show Settings tab only for admin users
  const isAdmin = user?.role === "admin";

  const { t } = useI18n();
  const tabs = [
    { path: "/", icon: Home, label: t("nav.home") },
    { path: "/play", icon: Gamepad2, label: t("nav.play") },
    { path: "/words", icon: BookOpen, label: t("nav.words") },
    ...(isAdmin ? [{ path: "/admin", icon: Settings, label: t("nav.settings") }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-[480px] mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => { sfx.tap(); setLocation(tab.path); }}
              className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-all duration-200 press-scale ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
