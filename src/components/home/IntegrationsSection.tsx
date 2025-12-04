"use client";

import { useId } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

type IconProps = {
  className?: string;
};

const floatKeyframes = { y: [0, -12, 0] };

type Satellite = {
  name: string;
  icon: (props: IconProps) => JSX.Element;
  desktopOffset: CSSProperties;
  floatDuration: number;
  delay: number;
  glow: string;
};

const satellites: Satellite[] = [
  {
    name: "Slack",
    icon: SlackGlyph,
    desktopOffset: { top: "4%", left: "18%" },
    floatDuration: 4.8,
    delay: 0,
    glow: "0 20px 45px rgba(54, 197, 240, 0.28)",
  },
  {
    name: "Google Drive",
    icon: DriveGlyph,
    desktopOffset: { top: "10%", right: "12%" },
    floatDuration: 5.4,
    delay: 0.3,
    glow: "0 18px 50px rgba(24, 128, 56, 0.25)",
  },
  {
    name: "Notion",
    icon: NotionGlyph,
    desktopOffset: { top: "48%", right: "-2%" },
    floatDuration: 4.2,
    delay: 0.6,
    glow: "0 18px 40px rgba(15, 23, 42, 0.28)",
  },
  {
    name: "Linear",
    icon: LinearGlyph,
    desktopOffset: { bottom: "4%", right: "18%" },
    floatDuration: 5,
    delay: 0.4,
    glow: "0 20px 55px rgba(99, 102, 241, 0.35)",
  },
  {
    name: "GitHub",
    icon: GithubGlyph,
    desktopOffset: { bottom: "0%", left: "16%" },
    floatDuration: 4.6,
    delay: 0.2,
    glow: "0 18px 55px rgba(15, 23, 42, 0.35)",
  },
  {
    name: "Microsoft Teams",
    icon: TeamsGlyph,
    desktopOffset: { top: "56%", left: "-2%" },
    floatDuration: 5.6,
    delay: 0.8,
    glow: "0 20px 45px rgba(56, 102, 255, 0.32)",
  },
];

