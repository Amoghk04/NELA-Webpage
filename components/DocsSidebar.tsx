/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DocsStyles.module.css';

export default function DocsSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const featuresOpen = isActive('/docs/features');

  return (
    <aside className={`hidden md:block w-56 pr-6 sticky top-24 ${styles.docsSidebar}`}>
      <nav className="bg-transparent">
        <ul className="space-y-3 text-sm">
          <li>
            <Link
              href="/docs/what-is-it"
              className={`${styles.docsSidebarLink} ${isActive('/docs/what-is-it') ? styles.docsSidebarLinkActive : ''}`}
            >
              What is it?
            </Link>
          </li>
          <li>
            <Link
              href="/docs/history"
              className={`${styles.docsSidebarLink} ${isActive('/docs/history') ? styles.docsSidebarLinkActive : ''}`}
            >
              History
            </Link>
          </li>
          <li>
            <Link
              href="/docs/architecture"
              className={`${styles.docsSidebarLink} ${isActive('/docs/architecture') ? styles.docsSidebarLinkActive : ''}`}
            >
              Architecture
            </Link>
          </li>
          <li>
            <Link
              href="/docs/models"
              className={`${styles.docsSidebarLink} ${isActive('/docs/models') ? styles.docsSidebarLinkActive : ''}`}
            >
              Models
            </Link>
          </li>
          <li>
            <Link
              href="/docs/installation"
              className={`${styles.docsSidebarLink} ${isActive('/docs/installation') ? styles.docsSidebarLinkActive : ''}`}
            >
              Installation
            </Link>
          </li>
          <li>
            <Link
              href="/docs/features"
              className={`${styles.docsSidebarLink} ${isActive('/docs/features') ? styles.docsSidebarLinkActive : ''}`}
            >
              Features
            </Link>
            {featuresOpen && (
              <ul className="mt-2 ml-3 space-y-1">
                <li>
                  <Link
                    href="/docs/features/local-indexing"
                    className={`${styles.docsSidebarSubLink} ${isActive('/docs/features/local-indexing') ? styles.docsSidebarSubLinkActive : ''}`}
                  >
                    Local Indexing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/features/private-inference"
                    className={`${styles.docsSidebarSubLink} ${isActive('/docs/features/private-inference') ? styles.docsSidebarSubLinkActive : ''}`}
                  >
                    Private Inference
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/features/model-management"
                    className={`${styles.docsSidebarSubLink} ${isActive('/docs/features/model-management') ? styles.docsSidebarSubLinkActive : ''}`}
                  >
                    Model Management
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/features/ui-integration"
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
              className={`${styles.docsSidebarLink} ${isActive('/docs/trouble-shooting') ? styles.docsSidebarLinkActive : ''}`}
            >
              Trouble Shooting
            </Link>
          </li>
          <li>
            <Link
              href="/docs/faqs"
              className={`${styles.docsSidebarLink} ${isActive('/docs/faqs') ? styles.docsSidebarLinkActive : ''}`}
            >
              FAQs
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
