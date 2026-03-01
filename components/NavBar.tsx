'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function NavBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-4 right-6 z-50">
      <nav className="backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 border"
        style={{
          background: 'var(--bg-nav)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <Link href="/" className="text-base font-medium px-4 py-1 transition-colors duration-200"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        >
          Home
        </Link>
        <Link href="/docs" className="text-base font-medium px-4 py-1 transition-colors duration-200"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        >
          Docs
        </Link>
        <Link href="/download" className="text-base font-medium px-4 py-1 rounded-full shadow-sm hover:opacity-90 transition-opacity duration-200"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          Download
        </Link>
        <button
          onClick={toggleTheme}
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
