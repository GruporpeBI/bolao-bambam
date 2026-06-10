-- Migration 013: Lock de override manual do admin
-- =====================================================================
-- Quando o admin corrige um resultado manualmente, result_locked=true e o
-- polling automático (poll-thesportsdb/poll-espn) para de sobrescrever o
-- placar/posse/status daquele jogo. O admin pode destravar para voltar ao
-- modo automático.
-- =====================================================================

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS result_locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.games.result_locked IS
  'true = resultado fixado manualmente pelo admin; polling automático não sobrescreve.';
