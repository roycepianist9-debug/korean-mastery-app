import { useI18n } from "@/contexts/I18nContext";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { X, LogIn, Zap } from "lucide-react";

interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordsLearned: number;
}

export default function SignupPromptModal({ isOpen, onClose, wordsLearned }: SignupPromptModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {t('guest.signupPromptTitle') || 'Great Progress!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-primary mb-1">{wordsLearned}</p>
            <p className="text-sm text-muted-foreground">
              {t('guest.wordsLearned') || 'Words Learned'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-foreground">
              {t('guest.signupPromptMessage') || 'You\'ve reached the demo limit! Sign up to:'}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('guest.saveProgress') || 'Save your progress'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('guest.unlockMore') || 'Unlock 10,000+ words'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('guest.trackStats') || 'Track your statistics'}
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('guest.continueTrying') || 'Continue Trying'}
          </Button>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            className="flex-1 gap-2"
          >
            <LogIn className="w-4 h-4" />
            {t('guest.signUp') || 'Sign Up'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}
