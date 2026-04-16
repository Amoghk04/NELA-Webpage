import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(): Promise<Response> {
  try {
    const scriptPath = path.join(process.cwd(), 'mac-install.sh');
    const script = await readFile(scriptPath, 'utf8');

    return new Response(script, {
      headers: {
        'Content-Type': 'text/x-shellscript; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('Unable to load mac-install.sh:', error);
    return new Response('Not found', { status: 404 });
  }
}
