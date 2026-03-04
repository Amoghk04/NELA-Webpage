import { NextResponse } from "next/server";
import { getReleasesServerSide } from "@/lib/releases";

// Run on the edge network — lower latency, no cold-start
export const runtime = "edge";

export async function GET() {
  try {
    const data = await getReleasesServerSide();
    return NextResponse.json(data, {
      headers: {
        // CDN: cache for 10 min, stale-while-revalidate for up to 1 hour
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Releases fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch releases" }, { status: 500 });
  }
}

