import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: Request): Promise<Response> {
  try {
    const scriptPath = path.join(process.cwd(), 'mac-install.sh');
    const script = await readFile(scriptPath, 'utf8');
    const origin = new URL(req.url).origin;
    const renderedScript = script.replace(/__NELA_BASE_URL__/g, origin);

    return new Response(renderedScript, {
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
