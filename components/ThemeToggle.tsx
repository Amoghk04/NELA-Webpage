'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleThemeToggle = () => {
    trackClientEvent(ANALYTICS_EVENTS.ThemeToggle, {
      source: 'floating_toggle',
      from_theme: theme,
      to_theme: theme === 'dark' ? 'light' : 'dark',
    });
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleThemeToggle}
      className="fixed z-50 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-200 hover:scale-105"
      style={{
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
        left: 'max(1rem, env(safe-area-inset-left))',
        background: 'var(--bg-nav)',
        borderColor: 'var(--border-primary)',
        color: 'var(--text-secondary)',
      }}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
