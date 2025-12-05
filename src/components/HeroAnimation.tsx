"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const Spline = dynamic(
  () => import("@splinetool/react-spline").then((mod) => mod.default),
  { ssr: false }
);

export default function HeroAnimation() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-slate-200/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-2xl">
        {!isLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          </div>
        )}

        <Spline
          scene="https://prod.spline.design/zKjuBb2cjZdP3Puh/scene.splinecode"
          onLoad={() => setIsLoaded(true)}
          style={{ width: "100%", height: "100%" }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>
    </div>
  );
}
