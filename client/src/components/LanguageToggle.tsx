import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { play: sfx } = useSound();

  return (
    <div className="flex gap-1">
      <Button
        variant={language === 'korean' ? 'default' : 'outline'}
        size="sm"
        onClick={() => { sfx.pop(); setLanguage('korean'); }}
        className="text-lg"
      >
        🇰🇷
      </Button>
      <Button
        variant={language === 'chinese' ? 'default' : 'outline'}
        size="sm"
        onClick={() => { sfx.pop(); setLanguage('chinese'); }}
        className="text-lg"
      >
        🇨🇳
      </Button>
    </div>
  );
}
