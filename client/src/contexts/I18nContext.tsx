import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "en" | "fr";

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.play": "Play",
    "nav.words": "Words",
    "nav.settings": "Settings",

    // Home page
    "home.welcome": "Welcome!",
    "home.welcomeBack": "Welcome back!",
    "home.tagline": "Learn languages by swiping!",
    "home.xp": "XP",
    "home.streak": "Streak",
    "home.today": "Today",
    "home.days": "days",
    "home.words": "words",
    "home.dictionaryStats": "Dictionary Stats",
    "home.totalWords": "Total Words",
    "home.milestone": "Milestone",
    "home.signInToTrack": "Sign in to track progress",
    "home.signInDesc": "Save your progress, unlock streaks, and compete on leaderboards.",
    "home.signIn": "Sign In",
    "home.progressByLevel": "Progress by Level",
    "home.progressByType": "Progress by Type",

    // Menu
    "menu.manageSubscription": "Manage Subscription",
    "menu.adminSettings": "Admin Settings",
    "menu.about": "About",
    "menu.rules": "Rules",
    "menu.signOut": "Sign Out",
    "menu.signUpIn": "Sign up / Sign in",
    "menu.billing": "Billing, upgrade, cancel",
    "menu.pricing": "Pricing, access, config",
    "menu.version": "Version 1.0",
    "menu.howToUse": "How to use the app",

    // Words page
    "words.dictionary": "Dictionary",
    "words.searchPlaceholder": "Search Korean, romanization, or English...",
    "words.filters": "Filters",
    "words.new": "New",
    "words.reviewing": "Reviewing",
    "words.learned": "Learned",
    "words.level": "Level",
    "words.type": "Type",
    "words.allLevels": "All Levels",
    "words.allTypes": "All Types",
    "words.clearFilters": "Clear all filters",
    "words.swipeMode": "Swipe Mode",
    "words.noWords": "No words found",
    "words.tryDifferent": "Try different search terms or filters",
    "words.wordsCount": "words",

    // Swipe game
    "swipe.learned": "Learned",
    "swipe.review": "Review",
    "swipe.sessionComplete": "Session Complete!",
    "swipe.wordsReviewed": "Words Reviewed",
    "swipe.markedLearned": "Marked Learned",
    "swipe.markedReview": "Marked for Review",
    "swipe.playAgain": "Play Again",
    "swipe.backToHome": "Back to Home",
    "swipe.swipeLeft": "← Learned",
    "swipe.swipeRight": "Review →",
    "swipe.tapForDetails": "Tap for details",
    "swipe.startSession": "Start Session",
    "swipe.deckSize": "Deck Size",
    "swipe.cards": "cards",
    "swipe.chooseYourDeck": "Choose your deck and start swiping",
    "swipe.topikLevel": "TOPIK Level",
    "swipe.partOfSpeech": "Part of Speech",
    "swipe.cardsPerSession": "Cards per Session",
    "swipe.wordSelection": "Word Selection",
    "swipe.onlyUnseenWords": "Only unseen words",
    "swipe.wordsToReview": "Words to review",
    "swipe.reinforceLearned": "Reinforce learned",
    "swipe.allWords": "All words",
    "swipe.startSessionButton": "Start Session",

    // Upgrade modal
    "upgrade.title": "Upgrade to Pro",
    "upgrade.subtitle": "Unlock unlimited vocabulary",
    "upgrade.unlimitedWords": "Unlimited word access",
    "upgrade.allLevels": "All levels: beginner to advanced",
    "upgrade.aiTranslations": "AI-powered translations & grammar tips",
    "upgrade.monthly": "Pro Monthly",
    "upgrade.annual": "Pro Annual",
    "upgrade.save": "Save 17%",
    "upgrade.month": "/month",
    "upgrade.year": "/year",
    "upgrade.redirecting": "Redirecting to checkout...",
    "upgrade.failed": "Failed to start checkout. Please try again.",
    "upgrade.limitReached": "You've reached the free limit",
    "upgrade.wordsLearned": "words learned",

    // Rules page
    "rules.title": "How to Use SwipeFluent",
    "rules.back": "Back",
    "rules.swipeTitle": "Swipe to Learn",
    "rules.swipeDesc": "Swipe LEFT to mark a word as Learned. Swipe RIGHT to mark it for Review. Tap a card to see details.",
    "rules.navTitle": "Navigation",
    "rules.navDesc": "Use the bottom bar to switch between Home, Play (swipe mode), and Words (dictionary). The hamburger menu (☰) gives access to settings and account.",
    "rules.progressTitle": "Track Progress",
    "rules.progressDesc": "Your XP, streak, and mastery stats update in real-time. Words are organized by level (TOPIK for Korean, HSK for Chinese).",
    "rules.proTitle": "Pro Features",
    "rules.proDesc": "Free users can learn up to 150 words per language. Upgrade to Pro for unlimited access, all levels, and AI-powered grammar tips.",

    // General
    "general.loading": "Loading...",
    "general.error": "Something went wrong",
    "general.retry": "Retry",
    "general.cancel": "Cancel",
    "general.save": "Save",
    "general.close": "Close",
    "general.comingSoon": "Feature coming soon",

    // Language picker
    "langPicker.title": "Choose your language",
    "langPicker.subtitle": "You can change this anytime in settings",
    "langPicker.english": "English",
    "langPicker.french": "Français",
    "langPicker.continue": "Continue",
  },
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.play": "Jouer",
    "nav.words": "Mots",
    "nav.settings": "Réglages",

    // Home page
    "home.welcome": "Bienvenue !",
    "home.welcomeBack": "Bienvenue !",
    "home.tagline": "Apprenez les langues en swipant !",
    "home.xp": "XP",
    "home.streak": "Série",
    "home.today": "Aujourd'hui",
    "home.days": "jours",
    "home.words": "mots",
    "home.dictionaryStats": "Statistiques du dictionnaire",
    "home.totalWords": "Mots totaux",
    "home.milestone": "Jalon",
    "home.signInToTrack": "Connectez-vous pour suivre vos progrès",
    "home.signInDesc": "Enregistrez vos progrès, débloquez des séries et participez aux classements.",
    "home.signIn": "Se connecter",
    "home.progressByLevel": "Progrès par niveau",
    "home.progressByType": "Progrès par type",

    // Menu
    "menu.manageSubscription": "Gérer l'abonnement",
    "menu.adminSettings": "Paramètres admin",
    "menu.about": "À propos",
    "menu.rules": "Règles",
    "menu.signOut": "Se déconnecter",
    "menu.signUpIn": "S'inscrire / Se connecter",
    "menu.billing": "Facturation, mise à niveau, annulation",
    "menu.pricing": "Tarifs, accès, configuration",
    "menu.version": "Version 1.0",
    "menu.howToUse": "Comment utiliser l'appli",

    // Words page
    "words.dictionary": "Dictionnaire",
    "words.searchPlaceholder": "Chercher en coréen, romanisation ou français...",
    "words.filters": "Filtres",
    "words.new": "Nouveau",
    "words.reviewing": "En révision",
    "words.learned": "Appris",
    "words.level": "Niveau",
    "words.type": "Type",
    "words.allLevels": "Tous les niveaux",
    "words.allTypes": "Tous les types",
    "words.clearFilters": "Effacer les filtres",
    "words.swipeMode": "Mode Swipe",
    "words.noWords": "Aucun mot trouvé",
    "words.tryDifferent": "Essayez d'autres termes ou filtres",
    "words.wordsCount": "mots",

    // Swipe game
    "swipe.learned": "Appris",
    "swipe.review": "Réviser",
    "swipe.sessionComplete": "Session terminée !",
    "swipe.wordsReviewed": "Mots révisés",
    "swipe.markedLearned": "Marqués appris",
    "swipe.markedReview": "Marqués à réviser",
    "swipe.playAgain": "Rejouer",
    "swipe.backToHome": "Retour à l'accueil",
    "swipe.swipeLeft": "← Appris",
    "swipe.swipeRight": "Réviser →",
    "swipe.tapForDetails": "Touchez pour les détails",
    "swipe.startSession": "Commencer",
    "swipe.deckSize": "Taille du paquet",
    "swipe.cards": "cartes",
    "swipe.chooseYourDeck": "Choisissez votre paquet et commencez à swiper",
    "swipe.topikLevel": "Niveau TOPIK",
    "swipe.partOfSpeech": "Partie du discours",
    "swipe.cardsPerSession": "Cartes par session",
    "swipe.wordSelection": "Sélection des mots",
    "swipe.onlyUnseenWords": "Seulement les mots non vus",
    "swipe.wordsToReview": "Mots à réviser",
    "swipe.reinforceLearned": "Renforcer l'apprentissage",
    "swipe.allWords": "Tous les mots",
    "swipe.startSessionButton": "Commencer la session",

    // Upgrade modal
    "upgrade.title": "Passer à Pro",
    "upgrade.subtitle": "Débloquez un vocabulaire illimité",
    "upgrade.unlimitedWords": "Accès illimité aux mots",
    "upgrade.allLevels": "Tous les niveaux : débutant à avancé",
    "upgrade.aiTranslations": "Traductions IA et conseils de grammaire",
    "upgrade.monthly": "Pro Mensuel",
    "upgrade.annual": "Pro Annuel",
    "upgrade.save": "Économisez 17%",
    "upgrade.month": "/mois",
    "upgrade.year": "/an",
    "upgrade.redirecting": "Redirection vers le paiement...",
    "upgrade.failed": "Échec du paiement. Veuillez réessayer.",
    "upgrade.limitReached": "Vous avez atteint la limite gratuite",
    "upgrade.wordsLearned": "mots appris",

    // Rules page
    "rules.title": "Comment utiliser SwipeFluent",
    "rules.back": "Retour",
    "rules.swipeTitle": "Swipez pour apprendre",
    "rules.swipeDesc": "Swipez à GAUCHE pour marquer un mot comme Appris. Swipez à DROITE pour le marquer à Réviser. Touchez une carte pour voir les détails.",
    "rules.navTitle": "Navigation",
    "rules.navDesc": "Utilisez la barre en bas pour naviguer entre Accueil, Jouer (mode swipe) et Mots (dictionnaire). Le menu hamburger (☰) donne accès aux réglages et au compte.",
    "rules.progressTitle": "Suivre ses progrès",
    "rules.progressDesc": "Vos XP, séries et statistiques se mettent à jour en temps réel. Les mots sont organisés par niveau (TOPIK pour le coréen, HSK pour le chinois).",
    "rules.proTitle": "Fonctionnalités Pro",
    "rules.proDesc": "Les utilisateurs gratuits peuvent apprendre jusqu'à 150 mots par langue. Passez à Pro pour un accès illimité, tous les niveaux et des conseils de grammaire IA.",

    // General
    "general.loading": "Chargement...",
    "general.error": "Une erreur est survenue",
    "general.retry": "Réessayer",
    "general.cancel": "Annuler",
    "general.save": "Enregistrer",
    "general.close": "Fermer",
    "general.comingSoon": "Fonctionnalité bientôt disponible",

    // Language picker
    "langPicker.title": "Choisissez votre langue",
    "langPicker.subtitle": "Vous pouvez changer à tout moment dans les réglages",
    "langPicker.english": "English",
    "langPicker.french": "Français",
    "langPicker.continue": "Continuer",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  hasChosenLocale: boolean;
  setHasChosenLocale: (v: boolean) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem("app_locale");
    if (stored === "en" || stored === "fr") return stored;
    // Auto-detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("fr")) return "fr";
    return "en";
  });

  const [hasChosenLocale, setHasChosenLocale] = useState(() => {
    return localStorage.getItem("app_locale_chosen") === "true";
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("app_locale", l);
  };

  const setHasChosenLocaleWrapper = (v: boolean) => {
    setHasChosenLocale(v);
    localStorage.setItem("app_locale_chosen", v ? "true" : "false");
  };

  const t = (key: TranslationKey): string => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, hasChosenLocale, setHasChosenLocale: setHasChosenLocaleWrapper }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
