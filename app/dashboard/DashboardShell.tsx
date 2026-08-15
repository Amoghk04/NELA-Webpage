'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { adminLogout } from '@/lib/admin-api';

const links = [
  { href: '/dashboard/overview', label: 'Overview' },
  { href: '/dashboard/inference', label: 'Inference' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/usage', label: 'Usage' },
  { href: '/dashboard/credits', label: 'Credits' },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}
          >
            NELA admin
          </p>
          <h1 className="font-space text-2xl font-bold">Dashboard</h1>
        </div>
        <button
          type="button"
          className="text-sm"
          style={{ color: 'var(--accent)' }}
          onClick={() => {
            void adminLogout().then(() => router.replace('/dashboard'));
          }}
        >
          Sign out
        </button>
      </div>
      <nav className="mb-8 flex flex-wrap gap-3 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border px-3 py-1"
            style={{
              borderColor:
                pathname === l.href ? 'var(--accent)' : 'var(--border-primary)',
              color: pathname === l.href ? 'var(--accent)' : undefined,
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
