"use client";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const SIZE_MAP = {
  small: 40,
  medium: 64,
  large: 120,
} as const;

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  const dimension = SIZE_MAP[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: dimension,
        height: dimension,
      }}
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
          <radialGradient id="coreGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="55%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <radialGradient id="shellGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(96,165,250,0.65)" />
            <stop offset="70%" stopColor="rgba(14,165,233,0.25)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0)" />
          </radialGradient>
          <linearGradient id="arcGradientA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a163f1" />
            <stop offset="60%" stopColor="#6363f1" />
            <stop offset="100%" stopColor="#3498ea" />
          </linearGradient>
          <linearGradient id="arcGradientB" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3498ea" />
            <stop offset="100%" stopColor="#40dfa3" />
          </linearGradient>
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a163f1" />
            <stop offset="100%" stopColor="#40dfa3" />
          </linearGradient>
        </defs>

        {/* Soft background halo */}
        <circle
          cx="60"
          cy="60"
          r="46"
          fill="url(#shellGlow)"
          opacity="0.6"
        />

        {/* Elliptical orbital rings */}
        <ellipse
          cx="60"
          cy="62"
          rx="42"
          ry="26"
          fill="none"
          stroke="url(#arcGradientA)"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(-15 60 62)"
          opacity="0.9"
        />
        <ellipse
          cx="60"
          cy="58"
          rx="36"
          ry="22"
          fill="none"
          stroke="url(#arcGradientB)"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(18 60 58)"
          opacity="0.8"
        />

        {/* Flowing arc inspired by hero ribbon */}
        <path
          d="M32 74 C44 58, 54 48, 70 42 C84 38, 96 42, 104 52"
          fill="none"
          stroke="url(#arcGradientA)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M20 58 C32 66, 44 70, 58 68 C72 66, 88 56, 98 44"
          fill="none"
          stroke="url(#arcGradientB)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Central core */}
        <circle cx="60" cy="60" r="20" fill="url(#coreGlow)" />

        {/* Core highlight */}
        <path
          d="M48 56 C54 48, 66 48, 72 56"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Orbiting data nodes */}
        <circle cx="88" cy="48" r="6" fill="url(#nodeGradient)" />
        <circle cx="32" cy="76" r="5" fill="url(#nodeGradient)" opacity="0.85" />
        <circle cx="82" cy="86" r="4" fill="#40dfa3" opacity="0.7" />
      </svg>
    </div>
  );
}
