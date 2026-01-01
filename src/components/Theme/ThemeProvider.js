"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(undefined);

function applyTheme(theme) {
  if (typeof window === "undefined") return;

  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

export function ThemeProvider({ children, defaultTheme = "system" }) {
  const [theme, setTheme] = useState("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initialTheme = stored || defaultTheme;
    setTheme(initialTheme);
    setMounted(true);
    applyTheme(initialTheme);
  }, [defaultTheme]);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
