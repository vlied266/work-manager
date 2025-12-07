"use client";

import { motion } from "framer-motion";
import { useId } from "react";

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

const PRIMARY_COLOR = "#0A6DFF";

export default function Logo({ size = "medium", className = "", animated = false }: LogoProps) {
  const dimension = SIZE_MAP[size];
  const uniqueId = useId().replace(/:/g, "");
  const clipPathId = `aw-monogram-clip-${uniqueId}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label="Atomic Work monogram"
    >
      <svg
        viewBox="0 0 512 512"
        width={dimension}
        height={dimension}
        role="presentation"
        aria-hidden="true"
        className="drop-shadow-lg"
      >
        <defs>
          <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
            <path d="M128 404L214 116C225 84 287 84 298 116L384 404H332L294 292C288 272 224 272 218 292L180 404Z" />
            <path d="M156 320L204 430C214 452 248 452 258 430L276 392L294 430C304 452 338 452 348 430L396 320H348L320 380L292 328C284 312 228 312 220 328L192 380L164 320Z" />
          </clipPath>
        </defs>

        <rect width="512" height="512" rx="120" fill="#ffffff" />
        <path fill={PRIMARY_COLOR} d="M128 404L214 116C225 84 287 84 298 116L384 404H332L294 292C288 272 224 272 218 292L180 404Z" />
        <path fill={PRIMARY_COLOR} d="M156 320L204 430C214 452 248 452 258 430L276 392L294 430C304 452 338 452 348 430L396 320H348L320 380L292 328C284 312 228 312 220 328L192 380L164 320Z" />
        <motion.path
          d="M150 330C220 210 320 210 374 302"
          stroke="#ffffff"
          strokeWidth={70}
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath={`url(#${clipPathId})`}
          initial={animated ? { pathLength: 0.4 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={
            animated
              ? {
                  duration: 2.4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      </svg>
    </div>
  );
}
