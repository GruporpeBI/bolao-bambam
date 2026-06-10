/**
 * Script para encontrar IDs de Portugal vs Nigeria em múltiplas APIs
 *
 * Uso:
 *   NODE_OPTIONS="--no-warnings" node FIND_PORTUGAL_IDS.js \
 *     --api-key=YOUR_API_SPORTS_KEY \
 *     --date=2026-06-10
 *
 * Ou configure .env.local com:
 *   API_FOOTBALL_KEY=sua_chave_aqui
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️ .env.local não encontrado');
    return {};
  }
  const env = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const ENV = loadEnv();
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || ENV.API_FOOTBALL_KEY;

console.log('🔍 Buscando Portugal vs Nigeria em múltiplas APIs...\n');

// ============================================================================
// 1. API-Football (precisa de API key)
// ============================================================================
async function findInApiFootball() {
  console.log('📍 Buscando em API-Football...');

  if (!API_FOOTBALL_KEY) {
    console.log('   ❌ API_FOOTBALL_KEY não configurada\n');
    return null;
  }

  try {
    // Buscar Portugal (ID 770)
    const res = await fetch(
      'https://v3.football.api-sports.io/fixtures?team=770&season=2026',
      { headers: { 'x-apisports-key': API_FOOTBALL_KEY } }
    );

    if (!res.ok) {
      console.log(`   ❌ HTTP ${res.status}: ${res.statusText}\n`);
      return null;
    }

    const data = await res.json();
    const match = data.response?.find(f =>
      (f.teams.home.name.includes('Portugal') && f.teams.away.name.includes('Nigeria')) ||
      (f.teams.home.name.includes('Nigeria') && f.teams.away.name.includes('Portugal'))
    );

    if (match) {
      console.log(`   ✅ Encontrado: ${match.teams.home.name} vs ${match.teams.away.name}`);
      console.log(`   📌 fixture_id: ${match.fixture.id}`);
      console.log(`   📅 Data: ${match.fixture.date}\n`);
      return match.fixture.id;
    } else {
      console.log('   ❌ Portugal vs Nigeria não encontrado nesta season\n');
      return null;
    }
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}\n`);
    return null;
  }
}

// ============================================================================
// 2. ESPN
// ============================================================================
async function findInEspn() {
  console.log('📍 Buscando em ESPN...');

  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/scoreboard?dates=20260610'
    );

    if (!res.ok) {
      console.log(`   ❌ HTTP ${res.status}: ${res.statusText}\n`);
      return null;
    }

    const data = await res.json();
    const match = data.events?.find(e => {
      const home = e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team.displayName || '';
      const away = e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team.displayName || '';
      return (home.includes('Portugal') && away.includes('Nigeria')) ||
             (home.includes('Nigeria') && away.includes('Portugal'));
    });

    if (match) {
      console.log(`   ✅ Encontrado: ${match.name}`);
      console.log(`   📌 espn_id: ${match.id}`);
      console.log(`   📅 Data: ${match.competitions?.[0]?.date}\n`);
      return match.id;
    } else {
      console.log('   ❌ Portugal vs Nigeria não encontrado\n');
      return null;
    }
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}\n`);
    return null;
  }
}

// ============================================================================
// 3. TheSportsDB
// ============================================================================
async function findInTheSportsDb() {
  console.log('📍 Buscando em TheSportsDB...');

  try {
    // TheSportsDB: team ID de Portugal é 133602
    const res = await fetch(
      'https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=133602'
    );

    if (!res.ok) {
      console.log(`   ❌ HTTP ${res.status}: ${res.statusText}\n`);
      return null;
    }

    const data = await res.json();
    const match = data.results?.find(e =>
      (e.strHomeTeam.includes('Portugal') && e.strAwayTeam.includes('Nigeria')) ||
      (e.strHomeTeam.includes('Nigeria') && e.strAwayTeam.includes('Portugal'))
    );

    if (match) {
      console.log(`   ✅ Encontrado: ${match.strHomeTeam} vs ${match.strAwayTeam}`);
      console.log(`   📌 idEvent: ${match.idEvent}`);
      console.log(`   📅 Data: ${match.dateEvent}\n`);
      return match.idEvent;
    } else {
      console.log('   ❌ Portugal vs Nigeria não encontrado\n');
      return null;
    }
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}\n`);
    return null;
  }
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  const [afId, espnId, tdbId] = await Promise.all([
    findInApiFootball(),
    findInEspn(),
    findInTheSportsDb(),
  ]);

  console.log('\n✨ RESUMO DOS IDS ENCONTRADOS:\n');
  console.log(`  sofascore_id:              16135568 (já conhecemos ✅)`);
  console.log(`  api_football_fixture_id:  ${afId || '❌ Não encontrado'}`);
  console.log(`  espn_event_id:             ${espnId || '❌ Não encontrado'}`);
  console.log(`  thesportsdb_event_id:      ${tdbId || '❌ Não encontrado'}`);

  console.log('\n📋 Use esses IDs no INSERT SQL:\n');
  console.log(`INSERT INTO public.games (...) VALUES (
  16135568,              -- sofascore_id
  '${afId || 'NULL'}',   -- api_football_fixture_id
  '${espnId || 'NULL'}', -- espn_event_id
  '${tdbId || 'NULL'}',  -- thesportsdb_event_id
  ...
);`);
}

main().catch(console.error);
