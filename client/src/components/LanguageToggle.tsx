import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { play: sfx } = useSound();
  const { setLocale } = useI18n();

  return (
    <div className="flex gap-1">
      <Button
        variant={language === 'korean' ? 'default' : 'outline'}
        size="sm"
        onClick={() => { sfx.pop(); setLanguage('korean'); }}
        className="text-lg"
        title="English (Korean)"
      >
        🇰🇷
      </Button>
      <Button
        variant={language === 'chinese' ? 'default' : 'outline'}
        size="sm"
        onClick={() => { sfx.pop(); setLanguage('chinese'); }}
        className="text-lg"
        title="English (Chinese)"
      >
        🇨🇳
      </Button>
      {/* Japanese button hidden for now - will be enabled with HSK levels expansion */}
      {/* <Button
        variant={language === 'japanese' ? 'default' : 'outline'}
        size="sm"
        onClick={() => { sfx.pop(); setLanguage('japanese'); }}
        className="text-lg"
        title="English (Japanese)"
      >
        🇯🇵
      </Button> */}
    </div>
  );
}
