"use client";

import Image from "next/image";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
}

const SIZE_MAP: Record<LogoSize, number> = {
  small: 32,
  medium: 54,
  large: 92,
};

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  const dimension = SIZE_MAP[size];

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <Image
        src="/logo.png"   // 👈 تغییر مهم: اینجا شد logo.png
        alt="WorkOS Logo"
        width={dimension}
        height={dimension}
        className="object-contain"
        priority
      />
    </div>
  );
}