import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:hyahTpLHam76v9xV@db.yzbsahubleskqbfmvmei.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.app_config (
      key   text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log("Tabela criada");

  await client.query(`
    INSERT INTO public.app_config (key, value) VALUES
      ('restaurant_lat',  '-23.550520'),
      ('restaurant_lng',  '-46.633309'),
      ('checkin_radius_m', '400')
    ON CONFLICT (key) DO NOTHING;
  `);
  console.log("Valores padrão inseridos");

  await client.query(`
    ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
  `);

  await client.query(`
    CREATE POLICY IF NOT EXISTS "Public read app_config"
      ON public.app_config FOR SELECT
      TO anon, authenticated
      USING (true);
  `).catch(() => {}); // ignora se já existe

  const { rows } = await client.query("SELECT * FROM public.app_config");
  console.log("Config atual:", rows);
} finally {
  client.release();
  await pool.end();
}
