import type { ReactNode } from 'react';
import Link from 'next/link';
import DocsSidebar from '../../components/DocsSidebar';
import styles from '../../components/DocsStyles.module.css';

const mobileQuickLinks = [
  { href: '/docs/what-is-it', label: 'What is it?' },
  { href: '/docs/installation', label: 'Installation' },
  { href: '/docs/features', label: 'Features' },
  { href: '/docs/models', label: 'Models' },
  { href: '/docs/trouble-shooting', label: 'Trouble Shooting' },
  { href: '/docs/faqs', label: 'FAQs' },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.docsShell}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14" style={{ color: 'var(--text-primary)' }}>
        <div className="md:hidden mb-6">
          <p className={styles.docsMobileLabel}>Quick Jump</p>
          <div className={styles.docsMobileNav}>
            {mobileQuickLinks.map((item) => (
              <Link key={item.href} href={item.href} className={styles.docsMobileNavLink}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-8 lg:gap-10">
          <DocsSidebar />
          <div className={`flex-1 min-w-0 ${styles.docsPageSurface}`}>
            <div className={styles.docsContent}>{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

