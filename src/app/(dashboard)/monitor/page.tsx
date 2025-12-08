"use client";

import { useEffect, useState, useMemo } from "react";
import { onSnapshot, doc, getDoc, where, query, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun, Procedure, UserProfile } from "@/types/schema";
import { 
  Clock, AlertTriangle, Bell, UserCheck, Eye, 
  Filter, AlertCircle, User
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrgQuery, useOrgId } from "@/hooks/useOrgData";
import { ReassignModal } from "@/components/monitor/ReassignModal";

// Prevent SSR/prerendering - this page requires client-side auth
export const dynamic = 'force-dynamic';

interface AssigneeInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function MonitorPage() {
  const [runs, setRuns] = useState<ActiveRun[]>([]);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [assignees, setAssignees] = useState<Record<string, AssigneeInfo>>({});
  const [loading, setLoading] = useState(true);
  const [showStalledOnly, setShowStalledOnly] = useState(false);
  const [reassigningRunId, setReassigningRunId] = useState<string | null>(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedRunForReassign, setSelectedRunForReassign] = useState<ActiveRun | null>(null);
  const orgId = useOrgId();
  
  // Query: Only IN_PROGRESS or FLAGGED runs
  // Note: We'll sort client-side by last activity (oldest first)
  const runsQuery = useOrgQuery("active_runs", [
    where("status", "in", ["IN_PROGRESS", "FLAGGED"])
  ]);

  useEffect(() => {
    if (!runsQuery) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      runsQuery,
      async (snapshot) => {
        const runsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const logs = (data.logs || []).map((log: any) => ({
            ...log,
            timestamp: log.timestamp?.toDate() || new Date(),
          }));
          
          // Calculate last activity: use last log timestamp or startedAt
          const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
          const lastActivity = lastLog?.timestamp || data.startedAt?.toDate() || new Date();
          
          return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            logs,
            lastActivity, // Last update time for sorting
          } as ActiveRun & { lastActivity: Date };
        });
        
