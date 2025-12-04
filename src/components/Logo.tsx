"use client";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
  className?: string;
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
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label="WorkOS Atomic mark"
    >
      <svg
        viewBox="0 0 120 120"
        width={dimension}
        height={dimension}
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="diamondFill" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="45%" stopColor="#5f3df0" />
            <stop offset="100%" stopColor="#29d3c1" />
          </linearGradient>
          <linearGradient id="diamondEdge" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#221a52" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Drop shadow */}
        <rect
          x="30"
          y="30"
          width="60"
          height="60"
          rx="4"
          transform="rotate(45 60 60)"
          fill="rgba(15,23,42,0.08)"
        />

        {/* Solid diamond */}
        <rect
          x="32"
          y="32"
          width="56"
          height="56"
          rx="4"
          transform="rotate(45 60 60)"
          fill="url(#diamondFill)"
          stroke="url(#diamondEdge)"
          strokeWidth="3"
        />

        {/* Subtle beveled edge */}
        <path
          d="M60 26 L94 60 L60 94 L26 60 Z"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Core glint */}
        <circle cx="60" cy="52" r="6" fill="rgba(255,255,255,0.5)" />
        <circle cx="60" cy="52" r="10" fill="rgba(255,255,255,0.08)" />
      </svg>
    </div>
  );
}
