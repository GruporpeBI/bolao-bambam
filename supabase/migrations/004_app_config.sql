-- Tabela de configurações do app (admin configurável)
CREATE TABLE IF NOT EXISTS public.app_config (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Valores padrão
INSERT INTO public.app_config (key, value) VALUES
  ('restaurant_lat',  '-23.550520'),
  ('restaurant_lng',  '-46.633309'),
  ('checkin_radius_m', '400')
ON CONFLICT (key) DO NOTHING;

-- RLS: admin pode ler e escrever; anon só lê
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_config"
  ON public.app_config FOR SELECT
  TO anon, authenticated
  USING (true);
