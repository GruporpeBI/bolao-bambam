-- ============================================================================
-- INSERT: Portugal vs Nigeria (2026-06-10)
-- SofaScore ID: 16135568
-- Objectivo: Teste funcional completo de sincronização multi-source
-- ============================================================================

INSERT INTO public.games (
  external_id,
  sofascore_id,
  sofascore_url,
  home_team,
  away_team,
  stage,
  scheduled_at,
  is_brazil_game,
  is_enabled,
  predictions_early,
  is_final,
  ranking_visible,
  status_type,
  status_description,
  created_at,
  updated_at
) VALUES (
  16135568,                                                                                          -- external_id
  16135568,                                                                                          -- sofascore_id
  'https://www.sofascore.com/pt/football/match/nigeria-portugal/eUbsKVb#id:16135568',             -- sofascore_url
  'Portugal',                                                                                        -- home_team
  'Nigeria',                                                                                         -- away_team
  'group',                                                                                           -- stage
  '2026-06-10 18:45:00+00'::timestamptz,                                                           -- scheduled_at (timestamp do SofaScore)
  false,                                                                                             -- is_brazil_game (não é jogo do Brasil)
  true,                                                                                              -- is_enabled
  true,                                                                                              -- predictions_early (para testar antecipação)
  false,                                                                                             -- is_final
  false,                                                                                             -- ranking_visible
  'Not started',                                                                                     -- status_type
  'Not started',                                                                                     -- status_description
  now(),                                                                                             -- created_at
  now()                                                                                              -- updated_at
)
ON CONFLICT (sofascore_id) DO UPDATE SET
  updated_at = now(),
  is_enabled = true,
  predictions_early = true
RETURNING
  id,
  sofascore_id,
  home_team,
  away_team,
  scheduled_at,
  is_enabled,
  predictions_early;

-- ============================================================================
-- Após inserir, execute via API (na sua aplicação):
--
-- curl -X POST http://localhost:3000/api/admin/enrich-ids \
--   -H "x-sync-secret: bolao_sync_2026" \
--   -H "Content-Type: application/json"
--
-- Isso vai buscar e preencher:
--  - espn_event_id
--  - api_football_fixture_id
--  - thesportsdb_event_id
-- ============================================================================

-- Validação: Listar o jogo inserido com todos os IDs
SELECT
  id,
  sofascore_id,
  espn_event_id,
  api_football_fixture_id,
  thesportsdb_event_id,
  home_team,
  away_team,
  scheduled_at,
  is_enabled,
  predictions_early
FROM public.games
WHERE sofascore_id = 16135568;
