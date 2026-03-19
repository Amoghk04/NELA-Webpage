import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

type Props = {
  markdown: string;
  assetBasePath?: string;
};

function normalizeImageSrc(src: unknown, assetBasePath: string): string | null {
  // Support a common pattern for content authors:
  // - `/docs/foo.png` works out of the box
  // - `./foo.png` gets mapped to `${assetBasePath}/foo.png`
  // - `../images/foo.png` / `images/foo.png` / `content/images/foo.png`
  //   get mapped to `/docs/foo.png` (served from public/docs/*)
  if (typeof src !== 'string' || !src.trim()) return null;

  const raw = src.trim();
  const normalized = raw.replace(/^<|>$/g, '');

  // Preserve already-resolved URLs and inline data URLs.
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

export default function DocsMarkdownRenderer({ markdown, assetBasePath = '/docs' }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      skipHtml={false}
      components={{
        pre({ children, ...props }) {
          // ReactMarkdown controls where block-level elements like <pre> are allowed.
          // We only style the container here to avoid invalid DOM nesting.
          return <pre {...props}>{children}</pre>;
        },
        img({ src = '', alt = '' }) {
          const normalized = normalizeImageSrc(src, assetBasePath);
          if (!normalized) return null;
          // White image stage + click to open full image.
          return (
            <a
              href={normalized}
              target="_blank"
              rel="noreferrer"
              className="block w-full my-4 rounded-xl border p-3"
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
        code({ inline, className, children, ...props }: any) {
          if (inline) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
          // Important: do NOT return <pre> from here.
          // Let the `pre` renderer handle the block-level wrapper.
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

