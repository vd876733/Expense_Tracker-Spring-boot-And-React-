import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'theme';

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      console.log('Current Theme:', next);
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:text-white"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
    </button>
  );
};

export default ThemeToggle;
