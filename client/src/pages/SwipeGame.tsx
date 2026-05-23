import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import BottomNav from "@/components/BottomNav";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Check, X, Undo2, RotateCcw, Zap,
  Trophy, Sparkles, Gamepad2, Info, ChevronRight, LogIn,
  BookOpen, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import WordDetailSheet from "@/components/WordDetailSheet";
import ClickableExample from "@/components/ClickableExample";
import { useSound } from "@/contexts/SoundContext";
import UpgradeModal from "@/components/UpgradeModal";
import { useI18n } from "@/contexts/I18nContext";
import { useAudio } from "@/hooks/useAudio";

interface SwipeResult {
  wordId: number;
  known: boolean;
}

type CardFilter = 'new' | 'reviewing' | 'all';

/* ─── Inline AI Translation Hook ─── */
function useExampleTranslation(
  sentence: string | null | undefined,
  existingEnglish: string | null | undefined,
  language: 'korean' | 'chinese' | undefined,
  enabled: boolean
) {
  const translate = trpc.llm.translateExample.useMutation();
  const [translation, setTranslation] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const attempted = useRef<string | null>(null);

  const doTranslate = useCallback((s: string) => {
    setFailed(false);
    translate.mutate(
      { koreanSentence: s, language },
      {
        onSuccess: (data) => {
          if (data?.translation) setTranslation(data.translation);
          else setFailed(true);
        },
        onError: () => setFailed(true),
      }
    );
  }, [translate, language]);

  useEffect(() => {
    if (!enabled) return;
    if (existingEnglish) {
      setTranslation(existingEnglish);
      setFailed(false);
      return;
    }
    if (!sentence) { setTranslation(null); setFailed(false); return; }
    if (attempted.current === sentence) return;
    attempted.current = sentence;
    doTranslate(sentence);
  }, [enabled, sentence, existingEnglish, doTranslate]);
