-- Migration 011: Schedule para disparar polling quando jogos começam
-- Executa a cada 1 minuto para verificar se há jogos começando

-- Remove job antigo se existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'game-start-trigger') THEN
    PERFORM cron.unschedule('game-start-trigger');
  END IF;
END $$;

-- Cria novo job: verifica a cada 1 minuto se há jogos começando
SELECT cron.schedule(
  'game-start-trigger',
  '* * * * *',  -- a cada minuto
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/game-start-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Verifica que foi criado
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'game-start-trigger';
