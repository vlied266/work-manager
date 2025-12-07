"use client";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
}

const SIZE_MAP: Record<LogoSize, { height: string; width: string }> = {
  small: { height: "h-10", width: "w-auto" },
  medium: { height: "h-16", width: "w-auto" },
  large: { height: "h-20", width: "w-auto" },
};

export default function Logo({ size = "medium", className = "", animated = false }: LogoProps) {
  const sizeClasses = SIZE_MAP[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label="Atomic Work Logo"
    >
      <img
        src="/logo.png"
        alt="Atomic Work Logo"
        className={`${sizeClasses.height} ${sizeClasses.width} object-contain drop-shadow-lg`}
        style={{ display: 'block' }}
      />
    </div>
  );
}
