import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SoundProvider } from "./contexts/SoundContext";
import { I18nProvider, useI18n } from "./contexts/I18nContext";
import LocalePicker from "./components/LocalePicker";
import FrenchOnboardingModal from "./components/FrenchOnboardingModal";
import Home from "./pages/Home";
import WordList from "./pages/WordList";
import SwipeGame from "./pages/SwipeGame";
import MemoryGame from "./pages/MemoryGame";
import WordDetail from "./pages/WordDetail";
import AdminSettings from "./pages/AdminSettings";
import Rules from "./pages/Rules";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/words" component={WordList} />
      <Route path="/play" component={SwipeGame} />
      <Route path="/memory" component={MemoryGame} />
      <Route path="/word/:id" component={WordDetail} />
      <Route path="/admin" component={AdminSettings} />
      <Route path="/rules" component={Rules} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { hasChosenLocale } = useI18n();
  
  if (!hasChosenLocale) {
    return <LocalePicker />;
  }

  return (
    <LanguageProvider>
      <SoundProvider>
        <TooltipProvider>
          <Toaster />
          <FrenchOnboardingModal />
          <Router />
        </TooltipProvider>
      </SoundProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
