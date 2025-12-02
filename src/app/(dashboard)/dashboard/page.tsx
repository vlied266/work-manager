"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Procedure, ActiveRun } from "@/types/schema";
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, 
  TrendingUp, ArrowRight, BarChart3, Filter, Search, User
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [loading, setLoading] = useState(true);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed" | "flagged">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch ONLY Active Runs (Instances), NOT Templates
    const runsQuery = query(
      collection(db, "active_runs"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribeRuns = onSnapshot(
      runsQuery,
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
        
        setActiveRuns(runs);
        
        // Fetch procedures for context (to show procedure details)
        const procIds = [...new Set(runs.map((r) => r.procedureId))];
        const procMap: Record<string, Procedure> = {};
        for (const procId of procIds) {
          try {
            const procDoc = await getDoc(doc(db, "procedures", procId));
            if (procDoc.exists()) {
              const data = procDoc.data();
              procMap[procId] = {
                id: procDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                steps: data.steps || [],
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
        console.error("Error fetching active runs:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeRuns();
    };
  }, [organizationId]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRuns = activeRuns.length;
    const activeRunsCount = activeRuns.filter(r => r.status === "IN_PROGRESS").length;
    const completedRuns = activeRuns.filter(r => r.status === "COMPLETED").length;
    const flaggedRuns = activeRuns.filter(r => r.status === "FLAGGED").length;
    
    // Calculate completion rate
    const completionRate = totalRuns > 0 
      ? Math.round((completedRuns / totalRuns) * 100) 
      : 0;

    // Calculate average completion time (for completed runs)
    const completedRunsWithTime = activeRuns.filter(r => 
      r.status === "COMPLETED" && r.completedAt && r.startedAt
    );
    const avgCompletionTime = completedRunsWithTime.length > 0
      ? completedRunsWithTime.reduce((sum, r) => {
          const time = r.completedAt!.getTime() - r.startedAt.getTime();
          return sum + time;
        }, 0) / completedRunsWithTime.length / (1000 * 60) // Convert to minutes
      : 0;

    return {
      totalRuns,
      activeRunsCount,
      completedRuns,
      flaggedRuns,
      completionRate,
      avgCompletionTime: Math.round(avgCompletionTime),
    };
  }, [activeRuns]);

  // Filter runs
  const filteredRuns = useMemo(() => {
    let filtered = activeRuns;

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(r => {
        if (filter === "in_progress") return r.status === "IN_PROGRESS";
        if (filter === "completed") return r.status === "COMPLETED";
        if (filter === "flagged") return r.status === "FLAGGED";
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.procedureTitle?.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query)
      );
    }

    // Sort by most recent first
    return filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }, [activeRuns, filter, searchQuery]);

  const getStatusBadge = (status: ActiveRun["status"]) => {
    const styles = {
      IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
      COMPLETED: "bg-green-100 text-green-700 border-green-200",
      FLAGGED: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return styles[status] || styles.IN_PROGRESS;
  };

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
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Command Center</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor active work instances and running processes
          </p>
        </div>
        <Link
          href="/processes"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          <BarChart3 className="h-4 w-4" />
          View Library
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Runs</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.activeRunsCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>{metrics.totalRuns} total runs</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.completedRuns}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <span>{metrics.completionRate}% completion rate</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Flagged</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.flaggedRuns}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/flags" className="text-xs font-medium text-rose-600 hover:text-rose-700">
              Review flagged items →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg. Time</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.avgCompletionTime}m</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <span>Average completion time</span>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              filter === "all"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            All ({activeRuns.length})
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              filter === "in_progress"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            In Progress ({metrics.activeRunsCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              filter === "completed"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            Completed ({metrics.completedRuns})
          </button>
          <button
            onClick={() => setFilter("flagged")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              filter === "flagged"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            Flagged ({metrics.flaggedRuns})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:w-64"
          />
        </div>
      </div>

      {/* Active Runs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Procedure</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Started By</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Current Step</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Started</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Activity className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No Active Runs</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {searchQuery || filter !== "all"
                        ? "No runs match your filters"
                        : "Start a procedure from the Library to see it here"}
                    </p>
                    {!searchQuery && filter === "all" && (
                      <Link
                        href="/processes"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Go to Library
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{run.procedureTitle || "Unknown Procedure"}</p>
                        <p className="text-xs text-slate-500 mt-1">ID: {run.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {(run as any).startedBy || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700">
                          {getCurrentStepName(run)}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({run.currentStepIndex + 1}/{procedures[run.procedureId]?.steps?.length || "?"})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadge(run.status)}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(run.startedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/run/${run.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
