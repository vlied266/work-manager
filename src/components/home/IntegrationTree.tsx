"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type IntegrationCard = {
  id: string;
  title: string;
  vendor: string;
  Icon: () => JSX.Element;
  positionClass: string;
  endpoint: { x: number; y: number };
  iconBg: string;
};

const startPoint = { x: 560, y: 70 };

const createBranchPath = (
  endpoint: { x: number; y: number },
  arcBoost: number
) => {
  const controlOne = {
    x: startPoint.x - 120,
    y: startPoint.y + arcBoost,
  };
  const controlTwo = {
    x: endpoint.x + 140,
    y: endpoint.y - 40,
  };

  return `M${startPoint.x},${startPoint.y} C ${controlOne.x},${controlOne.y} ${controlTwo.x},${controlTwo.y} ${endpoint.x},${endpoint.y}`;
};

const SlackGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
    <g strokeLinecap="round" strokeWidth="3">
      <path d="M5 9h4" stroke="#36C5F0" />
      <path d="M5 14h4" stroke="#2EB67D" />
      <path d="M10 5v4" stroke="#E01E5A" />
      <path d="M15 5v4" stroke="#ECB22E" />
      <path d="M15 15h4" stroke="#36C5F0" />
      <path d="M10 15h4" stroke="#2EB67D" />
      <path d="M9 10v4" stroke="#E01E5A" />
      <path d="M14 10v4" stroke="#ECB22E" />
    </g>
  </svg>
);

const DriveGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
    <path d="M10.5 3L3 16h6l7.5-13h-6z" fill="#34A853" />
    <path d="M21 16l-4.5-7.8L9 19h12l0-3z" fill="#4285F4" />
    <path d="M3 16l4.5 7.8H21L15 16H3z" fill="#FBBC04" />
  </svg>
);

const StripeGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
    <path
      d="M6 12.5c0 3.6 2.1 5.7 6 5.7 1.6 0 2.8-.2 4-.7v-3.2c-1.2.5-2.4.8-3.8.8-1.6 0-2.6-.7-2.6-2.1 0-1.2.8-1.8 2.8-2.2 2.7-.6 4.8-1.4 4.8-4.5 0-3.8-3.2-5.5-6.3-5.5-1.8 0-3.6.4-4.8 1v3.4c1.5-.8 3.2-1.3 4.8-1.3 1.4 0 2.7.4 2.7 1.8s-1 1.8-3 2.2C8 8.7 6 9.7 6 12.5z"
      fill="#7F5CFF"
    />
  </svg>
);

const integrationCards: IntegrationCard[] = [
  {
    id: "slack",
    title: "Real-time Notifications",
    vendor: "Slack",
    Icon: SlackGlyph,
    iconBg: "from-[#36C5F0] via-[#2EB67D] to-[#ECB22E]",
    positionClass: "lg:top-[18%] lg:left-[0%]",
    endpoint: { x: 140, y: 190 },
  },
  {
    id: "drive",
    title: "Document Sync",
    vendor: "Google Drive",
    Icon: DriveGlyph,
    iconBg: "from-[#4285F4] via-[#34A853] to-[#FBBC04]",
    positionClass: "lg:top-[45%] lg:left-[-2%]",
    endpoint: { x: 120, y: 310 },
  },
  {
    id: "stripe",
    title: "Auto-Reporting",
    vendor: "Stripe",
    Icon: StripeGlyph,
    iconBg: "from-[#7F5CFF] via-[#5D2EEA] to-[#2D1B69]",
    positionClass: "lg:top-[72%] lg:left-[8%]",
    endpoint: { x: 180, y: 430 },
  },
];

const branchPaths = integrationCards.map((card, index) => ({
  id: card.id,
  d: createBranchPath(card.endpoint, 60 + index * 90),
}));

const pathVariants = {
  hidden: { pathLength: 0, opacity: 0.25 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 2.8,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop" as const,
      repeatDelay: 0.4,
    },
  },
};

export default function IntegrationTree() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/60">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-16 h-64 w-64 rounded-full bg-purple-200/40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-200/60 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-8">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600"
            >
              Integrations
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[2.5rem] font-semibold leading-tight text-slate-900 sm:text-5xl"
            >
              Connect your entire stack? No sweat.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg leading-8 text-slate-600 sm:text-xl"
            >
              Quickly enable full workflow automation by syncing WorkOS with the apps
              your team uses every day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                href="/integrations"
                className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-slate-900/10 transition hover:bg-slate-800"
              >
                See all Integrations
              </Link>
            </motion.div>
          </div>

          <div className="relative h-[520px] rounded-[36px] border border-white/70 bg-white/30 shadow-[0_20px_80px_rgba(15,23,42,0.1)] backdrop-blur-3xl">
            <motion.svg
              viewBox="0 0 640 520"
              className="absolute inset-0 h-full w-full"
              initial="hidden"
              animate="visible"
            >
              <defs>
                <linearGradient id="treeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a163f1" />
                  <stop offset="40%" stopColor="#6363f1" />
                  <stop offset="80%" stopColor="#3ba6f6" />
                  <stop offset="100%" stopColor="#40dfa3" />
                </linearGradient>
              </defs>
              {branchPaths.map((branch) => (
                <motion.path
                  key={branch.id}
                  d={branch.d}
                  stroke="url(#treeStroke)"
                  strokeWidth="7"
                  fill="transparent"
                  strokeLinecap="round"
                  variants={pathVariants}
                />
              ))}
            </motion.svg>

            <div className="absolute -top-10 right-8 flex flex-col items-end text-right">
              <span className="text-sm uppercase tracking-[0.2em] text-slate-500">WorkOS</span>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/60 bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-2xl"
              >
                <motion.span
                  className="text-lg font-semibold"
                  animate={{ letterSpacing: [1, 3, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  WorkOS
                </motion.span>
                <motion.span
                  className="absolute inset-0 rounded-3xl border border-white/30"
                  animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                />
              </motion.div>
              <p className="mt-2 text-xs text-slate-500">Orchestrating every integration</p>
            </div>

            {integrationCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative mx-auto mt-6 w-full max-w-sm rounded-2xl border border-white/50 bg-white/60 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl lg:absolute lg:w-64 ${card.positionClass}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconBg} text-white`}>
                    <card.Icon />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.vendor}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                  </div>
                </div>
                <motion.span
                  className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full border border-white/50"
                  animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
