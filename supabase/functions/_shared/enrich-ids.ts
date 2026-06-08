/**
 * enrich-ids — shared Deno module
 *
 * Called automatically at the end of sync-agenda every morning.
 * For each game that is missing thesportsdb_event_id, espn_event_id or
 * api_football_fixture_id, fetches the ID from the corresponding source
 * and updates the games table.
 *
 * External API calls (1 per source, total 3 requests max per run):
 *   1. API-Football  GET /fixtures?league=1&season=2026
 *   2. ESPN          GET /scoreboard?limit=200&dates=20260611-20260719
 *   3. TheSportsDB   GET /eventsseason.php?id=4328&s=2026-2027
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAfJson } from "./apifootball.ts";

// ---------------------------------------------------------------------------
// Team name normalizer
// ---------------------------------------------------------------------------

const ALIASES: Record<string, string> = {
  "united states":          "usa",
  "u.s.a.":                 "usa",
  "republic of korea":      "south korea",
  "korea republic":         "south korea",
  "czech republic":         "czechia",
  "ir iran":                "iran",
  "côte d'ivoire":          "ivory coast",
  "cote d'ivoire":          "ivory coast",
  "chinese taipei":         "taiwan",
  "trinidad & tobago":      "trinidad and tobago",
  "bosnia & herzegovina":   "bosnia and herzegovina",
};

function norm(name: string): string {
  const s = name.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  return ALIASES[s] ?? s;
}

function teamsMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function dateMatch(d1: string, d2: string): boolean {
  return d1.slice(0, 10) === d2.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Game row
// ---------------------------------------------------------------------------

interface GameRow {
  id:                      string;
  home_team:               string;
  away_team:               string;
  scheduled_at:            string;
  thesportsdb_event_id:    string | null;
  espn_event_id:           string | null;
  espn_league:             string | null;
  api_football_fixture_id: string | null;
}

// ---------------------------------------------------------------------------
// Source: API-Football
// ---------------------------------------------------------------------------

interface AfFixture {
  fixture: { id: number; date: string };
  teams:   { home: { name: string }; away: { name: string } };
}

async function loadAfFixtures(): Promise<AfFixture[]> {
  try {
    const data = await fetchAfJson<{ response: AfFixture[] }>(
      "https://v3.football.api-sports.io/fixtures?league=1&season=2026"
    );
    return data.response ?? [];
  } catch (err) {
    console.warn("[enrich-ids] AF fixtures error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source: ESPN scoreboard — all WC 2026 games in one call
// ---------------------------------------------------------------------------

interface EspnEvent {
  id:           string;
  competitions: Array<{
    date:        string;
    competitors: Array<{ homeAway: string; team: { displayName: string } }>;
  }>;
}

async function loadEspnEvents(): Promise<EspnEvent[]> {
  try {
    const url =
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719";
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[enrich-ids] ESPN HTTP ${res.status}`);
      return [];
    }
    const data = await res.json() as { events?: EspnEvent[] };
    return data.events ?? [];
  } catch (err) {
    console.warn("[enrich-ids] ESPN error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source: TheSportsDB — season events (league 4328 = FIFA World Cup)
// ---------------------------------------------------------------------------

interface TdbEvent {
  idEvent:     string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent:   string; // YYYY-MM-DD
}

async function loadTdbEvents(): Promise<TdbEvent[]> {
  try {
    const url =
      "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4328&s=2026-2027";
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.warn(`[enrich-ids] TDB HTTP ${res.status}`);
      return [];
    }
    const data = await res.json() as { events?: TdbEvent[] | null };
    return data.events ?? [];
  } catch (err) {
    console.warn("[enrich-ids] TDB error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface EnrichResult {
  scanned: number;
  updated: number;
  errors:  string[];
}

export async function enrichGameIds(
  supabase: ReturnType<typeof createClient>
): Promise<EnrichResult> {
  // Fetch games missing at least one external ID (skip games with "A definir" teams)
  const { data, error } = await supabase
    .from("games")
    .select(
      "id, home_team, away_team, scheduled_at, thesportsdb_event_id, espn_event_id, espn_league, api_football_fixture_id"
    )
    .or("thesportsdb_event_id.is.null,espn_event_id.is.null,api_football_fixture_id.is.null")
    .neq("home_team", "A definir")
    .neq("away_team", "A definir");

  if (error) return { scanned: 0, updated: 0, errors: [error.message] };

  const games = (data ?? []) as GameRow[];
  if (games.length === 0) return { scanned: 0, updated: 0, errors: [] };

  // Fetch from all three sources in parallel (3 requests total)
  const [afFixtures, espnEvents, tdbEvents] = await Promise.all([
    loadAfFixtures(),
    loadEspnEvents(),
    loadTdbEvents(),
  ]);

  console.log(
    `[enrich-ids] sources: AF=${afFixtures.length} ESPN=${espnEvents.length} TDB=${tdbEvents.length} | games to enrich=${games.length}`
  );

  let updated = 0;
  const errors: string[] = [];

  for (const game of games) {
    const patch: Partial<Record<string, string>> = {};

    // API-Football
    if (!game.api_football_fixture_id) {
      const af = afFixtures.find(
        (f) =>
          dateMatch(game.scheduled_at, f.fixture.date) &&
          ((teamsMatch(game.home_team, f.teams.home.name) && teamsMatch(game.away_team, f.teams.away.name)) ||
           (teamsMatch(game.home_team, f.teams.away.name) && teamsMatch(game.away_team, f.teams.home.name)))
      );
      if (af) patch.api_football_fixture_id = String(af.fixture.id);
    }

    // ESPN
    if (!game.espn_event_id) {
      const espn = espnEvents.find((e) => {
        const comp = e.competitions?.[0];
        if (!comp || !dateMatch(game.scheduled_at, comp.date)) return false;
        const home = comp.competitors?.find((c) => c.homeAway === "home")?.team.displayName ?? "";
        const away = comp.competitors?.find((c) => c.homeAway === "away")?.team.displayName ?? "";
        return (
          (teamsMatch(game.home_team, home) && teamsMatch(game.away_team, away)) ||
          (teamsMatch(game.home_team, away) && teamsMatch(game.away_team, home))
        );
      });
      if (espn) {
        patch.espn_event_id = espn.id;
        patch.espn_league   = "fifa.world";
      }
    }

    // TheSportsDB
    if (!game.thesportsdb_event_id) {
      const tdb = tdbEvents.find(
        (e) =>
          dateMatch(game.scheduled_at, e.dateEvent) &&
          ((teamsMatch(game.home_team, e.strHomeTeam) && teamsMatch(game.away_team, e.strAwayTeam)) ||
           (teamsMatch(game.home_team, e.strAwayTeam) && teamsMatch(game.away_team, e.strHomeTeam)))
      );
      if (tdb) patch.thesportsdb_event_id = tdb.idEvent;
    }

    if (Object.keys(patch).length === 0) continue;

    const { error: updateErr } = await supabase
      .from("games")
      .update(patch)
      .eq("id", game.id);

    if (updateErr) {
      errors.push(`${game.home_team} × ${game.away_team}: ${updateErr.message}`);
    } else {
      updated++;
      console.log(
        `[enrich-ids] ✓ ${game.home_team} × ${game.away_team} — AF=${!!patch.api_football_fixture_id} ESPN=${!!patch.espn_event_id} TDB=${!!patch.thesportsdb_event_id}`
      );
    }
  }

  return { scanned: games.length, updated, errors };
}
