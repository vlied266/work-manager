"use client";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const SIZE_MAP: Record<LogoSize, number> = {
  small: 32,
  medium: 56,
  large: 96,
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
            <stop offset="0%" stopColor="#0f1c3d" />
            <stop offset="45%" stopColor="#6c4bff" />
            <stop offset="100%" stopColor="#35d4c2" />
          </linearGradient>
          <linearGradient id="diamondStroke" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a163f1" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3cc9eb" />
          </linearGradient>
          <linearGradient id="facetStroke" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <rect
          x="24"
          y="24"
          width="72"
          height="72"
          rx="6"
          transform="rotate(45 60 60)"
          fill="rgba(15,23,42,0.08)"
        />

        {/* Diamond */}
        <rect
          x="26"
          y="26"
          width="68"
          height="68"
          rx="5"
          transform="rotate(45 60 60)"
          fill="url(#diamondFill)"
          stroke="url(#diamondStroke)"
          strokeWidth="4.5"
        />

        {/* Inner facet */}
        <rect
          x="40"
          y="40"
          width="40"
          height="40"
          rx="4"
          transform="rotate(45 60 60)"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.25"
        />

        {/* Facet diagonals */}
        <path
          d="M60 34 L60 86"
          stroke="url(#facetStroke)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M34 60 L86 60"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M42 42 L78 78"
          stroke="rgba(15,23,42,0.35)"
          strokeWidth="1.2"
        />
        <path
          d="M78 42 L42 78"
          stroke="rgba(15,23,42,0.35)"
          strokeWidth="1.2"
        />

        {/* Highlight glints */}
        <path
          d="M48 50 C54 44, 66 44, 72 50"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="60" cy="72" r="4" fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  );
}
