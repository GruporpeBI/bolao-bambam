import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const url = id === "wc-logo"
    ? "https://www.sofascore.com/static/images/tournaments/world-cup-2026-logo.webp"
    : `https://img.sofascore.com/api/v1/team/${id}/image`;

  const res = await fetch(url, {
    headers: {
      "referer": "https://www.sofascore.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      "accept": "image/webp,image/avif,image/*,*/*",
    },
  });

  if (!res.ok) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = res.headers.get("content-type") ?? "image/png";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
