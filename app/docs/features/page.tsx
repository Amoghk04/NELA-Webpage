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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {featurePages.map((f) => (
          <TrackedDocLink
            key={f.href}
            href={f.href}
            source="docs_features_index"
            className={`${styles.docsCard} p-4`}
          >
            <h3 className="m-0">{f.title}</h3>
            <p className="m-0 mt-1 text-sm">Open section page</p>
          </TrackedDocLink>
        ))}
      </div>
    </section>
  );
}

