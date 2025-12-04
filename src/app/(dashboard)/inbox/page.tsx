"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun, Procedure, AtomicStep, UserProfile } from "@/types/schema";
import { 
  Play, Clock, AlertCircle, CheckCircle2, Mail, Calendar, 
  Filter, Search, ArrowRight, TrendingUp, Zap, User
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrgQuery } from "@/hooks/useOrgData";
import { useOrganization } from "@/contexts/OrganizationContext";

// Prevent SSR/prerendering - this page requires client-side auth
export const dynamic = 'force-dynamic';

export default function OperatorInbox() {
  const [pendingTasks, setPendingTasks] = useState<ActiveRun[]>([]);
  const [selectedTask, setSelectedTask] = useState<ActiveRun | null>(null);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "in_progress" | "flagged">("all");
  const [isMobile, setIsMobile] = useState(false);
  
  const { userProfile: orgUserProfile } = useOrganization();
  const userId = orgUserProfile?.uid || null;

  // Use organization-scoped query hook with additional status filter
  const runsQuery = useOrgQuery("active_runs", [
    where("status", "in", ["IN_PROGRESS", "FLAGGED"])
  ]);

  useEffect(() => {
    if (!runsQuery || !userId) {
      setLoading(false);
      return;
    }

    // Fetch active runs assigned to this user
    // Query is automatically filtered by organizationId via useOrgQuery
    const unsubscribe = onSnapshot(
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

        // Filter by assignee: Only show runs assigned to this user or their team
        const userTasks = runs.filter((run) => {
          // Check if assigned to this user
          if (run.assigneeId === userId && run.assigneeType === "USER") {
            return true;
          }

          // TODO: Check if assigned to user's team
          // For now, if no assignee is set, show it (backward compatibility)
          if (!run.assigneeId) {
            return true;
          }

          return false;
        });

        setPendingTasks(userTasks);
        
        // Update user profile from context
        if (orgUserProfile) {
          setUserProfile(orgUserProfile);
        }

        // Fetch procedures for context
        const procIds = [...new Set(userTasks.map((t) => t.procedureId))];
        const procMap: Record<string, Procedure> = {};
        for (const procId of procIds) {
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
        }
        setProcedures(procMap);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [runsQuery, userId, orgUserProfile]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getCurrentStep = (run: ActiveRun): AtomicStep | null => {
    const procedure = procedures[run.procedureId];
    if (!procedure) return null;
    return procedure.steps[run.currentStepIndex] || null;
  };

  const getTimeElapsed = (startedAt: Date): string => {
    const now = new Date();
    const diff = now.getTime() - startedAt.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  const canAccessTask = (run: ActiveRun): boolean => {
    const currentStep = getCurrentStep(run);
    if (!currentStep || !userProfile) return false;

    if (currentStep.assigneeType === "STARTER") {
      return true;
    } else if (currentStep.assigneeType === "SPECIFIC_USER") {
      return currentStep.assigneeId === userId;
    } else if (currentStep.assigneeType === "TEAM") {
      return currentStep.assigneeId ? userProfile.teamIds.includes(currentStep.assigneeId) : false;
    }

    return true;
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return pendingTasks.filter((task) => {
      // Filter by status
      if (filter === "in_progress" && task.status !== "IN_PROGRESS") return false;
      if (filter === "flagged" && task.status !== "FLAGGED") return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const procedure = procedures[task.procedureId];
        const currentStep = getCurrentStep(task);
        return (
          task.procedureTitle.toLowerCase().includes(query) ||
          currentStep?.title.toLowerCase().includes(query) ||
          procedure?.description?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [pendingTasks, filter, searchQuery, procedures]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: pendingTasks.length,
      inProgress: pendingTasks.filter(t => t.status === "IN_PROGRESS").length,
      flagged: pendingTasks.filter(t => t.status === "FLAGGED").length,
    };
  }, [pendingTasks]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading inbox...</p>
        </div>
      </div>
    );
  }

  const handleTaskClick = (task: ActiveRun) => {
    if (isMobile && canAccessTask(task)) {
      window.location.href = `/run/${task.id}`;
    } else {
      setSelectedTask(task);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="flex h-screen">
        {/* Left: Task List - Floating Glass Sidebar */}
        <div className={`${isMobile ? "w-full" : "w-96"} flex flex-col ${isMobile && selectedTask ? "hidden" : ""} p-6`}>
          <div className="h-full rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-100 bg-white/50 backdrop-blur-sm p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">My Tasks</h1>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                {stats.total} {stats.total === 1 ? "task" : "tasks"} pending
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/90 transition-all"
            />
          </div>

          {/* Filter Tabs - iOS Segmented Control */}
          <div className="inline-flex rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm p-1 w-full">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold tracking-tight transition-all ${
                filter === "all"
                  ? "bg-white text-slate-800 shadow-md"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold tracking-tight transition-all ${
                filter === "in_progress"
                  ? "bg-white text-slate-800 shadow-md"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Active ({stats.inProgress})
            </button>
            <button
              onClick={() => setFilter("flagged")}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold tracking-tight transition-all ${
                filter === "flagged"
                  ? "bg-white text-slate-800 shadow-md"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Flagged ({stats.flagged})
            </button>
          </div>
          </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="relative mb-4 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-emerald-100/50 rounded-3xl blur-2xl" />
                <div className="relative h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <p className="mt-4 text-sm font-extrabold text-slate-900">
                {searchQuery ? "No tasks found" : "All caught up!"}
              </p>
              <p className="mt-1 text-xs text-slate-600 font-medium">
                {searchQuery ? "Try a different search term" : "No pending tasks"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task, index) => {
                const currentStep = getCurrentStep(task);
                const isSelected = selectedTask?.id === task.id;
                const isFlagged = task.status === "FLAGGED";
                const timeElapsed = getTimeElapsed(task.startedAt);
                const procedure = procedures[task.procedureId];
                const progress = procedure 
                  ? Math.round(((task.currentStepIndex + 1) / procedure.steps.length) * 100)
                  : 0;

                return (
                  <motion.button
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleTaskClick(task)}
                    className={`w-full rounded-2xl p-5 text-left transition-all touch-manipulation ${
                      isSelected
                        ? "bg-white shadow-xl border-2 border-blue-500/50"
                        : isFlagged
                        ? "bg-rose-50/50 hover:bg-rose-50/70 border border-rose-200/50"
                        : "bg-white/50 hover:bg-white/70 border border-white/60 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                          isFlagged
                            ? "bg-rose-100 text-rose-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {isFlagged ? (
                          <AlertCircle className="h-6 w-6" />
                        ) : (
                          <Clock className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate text-sm">
                            {task.procedureTitle}
                          </h3>
                          {isFlagged && (
                            <span className="flex-shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                              Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 truncate font-medium mb-2">
                          {currentStep?.title || "Step " + (task.currentStepIndex + 1)}
                        </p>
                        
                        {/* Progress Bar */}
                        {procedure && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full rounded-full ${
                                  isFlagged ? "bg-rose-500" : "bg-blue-500"
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{timeElapsed}</span>
                          </div>
                          {procedure && (
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span>
                                {task.currentStepIndex + 1} / {procedure.steps.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
          </div>
        </div>

      {/* Right: Task Preview - Floating Glass Panel */}
      <div className={`${isMobile ? "hidden" : "flex-1"} p-6`}>
        <div className="h-full rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
        {selectedTask ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-100 bg-white/50 backdrop-blur-sm p-8 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                    {selectedTask.procedureTitle}
                  </h1>
                  {selectedTask.status === "FLAGGED" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-sm font-semibold text-rose-700 border border-rose-200">
                      <AlertCircle className="h-4 w-4" />
                      Flagged - Requires Review
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Started {selectedTask.startedAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeElapsed(selectedTask.startedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    {(() => {
                      const procedure = procedures[selectedTask.procedureId];
                      return procedure 
                        ? `${selectedTask.currentStepIndex + 1} of ${procedure.steps.length} steps`
                        : "Step " + (selectedTask.currentStepIndex + 1);
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="mx-auto max-w-3xl space-y-6">
                {/* Current Step Card */}
                {(() => {
                  const currentStep = getCurrentStep(selectedTask);
                  const procedure = procedures[selectedTask.procedureId];
                  const progress = procedure 
                    ? Math.round(((selectedTask.currentStepIndex + 1) / procedure.steps.length) * 100)
                    : 0;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 p-8 shadow-lg"
                    >
                      <div className="flex items-start gap-4 mb-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                          <span className="text-xl font-bold">
                            {selectedTask.currentStepIndex + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-1">
                            {currentStep?.title || "Current Step"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Step {selectedTask.currentStepIndex + 1} of{" "}
                            {procedure?.steps.length || "?"}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      {procedure && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                            <span>Overall Progress</span>
                            <span className="font-semibold text-slate-900">{progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${
                                selectedTask.status === "FLAGGED" ? "bg-rose-500" : "bg-blue-500"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {currentStep && (
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {currentStep.description || "No description available for this step."}
                          </p>
                        </div>
                      )}

                      {selectedTask.status === "FLAGGED" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 rounded-xl border-2 border-rose-200 bg-rose-50 p-5"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-rose-900 mb-1">
                                Mismatch Detected
                              </p>
                              <p className="text-sm text-rose-700 leading-relaxed">
                                This step requires manager approval before proceeding. Please review the details and take appropriate action.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })()}

                {/* Action Button */}
                <div className="pt-6 border-t border-slate-200">
                  {canAccessTask(selectedTask) ? (
                    <Link
                      href={`/run/${selectedTask.id}`}
                      className="group inline-flex items-center gap-3 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                    >
                      <Play className="h-5 w-5" />
                      Open Task
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ) : (
                    <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-5">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-rose-600" />
                        <div>
                          <p className="text-sm font-semibold text-rose-900">Access Denied</p>
                          <p className="text-sm text-rose-700 mt-0.5">
                            This task is not assigned to you or your team.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
                <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                  <Mail className="h-10 w-10 text-slate-400" />
                </div>
              </div>
              <p className="mt-4 text-xl font-extrabold text-slate-900">Select a task</p>
              <p className="mt-2 text-sm text-slate-600 font-medium max-w-sm">
                Choose a task from the list to view details and get started
              </p>
            </motion.div>
          </div>
        )}
        </div>
      </div>
      </div>
    </div>
  );
}
