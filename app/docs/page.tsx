import styles from '../../components/DocsStyles.module.css';
import TrackedDocLink from '@/components/TrackedDocLink';

export default function DocsPage() {
  return (
    <section>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Docs</h1>
      <p className="max-w-3xl">
        Browse the docs by topic. Each page explains a single section in the order you requested.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TrackedDocLink href="/docs/what-is-it" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">What is it?</h2>
          <p className="text-sm">Overview of what NELA does and the core workflow.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/history" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">History</h2>
          <p className="text-sm">Origin story, milestones, and evolution of the system.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/architecture" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Architecture</h2>
          <p className="text-sm">How indexing and local inference fit together.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/models" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Models</h2>
          <p className="text-sm">Small/Medium/Large guidance and selection tips.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/installation" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Installation</h2>
          <p className="text-sm">Install the app/CLI and example model commands.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/features" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Features</h2>
          <p className="text-sm">How each major feature works in practice.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/trouble-shooting" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Trouble Shooting</h2>
          <p className="text-sm">Common problems and quick fixes.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/faqs" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">FAQs</h2>
          <p className="text-sm">Answers to the most common questions.</p>
        </TrackedDocLink>
      </div>
    </section>
  );
}
