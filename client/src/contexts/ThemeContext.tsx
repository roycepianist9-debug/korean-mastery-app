import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "cinematic";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  setTheme?: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "cinematic");
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "cinematic") {
      root.classList.add("cinematic");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => {
          if (prev === "light") return "dark";
          if (prev === "dark") return "cinematic";
          return "light";
        });
      }
    : undefined;

  const setThemeExplicit = switchable ? setTheme : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, setTheme: setThemeExplicit }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
