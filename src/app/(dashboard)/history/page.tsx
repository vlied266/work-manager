"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useRunHistory } from "@/hooks/use-run-history";

const statusFilters = [
  { id: "all", label: "All Runs" },
  { id: "flagged", label: "Flagged" },
  { id: "completed", label: "Completed" },
];

const formatTs = (value?: Timestamp | Date) => {
  if (!value) return "—";
  const date = value instanceof Timestamp ? value.toDate() : value;
  return date.toLocaleString();
};

export default function HistoryPage() {
  const { runs, stats, loading, error } = useRunHistory();
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    if (activeFilter === "flagged") {
      return runs.filter((run) => run.logs?.some((log) => log.outcome === "FLAGGED"));
    }
    if (activeFilter === "completed") {
      return runs.filter((run) => run.status === "COMPLETED");
    }
    return runs;
  }, [activeFilter, runs]);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Audit Console</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-ink">Run History</h1>
            <p className="text-muted">Inspect completed work and flagged events.</p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-4 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-muted">Total</p>
              <p className="text-2xl font-semibold text-ink">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-4 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-muted">Completed</p>
              <p className="text-2xl font-semibold text-ink">{stats.completed}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-4 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-muted">Flagged</p>
              <p className="text-2xl font-semibold text-ink text-amber-600">{stats.flagged}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 inline-flex gap-2 rounded-full border border-white/80 bg-white/80 p-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full px-5 py-2 text-xs font-semibold ${
                activeFilter === filter.id ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          Loading run history…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-subtle">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          No runs match the selected filter.
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filtered.map((run) => (
              <motion.article
                key={run.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-subtle backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-muted">Procedure</p>
                    <h2 className="text-2xl font-semibold text-ink">{run.procedureName}</h2>
                    <p className="text-sm text-muted">Started {run.startedAtCopy}</p>
                  </div>
                  <div className="flex gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        run.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : run.status === "FAILED" || run.status === "BLOCKED"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {run.status.replace(/_/g, " ")}
                    </span>
                    {run.logs?.some((log) => log.outcome === "FLAGGED") && (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        Flagged
                      </span>
                    )}
                  </div>
                </div>

                <details className="mt-4 rounded-2xl border border-ink/10 bg-base/60 p-4 text-sm text-muted">
                  <summary className="cursor-pointer font-semibold text-ink">View audit logs</summary>
                  <div className="mt-4 space-y-3">
                    {run.logs?.map((log) => (
                      <div key={log.stepId + (log.performedAt as Timestamp)?.toMillis?.()} className="rounded-2xl border border-white/70 bg-white/80 p-4">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{log.stepTitle}</span>
                          <span>{log.performedAt && formatTs(log.performedAt as Timestamp)}</span>
                        </div>
                        <p className="mt-2 text-sm text-ink">Outcome: {log.outcome}</p>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-slate-900/90 p-3 text-xs text-slate-100">
                          {JSON.stringify(log.inputData, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </details>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

