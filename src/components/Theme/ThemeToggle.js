"use client";

import { useTheme } from "./ThemeProvider";
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    if (theme === "dark") {
      setIsDark(true);
    } else if (theme === "light") {
      setIsDark(false);
    } else if (theme === "system") {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    );
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label="Toggle theme"
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className={`theme-toggle-circle ${isDark ? "dark" : "light"}`}>
        <span className="flex items-center justify-center h-full w-full">
          {isDark ? (
            <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 theme-toggle-icon" />
          ) : (
            <SunIcon className="h-5 w-5 text-yellow-500 theme-toggle-icon" />
          )}
        </span>
      </span>
    </button>
  );
}
