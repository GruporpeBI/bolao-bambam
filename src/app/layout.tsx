import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import WorldCupTicker from "@/components/WorldCupTicker";
import NavBar from "@/components/NavBar";

const inter = localFont({
  src: "../../public/fonts/Inter-Medium.ttf",
  variable: "--font-inter",
  weight: "500",
  display: "swap",
});

const timesNow = localFont({
  src: [
    { path: "../../public/fonts/TimesNow-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/TimesNow-SemiBoldItalic.ttf", weight: "600", style: "italic" },
  ],
  variable: "--font-timesnow",
  display: "swap",
});

const phontPhreaks = localFont({
  src: "../../public/fonts/PhontPhreaks-Handwriting.ttf",
  variable: "--font-phontphreaks",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolão Copa 2026 — Bam Bam Café",
  description: "Você faz parte dessa torcida. Cadastre-se, faça seus palpites e dispute o ranking da Copa do Mundo 2026.",
  keywords: ["bolão", "copa do mundo 2026", "bam bam café", "palpites", "ranking"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${timesNow.variable} ${phontPhreaks.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#5A1220] text-[#F7EDE0]">
        <WorldCupTicker />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
