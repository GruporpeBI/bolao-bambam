// Smart Polling Dispatcher — verifica jogos do dia e respeita frequências (10/20 min)
// Deploy: supabase functions deploy smart-polling-dispatcher
// Schedule: a cada 1 minuto via pg_cron (replaces 3 antigos: poll-thesportsdb-live, poll-espn-live, game-start-trigger)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing credentials" }), {
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const now = new Date();
    const twoMinutesAhead = new Date(now.getTime() + 2 * 60 * 1000);
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log(
      `[smart-dispatcher] Verificando jogos do dia com scheduled_at <= ${twoMinutesAhead.toISOString()}`
    );

    // 1. Busca todos os jogos do dia que começam/começaram nos próximos 2 min
    const { data: todayGames, error: gamesError } = await supabase
      .from("games")
      .select(
        "id, home_team, away_team, scheduled_at, is_enabled, thesportsdb_event_id, espn_event_id, espn_league, sofascore_id"
      )
      .eq("is_enabled", true as unknown as string)
      .lte("scheduled_at", twoMinutesAhead.toISOString())
      .gte("scheduled_at", today + "T00:00:00Z") // Do início do dia
      .order("scheduled_at", { ascending: true });

    if (gamesError || !todayGames || todayGames.length === 0) {
      console.log("[smart-dispatcher] Nenhum jogo ativo hoje");
      return new Response(
        JSON.stringify({ ok: true, message: "No active games today", games_triggered: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[smart-dispatcher] ${todayGames.length} jogo(s) ativo(s) encontrado(s)`);

    const triggers = [];

    for (const game of todayGames) {
      const eventId = game.sofascore_id;

      // 2. Busca status do match_latest para este jogo
      const { data: matchLatest } = await supabase
        .from("match_latest")
        .select("tdb_fetched_at, espn_fetched_at, final_confirmed")
        .eq("event_id", eventId)
        .maybeSingle();

      // Se jogo já encerrado com consensus, pula
      if (matchLatest?.final_confirmed) {
        console.log(
          `[smart-dispatcher] ${game.home_team} vs ${game.away_team} (${eventId}) já finalizado`
        );
        continue;
      }

      const tdbFetchedAt = matchLatest?.tdb_fetched_at
        ? new Date(matchLatest.tdb_fetched_at)
        : null;
      const espnFetchedAt = matchLatest?.espn_fetched_at
        ? new Date(matchLatest.espn_fetched_at)
        : null;

      const minutesSinceTdbFetch = tdbFetchedAt
        ? Math.floor((now.getTime() - tdbFetchedAt.getTime()) / 60000)
        : null;
      const minutesSinceEspnFetch = espnFetchedAt
        ? Math.floor((now.getTime() - espnFetchedAt.getTime()) / 60000)
        : null;

      // 3. Verifica se precisa disparar TDB (null ou > 10 min)
      if (!tdbFetchedAt || minutesSinceTdbFetch! > 10) {
        if (game.thesportsdb_event_id) {
          console.log(
            `[smart-dispatcher] ${game.home_team} vs ${game.away_team}: TDB trigger (last: ${
              minutesSinceTdbFetch === null ? "null" : minutesSinceTdbFetch + "min"
            })`
          );

          try {
            const tdbRes = await fetch(`${supabaseUrl}/functions/v1/poll-thesportsdb`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ game_id: game.id }),
            });
            triggers.push({
              game: `${game.home_team} vs ${game.away_team}`,
              source: "thesportsdb",
              status: tdbRes.status,
            });
          } catch (e) {
            console.error("[smart-dispatcher] TDB error:", e);
          }
        }
      }

      // 4. Verifica se precisa disparar ESPN (null ou > 20 min)
      if (!espnFetchedAt || minutesSinceEspnFetch! > 20) {
        if (game.espn_event_id) {
          console.log(
            `[smart-dispatcher] ${game.home_team} vs ${game.away_team}: ESPN trigger (last: ${
              minutesSinceEspnFetch === null ? "null" : minutesSinceEspnFetch + "min"
            })`
          );

          try {
            const espnRes = await fetch(`${supabaseUrl}/functions/v1/poll-espn`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ game_id: game.id }),
            });
            triggers.push({
              game: `${game.home_team} vs ${game.away_team}`,
              source: "espn",
              status: espnRes.status,
            });
          } catch (e) {
            console.error("[smart-dispatcher] ESPN error:", e);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        games_found: todayGames.length,
        triggers_fired: triggers.length,
        triggers,
        timestamp: now.toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[smart-dispatcher] Fatal error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
