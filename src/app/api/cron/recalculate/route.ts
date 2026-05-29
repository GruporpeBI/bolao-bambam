import { NextRequest, NextResponse } from "next/server";
import { recalculateScores } from "@/app/admin/actions";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await recalculateScores();
  return NextResponse.json(result);
}
