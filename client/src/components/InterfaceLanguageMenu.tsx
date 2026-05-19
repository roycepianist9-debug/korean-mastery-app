import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function InterfaceLanguageMenu() {
  const { interfaceLanguage, setInterfaceLanguage } = useLanguage();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        {interfaceLanguage === 'fr' ? 'Langue de l\'interface' : 'App Language'}
      </p>
      <div className="flex flex-col gap-2">
        <Button
          variant={interfaceLanguage === 'en' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInterfaceLanguage('en')}
          className="w-full justify-between"
        >
          <span>English</span>
          {interfaceLanguage === 'en' && <Check className="w-4 h-4" />}
        </Button>
        <Button
          variant={interfaceLanguage === 'fr' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInterfaceLanguage('fr')}
          className="w-full justify-between"
        >
          <span>Français</span>
          {interfaceLanguage === 'fr' && <Check className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
