/**
 * Script para:
 * 1. Conectar ao Supabase
 * 2. Buscar API_FOOTBALL_KEY de app_config
 * 3. Buscar Portugal vs Nigeria em todas as APIs
 * 4. Retornar todos os 4 IDs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yzbsahubleskqbfmvmei.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YnNhaHVibGVza3FiZm12bWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkxMzI3MjUsImV4cCI6MjAyNDcwODcyNX0.uQvnkwlYw6V0xf_f6nKq8p_-vD0vwRLkPUO6OhCj3rE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔑 Conectando ao Supabase...\n');

async function main() {
  try {
    // Buscar API_FOOTBALL_KEY da tabela app_config
    const { data: configData, error: configError } = await supabase
      .from('app_config')
      .select('key, value')
      .or("key.ilike.%API_FOOTBALL%,key.ilike.%apisports%");

    if (configError) {
      console.log('❌ Erro ao buscar config:', configError.message);
      process.exit(1);
    }

    console.log('✅ Configurações encontradas:');
    console.log(JSON.stringify(configData, null, 2));

    // Extrair chave
    const apiKey = configData?.find(c => c.key.includes('API_FOOTBALL'))?.value;

    if (!apiKey) {
      console.log('\n❌ API_FOOTBALL_KEY não encontrada em app_config');
      console.log('Todas as chaves disponíveis:');
      const { data: allConfig } = await supabase.from('app_config').select('key');
      allConfig?.forEach(c => console.log(`  - ${c.key}`));
      process.exit(1);
    }

    console.log(`\n✅ API_FOOTBALL_KEY encontrada: ${apiKey.substring(0, 10)}...`);

    // Agora buscar em API-Football
    console.log('\n🔍 Buscando Portugal vs Nigeria em API-Football...');
    const afRes = await fetch(
      'https://v3.football.api-sports.io/fixtures?team=770&season=2026',
      { headers: { 'x-apisports-key': apiKey } }
    );

    if (!afRes.ok) {
      console.log(`❌ API-Football HTTP ${afRes.status}`);
    } else {
      const afData = await afRes.json();
      const match = afData.response?.find(f =>
        (f.teams.home.name.includes('Portugal') && f.teams.away.name.includes('Nigeria')) ||
        (f.teams.home.name.includes('Nigeria') && f.teams.away.name.includes('Portugal'))
      );

      if (match) {
        console.log(`✅ Encontrado: ${match.teams.home.name} vs ${match.teams.away.name}`);
        console.log(`   api_football_fixture_id: ${match.fixture.id}`);
      } else {
        console.log('❌ Portugal vs Nigeria não encontrado em API-Football');
      }
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

main();
