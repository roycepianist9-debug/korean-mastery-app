import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WordList from "./pages/WordList";
import SwipeGame from "./pages/SwipeGame";
import WordDetail from "./pages/WordDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/words" component={WordList} />
      <Route path="/play" component={SwipeGame} />
      <Route path="/word/:id" component={WordDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
