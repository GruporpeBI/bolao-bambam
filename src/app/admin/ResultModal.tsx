"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { updateGameResult, unlockGameResult } from "./actions";
import { teamName } from "@/lib/team-names";

interface ResultModalProps {
  game: {
    id: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    ball_possession_home: number | null;
    result_locked?: boolean;
  };
}

function ScoreField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { onChange(""); return; }
    const n = parseInt(raw, 10);
    if (n > 20) return;
    onChange(String(n));
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[#F7EDE0] uppercase tracking-wider">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        maxLength={2}
        placeholder="0"
        className="w-20 text-center bg-[#5A1220] border border-[#F7EDE0]/30 text-[#F7EDE0] rounded-sm px-2 py-3 text-xl font-bold outline-none focus:border-[#F7EDE0] transition-colors placeholder:text-[#F7EDE0]/30"
      />
    </div>
  );
}

export default function ResultModal({ game }: ResultModalProps) {
  const [open, setOpen] = useState(false);
  const [homeScore, setHomeScore] = useState(game.home_score?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(game.away_score?.toString() ?? "");
  const [possession, setPossession] = useState(game.ball_possession_home?.toString() ?? "");
  const [possessionTeam, setPossessionTeam] = useState<"home" | "away">("home");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const homeLabel = teamName(game.home_team);
  const awayLabel = teamName(game.away_team);

  async function handleUnlock() {
    setUnlocking(true);
    const result = await unlockGameResult(game.id);
    setUnlocking(false);
    if (result.success) {
      setStatus("success");
      setMessage("Jogo voltou ao modo automático.");
      setTimeout(() => setOpen(false), 1200);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Erro ao destravar.");
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    const ps = parseInt(possession);
    if (homeScore === "" || isNaN(hs) || hs < 0 || hs > 20) errs.home = "Placar inválido (0–20).";
    if (awayScore === "" || isNaN(as_) || as_ < 0 || as_ > 20) errs.away = "Placar inválido (0–20).";
    if (possession === "" || isNaN(ps) || ps < 0 || ps > 100) errs.possession = "Posse inválida (0–100%).";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    const ps = parseInt(possession);
    // Converte para posse do time da casa
    const possessionHome = possessionTeam === "home" ? ps : 100 - ps;

    setStatus("loading");
    const result = await updateGameResult(game.id, hs, as_, possessionHome);

    if (result.success) {
      setStatus("success");
      setMessage("Resultado atualizado e pontuações recalculadas.");
      setTimeout(() => setOpen(false), 1500);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Erro ao atualizar.");
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-[#F7EDE0] underline underline-offset-2 hover:text-[#EDE0CE] transition-colors"
        >
          Editar resultado
        </button>
        {game.result_locked && (
          <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
            🔒 Travado
          </span>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[#5A1220] border border-[#F7EDE0]/20 rounded-sm p-6 w-full max-w-sm">
            <h3 className="text-[#F7EDE0] font-bold text-lg mb-1">Editar Resultado</h3>
            <p className="text-[#F7EDE0]/50 text-sm mb-3">
              {homeLabel} × {awayLabel}
            </p>

            {game.result_locked && (
              <div className="mb-5 flex flex-col gap-2 rounded-sm border border-amber-400/30 bg-amber-400/5 px-3 py-2.5">
                <p className="text-amber-300/90 text-xs leading-snug">
                  🔒 Resultado fixado manualmente. O polling automático não sobrescreve este jogo.
                </p>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="self-start text-xs text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors disabled:opacity-50"
                >
                  {unlocking ? "Destravando..." : "🔓 Voltar ao automático"}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Placar */}
              <div className="flex flex-wrap gap-4 items-end">
                <ScoreField label={homeLabel} value={homeScore} onChange={setHomeScore} />
                <span className="text-[#F7EDE0] font-bold text-2xl pb-3">×</span>
                <ScoreField label={awayLabel} value={awayScore} onChange={setAwayScore} />
              </div>
              {(errors.home || errors.away) && (
                <p className="text-red-400 text-xs -mt-3">{errors.home || errors.away}</p>
              )}

              {/* Posse de bola */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#F7EDE0] uppercase tracking-wider">Posse de bola (%)</span>
                <p className="text-[#F7EDE0]/40 text-xs -mt-1">De qual time?</p>
                <div className="flex gap-2">
                  {(["home", "away"] as const).map((side) => {
                    const label = side === "home" ? homeLabel : awayLabel;
                    const active = possessionTeam === side;
                    return (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setPossessionTeam(side)}
                        className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${
                          active ? "bg-[#F7EDE0] border-[#F7EDE0] text-[#5A1220]"
                            : "bg-transparent border-[#F7EDE0]/30 text-[#F7EDE0]/60 hover:border-[#F7EDE0]/60"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={possession}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (raw === "") { setPossession(""); return; }
                      const n = parseInt(raw, 10);
                      if (n > 100) return;
                      setPossession(String(n));
                    }}
                    placeholder="50"
                    maxLength={3}
                    className="w-20 text-center bg-[#5A1220] border border-[#F7EDE0]/30 text-[#F7EDE0] rounded-sm px-2 py-2 text-base font-bold outline-none focus:border-[#F7EDE0] transition-colors placeholder:text-[#F7EDE0]/30"
                  />
                  <span className="text-[#F7EDE0]/40 text-sm">%</span>
                </div>
                {errors.possession && <p className="text-red-400 text-xs">{errors.possession}</p>}
              </div>

              {message && (
                <p className={`text-sm ${status === "error" ? "text-red-400" : "text-green-400"}`}>
                  {message}
                </p>
              )}

              <div className="flex gap-3">
                <Button type="submit" variant="gold" size="sm" disabled={status === "loading"}>
                  {status === "loading" ? "Salvando..." : "Salvar resultado"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
