import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "light" | "dark";
export type Language = "fr" | "en";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("hr-theme");
    return (saved === "dark" || saved === "light") ? saved : "light";
  });
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("hr-language");
    return saved === "en" ? "en" : "fr";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("hr-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("hr-language", language);
  }, [language]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  const setLanguage = (l: Language) => setLanguageState(l);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, language, setLanguage, isDark: theme === "dark", toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
