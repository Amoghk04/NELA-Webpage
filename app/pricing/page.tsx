import Link from 'next/link';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    blurb: 'Private local mode forever. Cloud inference locked.',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'From $4 credit',
    blurb: 'Fast Cloud with monthly included usage and standard limits.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'From $20 credit',
    blurb: 'Higher quotas, deeper reasoning models, artifact planning.',
  },
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-space text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Pricing
        </h1>
        <p className="mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Local-first by default. Pay only when you want Fast Cloud through NELA
          Cloud.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-2xl border"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
              }}
            >
              <h2 className="font-space text-2xl font-bold mb-1">{plan.name}</h2>
              <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
                {plan.price}
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {plan.blurb}
              </p>
              <Link
                href={plan.id === 'free' ? '/download' : '/account/billing'}
                className="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                }}
              >
                {plan.id === 'free' ? 'Download' : 'Choose plan'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
