"use client";

import { useState } from "react";

interface EnrichResult {
  scanned:  number;
  updated:  number;
  sources:  { af: number; espn: number; tdb: number };
  results:  Array<{ game: string; af: boolean; espn: boolean; tdb: boolean }>;
}

export function EnrichIdsButton() {
  const [status, setStatus]   = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [summary, setSummary] = useState<string>("");

  async function handleClick() {
    setStatus("loading");
    setSummary("");
    try {
      const res  = await fetch("/api/admin/enrich-ids", { method: "POST" });
      const data = await res.json() as EnrichResult & { error?: string; message?: string };
      if (res.ok) {
        setStatus("ok");
        if (data.updated === 0) {
          setSummary(data.message ?? "Todos os IDs já preenchidos.");
        } else {
          setSummary(
            `${data.updated}/${data.scanned} jogo(s) atualizados — AF: ${data.sources.af} | ESPN: ${data.sources.espn} | TDB: ${data.sources.tdb}`
          );
        }
      } else {
        setStatus("error");
        setSummary(data.error ?? "Erro desconhecido");
      }
    } catch {
      setStatus("error");
      setSummary("Falha na conexão");
    }
    // Mantém o estado ok/error por 6 segundos para o admin ler
    setTimeout(() => { setStatus("idle"); setSummary(""); }, 6000);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        title="Busca automaticamente thesportsdb_event_id, espn_event_id e api_football_fixture_id para todos os jogos"
        className={[
          "text-xs px-3 py-1.5 rounded border font-medium transition-colors",
          status === "idle"    && "border-blue-500 text-blue-400 hover:bg-blue-500/10",
          status === "loading" && "border-zinc-500 text-zinc-400 cursor-wait",
          status === "ok"      && "border-green-500 text-green-400",
          status === "error"   && "border-red-500 text-red-400",
        ].filter(Boolean).join(" ")}
      >
        {status === "idle"    && "🔍 Enrich IDs"}
        {status === "loading" && "Buscando IDs…"}
        {status === "ok"      && "✓ IDs atualizados"}
        {status === "error"   && "✗ Erro"}
      </button>
      {summary && (
        <span className={`text-[10px] max-w-xs leading-tight ${status === "error" ? "text-red-400" : "text-green-400"}`}>
          {summary}
        </span>
      )}
    </div>
  );
}
