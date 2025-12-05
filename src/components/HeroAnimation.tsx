"use client";

import { motion } from "framer-motion";

const containerSize = "min(1000px, 160vw)";
const morphKeyframes = {
  borderRadius: [
    "50% 50% 50% 50%",
    "46% 54% 48% 52%",
    "55% 45% 62% 38%",
    "52% 48% 45% 55%",
    "50% 50% 50% 50%",
  ],
  scaleX: [1, 1.08, 0.92, 1.04, 1],
  scaleY: [1, 0.9, 1.1, 0.96, 1],
  rotate: [0, 6, -8, 4, 0],
};
const morphTransition = {
  duration: 14,
  repeat: Infinity,
  ease: "easeInOut",
};
const sparkles = [
  { top: "18%", left: "68%", delay: 0 },
  { top: "62%", left: "28%", delay: 0.35 },
  { top: "42%", left: "82%", delay: 0.7 },
];

export default function HeroAnimation() {
  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{
          width: containerSize,
          height: containerSize,
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle, rgba(5, 71, 255, 0.55), transparent 65%)",
            filter: "blur(110px)",
          }}
          animate={{
            scale: [0.85, 1.05, 0.95, 0.9],
            opacity: [0.45, 0.8, 0.6, 0.45],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute"
          style={{
            inset: "12%",
            background:
              "radial-gradient(circle at 28% 22%, #d8eeff 0%, #6fb9ff 35%, #1a4bff 65%, #020b2f 100%)",
            boxShadow:
              "0 35px 120px rgba(38, 97, 255, 0.5), inset 0 -25px 60px rgba(4, 20, 58, 0.85), inset 0 25px 35px rgba(255, 255, 255, 0.25)",
          }}
          animate={morphKeyframes}
          transition={morphTransition}
        />

        <motion.div
          className="absolute"
          style={{
            inset: "22%",
            background:
              "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.3) 35%, rgba(255,255,255,0) 65%)",
            mixBlendMode: "screen",
            filter: "blur(8px)",
          }}
          animate={{
            rotate: [0, 18, -22, 0],
            scale: [0.85, 1.1, 0.95, 0.85],
            x: [-10, 12, -4, -10],
            y: [-12, -6, 6, -12],
            opacity: [0.6, 0.85, 0.5, 0.6],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute"
          style={{
            inset: "8%",
            borderRadius: "50%",
            border: "1px solid rgba(173, 206, 255, 0.35)",
            boxShadow: "0 0 40px rgba(99, 153, 255, 0.5)",
          }}
          animate={{
            scale: [0.95, 1.05, 0.98, 0.95],
            opacity: [0.4, 0.75, 0.5, 0.4],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        {sparkles.map((sparkle, index) => (
          <motion.span
            key={`${sparkle.top}-${sparkle.left}`}
            className="absolute"
            style={{
              top: sparkle.top,
              left: sparkle.left,
              width: 14,
              height: 14,
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(111,185,255,0.6) 45%, rgba(111,185,255,0) 70%)",
              filter: "blur(0.5px)",
            }}
            animate={{
              scale: [0.6, 1, 0.65, 0.6],
              opacity: [0.3, 0.9, 0.4, 0.3],
            }}
            transition={{
              duration: 5 + index,
              repeat: Infinity,
              ease: "easeInOut",
              delay: sparkle.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
