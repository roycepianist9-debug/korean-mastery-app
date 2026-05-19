import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'korean' | 'chinese' | 'french';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  getLanguageName?: (lang: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('french');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'korean' || saved === 'chinese' || saved === 'french')) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Get display name for language
  const getLanguageName = (lang: Language): string => {
    switch (lang) {
      case 'korean': return 'English';
      case 'chinese': return 'English';
      case 'french': return 'Français';
      default: return lang;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
