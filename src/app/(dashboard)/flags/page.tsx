"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { AlertTriangle, Repeat2, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useFlaggedRuns } from "@/hooks/use-flagged-runs";

export default function FlagsPage() {
  const { runs, loading, error } = useFlaggedRuns();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (runId: string, logIndex: number) => {
    setResolvingId(runId);
    try {
      const runRef = doc(db, "active_runs", runId);
      await updateDoc(runRef, {
        [`logs.${logIndex}.outcome`]: "SUCCESS",
        [`logs.${logIndex}.resolutionComment`]: "Flag reviewed and resolved.",
      });
    } finally {
      setResolvingId(null);
    }
  };

  const handleReopen = async (runId: string, logIndex: number) => {
    setResolvingId(runId);
    try {
      const runRef = doc(db, "active_runs", runId);
      await updateDoc(runRef, {
        currentStepIndex: logIndex,
        status: "IN_PROGRESS",
        [`logs.${logIndex}.resolutionComment`]: "Reopened from this step.",
      });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Flag Review</p>
        <div className="mt-4 flex flex-wrap items-center justify-between">
          <h1 className="text-3xl font-semibold text-ink">Flagged executions</h1>
          <span className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700">
            {runs.length} open
          </span>
        </div>
      </header>

      {loading ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          Loading flagged runs…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-subtle">
          {error}
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          No flagged steps at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => {
            const log = run.logs?.[run.flaggedLogIndex];
            if (!log) return null;
            return (
              <motion.article
                key={run.id}
                layout
                className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-subtle"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-rose-600">Flagged run</p>
                    <h2 className="text-xl font-semibold text-ink">{run.processName || run.procedureName}</h2>
                    <p className="text-sm text-muted">{log.stepTitle}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                </div>
                <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-white p-4 text-xs">
                  {JSON.stringify(log.inputData, null, 2)}
                </pre>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleResolve(run.id, run.flaggedLogIndex)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#10B981] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#10B981]/30 transition-all hover:bg-[#059669] hover:shadow-lg hover:shadow-[#10B981]/40 disabled:opacity-50"
                    disabled={!!resolvingId}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resolve
                  </button>
                  <button
                    onClick={() => handleReopen(run.id, run.flaggedLogIndex)}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#1D1D1F]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#1D1D1F] shadow-sm transition-all hover:border-[#007AFF]/40 hover:bg-[#007AFF]/5 hover:shadow-md disabled:opacity-50"
                    disabled={!!resolvingId}
                  >
                    <Repeat2 className="h-4 w-4" />
                    Reopen from here
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

