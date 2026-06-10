-- ============================================================================
-- MIGRATIONS A APLICAR NO SUPABASE SQL EDITOR
-- ============================================================================
-- Copie TUDO isso e cole no Supabase Dashboard → SQL Editor → Execute
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- MIGRATION 007: Multi-source polling infrastructure
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS thesportsdb_event_id    text,
  ADD COLUMN IF NOT EXISTS espn_event_id            text,
  ADD COLUMN IF NOT EXISTS espn_league              text DEFAULT 'fifa.world',
  ADD COLUMN IF NOT EXISTS api_football_fixture_id  text;

CREATE TABLE IF NOT EXISTS match_latest (
  event_id          bigint PRIMARY KEY,
  source            text NOT NULL DEFAULT 'multi-source',
  match_url         text,
  home_team         text,
  away_team         text,
  status            text,
  home_score        integer,
  away_score        integer,
  home_possession   integer,
  away_possession   integer,
  goals             jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw               jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  tdb_home_score    integer,
  tdb_away_score    integer,
  tdb_status        text,
  tdb_fetched_at    timestamptz,

  espn_home_score   integer,
  espn_away_score   integer,
  espn_possession   numeric,
  espn_status       text,
  espn_fetched_at   timestamptz,

  af_home_score     integer,
  af_away_score     integer,
  af_possession     numeric,
  af_status         text,
  af_fetched_at     timestamptz,

  consensus_status  text NOT NULL DEFAULT 'pending',
  final_confirmed   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS match_snapshots (
  id          bigserial PRIMARY KEY,
  event_id    bigint NOT NULL,
  source      text NOT NULL DEFAULT 'multi-source',
  match_url   text,
  status      text,
  home_score  integer,
  away_score  integer,
  home_possession integer,
  away_possession integer,
  goals       jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw         jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS match_snapshots_event_fetched_idx
  ON match_snapshots (event_id, fetched_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- MIGRATION 008: pg_cron schedules para polling automático
-- ─────────────────────────────────────────────────────────────────────────

-- Remove jobs antigos se existem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-world-cup-live') THEN
    PERFORM cron.unschedule('poll-world-cup-live');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-thesportsdb-live') THEN
    PERFORM cron.unschedule('poll-thesportsdb-live');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-espn-live') THEN
    PERFORM cron.unschedule('poll-espn-live');
  END IF;
END $$;

-- TheSportsDB: a cada 10 minutos
SELECT cron.schedule(
  'poll-thesportsdb-live', '*/10 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/poll-thesportsdb',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- ESPN: a cada 20 minutos
SELECT cron.schedule(
  'poll-espn-live', '*/20 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/poll-espn',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- ─────────────────────────────────────────────────────────────────────────
-- MIGRATION 009: Schedule sync-agenda-with-enrichment
-- ─────────────────────────────────────────────────────────────────────────

-- Remove job antigo se existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-agenda-with-enrichment') THEN
    PERFORM cron.unschedule('sync-agenda-with-enrichment');
  END IF;
END $$;

-- Executa diariamente 03:00 UTC
SELECT cron.schedule(
  'sync-agenda-with-enrichment',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/sync-agenda-with-enrichment',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- ─────────────────────────────────────────────────────────────────────────
-- MIGRATION 010: Check-in e deadline fix
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS checkin_enabled boolean NOT NULL DEFAULT false;

-- Habilitar check-in para Portugal vs Nigeria (teste)
UPDATE public.games
SET checkin_enabled = true
WHERE sofascore_id = 16135568;

CREATE INDEX IF NOT EXISTS games_checkin_enabled_idx
  ON public.games (checkin_enabled)
  WHERE checkin_enabled = true;

-- ============================================================================
-- VERIFICAÇÃO: Execute essas queries para confirmar que tudo foi aplicado
-- ============================================================================

-- Listar schedules pg_cron
SELECT jobname, schedule, command FROM cron.job WHERE jobname LIKE 'poll-%' OR jobname LIKE 'sync-%';

-- Verificar se match_latest existe
SELECT column_name FROM information_schema.columns WHERE table_name = 'match_latest' LIMIT 5;

-- Verificar se checkin_enabled existe
SELECT column_name FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'checkin_enabled';

-- Verificar Portugal vs Nigeria
SELECT id, home_team, away_team, checkin_enabled, espn_event_id, thesportsdb_event_id FROM games WHERE sofascore_id = 16135568;