export default function IntegrationsSection() {
  return (
    <section
      aria-labelledby="integrations-heading"
      className="relative overflow-hidden bg-transparent"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[360px_1fr] lg:gap-16">
          <div className="space-y-6">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-slate-200/60 bg-white/50 px-4 py-1 text-xs font-semibold tracking-[0.2em] uppercase text-slate-700"
            >
              Integrations
            </motion.span>

            <motion.h2
              id="integrations-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl"
            >
              The Heart of Your Stack.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg leading-8 text-slate-600"
            >
              WorkOS connects seamlessly with the tools you already use, creating
              a unified command center. Keep your favorite apps in orbit and let
              WorkOS pull everything into one gravity field.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-2 gap-4 text-sm text-slate-500"
            >
              <li className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm">
                Unified authentication and context
              </li>
              <li className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm">
                Live status mirrors across every app
              </li>
            </motion.ul>
          </div>

          <div className="relative flex flex-col items-center gap-10">
            {/* Mobile layout */}
            <div className="flex flex-col items-center gap-8 md:hidden">
              <CoreLogo />
              <div className="grid w-full max-w-sm grid-cols-3 gap-4">
                {satellites.map((satellite) => (
                  <SatelliteCard key={`mobile-${satellite.name}`} satellite={satellite} />
                ))}
              </div>
            </div>

            {/* Desktop orbit layout */}
            <div className="relative hidden w-full max-w-[520px] items-center justify-center md:flex">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/5 to-transparent blur-3xl"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute inset-0"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                {[180, 260, 340].map((size) => (
                  <div
                    key={size}
                    className="absolute left-1/2 top-1/2 rounded-full border border-white/15"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                ))}
              </motion.div>

              <motion.span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.5, 0.1, 0.5],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="h-56 w-56 rounded-full bg-gradient-to-r from-[#a78bfa]/30 via-[#38bdf8]/20 to-transparent blur-[90px]" />
              </motion.span>

              <CoreLogo />

              {satellites.map((satellite) => (
                <motion.div
                  key={satellite.name}
                  className="absolute"
                  style={{
                    ...satellite.desktopOffset,
                    boxShadow: satellite.glow,
                  }}
                  animate={floatKeyframes}
                  transition={{
                    duration: satellite.floatDuration,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                    delay: satellite.delay,
                  }}
                >
                  <SatelliteCard satellite={satellite} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreLogo() {
  return (
    <motion.div
      className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 p-2 shadow-[0_35px_120px_rgba(15,23,42,0.35)] backdrop-blur-3xl"
      animate={{
        y: [-4, 4, -4],
      }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Logo size="medium" />
    </motion.div>
  );
}

function SatelliteCard({ satellite }: { satellite: Satellite }) {
  const Icon = satellite.icon;

  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-center shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10 backdrop-blur-xl">
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-600">
        {satellite.name}
      </span>
    </div>
  );
}

function SlackGlyph({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="6" y="26" width="14" height="14" rx="7" fill="#36C5F0" />
      <rect x="18" y="12" width="14" height="14" rx="7" fill="#2EB67D" />
      <rect x="32" y="26" width="14" height="14" rx="7" fill="#ECB22E" />
      <rect x="20" y="40" width="14" height="14" rx="7" fill="#E01E5A" />
      <rect x="20" y="12" width="8" height="32" rx="4" fill="#36C5F0" />
      <rect x="20" y="28" width="24" height="8" rx="4" fill="#E01E5A" />
    </svg>
  );
}

function DriveGlyph({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M26 8h12l16 28-12.5 20H30.5L14 36z" fill="#188038" />
      <path d="M26 8 14 36l8.5 14L34 22z" fill="#34A853" />
      <path d="M38 8h12L50 22 34 50 30.5 42z" fill="#FBBC04" />
      <path d="M34 22h16l4 14H42z" fill="#4285F4" />
    </svg>
  );
}

function NotionGlyph({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="8" y="8" width="48" height="48" rx="8" fill="#0B0B0B" />
      <rect x="12" y="12" width="40" height="40" rx="6" fill="#fff" />
      <path
        d="M22 46V18h6.4l13.6 18.8V18H48v28h-6.2L26.8 27.6V46H22Z"
        fill="#111827"
      />
    </svg>
  );
}

function LinearGlyph({ className = "h-8 w-8" }: IconProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M12 44.5 44.5 12c6.5 6.5 9.5 13.5 9.5 20.5C54 44.3 44.3 54 32.5 54 25.5 54 18.5 51 12 44.5Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M24 42c8.8 0 16-7.2 16-16"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GithubGlyph({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="28" fill="#0F172A" />
      <path
        d="M32 20c-6.6 0-12 5.6-12 12.6 0 5.5 3.5 10.2 8.3 11.8.6.1.8-.3.8-.6 0-.3 0-1-.1-2-3.4.8-4.1-1.7-4.1-1.7-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.3.1 2 .9 2 .9 1.1 1.9 3 1.4 3.7 1 .1-.9.4-1.4.7-1.8-2.7-.3-5.6-1.4-5.6-6.2 0-1.4.5-2.6 1.3-3.6-.1-.3-.6-1.6.1-3.3 0 0 1.1-.4 3.5 1.4a11.2 11.2 0 0 1 6.2 0c2.4-1.8 3.5-1.4 3.5-1.4.7 1.7.2 3 .1 3.3.8 1 .1 2.2.1 3.6 0 4.8-2.9 5.9-5.7 6.2.5.5.8 1.2.8 2.4 0 1.8-.1 3.3-.1 3.7 0 .3.2.7.8.6A12.2 12.2 0 0 0 44 32.6C44 25.6 38.6 20 32 20Z"
        fill="#fff"
      />
    </svg>
  );
}

function TeamsGlyph({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="10" y="16" width="28" height="32" rx="8" fill="#5B5FC7" />
      <rect x="24" y="10" width="30" height="34" rx="10" fill="#8E96FF" />
      <circle cx="44" cy="20" r="6" fill="#D0D4FF" />
      <path
        d="M24 26h10v4h-3v14h-4V30h-3v-4Z"
        fill="#fff"
      />
    </svg>
  );
}
