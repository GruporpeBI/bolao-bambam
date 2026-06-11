"use client";

interface VideoBackgroundProps {
  src?: string;
}

export default function VideoBackground({ src = "/videos/hero.mp4" }: VideoBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Fallback: dark wine radial gradient — visible when no video */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 38%, #7D1A2E 0%, #6B1526 45%, #5A1220 100%)",
        }}
      />

      {/* Dot-pattern overlay — matches brand texture from SVGs */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #F7EDE0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        onError={(e) => {
          (e.target as HTMLVideoElement).style.display = "none";
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#5A1220]/30 via-transparent to-[#5A1220]" />
    </div>
  );
}
