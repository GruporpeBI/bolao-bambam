"use client";

import { useState } from "react";

interface Props {
  gameId: string;
  hasFixtureId: boolean;
}

export function SyncAfButton({ gameId, hasFixtureId }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleClick() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/sync-apifootball?game_id=${gameId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("ok");
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Erro desconhecido");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Falha na conexão");
    }
    setTimeout(() => setStatus("idle"), 4000);
  }

  if (!hasFixtureId) {
    return (
      <span
        title="Configure api_football_fixture_id no Supabase Studio para habilitar"
        className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-600 cursor-not-allowed select-none"
      >
        🔄 API-Football
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        title="Buscar resultado oficial na API-Football e recalcular pontos"
        className={[
          "text-xs px-2 py-1 rounded border transition-colors",
          status === "idle"    && "border-yellow-500 text-yellow-400 hover:bg-yellow-500/10",
          status === "loading" && "border-zinc-500 text-zinc-400 cursor-wait",
          status === "ok"      && "border-green-500 text-green-400",
          status === "error"   && "border-red-500 text-red-400",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {status === "idle"    && "🔄 API-Football"}
        {status === "loading" && "Buscando…"}
        {status === "ok"      && "✓ Atualizado"}
        {status === "error"   && "✗ Erro"}
      </button>
      {status === "error" && errorMsg && (
        <span className="text-[10px] text-red-400 max-w-[160px] leading-tight">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
