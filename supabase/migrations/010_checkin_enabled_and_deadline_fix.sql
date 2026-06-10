-- Migration 010: Add checkin_enabled flag and fix deadline logic
--
-- Adiciona coluna checkin_enabled para permitir check-in em jogos específicos
-- (não apenas jogos do Brasil)
--
-- Permite habilitar check-in para jogos de teste (ex: Portugal vs Nigeria)

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS checkin_enabled boolean NOT NULL DEFAULT false;

-- Para o teste, habilitar check-in para Portugal vs Nigeria (sofascore_id 16135568)
-- NOTA: Remover após testes
UPDATE public.games
SET checkin_enabled = true
WHERE sofascore_id = 16135568;

CREATE INDEX IF NOT EXISTS games_checkin_enabled_idx
  ON public.games (checkin_enabled)
  WHERE checkin_enabled = true;
