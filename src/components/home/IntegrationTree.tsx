"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type IntegrationCard = {
  id: string;
  title: string;
  vendor: string;
  Icon: () => JSX.Element;
  gradient: string;
  positionClass: string;
  endpoint: { x: number; y: number };
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
    gradient: "from-[#36C5F0] via-[#2EB67D] to-[#ECB22E]",
    positionClass: "lg:left-[-6%] lg:top-[55%]",
    endpoint: { x: 120, y: 455 },
  },
  {
    id: "drive",
    title: "Document Sync",
    vendor: "Google Drive",
    Icon: DriveGlyph,
    gradient: "from-[#4285F4] via-[#34A853] to-[#FBBC04]",
    positionClass: "lg:left-[25%] lg:top-[63%]",
    endpoint: { x: 260, y: 495 },
  },
  {
    id: "stripe",
    title: "Auto-Reporting",
    vendor: "Stripe",
    Icon: StripeGlyph,
    gradient: "from-[#7F5CFF] via-[#5D2EEA] to-[#2D1B69]",
    positionClass: "lg:left-[58%] lg:top-[58%]",
    endpoint: { x: 400, y: 460 },
  },
];

const branchAnchor = { x: 280, y: 420 };
const startPoint = { x: 520, y: 70 };

const trunkPath = `M${startPoint.x},${startPoint.y} C 430,120 410,210 360,270 S 300,360 280,420`;

const createBranchPath = (endpoint: { x: number; y: number }, curveOffset: number) =>
  `M${branchAnchor.x},${branchAnchor.y} C ${branchAnchor.x + curveOffset},${branchAnchor.y + 35} ${
    endpoint.x - curveOffset
  },${endpoint.y - 45} ${endpoint.x},${endpoint.y}`;

const branchPaths = integrationCards.map((card, index) => {
  const offsets = [-120, 0, 120];
  return {
    id: card.id,
    d: createBranchPath(card.endpoint, offsets[index] ?? 0),
  };
});

const strokeVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 2.4,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 0.6,
    },
  },
};

const pulseVariants = {
  animate: {
    opacity: [0.2, 0.8, 0.2],
    scale: [0.9, 1.1, 0.9],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const flowNodes = [
  { id: "n1", top: "16%", left: "48%" },
  { id: "n2", top: "33%", left: "56%" },
  { id: "n3", top: "47%", left: "46%" },
];

export default function IntegrationTree() {
  return (
    <section className="relative overflow-hidden bg-[#f5f7ff]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,197,253,0.35),transparent_55%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,rgba(199,210,254,0.4),transparent_70%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-6 py-24 sm:px-10 lg:grid lg:grid-cols-[1.05fr,1.2fr] lg:items-center lg:gap-20 lg:py-32">
        <div className="space-y-8">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500"
          >
            Directory Sync
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[2.6rem] font-semibold leading-tight text-slate-900 sm:text-5xl"
          >
            Connect your entire stack? No sweat.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg leading-8 text-slate-600 sm:text-xl"
          >
            Quickly enable full workflow automation by syncing WorkOS with the apps your team uses every day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/integrations"
              className="inline-flex items-center rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              See all Integrations
            </Link>
          </motion.div>
        </div>

        <div className="relative h-[520px] rounded-[42px] border border-white/70 bg-gradient-to-br from-white to-slate-50 shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
          <motion.svg
            viewBox="0 0 640 520"
            className="absolute inset-0 h-full w-full"
            initial="hidden"
            animate="visible"
          >
            <defs>
              <linearGradient id="integrationFlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="35%" stopColor="#8b5cf6" />
                <stop offset="75%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>

            <motion.path
              d={trunkPath}
              stroke="url(#integrationFlow)"
              strokeWidth="9"
              fill="transparent"
              strokeLinecap="round"
              variants={strokeVariants}
            />
            {branchPaths.map((branch) => (
              <motion.path
                key={branch.id}
                d={branch.d}
                stroke="url(#integrationFlow)"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                variants={strokeVariants}
              />
            ))}
          </motion.svg>

          <div className="absolute -top-10 right-8 flex flex-col items-end text-right">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">WorkOS</span>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-2xl"
            >
              <span className="text-lg font-semibold tracking-[0.2em]">W</span>
              <motion.span
                className="absolute inset-0 rounded-[28px] border border-white/30"
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>
            <p className="mt-2 text-xs text-slate-500">Orchestrating every integration</p>
          </div>

          {flowNodes.map((node, index) => (
            <motion.div
              key={node.id}
              className="absolute h-11 w-11 rounded-full border border-white/70 bg-white/80 shadow-lg shadow-slate-900/10"
              style={{ top: node.top, left: node.left }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
            >
              <motion.span
                className="absolute inset-0 rounded-full border border-indigo-200/70"
                variants={pulseVariants}
                animate="animate"
              />
            </motion.div>
          ))}

          {integrationCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              className={`relative mx-auto w-full max-w-sm rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-900/10 backdrop-blur-xl lg:absolute lg:w-64 ${card.positionClass}`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white`}>
                  <card.Icon />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">{card.vendor}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                </div>
              </div>
              <motion.span
                className="pointer-events-none absolute -right-3 -top-3 h-9 w-9 rounded-full border border-slate-200/70"
                variants={pulseVariants}
                animate="animate"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
