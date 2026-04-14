import styles from '../../components/DocsStyles.module.css';
import TrackedDocLink from '@/components/TrackedDocLink';

const quickStartLinks = [
  {
    href: '/docs/what-is-it',
    title: 'Start Here',
    description: 'Understand how NELA works before setup.',
  },
  {
    href: '/docs/installation',
    title: 'Install NELA',
    description: 'Choose download-first or source-first setup.',
  },
  {
    href: '/docs/features',
    title: 'Explore Features',
    description: 'See local indexing, inference, and model flows.',
  },
];

export default function DocsPage() {
  return (
    <section>
      <div className={styles.docsHero}>
        <p className={styles.docsHeroBadge}>NELA Documentation</p>
        <h1 className={styles.docsHeroHeading}>Docs</h1>
        <p className={styles.docsHeroBody}>
          Learn NELA through practical local-first workflows: setup, model strategy, RAG,
          multimodal modes, and troubleshooting.
        </p>

        <div className={styles.docsHeroQuickGrid}>
          {quickStartLinks.map((link) => (
            <TrackedDocLink
              key={link.href}
              href={link.href}
              source="docs_landing_quickstart"
              className={styles.docsHeroQuickLink}
            >
              <h2 className="text-base font-semibold mb-1">{link.title}</h2>
              <p className="text-sm">{link.description}</p>
            </TrackedDocLink>
          ))}
        </div>
      </div>

      <div className="mt-10 mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Browse By Topic</h2>
        <p className="max-w-3xl text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          Every page focuses on one part of NELA so users can onboard quickly and troubleshoot with confidence.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TrackedDocLink href="/docs/what-is-it" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">What is it?</h2>
          <p className="text-sm">Understand the NELA local-first desktop workflow and core modes.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/history" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">History</h2>
          <p className="text-sm">See how NELA evolved from a local runtime into a full workspace product.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/architecture" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Architecture</h2>
          <p className="text-sm">Trace UI, router, model backends, and RAG components end-to-end.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/models" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Models</h2>
          <p className="text-sm">Pick the right model classes for chat, vision, audio, and retrieval quality.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/installation" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Installation</h2>
          <p className="text-sm">Set up NELA from release builds or source, then install models correctly.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/features" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Features</h2>
          <p className="text-sm">Deep dives into local indexing, private inference, model ops, and UI flow.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/trouble-shooting" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">Trouble Shooting</h2>
          <p className="text-sm">Fix common indexing, model, and environment issues quickly.</p>
        </TrackedDocLink>
        <TrackedDocLink href="/docs/faqs" source="docs_landing" className={`${styles.docsCard} p-5`}>
          <h2 className="text-xl font-semibold mb-1">FAQs</h2>
          <p className="text-sm">Get direct answers on locality, modes, models, and workspace usage.</p>
        </TrackedDocLink>
      </div>
    </section>
  );
}
