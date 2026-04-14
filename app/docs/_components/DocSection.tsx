import { readFile } from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import DocsMarkdownRenderer from '@/components/DocsMarkdownRenderer';
import styles from '@/components/DocsStyles.module.css';

type Props = {
  slug: string;
};

const CONTENT_DIR = path.join(process.cwd(), 'content', 'docs');

export default async function DocSection({ slug }: Props) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  let markdown: string;
  try {
    markdown = await readFile(filePath, 'utf8');
  } catch {
    notFound();
  }

  // Markdown renderer maps `../images/...` and `content/images/...` to
  // `/api/docs-image/...` so authors can type assets in a simple way.
  return (
    <div className={styles.docsMarkdownFrame}>
      <DocsMarkdownRenderer markdown={markdown} assetBasePath={`/docs/${slug}`} />
    </div>
  );
}

