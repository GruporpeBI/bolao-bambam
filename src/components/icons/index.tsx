import Image from "next/image";

interface IconProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/* Crest hexagonal "Copa do Mundo 2026 — Brasil" (creme — usar sobre vinho) */
export function IconEscudo({ className, width = 120, height = 94, alt = "Bam Bam Café — Copa 2026" }: IconProps) {
  return (
    <Image
      src="/icons/BAM-BAM-1PNG-.png"
      width={width}
      height={height}
      alt={alt}
      className={className}
      priority
    />
  );
}

/* 5 estrelas / estrela da marca */
export function IconEstrelas({ className, width = 120, height = 64, alt = "Apaixonados por cerveja & futebol" }: IconProps) {
  return (
    <Image
      src="/icons/BAM-BAM-6PNG-.png"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}

/* Estrela isolada — selo/medalha 2026 (usado como watermark) */
export function IconBadge2026({ className, width = 160, height = 153, alt = "2026" }: IconProps) {
  return (
    <Image
      src="/icons/BAM-BAM-4PNG-.png"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}

/* Taça da Copa "Vai Brasil!" (traço vinho — usar sobre creme) */
export function IconTacaJules({ className, width = 80, height = 169, alt = "Taça da Copa — Vai Brasil!" }: IconProps) {
  return (
    <Image
      src="/icons/BAM-BAM-2PNG-.png"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}

/* Taça (versão creme suave — usar sobre vinho) */
export function IconTacaPenta({ className, width = 80, height = 130, alt = "Taça da Copa" }: IconProps) {
  return (
    <Image
      src="/icons/BAM-BAM-5PNG-.png"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}
