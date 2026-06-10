/**
 * POST /api/admin/sync-agenda-manual
 *
 * Dispara manualmente o fluxo completo:
 * 1. Sofascore → busca jogos
 * 2. Fallback ESPN se Sofascore falhar
 * 3. Auto-dispara enrich-ids
 *
 * Útil para:
 * - Testar o fluxo
 * - Forçar sincronização fora do horário agendado (03:00 UTC)
 * - Diagnosticar problemas
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_access")) return true;
  if (req.headers.get("x-sync-secret") === process.env.SYNC_SECRET) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase credentials not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("[sync-agenda-manual] Triggering sync-agenda-with-enrichment...");

    // Chamar Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-agenda-with-enrichment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[sync-agenda-manual] Error:", data);
      return NextResponse.json(
        {
          ok: false,
          error: data.error || `HTTP ${response.status}`,
        },
        { status: response.status }
      );
    }

    console.log("[sync-agenda-manual] Success:", data);

    return NextResponse.json({
      ok: true,
      message: "Sync agenda com enrichment disparado com sucesso",
      result: {
        sofascore_games: data.sofascore_games || 0,
        normalized_games: data.normalized_games || 0,
        inserted_games: data.inserted_games || 0,
        enrich_ids_result: data.enrich_ids_result || {},
        timestamp: data.timestamp,
      },
    });
  } catch (err) {
    console.error("[sync-agenda-manual] Fatal error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}
