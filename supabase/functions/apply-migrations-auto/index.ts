// Aplica migrations automaticamente no Supabase
// Deploy: supabase functions deploy apply-migrations-auto
// Chamada: curl -X POST https://...supabase.co/functions/v1/apply-migrations-auto -H "Authorization: Bearer [key]"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("[migrations] Iniciando aplicação automática...");
    const results: Record<string, any> = {};

    // ========== Migration 007: Colunas em games ==========
    console.log("[M007] Adicionando colunas em games...");
    const columns = [
      { col: "thesportsdb_event_id", type: "text" },
      { col: "espn_event_id", type: "text" },
      { col: "espn_league", type: "text DEFAULT 'fifa.world'" },
      { col: "api_football_fixture_id", type: "text" },
    ];

    for (const { col, type } of columns) {
      const { error } = await supabase.rpc("exec_sql", {
        query: `ALTER TABLE games ADD COLUMN IF NOT EXISTS ${col} ${type};`,
      });
      if (error) console.warn(`[M007] ${col}: ${error.message}`);
    }
    results.migration_007_columns = { status: "done" };

    // ========== Migration 007: Tabela match_latest ==========
    console.log("[M007] Criando tabela match_latest...");
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS match_latest (
        event_id bigint PRIMARY KEY,
        source text DEFAULT 'multi-source',
        tdb_home_score integer,
        tdb_away_score integer,
        tdb_status text,
        tdb_fetched_at timestamptz,
        espn_home_score integer,
        espn_away_score integer,
        espn_possession numeric,
        espn_status text,
        espn_fetched_at timestamptz,
        af_home_score integer,
        af_away_score integer,
        af_possession numeric,
        af_status text,
        af_fetched_at timestamptz,
        consensus_status text DEFAULT 'pending',
        final_confirmed boolean DEFAULT false
      );
    `;

    await supabase.rpc("exec_sql", { query: createTableSQL });
    results.migration_007_table = { status: "done" };

    // ========== Migration 010: Check-in ==========
    console.log("[M010] Configurando check-in...");

    await supabase.rpc("exec_sql", {
      query: "ALTER TABLE public.games ADD COLUMN IF NOT EXISTS checkin_enabled boolean NOT NULL DEFAULT false;",
    });

    await supabase.rpc("exec_sql", {
      query: "UPDATE public.games SET checkin_enabled = true WHERE sofascore_id = 16135568;",
    });

    await supabase.rpc("exec_sql", {
      query:
        "CREATE INDEX IF NOT EXISTS games_checkin_enabled_idx ON public.games(checkin_enabled) WHERE checkin_enabled = true;",
    });

    results.migration_010 = { status: "done" };

    console.log("[migrations] Aplicado com sucesso!");

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Migrations aplicadas automaticamente",
        results,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[migrations] Erro:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
