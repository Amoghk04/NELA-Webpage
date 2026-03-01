'use client';

import { motion } from 'motion/react';
import { Download, Terminal } from 'lucide-react';


const handleDownload = () => {
    window.open(`/api/download?fileId=1_goFzUgbD2tlfHoUCLixmtahbveVafaj`);
  };

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6">
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center z-10">
        
        {/* Dorky Terminal Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md mb-8 border transition-colors duration-300"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            Initializing local neural pathways...
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="font-space text-7xl md:text-9xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
        >
          NELA
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-3xl max-w-2xl mb-12 font-light"
          style={{ color: 'var(--text-secondary)' }}
        >
          Neural Engine for Local Analysis.
        </motion.p>

        {/* Download Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button
            onClick={handleDownload}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" style={{ background: 'var(--accent)' }} />
            <span className="relative z-10 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download for Windows
            </span>
          </button>
          
          <span className="font-mono text-sm" style={{ color: 'var(--text-tertiary)' }}>
            v1.0.4-beta • 142MB .exe
          </span>
        </motion.div>

      </div>
    </section>
  );
}
