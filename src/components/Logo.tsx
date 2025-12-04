"use client";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
}

const SIZE_MAP: Record<LogoSize, number> = {
  small: 48,
  medium: 84,
  large: 138,
};

const VIEWBOX = 240;
const DIAMOND_WIDTH = 115;
const DIAMOND_HEIGHT = 150;
const DIAMOND_DATA = [
  { id: "left", centerX: 82, tilt: -6, gradient: "diamondGradient-0", opacity: 0.9 },
  { id: "middle", centerX: 120, tilt: 0, gradient: "diamondGradient-1", opacity: 1 },
  { id: "right", centerX: 158, tilt: 6, gradient: "diamondGradient-2", opacity: 0.95 },
];

const diamondGradients = [
  { id: "diamondGradient-0", start: "#9db8ff", mid: "#5178ff", end: "#0d1b3d" },
  { id: "diamondGradient-1", start: "#c5d8ff", mid: "#5b78ff", end: "#091028" },
  { id: "diamondGradient-2", start: "#b0c5ff", mid: "#4a66f5", end: "#081024" },
];

const getDiamondPoints = (cx: number, cy: number) => {
  const halfW = DIAMOND_WIDTH / 2;
  const halfH = DIAMOND_HEIGHT / 2;
  return `${cx},${cy - halfH} ${cx + halfW},${cy} ${cx},${cy + halfH} ${cx - halfW},${cy}`;
};

export default function Logo({ size = "medium", className = "", animated = false }: LogoProps) {
  const dimension = SIZE_MAP[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label="WorkOS logo"
    >
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width={dimension}
        height={dimension}
        role="presentation"
        aria-hidden="true"
        className="drop-shadow-xl"
      >
        <defs>
          <filter id="glassShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
            <feOffset in="blur" dx="0" dy="10" result="offsetBlur" />
            <feFlood floodColor="rgba(10,12,30,0.45)" />
            <feComposite in2="offsetBlur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="backgroundGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1c2d62" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#050912" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="edgeHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" stopOpacity="0.85" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.35)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity="0" />
          </linearGradient>

          {diamondGradients.map(({ id, start, mid, end }) => (
            <linearGradient key={id} id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={start} />
              <stop offset="45%" stopColor={mid} />
              <stop offset="100%" stopColor={end} />
            </linearGradient>
          ))}
        </defs>

        <circle cx={VIEWBOX / 2} cy={VIEWBOX / 2} r={VIEWBOX / 2.35} fill="url(#backgroundGlow)" />

        {DIAMOND_DATA.map(({ id, centerX, tilt, gradient, opacity }, index) => (
          <g
            key={id}
            filter="url(#glassShadow)"
            opacity={opacity}
            transform={`rotate(${tilt}, ${centerX}, ${VIEWBOX / 2})`}
          >
            <polygon
              points={getDiamondPoints(centerX, VIEWBOX / 2)}
              fill={`url(#${gradient})`}
              stroke="rgba(15,28,66,0.75)"
              strokeWidth={6}
              strokeLinejoin="round"
            />

            <polygon
              points={getDiamondPoints(centerX, VIEWBOX / 2)}
              fill="none"
              stroke="url(#edgeHighlight)"
              strokeWidth={4}
              strokeLinejoin="round"
              strokeDasharray="8 18"
            >
              {animated && (
                <animate attributeName="stroke-dashoffset" values="0;-200" dur="4s" repeatCount="indefinite" />
              )}
            </polygon>

            <polygon
              points={getDiamondPoints(centerX, VIEWBOX / 2 - 6)}
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />

            {animated && (
              <circle
                cx={centerX + DIAMOND_WIDTH / 2.3}
                cy={VIEWBOX / 2 - DIAMOND_HEIGHT / 3.1}
                r={8}
                fill="rgba(255,255,255,0.45)"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0.8;0.2"
                  dur="2.8s"
                  repeatCount="indefinite"
                  begin={`${index * 0.4}s`}
                />
              </circle>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
