"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type IntegrationCard = {
  id: string;
  vendor: string;
  title: string;
  description: string;
  Icon: () => JSX.Element;
  gradient: string;
  badge: string;
  position: { top: string; left: string };
  endpoint: { x: number; y: number };
};

const hubPoint = { x: 430, y: 90 };

const createBranchPath = (endpoint: { x: number; y: number }, bend: number) => {
  const controlOne = {
    x: hubPoint.x - 80,
    y: hubPoint.y + 80 + bend,
  };
  const controlTwo = {
    x: endpoint.x + 80,
    y: endpoint.y - 60,
  };

  return `M${hubPoint.x},${hubPoint.y} C ${controlOne.x},${controlOne.y} ${controlTwo.x},${controlTwo.y} ${endpoint.x},${endpoint.y}`;
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
    vendor: "Slack",
    title: "Real-time Notifications",
    description: "Pipe workflow events into the channels that matter and keep ops unblocked.",
    Icon: SlackGlyph,
    gradient: "from-[#36C5F0] via-[#2EB67D] to-[#ECB22E]",
    badge: "Live Alerts",
    position: { top: "18%", left: "6%" },
    endpoint: { x: 170, y: 200 },
  },
  {
    id: "drive",
    vendor: "Google Drive",
    title: "Document Sync",
    description: "Publish the latest SOPs and briefs straight into shared folders.",
    Icon: DriveGlyph,
    gradient: "from-[#4285F4] via-[#34A853] to-[#FBBC04]",
    badge: "Auto-sync",
    position: { top: "50%", left: "-2%" },
    endpoint: { x: 140, y: 330 },
  },
  {
    id: "stripe",
    vendor: "Stripe",
    title: "Auto-Reporting",
    description: "Pipe run data into billing events and close the loop on finance.",
    Icon: StripeGlyph,
    gradient: "from-[#7F5CFF] via-[#5D2EEA] to-[#2D1B69]",
    badge: "Insights",
    position: { top: "70%", left: "32%" },
    endpoint: { x: 250, y: 430 },
  },
];

const branchPaths = integrationCards.map((card, index) => ({
  id: card.id,
  d: createBranchPath(card.endpoint, index * 40),
}));

const trunkPath = "M430,90 C 360,150 320,240 300,340 S 260,420 230,460";

const pathVariants = {
  hidden: { pathLength: 0, opacity: 0.25 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 2.4,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 0.4,
    },
  },
};

const pulseVariants = {
  animate: {
    opacity: [0.2, 0.9, 0.2],
    scale: [0.8, 1.1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const flowNodes = [
  { id: "a", top: "22%", left: "58%" },
  { id: "b", top: "38%", left: "46%" },
  { id: "c", top: "57%", left: "60%" },
];

export default function IntegrationTree() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-[#eef2ff]">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-purple-200/50 blur-[160px]" />
        <div className="absolute bottom-0 right-8 h-80 w-80 rounded-full bg-sky-200/60 blur-[170px]" />
        <div className="absolute top-1/4 right-1/4 h-48 w-48 rounded-full bg-cyan-200/50 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[1.05fr,1.15fr] lg:items-center">
          <div className="space-y-8">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500"
            >
              Directory Sync
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[2.8rem] font-semibold leading-tight text-slate-900 sm:text-5xl"
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
              Quickly enable full workflow automation by syncing WorkOS with the apps your team uses every day. Design paths once, and let WorkOS handle provisioning, sync, and observability.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4 text-slate-600"
            >
              {[
                "Single control plane for every connector",
                "Live run telemetry & health pulses",
                "Enterprise-ready SCIM + HRIS adapters",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm sm:text-base">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-indigo-500 shadow-sm shadow-indigo-500/20">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                href="/integrations"
                className="inline-flex items-center rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
              >
                See all Integrations
              </Link>
              <Link
                href="/documentation"
                className="inline-flex items-center rounded-full border border-slate-300/80 px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Explore Docs
              </Link>
            </motion.div>
          </div>

          <div className="relative h-[560px] rounded-[46px] border border-white/60 bg-gradient-to-br from-white/90 via-white/70 to-blue-50/60 shadow-[0_40px_120px_rgba(15,23,42,0.12)] backdrop-blur-3xl">
            <motion.svg
              viewBox="0 0 520 560"
              className="absolute inset-0 h-full w-full"
              initial="hidden"
              animate="visible"
            >
              <defs>
                <linearGradient id="treeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="40%" stopColor="#6366f1" />
                  <stop offset="80%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>

              <motion.path
                d={trunkPath}
                stroke="url(#treeStroke)"
                strokeWidth="9"
                fill="transparent"
                strokeLinecap="round"
                variants={pathVariants}
              />

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

            <div className="absolute -top-10 right-10 text-right">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">WorkOS</span>
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-2xl"
              >
                <span className="text-lg font-semibold tracking-[0.2em]">W</span>
                <motion.span
                  className="absolute inset-0 rounded-[28px] border border-white/40"
                  animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.07, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity }}
                />
              </motion.div>
              <p className="mt-2 text-xs text-slate-500">Automation nucleus</p>
            </div>

            {flowNodes.map((node, index) => (
              <motion.div
                key={node.id}
                className="absolute h-11 w-11 rounded-full border border-white/70 bg-white/80 shadow-lg shadow-indigo-500/20"
                style={{ top: node.top, left: node.left }}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
              >
                <motion.span className="absolute inset-0 rounded-full border border-indigo-200/80" variants={pulseVariants} animate="animate" />
              </motion.div>
            ))}

            {integrationCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                className="absolute w-64 max-w-[85%] rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-slate-900/10 backdrop-blur-xl"
                style={{ top: card.position.top, left: card.position.left }}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white`}>
                    <card.Icon />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{card.vendor}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">{card.description}</p>
                <span className="mt-4 inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">
                  {card.badge}
                </span>
                <motion.span
                  className="pointer-events-none absolute -right-3 -top-3 h-9 w-9 rounded-full border border-slate-200/80"
                  variants={pulseVariants}
                  animate="animate"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
