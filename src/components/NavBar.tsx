"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconEscudo } from "@/components/icons";

export default function NavBar() {
  const pathname = usePathname();

  // Não mostra na home nem no admin (admin tem header próprio)
  if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/preview")) return null;

  return (
    <nav className="sticky top-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-[#F6C900]/10">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#FAF6EB]/60 hover:text-[#F6C900] transition-colors text-sm font-semibold group"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path
              d="M10 3L5 8L10 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Início
        </Link>

        <div className="h-4 w-px bg-[#F6C900]/15" />

        <Link href="/" className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <IconEscudo width={16} height={27} />
          <span className="text-[#F6C900] text-xs font-bold uppercase tracking-wider hidden sm:block">
            Copa no Merça
          </span>
        </Link>
      </div>
    </nav>
  );
}
