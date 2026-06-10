-- ============================================================================
-- Insert Test Match: Cañuelas Reserve × General Lamadrid Reserve
-- SofaScore ID: 16300515 | Date: 2026-06-10 17:00 UTC
-- Purpose: Functional test of result synchronization + scoring system
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
  16300515,
  16300515,
  'https://www.sofascore.com/pt/football/match/canuelas-reserve-general-lamadrid-reserve/vagdsEagd#id:16300515',
  'Cañuelas Reserve',
  'General Lamadrid Reserve',
  'group',
  '2026-06-10 17:00:00+00'::timestamptz,
  false,
  true,
  true,
  false,
  false,
  'Not started',
  'Not started',
  now(),
  now()
)
ON CONFLICT (sofascore_id) DO UPDATE SET
  updated_at = now(),
  is_enabled = true,
  predictions_early = true
RETURNING id, sofascore_id, home_team, away_team, scheduled_at, is_enabled;
