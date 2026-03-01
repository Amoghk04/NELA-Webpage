'use client';

import { motion } from 'motion/react';
import { Download, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative py-32 px-6 z-10 border-t transition-colors duration-300"
      style={{ background: 'var(--bg-overlay-heavy)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-space text-5xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
        >
          Ready to go local?
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl max-w-2xl mb-16 font-light"
          style={{ color: 'var(--text-secondary)' }}
        >
          Join the resistance. Download NELA and take back control of your knowledge intelligence today.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
          className="mb-32"
        >
          <button className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full font-bold text-xl overflow-hidden transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              boxShadow: `0 0 40px var(--accent-glow)`,
            }}
          >
            <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
              style={{ background: 'var(--text-primary)' }}
            />
            <span className="relative z-10 flex items-center gap-2">
              <Download className="w-6 h-6" />
              Download NELA
            </span>
          </button>
        </motion.div>

        <div className="w-full border-t pt-12 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="font-space text-2xl font-bold tracking-tighter" style={{ color: 'var(--text-primary)' }}>NELA</div>
          
          <div className="flex gap-6" style={{ color: 'var(--text-tertiary)' }}>
            <a href="#" className="hover:opacity-80 transition-opacity">
              <Github className="w-6 h-6" />
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              <Twitter className="w-6 h-6" />
            </a>
          </div>
          
          <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} NELA Intelligence. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