        // Sort by lastActivity (oldest first) to highlight stalled items
        runsData.sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());
        setRuns(runsData);

        // Fetch procedures
        const procedureIds = [...new Set(runsData.map((r) => r.procedureId))];
        const proceduresData: Record<string, Procedure> = {};
        for (const procId of procedureIds) {
          try {
            const procDoc = await getDoc(doc(db, "procedures", procId));
            if (procDoc.exists()) {
              const procData = procDoc.data();
              proceduresData[procId] = {
                id: procDoc.id,
                ...procData,
                createdAt: procData.createdAt?.toDate() || new Date(),
                updatedAt: procData.updatedAt?.toDate() || new Date(),
                steps: procData.steps || [],
              } as Procedure;
            }
          } catch (error) {
            console.error(`Error fetching procedure ${procId}:`, error);
          }
        }
        setProcedures(proceduresData);

        // Fetch assignee profiles (by ID and by email)
        const assigneeIds = [...new Set(
          runsData
            .map((r) => r.currentAssigneeId)
            .filter((id): id is string => !!id)
        )];
        const assigneeEmails = [...new Set(
          runsData
            .map((r) => r.currentAssignee)
            .filter((email): email is string => !!email)
        )];
        
        const assigneesData: Record<string, AssigneeInfo> = {};
        
        // Fetch by ID
        for (const assigneeId of assigneeIds) {
          try {
            const userDoc = await getDoc(doc(db, "users", assigneeId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              assigneesData[assigneeId] = {
                id: assigneeId,
                name: userData.displayName || userData.email?.split("@")[0] || "Unknown",
                email: userData.email || "",
                avatar: userData.photoURL || undefined,
              };
            }
          } catch (error) {
            console.error(`Error fetching assignee ${assigneeId}:`, error);
          }
        }
        
        // Fetch by email (for cases where we only have email)
        if (orgId) {
          for (const email of assigneeEmails) {
            // Skip if we already have this user by ID
            if (Object.values(assigneesData).some((a) => a.email === email)) continue;
            
            try {
              const usersQuery = query(
                collection(db, "users"),
                where("email", "==", email),
                where("organizationId", "==", orgId)
              );
              const usersSnapshot = await getDocs(usersQuery);
              if (!usersSnapshot.empty) {
                const userDoc = usersSnapshot.docs[0];
                const userData = userDoc.data();
                assigneesData[userDoc.id] = {
                  id: userDoc.id,
                  name: userData.displayName || userData.email?.split("@")[0] || "Unknown",
                  email: userData.email || "",
                  avatar: userData.photoURL || undefined,
                };
              }
            } catch (error) {
              console.error(`Error fetching assignee by email ${email}:`, error);
            }
          }
        }
        
        setAssignees(assigneesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching runs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [runsQuery]);

  // Calculate time in current step (stall time)
  const getTimeInStep = (run: ActiveRun & { lastActivity: Date }): { hours: number; isStalled: boolean; display: string } => {
    const now = new Date();
    const lastUpdate = run.lastActivity || run.startedAt;
    const diffMs = now.getTime() - lastUpdate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);

    let display = "";
    if (days > 0) {
      display = `${days}d ${remainingHours}h`;
    } else if (hours >= 1) {
      display = `${remainingHours}h ${minutes}m`;
    } else {
      display = `${minutes}m`;
    }

    const isStalled = hours > 24; // Stalled if > 24 hours

    return { hours, isStalled, display };
  };

  // Get current step name
  const getCurrentStepName = (run: ActiveRun): string => {
    const procedure = procedures[run.procedureId];
    if (!procedure || !procedure.steps) return "Unknown Step";
    const step = procedure.steps[run.currentStepIndex];
    return step?.title || `Step ${run.currentStepIndex + 1}`;
  };

  // Get assignee info
  const getAssigneeInfo = (run: ActiveRun): AssigneeInfo | null => {
    // Try currentAssigneeId first (UID), then currentAssignee (email), then assigneeId (legacy)
    const assigneeId = run.currentAssigneeId || run.assigneeId;
    const assigneeEmail = run.currentAssignee;
    
    // First try to find by ID
    if (assigneeId && assignees[assigneeId]) {
      return assignees[assigneeId];
    }
    
    // If not found by ID, try to find by email
    if (assigneeEmail) {
      const found = Object.values(assignees).find((a) => a.email === assigneeEmail);
      if (found) return found;
    }
    
    return null;
  };

  // Filter runs: Show all active or only stalled/late
  const filteredRuns = useMemo(() => {
    let filtered = runs;

    if (showStalledOnly) {
      filtered = filtered.filter((run) => {
        const { isStalled } = getTimeInStep(run as ActiveRun & { lastActivity: Date });
        return isStalled;
      });
    }

    return filtered;
  }, [runs, showStalledOnly, procedures]);

  const handleNudge = async (run: ActiveRun) => {
    const assignee = getAssigneeInfo(run);
    if (!assignee) {
      alert("No assignee found for this task.");
      return;
    }

    // TODO: Implement nudge API call
    alert(`Sending reminder to ${assignee.name}...`);
    // await fetch("/api/runs/nudge", { method: "POST", body: JSON.stringify({ runId: run.id }) });
  };

  const handleReassign = (run: ActiveRun) => {
    setSelectedRunForReassign(run);
    setReassignModalOpen(true);
  };

  const handleReassignSuccess = () => {
    // The modal will close automatically, but we can refresh data if needed
    // The onSnapshot listener will automatically update the runs list
    setSelectedRunForReassign(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading operational monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Operational Monitor</h1>
              <p className="mt-2 text-sm text-slate-600 font-medium">
                Air Traffic Control: Track active processes and identify bottlenecks
              </p>
            </div>
            {/* Filter Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStalledOnly(!showStalledOnly)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  showStalledOnly
                    ? "bg-rose-100 text-rose-700 border-2 border-rose-300 shadow-md"
                    : "bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg text-slate-700 hover:bg-white/90"
                }`}
              >
                <AlertCircle className={`h-4 w-4 ${showStalledOnly ? "text-rose-600" : "text-slate-500"}`} />
                {showStalledOnly ? "Show Stalled Only" : "Show All Active"}
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Processes</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{runs.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stalled (&gt;24h)</p>
                  <p className="mt-1 text-2xl font-extrabold text-rose-600">
                    {runs.filter((r) => getTimeInStep(r as ActiveRun & { lastActivity: Date }).isStalled).length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flagged</p>
                  <p className="mt-1 text-2xl font-extrabold text-orange-600">
                    {runs.filter((r) => r.status === "FLAGGED").length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Runs Table - Operational Control Style */}
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
                {filteredRuns.length === 0 ? (
              <div className="p-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
                          <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                            <Clock className="h-10 w-10 text-slate-400" />
                          </div>
                        </div>
                  <p className="text-lg font-extrabold text-slate-900 mb-2">
                    {showStalledOnly ? "No stalled processes" : "No active processes"}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    {showStalledOnly 
                      ? "All processes are moving smoothly!" 
                      : "Start a process to see it here"}
                  </p>
                </div>
                      </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/50 border-b border-slate-100">
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Process Context
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Current Bottleneck
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Time in Step
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Quick Actions
                      </th>
                  </tr>
                  </thead>
                  <tbody>
                    {filteredRuns.map((run, index) => {
                      const timeInStep = getTimeInStep(run as ActiveRun & { lastActivity: Date });
                      const assignee = getAssigneeInfo(run);
                      const currentStepName = getCurrentStepName(run);
                      const runTitle = (run as any).title || run.procedureTitle || "Untitled Process";

                    return (
                        <motion.tr
                        key={run.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`transition-colors ${
                            index % 2 === 0 ? "bg-white/50" : "bg-white/30"
                          } hover:bg-white/70 ${
                          run.status === "FLAGGED" ? "bg-rose-50/30" : ""
                          } ${timeInStep.isStalled ? "bg-orange-50/30" : ""}`}
                      >
                          {/* Process Context */}
                        <td className="px-8 py-5">
                            <div>
                              <p className="text-sm font-bold text-slate-900 mb-0.5">
                                {runTitle}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">
                                {run.procedureTitle}
                              </p>
                              {run.status === "FLAGGED" && (
                                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                                  <AlertTriangle className="h-3 w-3" />
                                  Flagged
                                </span>
                              )}
                          </div>
                        </td>

                          {/* Current Bottleneck */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                              {assignee ? (
                                <>
                                  {assignee.avatar ? (
                                    <img
                                      src={assignee.avatar}
                                      alt={assignee.name}
                                      className="h-10 w-10 rounded-full border-2 border-white shadow-sm object-cover"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                      {assignee.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {currentStepName}
                                    </p>
                                    <p className="text-xs text-slate-600 font-medium">
                                      Waiting for <span className="font-semibold">{assignee.name}</span>
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {currentStepName}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                      No assignee
                                    </p>
                                  </div>
                                </div>
                              )}
                          </div>
                        </td>

                          {/* Time in Step */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                              <Clock className={`h-4 w-4 ${timeInStep.isStalled ? "text-rose-600" : "text-slate-400"}`} />
                              <span
                                className={`text-sm font-semibold ${
                                  timeInStep.isStalled
                                    ? "text-rose-600"
                                    : timeInStep.hours > 12
                                    ? "text-orange-600"
                                    : "text-slate-700"
                                }`}
                              >
                                {timeInStep.display}
                              </span>
                              {timeInStep.isStalled && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                                  Stalled
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Quick Actions */}
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                onClick={() => handleNudge(run)}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all shadow-sm"
                                title="Send reminder to assignee"
                              >
                                <Bell className="h-4 w-4" />
                                </button>
                                <button
                                onClick={() => handleReassign(run)}
                                disabled={reassigningRunId === run.id}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all shadow-sm disabled:opacity-50"
                                title="Reassign to another user"
                              >
                                <UserCheck className="h-4 w-4" />
                                </button>
                              <Link
                                href={`/run/${run.id}`}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all shadow-sm"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                          </div>
                        </td>
                        </motion.tr>
                    );
                    })}
              </tbody>
            </table>
          </div>
            )}
        </div>
        </div>
      </div>

      {/* Reassign Modal */}
      <ReassignModal
        isOpen={reassignModalOpen}
        onClose={() => {
          setReassignModalOpen(false);
          setSelectedRunForReassign(null);
        }}
        runId={selectedRunForReassign?.id || ""}
        currentAssignee={selectedRunForReassign?.currentAssignee}
        onReassigned={handleReassignSuccess}
      />
    </div>
  );
}
