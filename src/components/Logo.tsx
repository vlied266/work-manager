"use client";

import { motion } from "framer-motion";

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

export default function Logo({ size = "medium", className = "", animated = false }: LogoProps) {
  const dimension = SIZE_MAP[size];
  const centerX = 60;
  const centerY = 60;
  const coreRadius = 12;
  const orbitRadius = 28;
  const particleRadius = 4;

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
        className="drop-shadow-lg"
      >
        <defs>
          {/* Core gradient */}
          <radialGradient id="coreGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </radialGradient>

          {/* Particle gradient */}
          <radialGradient id="particleGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </radialGradient>

          {/* Glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Shine effect */}
          <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer glow ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={orbitRadius + 8}
          fill="none"
          stroke="url(#particleGradient)"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* Orbiting particles (3 particles representing atomic structure) */}
        {[0, 120, 240].map((angle, index) => {
          const radian = (angle * Math.PI) / 180;
          const x = centerX + orbitRadius * Math.cos(radian);
          const y = centerY + orbitRadius * Math.sin(radian);
          
          return (
            <g key={index}>
              {/* Particle orbit path (subtle) */}
              <circle
                cx={centerX}
                cy={centerY}
                r={orbitRadius}
                fill="none"
                stroke="rgba(59, 130, 246, 0.1)"
                strokeWidth="0.5"
                strokeDasharray="2 4"
              />
              
              {/* Particle */}
              <circle
                cx={x}
                cy={y}
                r={particleRadius}
                fill="url(#particleGradient)"
                filter="url(#glow)"
                opacity="0.9"
              >
                {animated && (
                  <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${index * 0.3}s`}
                  />
                )}
              </circle>
              
              {/* Particle inner highlight */}
              <circle
                cx={x}
                cy={y}
                r={particleRadius * 0.5}
                fill="rgba(255, 255, 255, 0.6)"
              />
            </g>
          );
        })}

        {/* Central core (nucleus) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius}
          fill="url(#coreGradient)"
          filter="url(#glow)"
        />

        {/* Core inner highlight */}
        <circle
          cx={centerX}
          cy={centerY - coreRadius * 0.3}
          r={coreRadius * 0.5}
          fill="rgba(255, 255, 255, 0.4)"
        />

        {/* Core shine overlay */}
        <ellipse
          cx={centerX}
          cy={centerY - coreRadius * 0.4}
          rx={coreRadius * 0.8}
          ry={coreRadius * 0.4}
          fill="url(#shine)"
          opacity="0.5"
        />

        {/* Subtle outer ring for depth */}
        <circle
          cx={centerX}
          cy={centerY}
          r={orbitRadius + 4}
          fill="none"
          stroke="rgba(59, 130, 246, 0.15)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
