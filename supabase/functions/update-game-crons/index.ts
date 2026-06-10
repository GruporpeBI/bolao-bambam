// update-game-crons — cria crons dinâmicos para cada jogo do dia
// Deploy: supabase functions deploy update-game-crons
// Schedule: 0 4 * * * (04:00 UTC diariamente)

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
    const today = now.toISOString().split("T")[0];

    console.log(`[update-game-crons] Atualizando crons para ${today}`);

    // 1. Busca jogos do dia que ainda não foram finalizados
    const { data: todayGames, error: gamesError } = await supabase
      .from("games")
      .select("id, home_team, away_team, scheduled_at, is_enabled")
      .eq("is_enabled", true as unknown as string)
      .gte("scheduled_at", today + "T00:00:00Z")
      .lt("scheduled_at", new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T00:00:00Z");

    if (gamesError) {
      console.error("[update-game-crons] Erro ao buscar jogos:", gamesError);
      return new Response(JSON.stringify({ error: gamesError.message }), {
        status: 500,
      });
    }

    if (!todayGames || todayGames.length === 0) {
      console.log("[update-game-crons] Nenhum jogo habilitado para hoje");
      return new Response(
        JSON.stringify({
          ok: true,
          message: "No games for today",
          games_processed: 0,
          crons_created: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[update-game-crons] ${todayGames.length} jogo(s) encontrado(s)`);

    const cronsCreated = [];

    for (const game of todayGames) {
      const scheduledDate = new Date(game.scheduled_at);
      const minute = String(scheduledDate.getUTCMinutes()).padStart(2, "0");
      const hour = String(scheduledDate.getUTCHours()).padStart(2, "0");
      const day = scheduledDate.getUTCDate();
      const month = scheduledDate.getUTCMonth() + 1; // 0-indexed
      const gameId = game.id;

      // Gera nome único para o cron
      const cronName = `game-${gameId}-${scheduledDate.toISOString().split("T")[0].replace(/-/g, "")}-${hour}${minute}`;

      console.log(
        `[update-game-crons] Criando cron: ${cronName} para ${game.home_team} vs ${game.away_team} às ${hour}:${minute} UTC`
      );

      try {
        // Cria o cron via SQL RPC (simula cron.schedule())
        const cronSchedule = `${minute} ${hour} ${day} ${month} *`;

        // PostgreSQL executa cron.schedule via uma função wrapper
        const { error: cronError } = await supabase.rpc("schedule_game_polling", {
          cron_name: cronName,
          cron_schedule: cronSchedule,
          game_id: gameId,
          supabase_url: supabaseUrl,
          service_role_key: serviceRoleKey,
        });

        if (cronError) {
          console.error(`[update-game-crons] Erro ao criar cron ${cronName}:`, cronError);
          // Continua mesmo se falhar, tenta próximo jogo
        } else {
          // Registra na tabela de rastreamento
          const { error: trackError } = await supabase.from("game_cron_schedule").upsert({
            game_id: gameId,
            cron_name: cronName,
            scheduled_at: game.scheduled_at,
          });

          if (trackError) {
            console.warn(`[update-game-crons] Aviso ao rastrear cron ${cronName}:`, trackError);
          }

          cronsCreated.push({
            game: `${game.home_team} vs ${game.away_team}`,
            cron_name: cronName,
            schedule: cronSchedule,
          });
        }
      } catch (e) {
        console.error(`[update-game-crons] Exceção ao criar cron para ${gameId}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: now.toISOString(),
        games_processed: todayGames.length,
        crons_created: cronsCreated.length,
        crons: cronsCreated,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[update-game-crons] Fatal error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
