"use client";

import { useState } from "react";

interface Props {
  gameId:      string;
  hasEspnId:   boolean;
  hasAfId:     boolean;
  onSuccess?:  (homeScore: number, awayScore: number, possession: number | null, source: string) => void;
}

type Status = "idle" | "loading" | "ok" | "not_finished" | "no_ids" | "error";

const SOURCE_LABEL: Record<string, string> = {
  espn:        "ESPN",
  apifootball: "API-Football",
};

export function AutoSyncButton({ gameId, hasEspnId, hasAfId, onSuccess }: Props) {
  const [status,    setStatus]    = useState<Status>("idle");
  const [message,   setMessage]   = useState("");
  const [source,    setSource]    = useState("");

  const hasAnyId = hasEspnId || hasAfId;

  async function handleClick() {
    if (!hasAnyId) return;
    setStatus("loading");
    setMessage("");
    setSource("");

    try {
      const res  = await fetch(`/api/admin/sync-result-auto?game_id=${gameId}`, { method: "POST" });
      const data = await res.json() as {
        ok?: boolean;
        source?: string;
        home_score?: number;
        away_score?: number;
        possession?: number | null;
        error?: string;
      };

      if (res.ok && data.ok) {
        setStatus("ok");
        setSource(SOURCE_LABEL[data.source ?? ""] ?? data.source ?? "");
        if (onSuccess && data.home_score != null && data.away_score != null) {
          onSuccess(data.home_score, data.away_score, data.possession ?? null, data.source ?? "");
        }
      } else if (res.status === 404) {
        setStatus("not_finished");
        setMessage("Jogo ainda não finalizado");
      } else if (res.status === 422) {
        setStatus("no_ids");
        setMessage("IDs não configurados — aguarde o sync diário");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Erro desconhecido");
      }
    } catch {
      setStatus("error");
      setMessage("Falha na conexão");
    }

    setTimeout(() => { setStatus("idle"); setMessage(""); setSource(""); }, 5000);
  }

  if (!hasAnyId) {
    return (
      <div className="flex flex-col items-center gap-0.5 w-full">
        <span className="text-[10px] text-zinc-600 text-center">
          IDs pendentes — sync às 03:00
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className={[
          "w-full max-w-[220px] px-3 py-2 rounded text-sm font-semibold transition-all",
          status === "idle"         && "bg-[#F6C900]/10 border border-[#F6C900]/50 text-[#F6C900] hover:bg-[#F6C900]/20",
          status === "loading"      && "bg-zinc-800 border border-zinc-600 text-zinc-400 cursor-wait",
          status === "ok"           && "bg-green-500/10 border border-green-500 text-green-400",
          status === "not_finished" && "bg-yellow-500/10 border border-yellow-500/50 text-yellow-400",
          status === "no_ids"       && "bg-zinc-800 border border-zinc-600 text-zinc-500",
          status === "error"        && "bg-red-500/10 border border-red-500 text-red-400",
        ].filter(Boolean).join(" ")}
      >
        {status === "idle"         && "🔄 Buscar Resultado"}
        {status === "loading"      && "Buscando…"}
        {status === "ok"           && `✓ Atualizado via ${source}`}
        {status === "not_finished" && "⏳ Jogo não finalizado"}
        {status === "no_ids"       && "⚙️ IDs pendentes"}
        {status === "error"        && "✗ Erro"}
      </button>

      {message && status !== "idle" && (
        <span className={[
          "text-[10px] text-center leading-tight px-1",
          status === "ok"           && "text-green-400",
          status === "not_finished" && "text-yellow-400",
          status === "no_ids"       && "text-zinc-500",
          status === "error"        && "text-red-400",
        ].filter(Boolean).join(" ")}>
          {message}
        </span>
      )}

      <span className="text-[9px] text-zinc-700 text-center">
        {hasEspnId && hasAfId ? "ESPN → API-Football" : hasEspnId ? "ESPN" : "API-Football"}
      </span>
    </div>
  );
}
