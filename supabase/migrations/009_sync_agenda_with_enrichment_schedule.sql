-- Migration 009: Schedule sync-agenda-with-enrichment
--
-- Adiciona job pg_cron para executar sync-agenda-with-enrichment diariamente
-- Executa: Diariamente 03:00 UTC (a partir de 24/06/2026, verificado na Edge Function)
--
-- Fluxo:
-- 1. Sofascore → jogos
-- 2. Se falhar → ESPN fallback
-- 3. Auto-dispara enrich-ids
-- 4. Retry automático no dia seguinte se enrich retornar NULL

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
