"use client";

import { useEffect } from "react";

const HERO_SCRIPT_URL = "https://cdn.workos.com/www/webgl-graphic.js";
let heroScriptInjected = false;

export default function HeroAnimation() {
  useEffect(() => {
    if (heroScriptInjected) {
      return;
    }

    const script = document.createElement("script");
    script.src = HERO_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    heroScriptInjected = true;
  }, []);

  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
    >
      <div
        id="canvas"
        className="pointer-events-auto"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "min(1000px, 160vw)",
          height: "min(1000px, 160vw)",
          transform: "translate(-50%, -50%)",
          background: "#fff",
        }}
      />
    </div>
  );
}
