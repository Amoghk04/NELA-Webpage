'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

export default function NavBar() {
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (destination: string) => {
    trackClientEvent(ANALYTICS_EVENTS.NavClick, {
      source: 'navbar',
      destination,
    });
  };

  const handleThemeToggle = () => {
    trackClientEvent(ANALYTICS_EVENTS.ThemeToggle, {
      source: 'navbar',
      from_theme: theme,
      to_theme: theme === 'dark' ? 'light' : 'dark',
    });
    toggleTheme();
  };

  return (
    <header className="fixed top-4 left-6 right-6 z-50 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="backdrop-blur-md rounded-full p-2 border transition-all duration-200 hover:scale-105"
        onClick={() => handleNavClick('home_logo')}
        style={{
          background: 'var(--bg-nav)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <Image
          src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
          alt="NELA"
          width={32}
          height={32}
          className="transition-opacity duration-300"
        />
      </Link>

      <nav className="backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 border"
        style={{
          background: 'var(--bg-nav)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <Link href="/" className="text-base font-medium px-4 py-1 transition-colors duration-200"
          onClick={() => handleNavClick('home')}
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        >
          Home
        </Link>
        <Link href="/docs" className="text-base font-medium px-4 py-1 transition-colors duration-200"
          onClick={() => handleNavClick('docs')}
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        >
          Docs
        </Link>
        <Link href="/download" className="text-base font-medium px-4 py-1 rounded-full shadow-sm hover:opacity-90 transition-opacity duration-200"
          onClick={() => {
            handleNavClick('download');
            trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
              source: 'navbar_cta',
              destination: '/download',
            });
          }}
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          Download
        </Link>
        <button
          onClick={handleThemeToggle}
          className="ml-1 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>
    </header>
  );
}
