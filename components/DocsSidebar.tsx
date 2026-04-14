'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DocsStyles.module.css';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

export default function DocsSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const trackDocsNav = (target: string) => {
    trackClientEvent(ANALYTICS_EVENTS.DocsNavigationClick, {
      source: 'docs_sidebar',
      target,
    });
  };

  const featuresOpen = isActive('/docs/features');

  return (
    <aside className={`hidden md:block w-64 lg:w-72 ${styles.docsSidebar}`}>
      <div className={`${styles.docsSidebarPanel} sticky top-24`}>
        <div className={styles.docsSidebarMeta}>
          <p className={styles.docsSidebarEyebrow}>NELA Docs</p>
          <p className={styles.docsSidebarCaption}>Local-first guide for setup, models, and workflows</p>
        </div>

        <nav className="bg-transparent">
          <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/docs/what-is-it"
              onClick={() => trackDocsNav('/docs/what-is-it')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/what-is-it') ? styles.docsSidebarLinkActive : ''}`}
            >
              What is it?
            </Link>
          </li>
          <li>
            <Link
              href="/docs/history"
              onClick={() => trackDocsNav('/docs/history')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/history') ? styles.docsSidebarLinkActive : ''}`}
            >
              History
            </Link>
          </li>
          <li>
            <Link
              href="/docs/architecture"
              onClick={() => trackDocsNav('/docs/architecture')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/architecture') ? styles.docsSidebarLinkActive : ''}`}
            >
              Architecture
            </Link>
          </li>
          <li>
            <Link
              href="/docs/models"
              onClick={() => trackDocsNav('/docs/models')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/models') ? styles.docsSidebarLinkActive : ''}`}
            >
              Models
            </Link>
          </li>
          <li>
            <Link
              href="/docs/installation"
              onClick={() => trackDocsNav('/docs/installation')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/installation') ? styles.docsSidebarLinkActive : ''}`}
            >
              Installation
            </Link>
          </li>
          <li>
            <Link
              href="/docs/features"
              onClick={() => trackDocsNav('/docs/features')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/features') ? styles.docsSidebarLinkActive : ''}`}
            >
              Features
            </Link>
            {featuresOpen && (
              <ul className="mt-2 ml-3 space-y-1">
                <li>
                  <Link
                    href="/docs/features/local-indexing"
                    onClick={() => trackDocsNav('/docs/features/local-indexing')}
                    className={`${styles.docsSidebarSubLink} ${isActive('/docs/features/local-indexing') ? styles.docsSidebarSubLinkActive : ''}`}
                  >
                    Local Indexing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/features/private-inference"
                    onClick={() => trackDocsNav('/docs/features/private-inference')}
                    className={`${styles.docsSidebarSubLink} ${isActive('/docs/features/private-inference') ? styles.docsSidebarSubLinkActive : ''}`}
                  >
                    Private Inference
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/features/model-management"
                    onClick={() => trackDocsNav('/docs/features/model-management')}
                    className={`${styles.docsSidebarSubLink} ${isActive('/docs/features/model-management') ? styles.docsSidebarSubLinkActive : ''}`}
                  >
                    Model Management
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/features/ui-integration"
                    onClick={() => trackDocsNav('/docs/features/ui-integration')}
                    className={`${styles.docsSidebarSubLink} ${isActive('/docs/features/ui-integration') ? styles.docsSidebarSubLinkActive : ''}`}
                  >
                    UI Integration
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link
              href="/docs/trouble-shooting"
              onClick={() => trackDocsNav('/docs/trouble-shooting')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/trouble-shooting') ? styles.docsSidebarLinkActive : ''}`}
            >
              Trouble Shooting
            </Link>
          </li>
          <li>
            <Link
              href="/docs/faqs"
              onClick={() => trackDocsNav('/docs/faqs')}
              className={`${styles.docsSidebarLink} ${isActive('/docs/faqs') ? styles.docsSidebarLinkActive : ''}`}
            >
              FAQs
            </Link>
          </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
