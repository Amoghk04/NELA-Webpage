import { Info, AlertTriangle, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import React from 'react';

export type CalloutType = 'note' | 'info' | 'warning' | 'danger' | 'tip';

interface CalloutConfig {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
  defaultTitle: string;
}

/**
 * Configuration for all callout types with colors, icons, and default titles
 */
export const calloutConfig: Record<CalloutType, CalloutConfig> = {
  note: {
    bg: 'rgba(37, 99, 235, 0.1)',
    border: '#2563eb',
    text: '#1e40af',
    icon: <Info className="w-5 h-5" style={{ color: '#2563eb' }} />,
    defaultTitle: 'Note',
  },
  info: {
    bg: 'rgba(37, 99, 235, 0.1)',
    border: '#2563eb',
    text: '#1e40af',
    icon: <Info className="w-5 h-5" style={{ color: '#2563eb' }} />,
    defaultTitle: 'Info',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: '#f59e0b',
    text: '#b45309',
    icon: <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />,
    defaultTitle: 'Warning',
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    text: '#991b1b',
    icon: <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />,
    defaultTitle: 'Danger',
  },
  tip: {
    bg: 'rgba(16, 185, 129, 0.1)',
    border: '#10b981',
    text: '#065f46',
    icon: <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />,
    defaultTitle: 'Tip',
  },
};

export const Callout = ({
  type = 'note',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}) => {
  const config = calloutConfig[type];
  const displayTitle = title || config.defaultTitle;

  return (
    <div
      className="my-4 rounded-lg border-l-4 p-4 flex gap-3"
      style={{
        background: config.bg,
        borderColor: config.border,
      }}
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="flex-1">
        <h4
          className="font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {displayTitle}
        </h4>
        <div
          className="text-sm prose prose-invert max-w-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export const parseCalloutFromMarkdown = (markdown: string): string => {
  // Handle GitHub-style admonitions
  // > [!NOTE]
  // > Content here

  const calloutTypes = ['NOTE', 'INFO', 'WARNING', 'DANGER', 'TIP'];

  let result = markdown;

  calloutTypes.forEach((calloutType) => {
    const regex = new RegExp(
      `> \\[!${calloutType}\\]\\s*\\n([\\s\\S]*?)(?=\\n\\n|\\n> \\[!|$)`,
      'gi'
    );

    result = result.replace(regex, (match, content) => {
      const lines = content.split('\n');
      const cleanedLines = lines
        .map((line: string) => line.replace(/^>\s?/, '').trim())
        .filter((line: string) => line);

      const text = cleanedLines.join('\n');

      return `
<div class="callout callout-${calloutType.toLowerCase()}">
${text}
</div>
      `.trim();
    });
  });

  return result;
};

export const stripMarkdownCallouts = (markdown: string): string => {
  // Remove callout syntax from standard markdown parsing
  return markdown.replace(/> \[!(NOTE|INFO|WARNING|DANGER|TIP)\]\s*\n/gi, '> ').replace(/^> \n/gm, '');
};

/**
 * Extract callout blocks from markdown
 * Returns an array of objects containing callout type and content
 */
export const extractCallouts = (
  markdown: string
): Array<{ type: CalloutType; content: string }> => {
  const callouts: Array<{ type: CalloutType; content: string }> = [];
  const calloutTypes = ['NOTE', 'INFO', 'WARNING', 'DANGER', 'TIP'];

  calloutTypes.forEach((calloutType) => {
    const regex = new RegExp(
      `> \\[!${calloutType}\\]\\s*\\n([\\s\\S]*?)(?=\\n\\n|\\n> \\[!|$)`,
      'gi'
    );

    let match;
    while ((match = regex.exec(markdown)) !== null) {
      const lines = match[1]
        .split('\n')
        .map((line: string) => line.replace(/^>\s?/, '').trim())
        .filter((line: string) => line);

      callouts.push({
        type: calloutType.toLowerCase() as CalloutType,
        content: lines.join('\n'),
      });
    }
  });

  return callouts;
};

/**
 * Check if markdown contains any callouts
 */
export const hasCallouts = (markdown: string): boolean => {
  return /> \[!(NOTE|INFO|WARNING|DANGER|TIP)\]/gi.test(markdown);
};

/**
 * Check if markdown contains any code blocks
 */
export const hasCodeBlocks = (markdown: string): boolean => {
  return /```[\s\S]*?```/g.test(markdown);
};

/**
 * Check if markdown contains any Mermaid diagrams
 */
export const hasMermaidDiagrams = (markdown: string): boolean => {
  return /```mermaid[\s\S]*?```/g.test(markdown);
};

/**
 * Get language from code fence
 */
export const getLanguageFromFence = (fence: string): string => {
  const match = fence.match(/^```(\w+)/);
  return match ? match[1] : 'plaintext';
};

/**
 * Supported syntax highlight languages
 */
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'go',
  'rust',
  'kotlin',
  'swift',
  'html',
  'css',
  'scss',
  'less',
  'sql',
  'json',
  'yaml',
  'xml',
  'markdown',
  'bash',
  'shell',
  'plaintext',
] as const;
