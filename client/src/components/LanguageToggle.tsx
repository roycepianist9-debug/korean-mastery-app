import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1">
      <Button
        variant={language === 'korean' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('korean')}
        className="text-lg"
      >
        🇰🇷
      </Button>
      <Button
        variant={language === 'chinese' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('chinese')}
        className="text-lg"
      >
        🇨🇳
      </Button>
    </div>
  );
}
