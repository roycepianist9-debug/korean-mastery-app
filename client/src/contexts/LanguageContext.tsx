import React, { createContext, useContext, useState, useEffect } from 'react';

export type StudyLanguage = 'korean' | 'chinese';
export type InterfaceLanguage = 'en' | 'fr';

interface LanguageContextType {
  // Study language: which deck the user is learning (Korean or Chinese)
  studyLanguage: StudyLanguage;
  setStudyLanguage: (lang: StudyLanguage) => void;
  
  // Interface language: what language the UI is displayed in (English or Français)
  interfaceLanguage: InterfaceLanguage;
  setInterfaceLanguage: (lang: InterfaceLanguage) => void;
  
  getLanguageName?: (lang: StudyLanguage) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [studyLanguage, setStudyLanguageState] = useState<StudyLanguage>('korean');
  const [interfaceLanguage, setInterfaceLanguageState] = useState<InterfaceLanguage>('en');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedStudy = localStorage.getItem('studyLanguage') as StudyLanguage | null;
    if (savedStudy && (savedStudy === 'korean' || savedStudy === 'chinese')) {
      setStudyLanguageState(savedStudy);
    }
    
    const savedInterface = localStorage.getItem('interfaceLanguage') as InterfaceLanguage | null;
    if (savedInterface && (savedInterface === 'en' || savedInterface === 'fr')) {
      setInterfaceLanguageState(savedInterface);
    }
    
    setMounted(true);
  }, []);

  const setStudyLanguage = (lang: StudyLanguage) => {
    setStudyLanguageState(lang);
    localStorage.setItem('studyLanguage', lang);
  };

  const setInterfaceLanguage = (lang: InterfaceLanguage) => {
    setInterfaceLanguageState(lang);
    localStorage.setItem('interfaceLanguage', lang);
  };

  // Get display name for study language
  const getLanguageName = (lang: StudyLanguage): string => {
    switch (lang) {
      case 'korean': return 'Korean';
      case 'chinese': return 'Chinese';
      default: return lang;
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      studyLanguage, 
      setStudyLanguage,
      interfaceLanguage,
      setInterfaceLanguage,
      getLanguageName 
    }}>
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
