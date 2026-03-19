import Link from 'next/link';
import styles from '../../components/DocsStyles.module.css';

export default function DocsPage() {
  return (
    <section>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Docs</h1>
      <p className="max-w-3xl">
        Browse the docs by topic. Each page explains a single section in the order you requested.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/docs/what-is-it" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">What is it?</h2>
          <p className="text-sm">Overview of what NELA does and the core workflow.</p>
        </Link>
        <Link href="/docs/history" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">History</h2>
          <p className="text-sm">Origin story, milestones, and evolution of the system.</p>
        </Link>
        <Link href="/docs/architecture" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Architecture</h2>
          <p className="text-sm">How indexing and local inference fit together.</p>
        </Link>
        <Link href="/docs/models" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Models</h2>
          <p className="text-sm">Small/Medium/Large guidance and selection tips.</p>
        </Link>
        <Link href="/docs/installation" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Installation</h2>
          <p className="text-sm">Install the app/CLI and example model commands.</p>
        </Link>
        <Link href="/docs/features" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Features</h2>
          <p className="text-sm">How each major feature works in practice.</p>
        </Link>
        <Link href="/docs/trouble-shooting" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Trouble Shooting</h2>
          <p className="text-sm">Common problems and quick fixes.</p>
        </Link>
        <Link href="/docs/faqs" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">FAQs</h2>
          <p className="text-sm">Answers to the most common questions.</p>
        </Link>
      </div>
    </section>
  );
}
