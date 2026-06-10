/**
 * sync-agenda-with-enrichment
 *
 * Fluxo completo:
 * 1. Busca jogos do Sofascore
 * 2. Se falhar/vazio → Fallback ESPN
 * 3. Auto-dispara enrich-ids para preencher TDB + ESPN IDs
 * 4. Retry automático no dia seguinte se enrich retornar NULL
 *
 * Executa: Diariamente @ 03:00 UTC (a partir de 24/06/2026)
 *
 * Triggers:
 * - pg_cron: "0 3 * * *" → POST /functions/v1/sync-agenda-with-enrichment
 * - Ou: POST /api/admin/sync-agenda-with-enrichment (manual)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function teamsMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function datesMatch(d1: string, d2: string): boolean {
  return d1.slice(0, 10) === d2.slice(0, 10);
}

function shouldRun(): boolean {
  const today = new Date();
  const cutoffDate = new Date("2026-06-24");
  return today >= cutoffDate;
}

// ---------------------------------------------------------------------------
// Step 1: Fetch Sofascore
// ---------------------------------------------------------------------------

async function fetchSofascoreGames(): Promise<any[]> {
  console.log("[sync-agenda-enrich] Fetching Sofascore...");

  try {
    // Assumindo que há um endpoint Sofascore configurado
    // Placeholder: precisa da URL correta do Sofascore
    const res = await fetch("https://api.sofascore.com/api/v1/tournament/1/season/57200/matches");

    if (!res.ok) {
      console.warn(`[sync-agenda-enrich] Sofascore HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    console.log(`[sync-agenda-enrich] Sofascore: ${data.events?.length || 0} games`);
    return data.events ?? [];
  } catch (err) {
    console.error("[sync-agenda-enrich] Sofascore fetch error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Step 2: Fallback to ESPN
// ---------------------------------------------------------------------------

async function fetchEspnGames(): Promise<any[]> {
  console.log("[sync-agenda-enrich] Fetching ESPN (fallback)...");

  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719"
    );

    if (!res.ok) {
      console.warn(`[sync-agenda-enrich] ESPN HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    console.log(`[sync-agenda-enrich] ESPN: ${data.events?.length || 0} games`);
    return data.events ?? [];
  } catch (err) {
    console.error("[sync-agenda-enrich] ESPN fetch error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Step 3: Normalize to Games Format
// ---------------------------------------------------------------------------

interface GameToInsert {
  external_id: number;
  sofascore_id: number;
  home_team: string;
  away_team: string;
  scheduled_at: string;
  stage: "group" | "semifinal" | "final";
  source: "sofascore" | "espn";
}

async function normalizeGames(events: any[], source: "sofascore" | "espn"): Promise<GameToInsert[]> {
  const games: GameToInsert[] = [];

  if (source === "sofascore") {
    // Mapear estrutura Sofascore
    for (const event of events) {
      games.push({
        external_id: event.id,
        sofascore_id: event.id,
        home_team: event.homeTeam?.name || "",
        away_team: event.awayTeam?.name || "",
        scheduled_at: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : "",
        stage: determineStage(event.tournament?.name || ""),
        source: "sofascore",
      });
    }
  } else if (source === "espn") {
    // Mapear estrutura ESPN
    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const home = comp.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName || "";
      const away = comp.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName || "";

      games.push({
        external_id: parseInt(event.id),
        sofascore_id: parseInt(event.id),
        home_team: home,
        away_team: away,
        scheduled_at: comp.date || "",
        stage: determineStage(comp.league?.name || ""),
        source: "espn",
      });
    }
  }

  return games;
}

function determineStage(leagueName: string): "group" | "semifinal" | "final" {
  const lower = leagueName.toLowerCase();
  if (lower.includes("semi") || lower.includes("semifinal")) return "semifinal";
  if (lower.includes("final")) return "final";
  return "group";
}

// ---------------------------------------------------------------------------
// Step 4: Insert/Update Games
// ---------------------------------------------------------------------------

async function upsertGames(games: GameToInsert[]): Promise<number> {
  let inserted = 0;

  for (const game of games) {
    const { error } = await supabase.from("games").upsert(
      {
        external_id: game.external_id,
        sofascore_id: game.sofascore_id,
        home_team: game.home_team,
        away_team: game.away_team,
        scheduled_at: game.scheduled_at,
        stage: game.stage,
        is_enabled: true,
        predictions_early: true,
        status_type: "Not started",
        status_description: "Not started",
      },
      { onConflict: "sofascore_id" }
    );

    if (!error) {
      inserted++;
    } else {
      console.error(`[sync-agenda-enrich] Upsert error for ${game.home_team}:`, error.message);
    }
  }

  return inserted;
}

// ---------------------------------------------------------------------------
// Step 5: Auto-trigger Enrich-IDs
// ---------------------------------------------------------------------------

async function triggerEnrichIds(): Promise<any> {
  console.log("[sync-agenda-enrich] Triggering enrich-ids...");

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/enrich-ids`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!res.ok) {
      console.warn(`[sync-agenda-enrich] Enrich-IDs HTTP ${res.status}`);
      return { scanned: 0, updated: 0 };
    }

    const result = await res.json();
    console.log(`[sync-agenda-enrich] Enrich-IDs: ${result.updated}/${result.scanned} updated`);
    return result;
  } catch (err) {
    console.error("[sync-agenda-enrich] Enrich-IDs trigger error:", err);
    return { scanned: 0, updated: 0 };
  }
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Verificar data: só executar a partir de 24/06/2026
  if (!shouldRun()) {
    return new Response(
      JSON.stringify({
        ok: true,
        message: "Antes de 24/06/2026, operação desabilitada",
        today: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log("[sync-agenda-enrich] Started at", new Date().toISOString());

  try {
    // Step 1: Tentar Sofascore
    let sofascoreGames = await fetchSofascoreGames();
    let normalizedGames: GameToInsert[] = [];

    if (sofascoreGames.length > 0) {
      normalizedGames = await normalizeGames(sofascoreGames, "sofascore");
      console.log(`[sync-agenda-enrich] Sofascore normalized: ${normalizedGames.length} games`);
    } else {
      // Step 2: Fallback ESPN
      console.warn("[sync-agenda-enrich] Sofascore empty/failed, using ESPN fallback");
      const espnGames = await fetchEspnGames();
      normalizedGames = await normalizeGames(espnGames, "espn");
      console.log(`[sync-agenda-enrich] ESPN fallback normalized: ${normalizedGames.length} games`);
    }

    // Step 3: Upsert games
    const inserted = await upsertGames(normalizedGames);
    console.log(`[sync-agenda-enrich] Inserted/updated: ${inserted} games`);

    // Step 4: Auto-trigger enrich-ids
    const enrichResult = await triggerEnrichIds();

    return new Response(
      JSON.stringify({
        ok: true,
        sofascore_games: sofascoreGames.length,
        normalized_games: normalizedGames.length,
        inserted_games: inserted,
        enrich_ids_result: enrichResult,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync-agenda-enrich] Fatal error:", err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err),
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
