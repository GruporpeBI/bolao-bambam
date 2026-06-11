import Link from "next/link";
import VideoBackground from "@/components/VideoBackground";
import { IconEscudo, IconBadge2026 } from "@/components/icons";
import Button from "@/components/ui/Button";
import AdminButton from "@/components/AdminButton";

const pontuacao = [
  { evento: "Presença no restaurante (jogo Brasil)", pts: 51 },
  { evento: "Acertou o ganhador (sem placar exato)", pts: 16 },
  { evento: "Placar exato (todos os jogos)", pts: 30 },
  { evento: "Semifinalista correto (cada, palpite antecipado)", pts: 27 },
  { evento: "Finalista correto (cada, palpite antecipado)", pts: 40 },
  { evento: "Campeão correto (palpite antecipado)", pts: 101 },
  { evento: "Placar exato da final (palpite antecipado)", pts: 121 },
  { evento: "Presença na final (mesmo sendo jogo do Brasil)", pts: 100 },
];

const comoFunciona = [
  {
    step: "01",
    title: "Cadastre-se",
    desc: "Crie sua conta com nome, telefone e CPF. Rápido, gratuito e exclusivo para maiores de 18 anos.",
    hand: "Vai Brasil!",
  },
  {
    step: "02",
    title: "Faça seus Palpites",
    desc: "Envie seu palpite de placar até 5 minutos antes de cada jogo do Brasil — e da Final.",
    hand: "Gooool!",
  },
  {
    step: "03",
    title: "Apareça no Bam Bam",
    desc: "Cada presença durante os jogos vale pontos extras. A torcida recompensa quem aparece.",
    hand: "O Hexa vem!",
  },
];

