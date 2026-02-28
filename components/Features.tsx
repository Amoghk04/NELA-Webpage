"use client";

import Image from 'next/image';
import { motion } from 'motion/react';
import { Shield, Zap, BrainCircuit } from 'lucide-react';

const features = [
  {
    title: 'Absolute Privacy',
    description: 'NELA runs entirely on your local machine. No data is sent to the cloud. Your prompts, your documents, and your knowledge base remain strictly confidential.',
    icon: Shield,
    color: 'from-emerald-400 to-emerald-600',
    align: 'left',
  },
  {
    title: 'Uncensored Intelligence',
    description: 'Break free from corporate guardrails. Load any open-source model and explore ideas without restrictions or artificial limitations.',
    icon: BrainCircuit,
    color: 'from-purple-400 to-purple-600',
    align: 'right',
  },
  {
    title: 'Internet Independent',
    description: 'No internet dependency — fully offline. Models and responses run locally on your machine without ever needing internet',
    icon: Zap,
    color: 'from-amber-400 to-amber-600',
    align: 'left',
  },
];

export default function Features() {
  return (
    <section className="relative py-32 px-6 z-10">
      <div className="max-w-6xl mx-auto space-y-32">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`flex flex-col md:flex-row gap-12 items-center ${
              feature.align === 'right' ? 'md:flex-row-reverse' : ''
            }`}
          >
            {/* Text Content */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <feature.icon className={`w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br ${feature.color}`} />
              </div>
              <h2 className="font-space text-4xl md:text-6xl font-bold tracking-tight">
                {feature.title}
              </h2>
              <p className="text-xl text-gray-400 font-light leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* Illustrative Placeholder */}
            <div className="flex-1 w-full">
              <div className="aspect-square md:aspect-[4/3] rounded-[3rem] bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl flex items-center justify-center p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-500 group-hover:opacity-40" />

                {feature.title === 'Absolute Privacy' ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                    <Image
                      src="/data_privacy.png"
                      alt="Data privacy"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : feature.title === 'Uncensored Intelligence' ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                    <Image
                      src="/uncensored_int.png"
                      alt="Uncensored intelligence"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (feature.title === 'Internet Independent' || feature.title === 'Offline First' || feature.title === 'Runs Locally') ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                    <Image
                      src="/offline.png"
                      alt="Offline"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  // Dorky UI Element Placeholder
                  <div className="w-full h-full border border-white/5 rounded-[2rem] bg-black/50 flex flex-col p-6 relative z-10">
                    <div className="flex gap-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="flex-1 font-mono text-sm text-[#00ffcc]/70 space-y-2">
                      <p>{'>'} Initializing {feature.title.toLowerCase().replace(' ', '_')} module...</p>
                      <p>{'>'} Status: ONLINE</p>
                      <p className="animate-pulse">{'>'} _</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
