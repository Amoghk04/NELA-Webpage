'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

type Props = {
  href: string;
  source: string;
  className?: string;
  children: ReactNode;
};

export default function TrackedDocLink({ href, source, className, children }: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackClientEvent(ANALYTICS_EVENTS.DocsNavigationClick, {
          source,
          target: href,
        });
      }}
    >
      {children}
    </Link>
  );
}
