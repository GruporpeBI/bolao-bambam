import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { recalculateScores } from "@/app/admin/actions";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// API-Football com fallback automático para key2
async function fetchAfApi(url: string): Promise<Response> {
  const key1 = process.env.API_FOOTBALL_KEY ?? "";
  const key2 = process.env.API_FOOTBALL_KEY_2 ?? "";
  const res1 = await fetch(url, { headers: { "x-apisports-key": key1 } });
  const remaining = Number(res1.headers.get("x-ratelimit-requests-remaining") ?? "1");
  if ((res1.status === 429 || remaining === 0) && key2) {
    return fetch(url, { headers: { "x-apisports-key": key2 } });
  }
  return res1;
}

async function isAdmin(req: NextRequest): Promise<boolean> {
  // Verifica cookie de sessão admin (mesmo mecanismo da página /admin)
  const cookieStore = await cookies();
  if (cookieStore.get("admin_access")) return true;

  // Fallback: header x-sync-secret para chamadas internas (Edge Functions)
  if (req.headers.get("x-sync-secret") === process.env.SYNC_SECRET) return true;

  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameId = req.nextUrl.searchParams.get("game_id");
  if (!gameId) {
    return NextResponse.json({ error: "game_id é obrigatório" }, { status: 400 });
  }

  if (!process.env.API_FOOTBALL_KEY && !process.env.API_FOOTBALL_KEY_2) {
    return NextResponse.json({ error: "API_FOOTBALL_KEY não configurada" }, { status: 500 });
  }

  const supabase = getServiceClient();

  // Busca o jogo pelo ID interno
  const { data: game, error: findError } = await supabase
    .from("games")
    .select("id, home_team, away_team, api_football_fixture_id")
    .eq("id", gameId)
    .single();

  if (findError || !game) {
    return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
  }

  if (!game.api_football_fixture_id) {
    return NextResponse.json(
      { error: "api_football_fixture_id não configurado para este jogo. Preencha no Supabase Studio." },
      { status: 422 }
    );
  }

  // Chama API-Football com dual-key fallback
  let fixRes: Response, stRes: Response;
  try {
    const base = "https://v3.football.api-sports.io";
    [fixRes, stRes] = await Promise.all([
      fetchAfApi(`${base}/fixtures?id=${game.api_football_fixture_id}`),
      fetchAfApi(`${base}/fixtures/statistics?fixture=${game.api_football_fixture_id}`),
    ]);
  } catch (err) {
    return NextResponse.json({ error: `API-Football fetch error: ${err}` }, { status: 502 });
  }

  const [fixData, stData] = await Promise.all([fixRes.json(), stRes.json()]);

  const fixture = fixData.response?.[0];
  if (!fixture) {
    return NextResponse.json(
      { error: "API-Football: sem dados de fixture. Verifique se o api_football_fixture_id está correto." },
      { status: 502 }
    );
  }

  const homeScore = fixture.goals.home   as number | null;
  const awayScore = fixture.goals.away   as number | null;
  const homeStats = (stData.response?.[0]?.statistics ?? []) as Array<{ type: string; value: string }>;
  const possEntry = homeStats.find((s) => s.type === "Ball Possession");
  const possession = possEntry?.value
    ? parseFloat(possEntry.value.replace("%", ""))
    : null;

  // Atualiza o jogo com o resultado definitivo
  const { error: updateError } = await supabase
    .from("games")
    .update({
      home_score:           homeScore,
      away_score:           awayScore,
      ball_possession_home: possession,
      status_type:          fixture.fixture.status.short,
      status_description:   fixture.fixture.status.long,
    } as never)
    .eq("id", gameId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Marca match_latest como confirmado (se existir)
  await supabase
    .from("match_latest")
    .update({
      af_home_score:    homeScore,
      af_away_score:    awayScore,
      af_possession:    possession,
      af_status:        fixture.fixture.status.short,
      af_fetched_at:    new Date().toISOString(),
      consensus_status: "confirmed",
      final_confirmed:  true,
      home_score:       homeScore,
      away_score:       awayScore,
      home_possession:  possession,
      updated_at:       new Date().toISOString(),
    })
    .eq("event_id", fixture.fixture.id);

  // Recalcula pontos de todos os usuários
  await recalculateScores();

  return NextResponse.json({
    ok:         true,
    game_id:    gameId,
    home_team:  game.home_team,
    away_team:  game.away_team,
    home_score: homeScore,
    away_score: awayScore,
    possession,
    status:     fixture.fixture.status.long,
  });
}
