"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  target: Date;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer({ target }: CountdownTimerProps) {
  const [diff, setDiff] = useState(Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSecs = Math.floor(diff / 1000);
  const days    = Math.floor(totalSecs / 86400);
  const hours   = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const numCls  = "text-[18px] font-black leading-snug text-[rgb(252,252,254)]";
  const unitCls = "text-[11px] font-bold uppercase ml-[1px] text-[rgba(252,252,254,0.65)]";
  const sepCls  = "text-[18px] font-black text-[rgba(252,252,254,0.4)] mx-[5px]";

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 6 }}>
      {/* Blurred colourful SVG background — same as header */}
      <div style={{ position: "absolute", inset: 0, background: "rgb(17,21,23)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }} />
        <svg width="100%" height="75" viewBox="0 0 498 75" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "blur(30px)", display: "block" }}>
          <path d="M-6.86646e-05 24.8062L-7.14566e-05 -4.98523e-05L55.3333 -4.76837e-05C24.7735 -4.69741e-05 -6.98076e-05 11.1059 -6.86646e-05 24.8062Z" fill="#367EC9"/>
          <path d="M110.667 49.6124H166V24.8062L110.667 24.8062L55.3333 24.8062L55.3333 0C24.7736 0 1.52588e-05 11.1059 1.52588e-05 24.8062L0 49.6124V74.4186C30.5597 74.4186 55.3333 63.3127 55.3333 49.6124H55.3533C85.8923 49.6076 110.648 38.5119 110.667 24.8217V49.6124Z" fill="#A30100"/>
          <path d="M166 -9.75361e-05L55.3332 -0.000101873L55.3332 24.8061L110.667 24.8061L166 24.8061L166 49.6123C166 35.9193 190.759 24.8179 221.297 24.8061C221.309 24.8061 221.321 24.8061 221.333 24.8061C190.774 24.8061 166 13.7002 166 -9.75361e-05Z" fill="#E42323"/>
          <path d="M221.285 24.8063L221.333 24.8063H276.667C276.667 37.6503 254.893 48.2141 226.991 49.4844C225.15 49.5682 223.283 49.6116 221.393 49.6125C221.373 49.6125 221.353 49.6125 221.333 49.6125L221.393 49.6125L276.667 49.6125L332 49.6125V74.4187L276.667 74.4187H221.333L166 74.4187L166 49.6125C166 35.9195 190.747 24.8181 221.285 24.8063Z" fill="#185A2C"/>
          <path d="M166 -4.00543e-05C166 13.7002 190.774 24.8062 221.333 24.8062H276.667C276.667 11.1059 251.893 -4.95911e-05 221.333 -4.95911e-05L166 -4.00543e-05Z" fill="#17963F"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M221.333 -0.000105688C251.893 -0.00010449 276.667 11.1058 276.667 24.8061C276.667 37.6501 254.893 48.2139 226.991 49.4842C225.15 49.568 223.283 49.6114 221.393 49.6123L276.667 49.6123L332 49.6123C332 35.912 356.774 24.8061 387.333 24.8061L387.333 -9.91821e-05L221.333 -0.000105688Z" fill="#7BB3EC"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M60.9888 49.4845C59.1293 49.5691 57.2426 49.6125 55.3334 49.6125C55.3334 63.3128 30.5597 74.4187 -1.52588e-05 74.4187L166 74.4187L166 49.6125L110.667 49.6125L110.667 24.8218C110.649 37.6591 88.8807 48.2151 60.9888 49.4845Z" fill="#E06A00"/>
          <path d="M332 49.6125L387.333 49.6125C387.333 63.3128 412.107 74.4187 442.667 74.4187L332 74.4187L332 49.6125Z" fill="#FFD700"/>
          <path d="M387.333 24.8062C356.774 24.8062 332 35.9121 332 49.6124H387.333C387.333 63.3126 412.107 74.4186 442.667 74.4186V49.6124C442.667 36.7684 420.893 26.2045 392.991 24.9342C391.145 24.8502 389.271 24.8068 387.376 24.8062C387.362 24.8062 387.348 24.8062 387.333 24.8062Z" fill="#BD9511"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M392.991 24.9342C420.893 26.2045 442.667 36.7684 442.667 49.6124L442.667 74.4186L498 74.4186V49.6124C467.44 49.6124 442.667 38.5064 442.667 24.8062L387.376 24.8062C389.271 24.8068 391.144 24.8502 392.991 24.9342Z" fill="#A30100"/>
          <path d="M387.376 24.8061L442.667 24.8061C442.667 38.5064 467.44 49.6123 498 49.6123L498 24.8061C498 11.1093 473.239 0.00556467 442.69 -0.00010135C442.682 -0.00010135 442.674 -0.00010135 442.667 -0.000101351L387.333 -0.000103519L387.333 24.8061L387.376 24.8061Z" fill="#2035A5"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M498 0L498 24.8062C498 11.1094 473.239 0.0056653 442.69 0L498 0Z" fill="#E06A00"/>
        </svg>
      </div>

      {/* Content */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", boxShadow: "inset 0 0 16px 0 rgba(0,0,0,0.45)" }}>
        {/* WC Logo */}
        <div style={{ width: 24, height: 24, borderRadius: 4, background: "rgb(23,28,31)", overflow: "hidden", flexShrink: 0, display: "flex" }}>
          <img src="/api/flag/wc-logo" alt="Copa 2026" style={{ objectFit: "cover", fontSize: 0, width: "100%", height: "100%" }} />
        </div>

        {/* Numbers */}
        <div style={{ display: "flex", alignItems: "baseline", fontWeight: 800 }}>
          {days > 0 && (
            <>
              <span className={numCls}>{pad(days)}</span><span className={unitCls}>d</span>
              <span className={sepCls}>:</span>
            </>
          )}
          <span className={numCls}>{pad(hours)}</span><span className={unitCls}>h</span>
          <span className={sepCls}>:</span>
          <span className={numCls}>{pad(minutes)}</span><span className={unitCls}>m</span>
          <span className={sepCls}>:</span>
          <span className={numCls}>{pad(seconds)}</span><span className={unitCls}>s</span>
        </div>
      </div>
    </div>
  );
}
