"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun, AtomicStep } from "@/types/schema";
import { 
  Target, Clock, CheckCircle2, AlertCircle, 
  Play, Pause, RotateCcw, ArrowRight, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function FocusPage() {
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<ActiveRun | null>(null);
  const [currentStep, setCurrentStep] = useState<AtomicStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Fetch active runs assigned to current user
    // Note: Removed orderBy to avoid index requirement - will sort client-side
    const runsQuery = query(
      collection(db, "active_runs"),
      where("organizationId", "==", organizationId),
      where("status", "in", ["IN_PROGRESS", "OPEN_FOR_CLAIM"])
    );

    const unsubscribe = onSnapshot(runsQuery, (snapshot) => {
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

      // Sort by createdAt descending (client-side)
      const sortedRuns = runs.sort((a, b) => {
        const aTime = a.startedAt?.getTime() || 0;
        const bTime = b.startedAt?.getTime() || 0;
        return bTime - aTime;
      }).slice(0, 10); // Limit to 10 most recent

      setActiveRuns(sortedRuns);
      
      // Auto-select first run if none selected
      if (!selectedRun && runs.length > 0) {
        setSelectedRun(runs[0]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId, selectedRun]);

  useEffect(() => {
    if (selectedRun && selectedRun.currentStepIndex !== undefined) {
      const step = selectedRun.procedureSteps[selectedRun.currentStepIndex];
      setCurrentStep(step || null);
    }
  }, [selectedRun]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading focus mode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="relative z-10 p-6 md:p-8">
        <div className="mx-auto max-w-[1800px]">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                  Focus Mode
                </h1>
                <p className="text-slate-500">
                  Eliminate distractions. Focus on what matters.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg hover:bg-white/90 transition-all"
              >
                <X className="h-4 w-4" />
                Exit Focus
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Task List */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 rounded-[2.5rem] p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Active Tasks</h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {activeRuns.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-500">No active tasks</p>
                      </div>
                    ) : (
                      activeRuns.map((run) => (
                        <motion.button
                          key={run.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          onClick={() => setSelectedRun(run)}
                          className={`w-full text-left p-4 rounded-2xl transition-all ${
                            selectedRun?.id === run.id
                              ? "bg-slate-900 text-white shadow-lg"
                              : "bg-white/50 hover:bg-white/80 border border-slate-100"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm mb-1">
                                {run.procedureName || "Untitled Procedure"}
                              </h3>
                              <p className="text-xs opacity-70">
                                Step {run.currentStepIndex !== undefined ? run.currentStepIndex + 1 : 0} of {run.procedureSteps?.length || 0}
                              </p>
                            </div>
                            {run.status === "IN_PROGRESS" && (
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            )}
                          </div>
                        </motion.button>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Main Content - Focus Area */}
            <div className="lg:col-span-2">
              {selectedRun && currentStep ? (
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 rounded-[2.5rem] p-8">
                  {/* Timer */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-slate-800">Focus Timer</h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsRunning(!isRunning)}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                          {isRunning ? (
                            <>
                              <Pause className="h-4 w-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Start
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setTimer(0);
                            setIsRunning(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-white/50 border border-slate-200 hover:bg-white/80 transition-all"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-center py-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
                      <div className="text-6xl font-bold text-slate-900 font-mono">
                        {formatTime(timer)}
                      </div>
                    </div>
                  </div>

                  {/* Current Step */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-bold text-slate-800">Current Task</h3>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900 mb-2">
                            {currentStep.title || "Untitled Step"}
                          </h4>
                          <p className="text-slate-600 text-sm">
                            {currentStep.description || "No description"}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {currentStep.action}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/run/${selectedRun.id}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-semibold"
                  >
                    Open Task
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 rounded-[2.5rem] p-12 text-center">
                  <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Task Selected</h3>
                  <p className="text-slate-500">
                    Select a task from the sidebar to start focusing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

