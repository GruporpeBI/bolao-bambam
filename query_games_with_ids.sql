-- Buscar jogos com múltiplos IDs preenchidos (para validar padrão)
SELECT 
  id,
  home_team,
  away_team,
  scheduled_at,
  sofascore_id,
  espn_event_id,
  api_football_fixture_id,
  thesportsdb_event_id,
  is_brazil_game,
  is_enabled
FROM public.games
WHERE 
  sofascore_id IS NOT NULL 
  AND (espn_event_id IS NOT NULL 
       OR api_football_fixture_id IS NOT NULL 
       OR thesportsdb_event_id IS NOT NULL)
LIMIT 5;

-- Também buscar TODOS os jogos para ver o padrão de IDs
SELECT 
  COUNT(*) as total_games,
  SUM(CASE WHEN sofascore_id IS NOT NULL THEN 1 ELSE 0 END) as with_sofascore,
  SUM(CASE WHEN espn_event_id IS NOT NULL THEN 1 ELSE 0 END) as with_espn,
  SUM(CASE WHEN api_football_fixture_id IS NOT NULL THEN 1 ELSE 0 END) as with_api_football,
  SUM(CASE WHEN thesportsdb_event_id IS NOT NULL THEN 1 ELSE 0 END) as with_thesportsdb
FROM public.games;
