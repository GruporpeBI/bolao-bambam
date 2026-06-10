// poll-game-start — dispara polling quando um jogo começa (chamado pelos crons dinâmicos)
// Deploy: supabase functions deploy poll-game-start
// Chamado por: crons dinâmicos criados por update-game-crons

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing credentials" }), {
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Lê game_id do body
    const body = await req.json().catch(() => ({}));
    const gameId = body.game_id;

    if (!gameId) {
      return new Response(
        JSON.stringify({ error: "Missing game_id in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[poll-game-start] Disparando polling para game_id=${gameId}`);

    // Busca informações do jogo
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, home_team, away_team, sofascore_id, thesportsdb_event_id, espn_event_id, espn_league")
      .eq("id", gameId)
      .maybeSingle();

    if (gameError || !game) {
      console.error(`[poll-game-start] Jogo não encontrado: game_id=${gameId}`);
      return new Response(
        JSON.stringify({ error: "Game not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[poll-game-start] ${game.home_team} vs ${game.away_team} começando agora`);

    const triggers = [];

    // Dispara poll-thesportsdb
    if (game.thesportsdb_event_id) {
      try {
        console.log(`[poll-game-start] Disparando poll-thesportsdb para ${gameId}`);
        const tdbRes = await fetch(`${supabaseUrl}/functions/v1/poll-thesportsdb`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ game_id: gameId }),
        });

        triggers.push({
          source: "thesportsdb",
          status: tdbRes.status,
          ok: tdbRes.ok,
        });

        if (!tdbRes.ok) {
          console.warn(`[poll-game-start] TDB resposta ${tdbRes.status}`);
        }
      } catch (e) {
        console.error(`[poll-game-start] Erro ao disparar poll-thesportsdb:`, e);
        triggers.push({
          source: "thesportsdb",
          error: String(e),
        });
      }
    }

    // Dispara poll-espn
    if (game.espn_event_id) {
      try {
        console.log(`[poll-game-start] Disparando poll-espn para ${gameId}`);
        const espnRes = await fetch(`${supabaseUrl}/functions/v1/poll-espn`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ game_id: gameId }),
        });

        triggers.push({
          source: "espn",
          status: espnRes.status,
          ok: espnRes.ok,
        });

        if (!espnRes.ok) {
          console.warn(`[poll-game-start] ESPN resposta ${espnRes.status}`);
        }
      } catch (e) {
        console.error(`[poll-game-start] Erro ao disparar poll-espn:`, e);
        triggers.push({
          source: "espn",
          error: String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        game: `${game.home_team} vs ${game.away_team}`,
        game_id: gameId,
        triggers_fired: triggers.length,
        triggers,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[poll-game-start] Fatal error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
