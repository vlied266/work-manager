"use client";

import Logo from "@/components/Logo";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Drive,
  Github,
  Infinity,
  NotebookPen,
  Slack,
} from "lucide-react";

type Satellite = {
  name: string;
  icon: LucideIcon;
  accent: string;
  shadow: string;
  delay: number;
  desktopPosition: {
    top: string;
    left: string;
  };
};

const satellites: Satellite[] = [
  {
    name: "Slack",
    icon: Slack,
    accent: "from-[#4A154B] via-[#A855F7] to-[#EC4899]",
    shadow: "rgba(74, 21, 75, 0.35)",
    delay: 0.1,
    desktopPosition: { top: "4%", left: "68%" },
  },
  {
    name: "Google Drive",
    icon: Drive,
    accent: "from-[#0EA5E9] via-[#22D3EE] to-[#34D399]",
    shadow: "rgba(14, 165, 233, 0.25)",
    delay: 0.35,
    desktopPosition: { top: "14%", left: "26%" },
  },
  {
    name: "Notion",
    icon: NotebookPen,
    accent: "from-[#0F172A] via-[#1E293B] to-[#475569]",
    shadow: "rgba(15, 23, 42, 0.25)",
    delay: 0.55,
    desktopPosition: { top: "46%", left: "10%" },
  },
  {
    name: "GitHub",
    icon: Github,
    accent: "from-[#111827] via-[#374151] to-[#4B5563]",
    shadow: "rgba(15, 23, 42, 0.35)",
    delay: 0.25,
    desktopPosition: { top: "64%", left: "72%" },
  },
  {
    name: "Stripe",
    icon: CreditCard,
    accent: "from-[#312E81] via-[#4338CA] to-[#6366F1]",
    shadow: "rgba(79, 70, 229, 0.35)",
    delay: 0.8,
    desktopPosition: { top: "78%", left: "32%" },
  },
  {
    name: "Linear",
    icon: Infinity,
    accent: "from-[#581C87] via-[#7C3AED] to-[#C084FC]",
    shadow: "rgba(124, 58, 237, 0.35)",
    delay: 0.6,
    desktopPosition: { top: "24%", left: "84%" },
  },
];

type SatelliteCardProps = {
  sat: Satellite;
  variant: "desktop" | "mobile";
};

const SatelliteCard = ({ sat, variant }: SatelliteCardProps) => (
  <motion.div
    className={`flex flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-center shadow-[0_20px_45px_rgba(15,23,42,0.1)] backdrop-blur-md ${
      variant === "desktop" ? "absolute w-28" : "w-full"
    }`}
    style={{
      boxShadow: `0 20px 45px ${sat.shadow}`,
      ...(variant === "desktop" ? sat.desktopPosition : {}),
    }}
    animate={{ y: [0, -15, 0] }}
    transition={{
      duration: 5.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: sat.delay,
    }}
  >
    <span
      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${sat.accent}`}
    >
      <sat.icon className="h-6 w-6 text-white" aria-hidden="true" />
    </span>
    <p className="text-sm font-semibold text-slate-800">{sat.name}</p>
  </motion.div>
);

const CenterHub = ({ className = "" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <motion.span
      aria-hidden="true"
      className="absolute h-56 w-56 rounded-full bg-[#6366f1]/30 blur-[120px]"
      animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.2, 1] }}
      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="relative flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-[28px] border border-white/30 bg-white/15 text-slate-900 shadow-[0_25px_60px_rgba(79,70,229,0.35)] backdrop-blur-3xl"
      animate={{
        boxShadow: [
          "0 25px 60px rgba(79,70,229,0.35)",
          "0 35px 80px rgba(34,211,238,0.45)",
          "0 25px 60px rgba(79,70,229,0.35)",
        ],
      }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Logo size="small" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
        WorkOS
      </span>
    </motion.div>
    {[0, 1].map((ring) => (
      <motion.span
        key={ring}
        aria-hidden="true"
        className="absolute h-28 w-28 rounded-[32px] border border-white/30"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.8, 0.2, 0.8],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeOut",
          delay: ring * 0.6,
        }}
      />
    ))}
  </div>
);

const IntegrationsSection = () => {
  return (
    <section className="relative isolate overflow-hidden rounded-[40px] border border-slate-100 bg-gradient-to-b from-white via-slate-50 to-white px-6 py-16 shadow-[0_45px_120px_rgba(15,23,42,0.08)] sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-16 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#a855f7]/40 via-[#6366f1]/30 to-transparent blur-[150px]" />
        <div className="absolute bottom-10 left-0 h-64 w-64 rounded-full bg-cyan-100/40 blur-[140px]" />
        <div className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-pink-100/40 blur-[120px]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
        >
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#6366f1] to-[#22d3ee]" />
          Gravity Orbit
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
        >
          Integrations anchored to the WorkOS core
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 text-lg leading-8 text-slate-600"
        >
          Connect the tools that already power your org. The Gravity Orbit keeps
          Slack alerts, Linear tickets, billing events, and repo activity
          flowing through WorkOS without brittle handoffs.
        </motion.p>

        <div className="mt-16 hidden w-full max-w-4xl lg:block">
          <div className="relative mx-auto h-[520px] w-[520px]">
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-white/30"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              aria-hidden="true"
              className="absolute inset-6 rounded-full border border-white/20"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            <CenterHub className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            {satellites.map((sat) => (
              <SatelliteCard key={`${sat.name}-desktop`} sat={sat} variant="desktop" />
            ))}
          </div>
        </div>

        <div className="mt-16 flex w-full flex-col items-center gap-6 lg:hidden">
          <CenterHub />
          <div className="grid w-full max-w-sm grid-cols-3 gap-4">
            {satellites.map((sat) => (
              <SatelliteCard key={`${sat.name}-mobile`} sat={sat} variant="mobile" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
