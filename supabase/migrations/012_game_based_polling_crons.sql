-- Migration 012: Polling baseado no horário de início de cada jogo
-- =====================================================================
-- Substitui os crons genéricos 24/7 (poll-thesportsdb-live, poll-espn-live)
-- por crons dinâmicos por jogo, criados na janela de horário de cada jogo.
--
-- A service_role_key fica numa tabela privada (private.cron_secrets) e é
-- lida em TEMPO DE EXECUÇÃO pelo comando do cron — não há chave literal no
-- código versionado nem em cron.job. Se a chave rotacionar, basta um UPDATE.
--
-- Função refresh_game_crons():
--   - Roda 1x/dia (04:00 UTC) e cria, para cada jogo habilitado do dia,
--     dois crons que disparam SOMENTE durante a janela do jogo:
--       gcron-tdb-<id>  → poll-thesportsdb a cada 10 min (durante o jogo)
--       gcron-espn-<id> → poll-espn a cada 20 min (durante o jogo)
--   - Janela = [hora_inicio .. hora_inicio+3] no dia/mês exatos do jogo.
-- =====================================================================

-- 1. Schema + tabela privada para o segredo do cron
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated, public;

CREATE TABLE IF NOT EXISTS private.cron_secrets (
  key   text PRIMARY KEY,
  value text NOT NULL
);
REVOKE ALL ON private.cron_secrets FROM anon, authenticated, public;

-- 2. Remove crons genéricos antigos (idempotente)
DO $$
BEGIN
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

-- 3. Função que (re)cria os crons por jogo do dia
CREATE OR REPLACE FUNCTION public.refresh_game_crons()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net, private
AS $func$
DECLARE
  g            RECORD;
  v_start_hour int;
  v_end_hour   int;
  v_day        int;
  v_month      int;
  v_created    int := 0;
  v_url_base   text := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/';
  j            RECORD;
BEGIN
  -- 3a. Limpa crons de jogos anteriores (prefixo gcron-)
  FOR j IN SELECT jobname FROM cron.job WHERE jobname LIKE 'gcron-%' LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;

  -- 3b. Recria para jogos habilitados na janela [now-4h .. now+28h] e não finalizados.
  --     Janela rolante (em vez de "data UTC = hoje") para que jogos que começam
  --     entre 00:00 e 04:00 UTC recebam o cron no run do dia anterior (04:00).
  FOR g IN
    SELECT gm.id,
           gm.scheduled_at,
           gm.thesportsdb_event_id,
           gm.espn_event_id
    FROM   public.games gm
    LEFT JOIN public.match_latest ml ON ml.event_id = gm.sofascore_id
    WHERE  gm.is_enabled = true
      AND  gm.scheduled_at BETWEEN (now() - interval '4 hours') AND (now() + interval '28 hours')
      AND  COALESCE(ml.final_confirmed, false) = false
  LOOP
    v_start_hour := EXTRACT(HOUR  FROM g.scheduled_at AT TIME ZONE 'UTC')::int;
    v_end_hour   := LEAST(v_start_hour + 3, 23);
    v_day        := EXTRACT(DAY   FROM g.scheduled_at AT TIME ZONE 'UTC')::int;
    v_month      := EXTRACT(MONTH FROM g.scheduled_at AT TIME ZONE 'UTC')::int;

    -- TheSportsDB: a cada 10 min durante a janela do jogo
    IF g.thesportsdb_event_id IS NOT NULL THEN
      PERFORM cron.schedule(
        'gcron-tdb-' || g.id,
        format('*/10 %s-%s %s %s *', v_start_hour, v_end_hour, v_day, v_month),
        format(
          'SELECT net.http_post('
          || 'url := %L, '
          || 'headers := jsonb_build_object(%L, %L, %L, %L || (SELECT value FROM private.cron_secrets WHERE key = %L)), '
          || 'body := jsonb_build_object(%L, %L::text));',
          v_url_base || 'poll-thesportsdb',
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ',
          'service_role_key',
          'game_id', g.id
        )
      );
      v_created := v_created + 1;
    END IF;

    -- ESPN: a cada 20 min durante a janela do jogo
    IF g.espn_event_id IS NOT NULL THEN
      PERFORM cron.schedule(
        'gcron-espn-' || g.id,
        format('*/20 %s-%s %s %s *', v_start_hour, v_end_hour, v_day, v_month),
        format(
          'SELECT net.http_post('
          || 'url := %L, '
          || 'headers := jsonb_build_object(%L, %L, %L, %L || (SELECT value FROM private.cron_secrets WHERE key = %L)), '
          || 'body := jsonb_build_object(%L, %L::text));',
          v_url_base || 'poll-espn',
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ',
          'service_role_key',
          'game_id', g.id
        )
      );
      v_created := v_created + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'crons_created', v_created, 'ts', now());
END;
$func$;

-- 4. Cron diário que atualiza os crons por jogo (04:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-game-crons') THEN
    PERFORM cron.unschedule('refresh-game-crons');
  END IF;
END $$;

SELECT cron.schedule(
  'refresh-game-crons',
  '0 4 * * *',
  'SELECT public.refresh_game_crons();'
);

-- =====================================================================
-- NOTA: após aplicar, inserir a chave (fora do versionamento):
--   INSERT INTO private.cron_secrets (key, value)
--   VALUES ('service_role_key', '<SERVICE_ROLE_KEY>')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- e rodar: SELECT public.refresh_game_crons();
-- =====================================================================
