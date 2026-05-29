"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { saveLocationConfig } from "./actions";

interface LocationConfigProps {
  initialLat: number;
  initialLng: number;
  initialRadius: number;
}

export default function LocationConfig({ initialLat, initialLng, initialRadius }: LocationConfigProps) {
  const [lat, setLat] = useState(String(initialLat));
  const [lng, setLng] = useState(String(initialLng));
  const [radius, setRadius] = useState(String(initialRadius));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    const radN = parseInt(radius, 10);
    if (isNaN(latN) || isNaN(lngN) || isNaN(radN)) {
      setStatus("error");
      setMsg("Valores inválidos. Verifique latitude, longitude e raio.");
      return;
    }
    setStatus("saving");
    const result = await saveLocationConfig(latN, lngN, radN);
    if (result.success) {
      setStatus("saved");
      setMsg("Configuração salva com sucesso!");
    } else {
      setStatus("error");
      setMsg(result.error ?? "Erro ao salvar.");
    }
  }

  function handleTestGeo() {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada neste navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latN = parseFloat(lat);
        const lngN = parseFloat(lng);
        const radN = parseInt(radius, 10);
        const R = 6371000;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const dLat = toRad(pos.coords.latitude - latN);
        const dLng = toRad(pos.coords.longitude - lngN);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latN)) * Math.cos(toRad(pos.coords.latitude)) * Math.sin(dLng / 2) ** 2;
        const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        const dentro = dist <= radN;
        alert(`📍 Sua posição: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}\n🏠 Restaurante: ${latN}, ${lngN}\n📏 Distância: ${dist}m\n✅ Raio configurado: ${radN}m\n${dentro ? "✅ DENTRO do raio — check-in permitido" : "❌ FORA do raio — check-in bloqueado"}`);
      },
      (err) => alert("Erro ao obter localização: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const field = "w-full bg-[#1A1A1A] border border-[#F6C900]/30 text-[#FAF6EB] rounded-sm px-4 py-3 text-sm outline-none focus:border-[#F6C900] transition-colors placeholder:text-[#FAF6EB]/30";

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-lg">
      <p className="text-[#FAF6EB]/50 text-sm">
        Configure a localização do restaurante para o check-in por geolocalização.
        Obtenha as coordenadas em{" "}
        <a href="https://maps.google.com" target="_blank" className="text-[#F6C900] underline">
          Google Maps
        </a>{" "}
        → clique direito no local → copie as coordenadas.
      </p>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[#F6C900] uppercase tracking-wider">Latitude</label>
        <input
          type="text"
          value={lat}
          onChange={(e) => { setLat(e.target.value); setStatus("idle"); }}
          placeholder="-23.550520"
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[#F6C900] uppercase tracking-wider">Longitude</label>
        <input
          type="text"
          value={lng}
          onChange={(e) => { setLng(e.target.value); setStatus("idle"); }}
          placeholder="-46.633309"
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[#F6C900] uppercase tracking-wider">Raio de check-in (metros)</label>
        <input
          type="number"
          value={radius}
          onChange={(e) => { setRadius(e.target.value); setStatus("idle"); }}
          min={50}
          max={2000}
          placeholder="400"
          className={field}
        />
        <p className="text-[#FAF6EB]/30 text-xs">Distância máxima do restaurante para permitir o check-in. Padrão: 400m.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button type="submit" variant="gold" size="sm" disabled={status === "saving"}>
          {status === "saving" ? "Salvando..." : "Salvar configuração"}
        </Button>
        <button
          type="button"
          onClick={handleTestGeo}
          className="px-4 py-2 text-sm border border-[#F6C900]/30 text-[#FAF6EB]/70 hover:text-[#F6C900] hover:border-[#F6C900]/60 rounded-sm transition-colors"
        >
          📍 Testar minha localização
        </button>
      </div>

      {status === "saved" && <p className="text-green-400 text-sm">✓ {msg}</p>}
      {status === "error" && <p className="text-red-400 text-sm">{msg}</p>}
    </form>
  );
}
