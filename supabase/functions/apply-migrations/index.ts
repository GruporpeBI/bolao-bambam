// Edge Function para aplicar migrations
// Deploy: supabase functions deploy apply-migrations
// URL: https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/apply-migrations

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Validar autenticação
  const authHeader = req.headers.get("authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader?.includes(serviceRoleKey || "")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabase = createClient(supabaseUrl, serviceRoleKey || "");

  const results: Record<string, any> = {};

  try {
    console.log("[migrations] Iniciando aplicação de migrations...");

    // Migration 007
    console.log("[migrations] Aplicando 007...");
    const { error: e007 } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE games
          ADD COLUMN IF NOT EXISTS thesportsdb_event_id text,
          ADD COLUMN IF NOT EXISTS espn_event_id text,
          ADD COLUMN IF NOT EXISTS espn_league text DEFAULT 'fifa.world',
          ADD COLUMN IF NOT EXISTS api_football_fixture_id text;

        CREATE TABLE IF NOT EXISTS match_latest (
          event_id bigint PRIMARY KEY,
          source text DEFAULT 'multi-source',
          tdb_home_score integer, tdb_away_score integer, tdb_status text, tdb_fetched_at timestamptz,
          espn_home_score integer, espn_away_score integer, espn_possession numeric, espn_status text, espn_fetched_at timestamptz,
          af_home_score integer, af_away_score integer, af_possession numeric, af_status text, af_fetched_at timestamptz,
          consensus_status text DEFAULT 'pending', final_confirmed boolean DEFAULT false
        );
      `,
    });
    results.migration_007 = e007 ? { error: e007.message } : { status: "ok" };

    // Migration 010
    console.log("[migrations] Aplicando 010...");
    const { error: e010 } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE public.games ADD COLUMN IF NOT EXISTS checkin_enabled boolean DEFAULT false;
        UPDATE public.games SET checkin_enabled = true WHERE sofascore_id = 16135568;
      `,
    });
    results.migration_010 = e010 ? { error: e010.message } : { status: "ok" };

    console.log("[migrations] Concluído", results);

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[migrations] Erro fatal:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
