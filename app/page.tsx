'use client';

import { useScroll } from 'motion/react';
import NeuralBackground from '@/components/NeuralBackground';
import Hero from '@/components/Hero';
import UseCases from '@/components/UseCases';
import Features from '@/components/Features';
import Models from '@/components/Models';
import Footer from '@/components/Footer';

export default function Home() {
  const { scrollYProgress } = useScroll();

  return (
    <main className="relative min-h-screen bg-transparent overflow-hidden">
      {/* Fixed 3D Background */}
      <NeuralBackground scrollYProgress={scrollYProgress} />
      
      {/* Scrollable Content */}
      <div className="relative z-10">
        <Hero />
        <UseCases />
        <Features />
        <Models />
        <Footer />
      </div>
    </main>
  );
}
