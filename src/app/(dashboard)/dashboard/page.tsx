"use client";

import { useEffect, useState, useMemo } from "react";
import { onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Procedure, ActiveRun } from "@/types/schema";
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, 
  TrendingUp, ArrowRight, BarChart3, Filter, Search, User
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrgQuery } from "@/hooks/useOrgData";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Target, Database } from "lucide-react";
import ActiveWatchersList from "@/components/dashboard/active-watchers-list";
import { fetchCollectionsStats, CollectionStats } from "@/lib/collections-stats";

// Prevent SSR/prerendering - this page requires client-side auth
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { userProfile } = useOrganization();
  const isAdmin = userProfile?.role?.toUpperCase() === "ADMIN" || userProfile?.role?.toUpperCase() === "MANAGER";
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed" | "flagged">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionsStats, setCollectionsStats] = useState<CollectionStats | null>(null);
  const { organizationId } = useOrganization();

  // Use organization-scoped query hook (automatically filters by orgId)
  const runsQuery = useOrgQuery("active_runs");

  useEffect(() => {
    if (!runsQuery) {
      setLoading(false);
      return;
    }

    // Fetch ONLY Active Runs (Instances), NOT Templates
    // Query is automatically filtered by organizationId via useOrgQuery

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
  }, [runsQuery]);

  // Fetch collections stats
  useEffect(() => {
    if (!organizationId) return;
    fetchCollectionsStats(organizationId).then(setCollectionsStats);
  }, [organizationId]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRuns = activeRuns.length;
    const activeRunsCount = activeRuns.filter(r => r.status === "IN_PROGRESS").length;
    const completedRuns = activeRuns.filter(r => r.status === "COMPLETED").length;
    const flaggedRuns = activeRuns.filter(r => r.status === "FLAGGED").length;
    
    // If no runs, use collections stats
    const useCollectionsStats = totalRuns === 0 && collectionsStats;
    
    // Calculate completion rate
    const completionRate = totalRuns > 0 
      ? Math.round((completedRuns / totalRuns) * 100) 
      : useCollectionsStats && collectionsStats.totalRecords > 0 ? 100 : 0;

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
      totalRuns: useCollectionsStats ? collectionsStats!.totalRecords : totalRuns,
      activeRunsCount: useCollectionsStats ? 0 : activeRunsCount,
      completedRuns: useCollectionsStats ? collectionsStats!.totalRecords : completedRuns,
      flaggedRuns: useCollectionsStats ? 0 : flaggedRuns,
      completionRate,
      avgCompletionTime: Math.round(avgCompletionTime),
      collectionsCount: collectionsStats?.totalCollections || 0,
      useCollectionsStats: !!useCollectionsStats,
    };
  }, [activeRuns, collectionsStats]);

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
    const styles: Record<string, string> = {
      IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
      COMPLETED: "bg-green-100 text-green-700 border-green-200",
      FLAGGED: "bg-rose-100 text-rose-700 border-rose-200",
      BLOCKED: "bg-slate-100 text-slate-700 border-slate-200",
      OPEN_FOR_CLAIM: "bg-yellow-100 text-yellow-700 border-yellow-200",
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Command Center</h1>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Monitor active work instances and running processes
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/processes"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
            >
              <BarChart3 className="h-4 w-4" />
              View Library
            </Link>
          ) : (
            <Link
              href="/focus"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
            >
              <Target className="h-4 w-4" />
              Focus Mode
            </Link>
          )}
        </div>

        {/* Metrics Cards - Glass Widgets */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {metrics.useCollectionsStats ? "Total Records" : "Active Runs"}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {metrics.useCollectionsStats ? metrics.totalRuns : metrics.activeRunsCount}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              {metrics.useCollectionsStats ? <Database className="h-7 w-7" /> : <Activity className="h-7 w-7" />}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 font-medium">
            {metrics.useCollectionsStats ? (
              <span>{metrics.collectionsCount} collections</span>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>{metrics.totalRuns} total runs</span>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {metrics.useCollectionsStats ? "Total Records" : "Completed"}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{metrics.completedRuns}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 font-medium">
            {metrics.useCollectionsStats ? (
              <span>All records stored</span>
            ) : (
              <span>{metrics.completionRate}% completion rate</span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flagged</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{metrics.flaggedRuns}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
              <AlertTriangle className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/flags" className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors">
              Review flagged items →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Time</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{metrics.avgCompletionTime}m</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <Clock className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>Average completion time</span>
          </div>
        </motion.div>
      </div>

      {/* Active Watchers Widget */}
      <ActiveWatchersList />

      {/* Filters and Search - iOS Segmented Control Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-5 py-2 text-sm font-semibold tracking-tight transition-all ${
              filter === "all"
                ? "bg-white text-slate-800 shadow-md"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            All ({activeRuns.length})
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`rounded-full px-5 py-2 text-sm font-semibold tracking-tight transition-all ${
              filter === "in_progress"
                ? "bg-white text-slate-800 shadow-md"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            In Progress ({metrics.activeRunsCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`rounded-full px-5 py-2 text-sm font-semibold tracking-tight transition-all ${
              filter === "completed"
                ? "bg-white text-slate-800 shadow-md"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Completed ({metrics.completedRuns})
          </button>
          <button
            onClick={() => setFilter("flagged")}
            className={`rounded-full px-5 py-2 text-sm font-semibold tracking-tight transition-all ${
              filter === "flagged"
                ? "bg-white text-slate-800 shadow-md"
                : "text-slate-600 hover:text-slate-800"
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
            className="w-full rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg pl-12 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/90 sm:w-64 transition-all"
          />
        </div>
      </div>

      {/* Active Runs Table - Floating Glass Panel */}
      <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Procedure</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Started By</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Current Step</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Started</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
                        <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                          <Activity className="h-10 w-10 text-slate-400" />
                        </div>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Active Runs</h3>
                      <p className="text-sm text-slate-600 mb-6 max-w-md">
                        {searchQuery || filter !== "all"
                          ? "No runs match your filters"
                          : "Start a procedure from the Library to see it here"}
                      </p>
                      {!searchQuery && filter === "all" && (
                        <Link
                          href="/processes"
                          className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#0071E3] hover:shadow-lg transition-all"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Start a Workflow
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run, index) => (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`transition-colors ${index % 2 === 0 ? "bg-white/50" : "bg-white/30"} hover:bg-white/70`}
                  >
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{run.procedureTitle || "Unknown Procedure"}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">ID: {run.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {(run as any).startedBy || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {getCurrentStepName(run)}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({run.currentStepIndex + 1}/{procedures[run.procedureId]?.steps?.length || "?"})
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusBadge(run.status).replace("border ", "")}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(run.startedAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Link
                        href={`/run/${run.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-md"
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
    </div>
  );
}
