import { NextRequest, NextResponse } from "next/server";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");

  if (!file) {
    return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
  }

  const modelsDir = path.join(process.cwd(), "models");
  const fullPath = path.resolve(modelsDir, file);

  // Prevent path traversal
  if (!fullPath.startsWith(modelsDir + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  try {
    const fileStat = await stat(fullPath);

    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    const fileName = path.basename(fullPath);
    const stream = createReadStream(fullPath);

    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: string | Buffer) => controller.enqueue(typeof chunk === "string" ? Buffer.from(chunk) : chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Length", String(fileStat.size));

    return new NextResponse(webStream, { headers });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
