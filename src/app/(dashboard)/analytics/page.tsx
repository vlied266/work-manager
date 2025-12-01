"use client";

import { motion } from "framer-motion";
import { useProcessAnalytics } from "@/hooks/use-process-analytics";

export default function AnalyticsPage() {
  const { metrics, loading, error } = useProcessAnalytics();

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Process Analytics</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Operational insight</h1>
        <p className="text-muted">Completion rates, flagged incidents, and run volume per process.</p>
      </header>

      {loading ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          Calculating metrics…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-subtle">
          {error}
        </div>
      ) : metrics.length === 0 ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          No runs recorded yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {metrics.map((metric) => {
            const completionRate = metric.runs ? Math.round((metric.completed / metric.runs) * 100) : 0;
            const flagRate = metric.runs ? Math.round((metric.flagged / metric.runs) * 100) : 0;
            return (
              <motion.article
                key={metric.processName}
                layout
                className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-subtle"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-muted">Process</p>
                <h2 className="text-xl font-semibold text-ink">{metric.processName}</h2>
                <div className="mt-4 grid gap-4 text-sm text-ink">
                  <div className="rounded-2xl border border-ink/10 bg-base/60 p-4">
                    <p className="text-xs text-muted">Total runs</p>
                    <p className="text-2xl font-semibold">{metric.runs}</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 bg-base/60 p-4">
                    <p className="text-xs text-muted">Completion rate</p>
                    <p className="text-2xl font-semibold">{completionRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs text-rose-600">Flagged rate</p>
                    <p className="text-2xl font-semibold text-rose-700">{flagRate}%</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

