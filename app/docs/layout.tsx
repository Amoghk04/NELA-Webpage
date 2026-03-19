import type { ReactNode } from 'react';
import DocsSidebar from '../../components/DocsSidebar';
import styles from '../../components/DocsStyles.module.css';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16 flex gap-8" style={{ color: 'var(--text-primary)' }}>
      <DocsSidebar />
      <div className={`flex-1 min-w-0 ${styles.docsContent}`}>{children}</div>
    </main>
  );
}

