'use client';

import { motion } from 'motion/react';
import { Download, Cpu, HardDrive, Server } from 'lucide-react';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';

const models = [
  {
    name: 'Small',
    desc: 'Fast inference, low footprint',
    size: '1.2 GB',
    speed: '~45 tok/s',
    icon: Cpu,
    href: '/downloads/models/small',
  },
  {
    name: 'Medium',
    desc: 'Balanced speed & quality',
    size: '4.7 GB',
    speed: '~28 tok/s',
    icon: HardDrive,
    href: '/downloads/models/medium',
  },
  {
    name: 'Large',
    desc: 'Maximum accuracy',
    size: '13 GB',
    speed: '~12 tok/s',
    icon: Server,
    href: '/downloads/models/large',
  },
];

const platforms = [
  {
    name: 'Windows',
    desc: '64-bit installer (.exe)',
    icon: FaWindows,
    href: '/downloads/installer/windows',
  },
  {
    name: 'macOS',
    desc: 'Universal binary',
    icon: FaApple,
    href: '/downloads/installer/macos',
  },
  {
    name: 'Linux',
    desc: 'Deb / AppImage',
    icon: FaLinux,
    href: '/downloads/installer/linux',
  },
];

export default function DownloadPage() {
  return (
    <main className="relative min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="font-space text-5xl md:text-7xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
          >
            Downloads
          </h1>
          <p className="text-lg font-light max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Everything you need to run NELA locally.
          </p>
        </motion.div>

        {/* ── Installer Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, var(--border-primary))' }} />
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Installer</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, var(--border-primary))' }} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {platforms.map((p, i) => (
              <motion.a
                key={p.name}
                href={p.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                className="group relative rounded-2xl border backdrop-blur-sm p-6 flex flex-col items-center text-center transition-all duration-300"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <p.icon className="w-8 h-8 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <span className="font-space text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                <span className="text-sm font-light" style={{ color: 'var(--text-tertiary)' }}>{p.desc}</span>
                <Download className="w-4 h-4 mt-4 transition-colors duration-300" style={{ color: 'var(--text-muted)' }} />
              </motion.a>
            ))}
          </div>
        </motion.section>

        {/* ── Models Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, var(--border-primary))' }} />
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Models</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, var(--border-primary))' }} />
          </div>

          <div className="space-y-3">
            {models.map((m, i) => (
              <motion.a
                key={m.name}
                href={m.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.45 + i * 0.1 }}
                className="group flex items-center justify-between rounded-2xl border backdrop-blur-sm px-6 py-5 transition-all duration-300"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <m.icon className="w-5 h-5 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }} />
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
                  <Download className="w-4 h-4 transition-colors duration-300" style={{ color: 'var(--text-muted)' }} />
                </div>
              </motion.a>
            ))}
          </div>
        </motion.section>

      </div>
    </main>
  );
}
