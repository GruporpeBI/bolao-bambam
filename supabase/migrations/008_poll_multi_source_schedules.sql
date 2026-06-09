-- Remove job Sofascore
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-world-cup-live') THEN
    PERFORM cron.unschedule('poll-world-cup-live');
  END IF;
END $$;

-- Idempotência
DO $$
BEGIN
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
