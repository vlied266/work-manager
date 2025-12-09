"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where, collection, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun, Procedure } from "@/types/schema";
import { AlertTriangle, Clock, User, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrgQuery } from "@/hooks/useOrgData";
import { useOrganization } from "@/contexts/OrganizationContext";

// Prevent SSR/prerendering - this page requires client-side auth
export const dynamic = 'force-dynamic';

export default function FlagsPage() {
  const { organizationId } = useOrganization();
  const [flaggedRuns, setFlaggedRuns] = useState<ActiveRun[]>([]);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [loading, setLoading] = useState(true);

  // Use organization-scoped query hook
  const runsQuery = useOrgQuery("active_runs");

  useEffect(() => {
    if (!runsQuery) {
      setLoading(false);
      return;
    }

    // Query for flagged runs only
    const flaggedQuery = query(
      runsQuery,
      where("status", "==", "FLAGGED"),
      orderBy("startedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      flaggedQuery,
      async (snapshot) => {
        const runs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            logs: (data.logs || []).map((log: any) => ({
              ...log,
              timestamp: log.timestamp?.toDate() || new Date(),
            })),
          } as ActiveRun;
        });

        setFlaggedRuns(runs);

        // Fetch procedures for context
        const procIds = [...new Set(runs.map((r) => r.procedureId))];
        const procMap: Record<string, Procedure> = {};
        for (const procId of procIds) {
          try {
            const procDoc = await snapshot.ref.firestore
              .collection("procedures")
              .doc(procId)
              .get();
            if (procDoc.exists()) {
              const data = procDoc.data();
              procMap[procId] = {
                id: procDoc.id,
                ...data,
                createdAt: data?.createdAt?.toDate() || new Date(),
                updatedAt: data?.updatedAt?.toDate() || new Date(),
                steps: data?.steps || [],
              } as Procedure;
            }
          } catch (error) {
            console.error(`Error fetching procedure ${procId}:`, error);
          }
        }
        setProcedures(procMap);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching flagged runs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [runsQuery]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getCurrentStepName = (run: ActiveRun): string => {
    const procedure = procedures[run.procedureId];
    if (!procedure || !procedure.steps) return "Unknown";
    const step = procedure.steps[run.currentStepIndex];
    return step?.title || `Step ${run.currentStepIndex + 1}`;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading flagged runs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Flagged Runs</h1>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Review and resolve workflow runs that require attention
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>

        {/* Flagged Runs List */}
        {flaggedRuns.length === 0 ? (
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl" />
                <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Flagged Runs</h3>
              <p className="text-sm text-slate-600 mb-6 max-w-md text-center">
                All workflows are running smoothly. No issues detected.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedRuns.map((run, index) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-rose-200/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Run Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {run.procedureTitle || "Unknown Procedure"}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">ID: {run.id.slice(0, 8)}...</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>Started {formatTimeAgo(run.startedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>Step: {getCurrentStepName(run)}</span>
                      </div>
                    </div>

                    {/* Flag Reason (if available) */}
                    {run.logs && run.logs.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                        <p className="text-xs font-semibold text-rose-700 mb-1">Flag Reason:</p>
                        <p className="text-sm text-rose-600">
                          {run.logs.find((log: any) => log.action === "FLAGGED")?.message ||
                            "Workflow run flagged for review"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/run/${run.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-md"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Review
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

