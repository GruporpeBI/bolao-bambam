// Dispara polling automaticamente quando um jogo começa
// Deploy: supabase functions deploy game-start-trigger
// Schedule: a cada 1 minuto via pg_cron

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
    // Buscar jogos que começaram nos últimos 2 minutos
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    console.log(`[game-start] Verificando jogos que começaram desde ${twoMinutesAgo.toISOString()}`);

    const { data: gamesStarting } = await supabase
      .from("games")
      .select("id, home_team, away_team, scheduled_at, thesportsdb_event_id, espn_event_id")
      .gte("scheduled_at", twoMinutesAgo.toISOString())
      .lte("scheduled_at", now.toISOString())
      .eq("is_enabled", true as unknown as string);

    if (!gamesStarting || gamesStarting.length === 0) {
      console.log("[game-start] Nenhum jogo começou agora");
      return new Response(JSON.stringify({ ok: true, games_triggered: 0 }), {
        status: 200,
      });
    }

    console.log(`[game-start] ${gamesStarting.length} jogo(s) começando agora!`);

    // Para cada jogo começando, disparar polling
    const triggered = [];

    for (const game of gamesStarting) {
      console.log(`[game-start] Disparando poll para: ${game.home_team} vs ${game.away_team}`);

      // Disparar TheSportsDB poll
      if (game.thesportsdb_event_id) {
        try {
          const tdbResponse = await fetch(
            `${supabaseUrl}/functions/v1/poll-thesportsdb`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ game_id: game.id }),
            }
          );
          console.log(`[game-start] TheSportsDB poll: ${tdbResponse.status}`);
        } catch (e) {
          console.error(`[game-start] Erro ao disparar TheSportsDB:`, e);
        }
      }

      // Disparar ESPN poll
      if (game.espn_event_id) {
        try {
          const espnResponse = await fetch(
            `${supabaseUrl}/functions/v1/poll-espn`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ game_id: game.id }),
            }
          );
          console.log(`[game-start] ESPN poll: ${espnResponse.status}`);
        } catch (e) {
          console.error(`[game-start] Erro ao disparar ESPN:`, e);
        }
      }

      triggered.push({
        game_id: game.id,
        teams: `${game.home_team} vs ${game.away_team}`,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        games_triggered: triggered.length,
        triggered,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[game-start] Erro fatal:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500 }
    );
  }
});
