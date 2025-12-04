"use client";

import { Suspense } from "react";
import Logo from "./Logo";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
}

export default function Logo3D({ size = "medium", className = "", animated = false }: LogoProps) {
  return (
    <Suspense fallback={<div style={{ width: "100%", height: "100%" }} />}>
      <Logo size={size} className={className} animated={animated} />
    </Suspense>
  );
}
