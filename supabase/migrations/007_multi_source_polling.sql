-- IDs de fontes externas na tabela games
-- (sofascore_id e sofascore_url já existem da migration 001)
alter table games
  add column if not exists thesportsdb_event_id    text,
  add column if not exists espn_event_id            text,
  add column if not exists espn_league              text default 'fifa.world',
  add column if not exists api_football_fixture_id  text;

-- Colunas multi-source em match_latest para rastreamento por fonte
alter table match_latest
  -- TheSportsDB (score a cada 10 min)
  add column if not exists tdb_home_score    integer,
  add column if not exists tdb_away_score    integer,
  add column if not exists tdb_status        text,
  add column if not exists tdb_fetched_at    timestamptz,

  -- ESPN (score + posse + gols a cada 20 min)
  add column if not exists espn_home_score   integer,
  add column if not exists espn_away_score   integer,
  add column if not exists espn_possession   numeric,
  add column if not exists espn_status       text,
  add column if not exists espn_fetched_at   timestamptz,

  -- API-Football (autoritativo, chamado só ao fim ou manualmente)
  add column if not exists af_home_score     integer,
  add column if not exists af_away_score     integer,
  add column if not exists af_possession     numeric,
  add column if not exists af_status         text,
  add column if not exists af_fetched_at     timestamptz,

  -- Consenso entre fontes
  -- 'pending' | 'agreed' | 'conflict' | 'confirmed' | 'manual_needed'
  add column if not exists consensus_status  text not null default 'pending',
  add column if not exists final_confirmed   boolean not null default false;
