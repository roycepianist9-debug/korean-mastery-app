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

  // Load from localStorage on mount, with geolocation fallback
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'korean' || saved === 'chinese' || saved === 'french')) {
      setLanguageState(saved);
      setMounted(true);
      return;
    }

    // Geolocation-based default language
    const detectLanguageByLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_code?.toUpperCase();
        
        let detectedLang: Language = 'korean'; // Default
        if (country === 'KR') {
          detectedLang = 'korean';
        } else if (country === 'CN') {
          detectedLang = 'chinese';
        } else if (['FR', 'BE', 'CH', 'LU', 'CA'].includes(country)) {
          // French-speaking countries
          detectedLang = 'korean'; // Still default to Korean for learning
        }
        
        setLanguageState(detectedLang);
      } catch (error) {
        // Fallback to Korean if geolocation fails
        setLanguageState('korean');
      }
      setMounted(true);
    };

    detectLanguageByLocation();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Get display name for language
  const getLanguageName = (lang: Language): string => {
    switch (lang) {
      case 'korean': return '🇰🇷 Korean';
      case 'chinese': return '🇨🇳 Chinese';
      case 'french': return '🇫🇷 French';
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
