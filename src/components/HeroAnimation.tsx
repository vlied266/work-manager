"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

// Dynamically import Spline to avoid SSR issues
const Spline = dynamic(
  () => import("@splinetool/react-spline"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="text-slate-400 text-sm">Loading 3D scene...</div>
      </div>
    ),
  }
);

const SCENE_PATH =
  "https://prod.spline.design/zKjuBb2cjZdP3Puh/scene.splinecode";

export default function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ensureTransparentBackground = () => {
      if (!containerRef.current) return;

      const canvas = containerRef.current.querySelector("canvas");
      if (!canvas) return;

      canvas.style.background = "transparent";
      canvas.style.backgroundColor = "transparent";
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      let element: HTMLElement | null = canvas.parentElement;
      while (element && element !== containerRef.current) {
        element.style.background = "transparent";
        element.style.backgroundColor = "transparent";
        element = element.parentElement;
      }
    };

    ensureTransparentBackground();
    const interval = setInterval(ensureTransparentBackground, 250);

    const observer = new MutationObserver(ensureTransparentBackground);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="relative flex h-[520px] w-full items-center justify-center sm:h-[640px] lg:h-[780px] xl:h-[860px]"
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden bg-transparent"
        style={{
          background: "transparent",
          backgroundColor: "transparent",
        }}
      >
        <Spline
          scene={SCENE_PATH}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            backgroundColor: "transparent",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
