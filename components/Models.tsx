'use client';

import { motion } from 'motion/react';
import { Cpu, Database, HardDrive } from 'lucide-react';

const models = [
  {
    name: 'Llama 3',
    description: 'Meta\'s highly capable 8B parameter model. Excellent for general knowledge and coding tasks.',
    icon: Cpu,
    color: 'text-blue-400',
  },
  {
    name: 'Mistral',
    description: 'The 7B powerhouse. Exceptional reasoning capabilities and context handling.',
    icon: Database,
    color: 'text-orange-400',
  },
  {
    name: 'Phi-3',
    description: 'Microsoft\'s small language model. Perfect for lower-end hardware without sacrificing quality.',
    icon: HardDrive,
    color: 'text-green-400',
  },
];

export default function Models() {
  return (
    <section className="relative py-32 px-6 z-10 backdrop-blur-3xl border-y transition-colors duration-300"
      style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-space text-5xl md:text-7xl font-bold tracking-tighter mb-6"
          >
            Bring Your Own Weights
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl max-w-2xl mx-auto font-light"
            style={{ color: 'var(--text-secondary)' }}
          >
            NELA supports the GGUF format, allowing you to run a massive ecosystem of open-source models optimized for your specific hardware.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {models.map((model, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group relative p-8 rounded-[2.5rem] border hover:opacity-90 transition-all duration-500 overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <model.icon className={`w-32 h-32 ${model.color}`} />
              </div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full border flex items-center justify-center mb-8"
                  style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border-primary)' }}
                >
                  <model.icon className={`w-6 h-6 ${model.color}`} />
                </div>
                <h3 className="font-space text-2xl font-bold mb-4">{model.name}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {model.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 p-8 rounded-[3rem] border border-dashed flex flex-col items-center justify-center text-center group transition-colors duration-300"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
        >
          <div className="font-mono mb-2" style={{ color: 'var(--accent)' }}>Drag & Drop .gguf files</div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Instantly load custom models into your local intelligence hub.</p>
        </motion.div>
      </div>
    </section>
  );
}
