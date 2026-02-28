import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Get file metadata first to obtain the filename and mimeType
    const meta = await drive.files.get({ fileId, fields: "name,mimeType,size" });
    const name = meta.data.name || "download";
    const mimeType = meta.data.mimeType || "application/octet-stream";

    // Stream the Drive response directly to the client (avoids buffering large files)
    const driveRes = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    const nodeStream = driveRes.data as unknown as import('stream').Readable;

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        if (typeof (nodeStream as any).destroy === 'function') (nodeStream as any).destroy();
      }
    });

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${name}"`);
    headers.set("Content-Type", mimeType);
    if (meta.data.size) headers.set("Content-Length", String(meta.data.size));
    // Allow CDN caching at the edge for an hour (adjust as needed)
    headers.set('Cache-Control', 'public, max-age=0, s-maxage=3600');

    return new NextResponse(webStream, { headers });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}