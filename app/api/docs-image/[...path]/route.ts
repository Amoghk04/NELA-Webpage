import { readFile } from 'fs/promises';
import path from 'path';

function guessMimeType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function safeSegments(segments: string[]) {
  return segments
    .map((s) => decodeURIComponent(s))
    .filter((s) => s && !s.includes('\0'))
    .filter((s) => s !== '.' && s !== '..' && !s.startsWith('..'));
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  const { path: requestedPath } = await context.params;
  const segments = safeSegments(requestedPath ?? []);
  if (segments.length === 0) {
    return new Response('Missing image path', { status: 400 });
  }

  const filename = segments[segments.length - 1];
  const mime = guessMimeType(filename);

  const fsPath = path.join(process.cwd(), 'content', 'images', ...segments);

  try {
    const buf = await readFile(fsPath);
    return new Response(buf, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

