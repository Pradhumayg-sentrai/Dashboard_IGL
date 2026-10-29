import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import styles from './ThemeToggle.module.css';

const STORAGE_KEY = 'igl-theme';

type Theme = 'light' | 'dark';

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Applies the effective theme to <html data-theme>. The pre-paint script in
 * index.html handles the first frame; this keeps the control and the document
 * in sync afterwards and remembers an explicit choice.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (!readStoredTheme()) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };

    media.addEventListener('change', handleSystemChange);
    return () => media.removeEventListener('change', handleSystemChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing; the theme still applies.
    }
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn btn-secondary ${styles.toggle}${className ? ` ${className}` : ''}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
      <span className={styles.label}>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
};
