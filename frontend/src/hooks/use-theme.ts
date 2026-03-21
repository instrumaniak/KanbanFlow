import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
let userHasPreference = false;

function getSystemPreference(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (private browsing, sandboxed iframe)
  }
  return null;
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private browsing, sandboxed iframe)
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = getStoredTheme() ?? getSystemPreference();
    applyTheme(initial);
    if (getStoredTheme()) userHasPreference = true;
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (userHasPreference) return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!userHasPreference) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      userHasPreference = true;
      persistTheme(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    userHasPreference = true;
    persistTheme(t);
  }, []);

  return { theme, toggleTheme, setTheme } as const;
}
