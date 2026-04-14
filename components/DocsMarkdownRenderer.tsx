'use client';

import React, { useEffect, useState, useMemo, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { Copy, CheckCircle, AlertCircle, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';
import { useTheme } from './ThemeProvider';

type Props = {
  markdown: string;
  assetBasePath?: string;
};

function normalizeImageSrc(src: unknown, assetBasePath: string): string | null {
  if (typeof src !== 'string' || !src.trim()) return null;

  const raw = src.trim();
  const normalized = raw.replace(/^<|>$/g, '');

  if (normalized.startsWith('data:')) return normalized;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;

  const imagesMarker = '/images/';
  const markerIndex = normalized.lastIndexOf(imagesMarker);
  if (normalized.startsWith('content/images/')) {
    return `/api/docs-image/${normalized.slice('content/images/'.length)}`;
  }
  if (markerIndex !== -1) {
    return `/api/docs-image/${normalized.slice(markerIndex + imagesMarker.length)}`;
  }
  if (normalized.startsWith('images/')) {
    return `/api/docs-image/${normalized.slice('images/'.length)}`;
  }

  if (normalized.startsWith('/api/docs-image/')) return normalized;
  if (normalized.startsWith('/')) return normalized;
  if (normalized.startsWith('./')) return `${assetBasePath}/${normalized.slice(2)}`;
  return normalized;
}

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextContent(child)).join('');
  }

  if (React.isValidElement(node)) {
    return extractTextContent((node as React.ReactElement<{ children?: React.ReactNode }>).props?.children);
  }

  return '';
}

// Code copy button component
function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      trackClientEvent(ANALYTICS_EVENTS.DocsInteraction, {
        source: 'docs_markdown',
        action: 'copy_code',
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      trackClientEvent(ANALYTICS_EVENTS.DocsInteraction, {
        source: 'docs_markdown',
        action: 'copy_code_failed',
      });
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 rounded-md transition-all hover:opacity-100"
      style={{
        background: 'var(--bg-card)',
        color: 'var(--text-secondary)',
        zIndex: 2,
      }}
      title="Copy code"
      aria-label="Copy code"
    >
      {copied ? (
        <CheckCircle size={18} style={{ color: 'var(--accent)' }} />
      ) : (
        <Copy size={18} />
      )}
    </button>
  );
}

