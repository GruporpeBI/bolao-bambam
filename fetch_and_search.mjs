import { createClient } from '@supabase/supabase-js';

const URL = 'https://yzbsahubleskqbfmvmei.supabase.co';
const ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YnNhaHVibGVza3FiZm12bWVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5NTQyMSwiZXhwIjoyMDk1MzcxNDIxfQ.0s0baNlDWdJ-qcXXFcetnIr9ravQE9kr_diuxhp3Qr4';

const sb = createClient(URL, ROLE_KEY);

console.log('🔍 Buscando IDs de Portugal vs Nigeria...\n');

try {
  // Buscar configurações
  console.log('1️⃣ Buscando credenciais no banco...');
  const { data: config } = await sb.from('app_config').select('*');
  console.log('✅ Config carregada:', config?.length, 'itens\n');

  // Buscar API keys
  const apiKeys = config?.filter(c => c.key.includes('API') || c.key.includes('api'));
  console.log('🔑 Chaves API encontradas:');
  apiKeys?.forEach(k => {
    const masked = k.value?.substring(0, 10) + '...';
    console.log(`   ${k.key}: ${masked}`);
  });

  // Tentar com API-Football
  const apiKey = apiKeys?.find(k => k.key.includes('API_FOOTBALL'))?.value;
  if (apiKey) {
    console.log(`\n2️⃣ Buscando em API-Football com chave encontrada...\n`);
    
    const res = await fetch(
      'https://v3.football.api-sports.io/fixtures?team=770&season=2026',
      { headers: { 'x-apisports-key': apiKey } }
    );

    if (res.ok) {
      const data = await res.json();
      const match = data.response?.find(f =>
        (f.teams.home.name.toLowerCase().includes('portug') && f.teams.away.name.toLowerCase().includes('nigeria')) ||
        (f.teams.home.name.toLowerCase().includes('nigeria') && f.teams.away.name.toLowerCase().includes('portug'))
      );

      if (match) {
        console.log(`✅ ENCONTRADO em API-Football!`);
        console.log(`   ${match.teams.home.name} vs ${match.teams.away.name}`);
        console.log(`   📌 fixture_id: ${match.fixture.id}`);
        console.log(`   📅 ${match.fixture.date}\n`);
      } else {
        console.log(`❌ Portugal não encontrado em API-Football\n`);
        console.log('Últimos 5 jogos de Portugal:');
        data.response?.slice(0, 5).forEach(f => {
          console.log(`   ${f.teams.home.name} vs ${f.teams.away.name} (${f.fixture.date})`);
        });
      }
    } else {
      console.log(`❌ HTTP ${res.status} em API-Football\n`);
    }
  } else {
    console.log(`❌ API_FOOTBALL_KEY não encontrada\n`);
  }

} catch (err) {
  console.error('❌ Erro:', err.message);
}
