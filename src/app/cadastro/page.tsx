import { IconEscudo } from "@/components/icons";
import CadastroForm from "./CadastroForm";

export default function CadastroPage() {
  return (
    <main className="min-h-screen bg-[#5A1220]">
      {/* Hero vinho */}
      <section className="bam-hero-texture relative overflow-hidden bg-[#7D1A2E] px-6 pt-16 pb-24">
        <div className="relative z-10 max-w-md mx-auto flex flex-col items-center gap-3 text-center">
          <IconEscudo width={120} height={94} />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#F7EDE0]/45">
            Bolão Copa 2026
          </p>
          <h1 className="font-display text-5xl font-semibold text-[#F7EDE0] uppercase tracking-tight leading-none">
            Participe
          </h1>
          <p className="font-display italic text-[15px] text-[#F7EDE0]/55 mt-1">
            Faça seus palpites e dispute prêmios no Bam Bam Café
          </p>
          <p className="font-hand text-xl text-[#F7EDE0]/35 -rotate-1 mt-1">
            Você faz parte dessa torcida.
          </p>
        </div>
      </section>

      {/* Card do formulário */}
      <div className="max-w-md mx-auto px-4 -mt-8 pb-16">
        <div className="bg-[#6E1727] border border-[#F7EDE0]/10 rounded-sm p-6 shadow-xl">
          <CadastroForm />
        </div>

        {/* Regras rápidas */}
        <div className="mt-6 border border-[#F7EDE0]/10 rounded-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F7EDE0]/70 mb-3">
            Como funciona a pontuação
          </p>
          <ul className="flex flex-col gap-2">
            {[
              ["51 pts", "Presença no restaurante (jogo Brasil)"],
              ["16 pts", "Acertou o ganhador (sem placar exato)"],
              ["30 pts", "Placar exato (todos os jogos)"],
              ["27 pts", "Semifinalista correto (cada, palpite antecipado)"],
              ["40 pts", "Finalista correto (cada, palpite antecipado)"],
              ["101 pts", "Campeão correto (palpite antecipado)"],
              ["121 pts", "Placar exato da final (palpite antecipado)"],
              ["100 pts", "Presença na final (mesmo sendo jogo do Brasil)"],
            ].map(([pts, desc]) => (
              <li key={pts} className="flex items-start gap-3">
                <span className="text-[#F7EDE0] font-bold text-xs w-16 shrink-0 pt-0.5">{pts}</span>
                <span className="text-[#F7EDE0]/50 text-xs">{desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#F7EDE0]/45 text-xs leading-relaxed mt-3">
            A final abre para palpite de placar no dia do jogo (mesmo sem o Brasil). A semifinal abre no dia apenas se for jogo do Brasil. Esses palpites do dia (placar exato 30 / ganhador 16) somam com os palpites antecipados do torneio.
          </p>
          <p className="text-[#F7EDE0]/45 text-xs leading-relaxed mt-2">
            Em caso de empate, o desempate é por número de presenças, placares exatos, acertos de ganhador, e proximidade na % de posse de bola.
          </p>
        </div>
      </div>
    </main>
  );
}
