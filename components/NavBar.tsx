'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, User, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const NAV_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  id: string;
  cta?: boolean;
}> = [
  { href: '/', label: 'Home', id: 'home' },
  { href: '/docs', label: 'Docs', id: 'docs' },
  { href: '/pricing', label: 'Pricing', id: 'pricing' },
  { href: '/download', label: 'Download', id: 'download', cta: true },
];

export default function NavBar() {
  const { theme } = useTheme();
  const { user, isAuthenticated, isReady } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = (destination: string) => {
    trackClientEvent(ANALYTICS_EVENTS.NavClick, {
      source: 'navbar',
      destination,
    });
    setMenuOpen(false);
  };

  const profileHref = isAuthenticated ? '/account' : '/login';
  const profileLabel = isAuthenticated ? 'Profile' : 'Sign in';

  const linkStyle = (cta?: boolean): CSSProperties =>
    cta
      ? { background: 'var(--accent)', color: 'var(--bg-primary)' }
      : { color: 'var(--text-primary)' };

  return (
    <>
      <header
        className="fixed z-50 flex items-center justify-between gap-3"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top))',
          left: 'max(0.75rem, env(safe-area-inset-left))',
          right: 'max(0.75rem, env(safe-area-inset-right))',
        }}
      >
        <Link
          href="/"
          className="shrink-0 rounded-full border p-2 backdrop-blur-md transition-transform duration-200 hover:scale-105"
          onClick={() => handleNavClick('home_logo')}
          style={{
            background: 'var(--bg-nav)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <Image
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="NELA"
            width={28}
            height={28}
            className="h-7 w-7 transition-opacity duration-300 sm:h-8 sm:w-8"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-md md:flex lg:gap-2 lg:px-3"
          style={{
            background: 'var(--bg-nav)',
            borderColor: 'var(--border-primary)',
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-opacity duration-200 hover:opacity-90 lg:px-4 lg:text-base ${
                link.cta ? 'shadow-sm' : ''
              }`}
              style={linkStyle(link.cta)}
              onClick={() => {
                handleNavClick(link.id);
                if (link.id === 'download') {
                  trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
                    source: 'navbar_cta',
                    destination: '/download',
                  });
                }
              }}
              onMouseEnter={(e) => {
                if (!link.cta) e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                if (!link.cta) e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={profileHref}
            className="flex h-10 max-w-[10rem] items-center gap-2 rounded-full border px-2.5 backdrop-blur-md transition-transform duration-200 hover:scale-105 sm:h-11 sm:px-3"
            onClick={() => handleNavClick(isAuthenticated ? 'account' : 'login')}
            style={{
              background: 'var(--bg-nav)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            aria-label={profileLabel}
          >
            {isReady && user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: 'var(--bg-card)' }}
              >
                <User className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              </span>
            )}
            <span className="hidden truncate text-sm font-medium sm:inline">
              {isReady && user?.name ? user.name.split(' ')[0] : profileLabel}
            </span>
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md md:hidden sm:h-11 sm:w-11"
            style={{
              background: 'var(--bg-nav)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: 'var(--bg-overlay-heavy)' }}
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute left-3 right-3 flex flex-col gap-1 rounded-2xl border p-3 backdrop-blur-md"
            style={{
              top: 'max(4.5rem, calc(env(safe-area-inset-top) + 3.75rem))',
              background: 'var(--bg-nav)',
              borderColor: 'var(--border-primary)',
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-base font-medium ${
                  link.cta ? 'text-center' : ''
                }`}
                style={linkStyle(link.cta)}
                onClick={() => {
                  handleNavClick(link.id);
                  if (link.id === 'download') {
                    trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
                      source: 'navbar_mobile',
                      destination: '/download',
                    });
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={profileHref}
              className="rounded-xl px-4 py-3 text-base font-medium"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => handleNavClick(isAuthenticated ? 'account' : 'login')}
            >
              {profileLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
