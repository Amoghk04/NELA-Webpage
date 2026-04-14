import DocSection from '../_components/DocSection';
import styles from '@/components/DocsStyles.module.css';
import TrackedDocLink from '@/components/TrackedDocLink';

const featurePages = [
  { title: 'Local Indexing', href: '/docs/features/local-indexing' },
  { title: 'Private Inference', href: '/docs/features/private-inference' },
  { title: 'Model Management', href: '/docs/features/model-management' },
  { title: 'UI Integration', href: '/docs/features/ui-integration' },
];

export default function FeaturesPage() {
  return (
    <section>
      <DocSection slug="features" />

      <div className="mt-8 mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Feature Deep Dives</h2>
        <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          These pages explain the real data flow behind each capability so users can troubleshoot and tune behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {featurePages.map((f) => (
          <TrackedDocLink
            key={f.href}
            href={f.href}
            source="docs_features_index"
            className={`${styles.docsCard} p-5`}
          >
            <h3 className="m-0">{f.title}</h3>
            <p className="m-0 mt-1 text-sm">Read workflow details and architecture snapshot</p>
          </TrackedDocLink>
        ))}
      </div>
    </section>
  );
}

