/**
 * POST /api/admin/apply-migrations
 *
 * Instrui o usuário a aplicar migrations manualmente no Supabase Dashboard
 * As migrations não podem ser executadas via API REST por limitações de segurança
 * Requer: x-sync-secret header ou admin_access cookie
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

  return NextResponse.json({
    ok: false,
    message: "As migrations devem ser aplicadas manualmente no Supabase Dashboard",
    instructions: {
      step_1: "Acesse https://app.supabase.com → seu projeto bolao-amauri",
      step_2: "Vá para SQL Editor → New Query",
      step_3: "Copie TODO o conteúdo do arquivo MIGRATIONS_APPLY.sql deste projeto",
      step_4: "Cole no SQL Editor e clique Run",
      step_5: "Execute as 4 queries de verificação ao final do arquivo",
    },
    migration_file: "MIGRATIONS_APPLY.sql",
    documentation_file: "APPLY_MIGRATIONS_MANUAL.md",
    timestamp: new Date().toISOString(),
  });
}
