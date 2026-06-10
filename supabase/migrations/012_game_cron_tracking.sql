-- Migration 012: Dynamic Game Polling Crons
-- Cria tabela de rastreamento de crons por jogo
-- Remove crons antigos (poll-thesportsdb-live, poll-espn-live, game-start-trigger, auto-polling-all-games)
-- Cria novo cron: update-game-crons (1x/dia às 04:00 UTC)

-- ============================================================================
-- REMOVE CRONS ANTIGOS
-- ============================================================================

DO $$
BEGIN
  -- Remove crons antigos se existem
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-thesportsdb-live') THEN
    PERFORM cron.unschedule('poll-thesportsdb-live');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-espn-live') THEN
    PERFORM cron.unschedule('poll-espn-live');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'game-start-trigger') THEN
    PERFORM cron.unschedule('game-start-trigger');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-polling-all-games') THEN
    PERFORM cron.unschedule('auto-polling-all-games');
  END IF;
END $$;

-- ============================================================================
-- CRIA TABELA DE RASTREAMENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_cron_schedule (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  game_id bigint UNIQUE NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  cron_name text UNIQUE NOT NULL,
  scheduled_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_cron_schedule_game_id_idx ON public.game_cron_schedule(game_id);
CREATE INDEX IF NOT EXISTS game_cron_schedule_cron_name_idx ON public.game_cron_schedule(cron_name);

-- ============================================================================
-- CRIA NOVO CRON: UPDATE-GAME-CRONS (1x/dia às 04:00 UTC)
-- ============================================================================

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

-- ============================================================================
-- VERIFICA CRIAÇÃO
-- ============================================================================

SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'update-game-crons';
