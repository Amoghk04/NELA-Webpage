// Server Component — no 'use client' directive.
// Data is fetched at render time on the server; the page arrives pre-populated.
import { Cpu, HardDrive, Server, Download } from 'lucide-react';
import { getReleasesServerSide } from '@/lib/releases';
import DownloadInstaller from '@/components/DownloadInstaller';

const models = [
  { name: 'Small',  desc: 'Fast inference, low footprint', size: '1.2 GB', speed: '~45 tok/s', icon: Cpu },
  { name: 'Medium', desc: 'Balanced speed & quality',      size: '4.7 GB', speed: '~28 tok/s', icon: HardDrive },
  { name: 'Large',  desc: 'Maximum accuracy',              size: '13 GB',  speed: '~12 tok/s', icon: Server },
];

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, var(--border-primary))' }} />
      <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--accent)' }}>{label}</span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, var(--border-primary))' }} />
    </div>
  );
}

export default async function DownloadPage() {
  // Fetch is cached server-side via unstable_cache — no round-trip from the browser.
  const data = await getReleasesServerSide();

  return (
    <main className="relative min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-20">
          <h1
            className="font-space text-5xl md:text-7xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
          >
            Downloads
          </h1>
          <p className="text-lg font-light max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Everything you need to run NELA locally.
          </p>
        </div>

        {/* ── Installer Section ── */}
        <section className="mb-24">
          <SectionDivider label="Installer" />
          {/* Interactive part is a client component; receives pre-fetched data as props */}
          <DownloadInstaller data={data} />
        </section>

        {/* ── Models Section ── */}
        <section>
          <SectionDivider label="Models" />
          <div className="space-y-3">
            {models.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between rounded-2xl border backdrop-blur-sm px-6 py-5"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <m.icon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <span className="font-space text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                    <p className="text-sm font-light" style={{ color: 'var(--text-tertiary)' }}>{m.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex gap-6 text-right">
                    <div>
                      <div className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>Size</div>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{m.size}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>Speed</div>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{m.speed}</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
