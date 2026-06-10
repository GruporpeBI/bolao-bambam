-- ============================================================================
-- APLICAR GAME CRON TRACKING - Migration 012
-- ============================================================================
-- Execute isto no Supabase SQL Editor (https://app.supabase.com/project/yzbsahubleskqbfmvmei/sql/new)
-- Este arquivo contém o mesmo SQL da migration/012_game_cron_tracking.sql
-- ============================================================================

-- Remove crons antigos se existem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-thesportsdb-live') THEN
    PERFORM cron.unschedule('poll-thesportsdb-live');
    RAISE NOTICE 'Cron poll-thesportsdb-live removido';
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-espn-live') THEN
    PERFORM cron.unschedule('poll-espn-live');
    RAISE NOTICE 'Cron poll-espn-live removido';
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'game-start-trigger') THEN
    PERFORM cron.unschedule('game-start-trigger');
    RAISE NOTICE 'Cron game-start-trigger removido';
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-polling-all-games') THEN
    PERFORM cron.unschedule('auto-polling-all-games');
    RAISE NOTICE 'Cron auto-polling-all-games removido';
  END IF;
END $$;

-- Cria tabela de rastreamento
CREATE TABLE IF NOT EXISTS public.game_cron_schedule (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  game_id bigint UNIQUE NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  cron_name text UNIQUE NOT NULL,
  scheduled_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_cron_schedule_game_id_idx ON public.game_cron_schedule(game_id);
CREATE INDEX IF NOT EXISTS game_cron_schedule_cron_name_idx ON public.game_cron_schedule(cron_name);

RAISE NOTICE 'Tabela game_cron_schedule criada';

-- Cria novo cron: update-game-crons
SELECT cron.schedule(
  'update-game-crons',
  '0 4 * * *',  -- 04:00 UTC diariamente
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/update-game-crons',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

RAISE NOTICE 'Cron update-game-crons criado para 04:00 UTC diariamente';

-- Verifica criação
SELECT 'Status após migration 012:' as status;
SELECT jobname, schedule FROM cron.job WHERE jobname IN ('update-game-crons', 'sync-agenda-with-enrichment') ORDER BY jobname;

RAISE NOTICE 'Migration 012 aplicada com sucesso!';
