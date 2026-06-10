/**
 * POST /api/admin/auto-setup-migrations
 *
 * Aplica TODAS as migrations automaticamente:
 * 1. Chama apply-migrations-auto (Edge Function)
 * 2. Aguarda conclusão
 * 3. Dispara game-start-trigger para teste
 *
 * Requer: x-sync-secret header
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_access")) return true;
  if (req.headers.get("x-sync-secret") === process.env.SYNC_SECRET) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase credentials missing" },
      { status: 500 }
    );
  }

  try {
    console.log("[auto-setup] Iniciando setup automático...");

    // Step 1: Aplicar migrations
    console.log("[auto-setup] Etapa 1: Aplicando migrations...");
    const migrationsResponse = await fetch(
      `${supabaseUrl}/functions/v1/apply-migrations-auto`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const migrationsData = await migrationsResponse.json();
    console.log("[auto-setup] Migrations:", migrationsData);

    if (!migrationsResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "migrations",
          error: migrationsData,
        },
        { status: 500 }
      );
    }

    // Step 2: Aguardar um pouco (para migrations serem processadas)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Disparar game-start-trigger para teste
    console.log("[auto-setup] Etapa 2: Disparando game-start-trigger para teste...");
    const triggerResponse = await fetch(
      `${supabaseUrl}/functions/v1/game-start-trigger`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const triggerData = await triggerResponse.json();
    console.log("[auto-setup] Trigger:", triggerData);

    // Step 4: Responder com sucesso
    return NextResponse.json({
      ok: true,
      message: "Setup automático completo!",
      steps: {
        migrations: migrationsData,
        game_start_trigger: triggerData,
      },
      next_steps: [
        "Migrations foram aplicadas automaticamente",
        "Game-start-trigger foi disparado e vai rodar a cada 1 minuto",
        "Quando um jogo começar, polling será disparado automaticamente",
        "Dados em tempo real aparecerão no site",
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[auto-setup] Erro:", err);
    return NextResponse.json(
      {
        ok: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}