// Callout component
const Callout = ({
  type,
  title,
  children,
}: {
  type: 'note' | 'info' | 'warning' | 'danger' | 'tip';
  title: string;
  children: React.ReactNode;
}) => {
  const colors: {
    [key: string]: { bg: string; border: string };
  } = {
    note: { bg: 'rgba(37, 99, 235, 0.1)', border: '#2563eb' },
    info: { bg: 'rgba(37, 99, 235, 0.1)', border: '#2563eb' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' },
    tip: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
  };

  const icons: { [key: string]: React.ReactNode } = {
    note: <Info className="w-5 h-5" style={{ color: '#2563eb' }} />,
    info: <Info className="w-5 h-5" style={{ color: '#2563eb' }} />,
    warning: <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />,
    danger: <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />,
    tip: <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />,
  };

  const config = colors[type];

  return (
    <div
      className="my-4 rounded-lg border-l-4 p-4 flex gap-3"
      style={{
        background: config.bg,
        borderColor: config.border,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <h4
          className="font-semibold mb-1 text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h4>
        <div
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// Mermaid diagram component
const MermaidDiagram = ({ code, theme }: { code: string; theme: 'dark' | 'light' }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const elementId = useId().replace(/:/g, '-');

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        // Wait until web fonts are ready so Mermaid measures text with final metrics.
        if (typeof document !== 'undefined' && 'fonts' in document) {
          await (document as Document & { fonts: FontFaceSet }).fonts.ready;
        }

        mermaid.initialize({
          startOnLoad: true,
          // Keep Mermaid in sync with the app's theme toggle.
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          // Use stable system fonts to avoid clipping caused by late custom-font swaps.
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          flowchart: {
            htmlLabels: false,
            useMaxWidth: true,
          },
          themeVariables: {
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          },
        });
        
        // Clear any previous content
        const container = document.getElementById(elementId);
        if (container) {
          container.innerHTML = '';
        }

        const { svg: svgCode } = await mermaid.render(elementId, code);
        setSvg(svgCode);
        setError('');
      } catch (err) {
        setError(`Failed to render diagram: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Mermaid error:', err);
      }
    };

    if (code && code.trim()) {
      renderDiagram();
    }
  }, [code, elementId, theme]);

  if (error) {
    return (
      <div
        className="my-4 p-4 rounded-lg border text-sm"
        style={{
          background: 'var(--bg-card)',
          borderColor: '#ef4444',
          color: '#ef4444',
        }}
      >
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className="my-4 p-4 rounded-lg border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className="my-4 p-4 rounded-lg border flex justify-center overflow-x-auto"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-subtle)',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// Collapsible details component
const Details = ({ children, summary }: { children: React.ReactNode; summary: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <details
      open={open}
      onToggle={(e) => {
        const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(nextOpen);
        trackClientEvent(ANALYTICS_EVENTS.DocsInteraction, {
          source: 'docs_markdown',
          action: nextOpen ? 'details_open' : 'details_close',
          summary,
        });
      }}
      className="my-4 cursor-pointer rounded-lg border p-4"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <summary
        className="flex items-center gap-2 font-semibold cursor-pointer select-none"
        style={{ color: 'var(--text-primary)' }}
      >
        <ChevronDown
          size={18}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
        {summary}
      </summary>
      <div
        className="mt-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </div>
    </details>
  );
};

export default function DocsMarkdownRenderer({ markdown, assetBasePath = '/docs' }: Props) {
  const { theme } = useTheme();

  // Enhanced markdown processing
  const processedMarkdown = useMemo(() => {
    let processed = markdown;

    // Convert GitHub-style callouts to div markers for better parsing
    // > [!NOTE]
    // > Content
    const calloutTypes = ['NOTE', 'INFO', 'WARNING', 'DANGER', 'TIP'];
    
    calloutTypes.forEach((type) => {
      const regex = new RegExp(
        `> \\[!${type}\\]\\s*\\n(>[\\s\\S]*?)(?=\\n(?:> \\[!|$|[^>]))`,
        'gm'
      );
      
      processed = processed.replace(regex, (match, content) => {
        const lines = content
          .split('\n')
          .map((line: string) => line.replace(/^>\s?/, '').trim())
          .filter((line: string) => line.length > 0);
        
        const text = lines.join('\n');
        return `<callout type="${type.toLowerCase()}">\n${text}\n</callout>`;
      });
    });

    return processed;
  }, [markdown]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective]}
      rehypePlugins={[rehypeRaw]}
      skipHtml={false}
      components={{
        pre({ children, ...props }: any) {
          let codeContent = '';
          let codeClassName = '';

          const firstChild = Array.isArray(children) ? children[0] : children;
          if (React.isValidElement(firstChild)) {
            codeClassName = String((firstChild as any)?.props?.className || '');
            const rawChildren = (firstChild as any)?.props?.children;
            codeContent = extractTextContent(rawChildren);
          } else {
            codeContent = extractTextContent(children);
          }

          const isMermaid = /(^|\s)language-mermaid(\s|$)/.test(codeClassName);
          
          if (isMermaid) {
            return <MermaidDiagram code={codeContent.trim()} theme={theme} />;
          }

          return (
            <div className="relative my-4 group">
              <pre
                {...props}
                className="rounded-lg overflow-x-auto"
                style={{
                  background: 'var(--code-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1rem',
                }}
              >
                {children}
              </pre>
              {codeContent.trim().length > 0 && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CodeCopyButton text={codeContent.trim()} />
                </div>
              )}
            </div>
          );
        },
        code({ inline, className, children, ...props }: any) {
          if (inline) {
            return (
              <code
                className={className}
                {...props}
                style={{
                  background: 'var(--code-bg)',
                  color: 'var(--text-primary)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.92em',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={className}
              {...props}
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                padding: '0',
                borderRadius: '0',
                fontSize: '0.9rem',
              }}
            >
              {children}
            </code>
          );
        },
        img({ src = '', alt = '' }) {
          const normalized = normalizeImageSrc(src, assetBasePath);
          if (!normalized) return null;
          return (
            <a
              href={normalized}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackClientEvent(ANALYTICS_EVENTS.DocsInteraction, {
                  source: 'docs_markdown',
                  action: 'image_open',
                  href: normalized,
                });
              }}
              className="block w-full my-4 rounded-xl border p-3 transition-all hover:opacity-90"
              style={{ background: '#ffffff', borderColor: 'var(--border-subtle)' }}
            >
              <img
                src={normalized}
                alt={alt}
                className="max-w-full h-auto mx-auto rounded-md"
              />
            </a>
          );
        },
        a({ href = '', children, ...props }: any) {
          const normalizedHref = typeof href === 'string' ? href : '';
          const isExternal = /^https?:\/\//.test(normalizedHref) || normalizedHref.startsWith('mailto:');

          return (
            <a
              href={normalizedHref}
              {...props}
              onClick={(e) => {
                if (typeof props.onClick === 'function') props.onClick(e);
                trackClientEvent(ANALYTICS_EVENTS.DocsInteraction, {
                  source: 'docs_markdown',
                  action: 'link_click',
                  href: normalizedHref,
                  link_type: isExternal ? 'external' : 'internal',
                });
              }}
            >
              {children}
            </a>
          );
        },
        table({ children }: any) {
          return (
            <div className="my-4 overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  color: 'var(--text-primary)',
                }}
              >
                {children}
              </table>
            </div>
          );
        },
        thead({ children }: any) {
          return (
            <thead
              style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {children}
            </thead>
          );
        },
        th({ children }: any) {
          return (
            <th
              style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--text-primary)',
                borderRight: '1px solid var(--border-subtle)',
              }}
            >
              {children}
            </th>
          );
        },
        td({ children }: any) {
          return (
            <td
              style={{
                padding: '0.75rem 1rem',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {children}
            </td>
          );
        },
        blockquote({ children }: any) {
          return (
            <blockquote
              className="my-4 border-l-4 pl-4"
              style={{
                borderColor: 'var(--accent)',
                color: 'var(--text-tertiary)',
              }}
            >
              {children}
            </blockquote>
          );
        },
        hr() {
          return (
            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--border-subtle)',
                margin: '2rem 0',
              }}
            />
          );
        },
        html({ value }: any) {
          // Handle custom callout elements
          const calloutMatch = value.match(/<callout\s+type="([^"]+)"\s*>([\s\S]*?)<\/callout>/);
          if (calloutMatch) {
            const [, type, content] = calloutMatch;
            const titleMap: Record<string, string> = {
              note: 'Note',
              info: 'Info',
              warning: 'Warning',
              danger: 'Danger',
              tip: 'Tip',
            };
            return (
              <Callout type={type as any} title={titleMap[type] || type}>
                {content}
              </Callout>
            );
          }
          return <div dangerouslySetInnerHTML={{ __html: value }} />;
        },
      }}
    >
      {processedMarkdown}
    </ReactMarkdown>
  );
}