function CheckerStrip({ inv = false }: { inv?: boolean }) {
  return (
    <div className={`checker-strip${inv ? " inv" : ""}`} aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

function Stars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-2.5 text-sm tracking-[4px] ${className}`} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* ── HERO ── */}
      <section className="bam-hero-texture relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-28 text-center overflow-hidden bg-[#7D1A2E]">
        <VideoBackground />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F7EDE0]/45">
            Copa do Mundo 2026
          </p>

          <IconEscudo width={210} height={164} className="drop-shadow-2xl" />

          <h1 className="font-display text-6xl md:text-8xl font-semibold text-[#F7EDE0] leading-[0.88] tracking-tight uppercase">
            Bam Bam
          </h1>

          <p className="font-hand text-3xl md:text-5xl text-[#F7EDE0]/80 -rotate-2">
            Você faz parte dessa torcida.
          </p>

          <p className="font-display italic text-lg md:text-xl text-[#F7EDE0]/60 leading-relaxed max-w-lg">
            Faça seus palpites, marque presença nos jogos
            <br className="hidden sm:block" /> e dispute o ranking da Copa do Mundo 2026.
          </p>

          <Stars className="text-[#F7EDE0]/45" />

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link href="/cadastro">
              <Button size="lg" variant="gold">
                Participar Agora
              </Button>
            </Link>
            <Link href="/ranking">
              <Button size="lg" variant="outline">
                Ver Ranking
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10" aria-hidden="true">
          <div className="w-6 h-10 border-2 border-[#F7EDE0]/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-[#F7EDE0]/50 rounded-full" />
          </div>
        </div>
      </section>

      <CheckerStrip />

      {/* ── COMO FUNCIONA ── */}
      <section className="pt-20 bg-[#F7EDE0]">
        <div className="max-w-5xl mx-auto px-8 mb-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7D1A2E] mb-3">
            Como Funciona
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-semibold text-[#7D1A2E] uppercase tracking-tight leading-[0.92]">
            Simples assim.
          </h2>
          <p className="font-display italic text-4xl md:text-6xl text-[#7D1A2E] leading-[0.92]">
            Apaixonados por cerveja &amp; futebol.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {comoFunciona.map((item, i) => {
            const dark = i % 2 === 0; // wine card
            return (
              <div
                key={item.step}
                className={`relative overflow-hidden px-8 pt-11 pb-12 ${dark ? "bg-[#7D1A2E]" : "bg-[#EDE0CE]"}`}
              >
                <span
                  className={`font-display absolute top-1 right-4 text-[100px] leading-none font-semibold pointer-events-none ${dark ? "text-[#F7EDE0]/[0.07]" : "text-[#7D1A2E]/[0.07]"}`}
                  aria-hidden="true"
                >
                  {item.step}
                </span>
                <h3 className={`font-display text-2xl font-semibold mb-3 relative ${dark ? "text-[#F7EDE0]" : "text-[#7D1A2E]"}`}>
                  {item.title}
                </h3>
                <p className={`text-sm leading-[1.75] relative ${dark ? "text-[#F7EDE0]/60" : "text-[#5A1220]/60"}`}>
                  {item.desc}
                </p>
                <span
                  className={`font-hand absolute bottom-3 right-5 text-xl opacity-20 ${dark ? "text-[#F7EDE0]" : "text-[#7D1A2E]"}`}
                  aria-hidden="true"
                >
                  {item.hand}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <CheckerStrip inv />

      {/* ── PONTUAÇÃO ── */}
      <section className="py-20 px-6 bg-[#7D1A2E]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 text-center md:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F7EDE0]/40 mb-2">
              Sistema de Pontuação
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-semibold text-[#F7EDE0] uppercase tracking-tight leading-[0.92]">
              Como ganhar
            </h2>
            <p className="font-display italic text-4xl md:text-6xl text-[#F7EDE0]/50 leading-[0.92]">
              pontos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 mt-10">
            {pontuacao.map((item) => (
              <div
                key={item.evento}
                className="flex items-center justify-between gap-4 bg-[#F7EDE0]/[0.04] border border-[#F7EDE0]/10 px-6 py-4 hover:bg-[#F7EDE0]/[0.09] transition-colors"
              >
                <span className="text-[#F7EDE0]/85 text-sm leading-snug">{item.evento}</span>
                <span className="font-display text-3xl font-semibold text-[#F7EDE0] shrink-0">
                  {item.pts}
                  <span className="font-sans text-[13px] font-normal opacity-45 ml-0.5">pts</span>
                </span>
              </div>
            ))}
          </div>

          <p className="text-[#F7EDE0]/45 text-sm text-center mt-8 leading-relaxed">
            A <span className="text-[#F7EDE0]/80 font-semibold">final</span> abre para palpite de placar <span className="text-[#F7EDE0]/80 font-semibold">no dia do jogo</span> (mesmo sem o Brasil). A <span className="text-[#F7EDE0]/80 font-semibold">semifinal</span> abre no dia <span className="text-[#F7EDE0]/80 font-semibold">apenas se for jogo do Brasil</span>. Esses palpites do dia (placar exato 30 / ganhador 16) somam com os palpites antecipados do torneio.
          </p>

          <p className="text-[#F7EDE0]/30 text-xs text-center mt-4 leading-relaxed">
            Em caso de empate, o desempate é por número de presenças, placares exatos, acertos de ganhador, e proximidade na % de posse de bola.
          </p>
        </div>
      </section>

      <CheckerStrip />

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-6 bg-[#F7EDE0] relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.07] pointer-events-none" aria-hidden="true">
          <IconBadge2026 width={320} height={306} />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10 flex flex-col items-center gap-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7D1A2E]/45">
            Copa do Mundo 2026
          </p>
          <h2 className="font-display text-5xl md:text-7xl font-semibold text-[#7D1A2E] uppercase leading-[0.88] tracking-tight">
            A Copa
            <br />
            começa aqui.
          </h2>
          <p className="font-display italic text-xl md:text-2xl text-[#5A1220]/55 leading-snug">
            Cerveja, futebol e muita torcida no Bam Bam Café.
          </p>
          <p className="font-hand text-3xl md:text-4xl text-[#7D1A2E]/40 -rotate-1">
            Vai Brasil!
          </p>
          <Stars className="text-[#7D1A2E]/25" />
          <Link href="/cadastro" className="mt-3">
            <Button size="lg" variant="green">
              Criar minha conta
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#5A1220] border-t border-[#F7EDE0]/10 py-8 px-6 text-center text-[#F7EDE0]/35 text-xs">
        <p>© 2026 Bam Bam Café — Copa do Mundo 2026</p>
        <p className="mt-1">Não somos afiliados à FIFA ou entidades oficiais da Copa do Mundo.</p>
        <AdminButton />
      </footer>
    </main>
  );
}
