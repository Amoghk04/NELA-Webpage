'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { FAQ_SECTIONS } from './faqData';

function FaqAccordionItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div
      className="rounded-xl border"
      style={{
        borderColor: 'var(--border-primary)',
        background: 'var(--bg-card)',
      }}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium sm:text-base" style={{ color: 'var(--text-primary)' }}>
          {question}
        </span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          style={{ color: 'var(--accent)' }}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={panelId}
          className="border-t px-4 pb-4 pt-3 text-sm leading-relaxed"
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          {answer}
        </div>
      ) : null}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="min-h-screen px-6 pb-16 pt-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-3 font-space text-4xl font-bold tracking-tight md:text-5xl">
          FAQ
        </h1>
        <p className="mb-10 max-w-2xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
          Answers about local NELA, Cloud credits, OpenRouter routing, how we
          catalog models, and payments. For setup guides, see{' '}
          <Link href="/docs" style={{ color: 'var(--accent)' }}>
            Docs
          </Link>
          . For plans and packs, see{' '}
          <Link href="/pricing" style={{ color: 'var(--accent)' }}>
            Pricing
          </Link>
          .
        </p>

        <nav className="mb-10 flex flex-wrap gap-2" aria-label="FAQ sections">
          {FAQ_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-10">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="mb-4 font-space text-xl font-bold sm:text-2xl">
                {section.title}
              </h2>
              <div className="flex flex-col gap-2.5">
                {section.items.map((item, index) => (
                  <FaqAccordionItem
                    key={item.id}
                    question={item.question}
                    answer={item.answer}
                    defaultOpen={section.id === 'product' && index === 0}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
