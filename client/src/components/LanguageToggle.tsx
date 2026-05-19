import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const { studyLanguage, setStudyLanguage } = useLanguage();
  const { play: sfx } = useSound();

  return (
    <div className="flex gap-1">
      <Button
        variant={studyLanguage === 'korean' ? 'default' : 'outline'}
        size="sm"
        onClick={() => { sfx.pop(); setStudyLanguage('korean'); }}
        className="text-lg"
        title="Study Korean"
      >
        🇰🇷
      </Button>
      <Button
        variant={studyLanguage === 'chinese' ? 'default' : 'outline'}
        size="sm"
        onClick={() => { sfx.pop(); setStudyLanguage('chinese'); }}
        className="text-lg"
        title="Study Chinese"
      >
        🇨🇳
      </Button>
    </div>
  );
}
