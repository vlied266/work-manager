"use client";

import dynamic from "next/dynamic";

const SplineScene = dynamic(
  () => import("@splinetool/react-spline").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-[32px] border border-slate-200/50 bg-white/70 backdrop-blur-xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
      </div>
    ),
  }
);

const SPLINE_SCENE_URL =
  "https://prod.spline.design/c7a3f8f5-9535-4aad-ade7-67d21df46f78/scene.splinecode";

export default function HeroAnimation() {
  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 blur-[120px]">
        <div className="absolute left-8 top-12 h-48 w-48 rounded-full bg-[#a163f1]/40" />
        <div className="absolute bottom-6 right-6 h-56 w-56 rounded-full bg-[#40dfa3]/40" />
        <div className="absolute inset-x-0 top-1/2 h-72 w-full -translate-y-1/2 bg-gradient-to-r from-[#a163f1]/20 via-[#3498ea]/20 to-[#40dfa3]/20" />
      </div>

      <div className="relative isolate flex h-full w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/30 shadow-[0_40px_140px_rgba(15,82,186,0.2)] backdrop-blur-2xl">
        <SplineScene scene={SPLINE_SCENE_URL} className="h-full w-full" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/0 via-white/5 to-white/35" />
        <div className="pointer-events-none absolute inset-x-20 top-10 h-16 rounded-full bg-white/40 blur-3xl" />
      </div>
    </div>
  );
}
