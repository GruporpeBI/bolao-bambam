-- ============================================================================
-- Simulate Match Result Synchronization (as if poller had fetched it)
-- This simulates what /api/sync-result endpoint does
-- ============================================================================

-- Step 1: Insert into match_latest (as if poller fetched from SofaScore)
INSERT INTO public.match_latest (
  event_id,
  source,
  match_url,
  home_team,
  away_team,
  status,
  home_score,
  away_score,
  home_possession,
  away_possession,
  goals,
  raw,
  fetched_at,
  updated_at
) VALUES (
  16300515,
  'sofascore',
  'https://www.sofascore.com/pt/football/match/canuelas-reserve-general-lamadrid-reserve/vagdsEagd#id:16300515',
  'Cañuelas Reserve',
  'General Lamadrid Reserve',
  'Finished',
  2,
  1,
  55,
  45,
  '[
    {"minute": 23, "team": "home", "player": "Player A", "homeScore": 1, "awayScore": 0},
    {"minute": 67, "team": "home", "player": "Player B", "homeScore": 2, "awayScore": 0},
    {"minute": 89, "team": "away", "player": "Player C", "homeScore": 2, "awayScore": 1}
  ]'::jsonb,
  '{"raw_event": {"status": "Finished"}, "statistics": {}}'::jsonb,
  now(),
  now()
)
ON CONFLICT (event_id) DO UPDATE SET
  status = 'Finished',
  home_score = 2,
  away_score = 1,
  home_possession = 55,
  away_possession = 45,
  updated_at = now();

-- Step 2: Insert snapshot (historical record)
INSERT INTO public.match_snapshots (
  event_id,
  source,
  match_url,
  status,
  home_score,
  away_score,
  home_possession,
  away_possession,
  goals,
  raw,
  fetched_at
) VALUES (
  16300515,
  'sofascore',
  'https://www.sofascore.com/pt/football/match/canuelas-reserve-general-lamadrid-reserve/vagdsEagd#id:16300515',
  'Finished',
  2,
  1,
  55,
  45,
  '[
    {"minute": 23, "team": "home", "player": "Player A", "homeScore": 1, "awayScore": 0},
    {"minute": 67, "team": "home", "player": "Player B", "homeScore": 2, "awayScore": 0},
    {"minute": 89, "team": "away", "player": "Player C", "homeScore": 2, "awayScore": 1}
  ]'::jsonb,
  '{"raw_event": {"status": "Finished"}, "statistics": {}}'::jsonb,
  now()
);

-- Step 3: Update games table (this is what /api/sync-result does)
UPDATE public.games
SET
  home_score = 2,
  away_score = 1,
  ball_possession_home = 55,
  status_type = 'Finished',
  status_description = 'Finished',
  updated_at = now()
WHERE sofascore_id = 16300515
RETURNING id, home_team, away_team, home_score, away_score, ball_possession_home;

-- Step 4: Verify sync completed
SELECT
  id,
  home_team,
  away_team,
  home_score,
  away_score,
  ball_possession_home,
  updated_at
FROM public.games
WHERE sofascore_id = 16300515;
