"use client";

import { useEffect, useState, use } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc, serverTimestamp, Timestamp, collection, addDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ActiveRun, Procedure, AtomicStep, ATOMIC_ACTION_METADATA, UserProfile } from "@/types/schema";
import { ArrowLeft, CheckCircle2, XCircle, Flag, Loader2, AlertTriangle, Clock, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  validateInput,
  getContextValue,
  setContextValue,
  RunContext,
} from "@/lib/engine";
import { resolveConfig, ResolvedConfig } from "@/lib/engine/resolver";
import { TaskRenderer } from "@/components/run/task-renderer";
import { TaskChat } from "@/components/run/task-chat";
import { ContextPanel } from "@/components/run/context-panel";
import { generateRunCertificate, exportRunToCSV } from "@/lib/exporter";
import { AddToCalendarButton } from "@/components/run/add-to-calendar-button";
import { isAutoStep, isHumanStep } from "@/lib/constants";

export default function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [run, setRun] = useState<ActiveRun | null>(null);
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepOutput, setStepOutput] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [runContext, setRunContext] = useState<RunContext>({});
  const [processing, setProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<string>("0m");
  const [stepKey, setStepKey] = useState(0); // For animation key
  const [isMobile, setIsMobile] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);

  // Fetch ActiveRun
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "active_runs", id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setRun({
            id: snapshot.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            logs: (data.logs || []).map((log: any) => ({
              ...log,
              timestamp: log.timestamp?.toDate() || new Date(),
            })),
          } as ActiveRun);
          
          if (data.procedureId) {
            const procUnsubscribe = onSnapshot(
              doc(db, "procedures", data.procedureId),
              (procSnapshot) => {
                if (procSnapshot.exists()) {
                  const procData = procSnapshot.data();
                  setProcedure({
                    id: procSnapshot.id,
                    ...procData,
                    createdAt: procData.createdAt?.toDate() || new Date(),
                    updatedAt: procData.updatedAt?.toDate() || new Date(),
                    steps: procData.steps || [],
                  } as Procedure);
                }
                setLoading(false);
              },
              (err) => {
                console.error("Error fetching procedure:", err);
                setError(err.message);
                setLoading(false);
              }
            );
            return () => procUnsubscribe();
          } else {
            setLoading(false);
          }
        } else {
          setError("Run not found");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching run:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Calculate time elapsed
  useEffect(() => {
    if (!run?.startedAt) return;

    const updateTime = () => {
      const elapsed = Date.now() - run.startedAt.getTime();
      const minutes = Math.floor(elapsed / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        setTimeElapsed(`${hours}h ${minutes % 60}m`);
      } else {
        setTimeElapsed(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [run?.startedAt]);

  // Update step key when step changes (for animation)
  useEffect(() => {
    if (run && procedure) {
      setStepKey(run.currentStepIndex);
    }
  }, [run?.currentStepIndex, procedure]);

  // Get current user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            id: userDoc.id,
            uid: user.uid,
            email: data.email || user.email || "",
            displayName: data.displayName || user.displayName || user.email?.split("@")[0] || "User",
            photoURL: data.photoURL || user.photoURL || undefined,
            jobTitle: data.jobTitle || undefined,
            role: data.role || "OPERATOR",
            teamIds: data.teamIds || [],
            organizationId: data.organizationId || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserProfile);
        } else {
          // Fallback to auth user data
          setUserProfile({
            id: user.uid,
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            photoURL: user.photoURL || undefined,
            role: "OPERATOR",
            teamIds: [],
            organizationId: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as UserProfile);
        }
      } else {
        setUserId(null);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const currentStep: AtomicStep | null = procedure && run
    ? procedure.steps[run.currentStepIndex]
    : null;

  // Resolve config variables at runtime
  const resolvedConfig: ResolvedConfig | null = currentStep && run && procedure
    ? resolveConfig(currentStep.config, run.logs || [], procedure.steps, run.triggerContext)
    : null;

  const resolvedStep: AtomicStep | null = currentStep && resolvedConfig
    ? {
        ...currentStep,
        config: resolvedConfig, // Use resolved config directly
      }
    : currentStep;

  // Build Run Context
  // Supports both flat and nested access patterns:
  // - Flat: step_1_output, step_1_output.email
  // - Nested: step_1.output.email, step_1.output
  useEffect(() => {
    if (!run || !procedure) return;
    
    const context: RunContext = {};
    run.logs?.forEach((log, index) => {
      const step = procedure.steps[index];
      if (step) {
        const stepIndex = index + 1;
        const varName = step.config.outputVariableName || `step_${stepIndex}_output`;
        
        // Flat access pattern: step_1_output
        context[varName] = log.output;
        context[`step_${stepIndex}_output`] = log.output;
        
        // Nested access pattern: step_1.output (for dot notation like {{step_1.output.email}})
        context[`step_${stepIndex}`] = {
          output: log.output,
        };
        
        // Also support custom variable names in nested format
        if (varName !== `step_${stepIndex}_output`) {
          const baseName = varName.replace(/_output$/, '');
          context[baseName] = {
            output: log.output,
          };
        }
        
        // Flat access for nested properties: step_1_output.email
        if (log.output && typeof log.output === "object" && !Array.isArray(log.output)) {
          Object.keys(log.output).forEach((key) => {
            context[`${varName}.${key}`] = log.output[key];
          });
        }
      }
    });
    
    setRunContext(context);
  }, [run, procedure]);

  useEffect(() => {
    if (run?.status === "COMPLETED") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [run?.status]);

  // Auto-execute AUTO steps when run is loaded
  useEffect(() => {
    if (!run || !procedure || !userId || submitting) return;
    
    const currentStep = procedure.steps[run.currentStepIndex];
    if (!currentStep) return;

    // Check if current step is AUTO and run is IN_PROGRESS
    if (isAutoStep(currentStep.action) && run.status === "IN_PROGRESS") {
      // Auto-execute the step
      const autoExecute = async () => {
        try {
          const orgId = run.organizationId || "";
          if (!orgId) return;

          const executeResponse = await fetch("/api/runs/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runId: run.id,
              stepId: currentStep.id,
              output: {},
              outcome: "SUCCESS",
              orgId,
              userId,
            }),
          });

          if (executeResponse.ok) {
            const result = await executeResponse.json();
            // If should continue, the API will handle the next step
            // The run will be updated via onSnapshot
          }
        } catch (error) {
          console.error("Error auto-executing step:", error);
        }
      };

      // Small delay to ensure run is fully loaded
      const timeout = setTimeout(autoExecute, 1000);
      return () => clearTimeout(timeout);
    }
  }, [run?.id, run?.currentStepIndex, run?.status, procedure?.steps, userId, submitting]);

  const handleCompleteStep = async (outcome: "SUCCESS" | "FAILURE" | "FLAGGED", autoFlagged = false) => {
    if (!run || !procedure || !currentStep) return;

    if (currentStep.action === "INPUT" && currentStep.config.inputType) {
      const validation = validateInput(stepOutput, currentStep.config);
      if (!validation.valid) {
        setValidationError(validation.error || "Validation failed");
        return;
      }
    }

    setSubmitting(true);
    try {
      // Use new execution API for proper Human/Auto step handling
      const orgId = run.organizationId || "";
      if (orgId && userId) {
        try {
          const executeResponse = await fetch("/api/runs/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runId: run.id,
              stepId: currentStep.id,
              output: stepOutput,
              outcome,
              orgId,
              userId,
            }),
          });

          if (executeResponse.ok) {
            const result = await executeResponse.json();
            // If it's an AUTO step and should continue, recursively execute next AUTO steps
            if (result.shouldContinue && result.nextStepId && isAutoStep(currentStep.action)) {
              // Auto-execute next AUTO step
              setTimeout(async () => {
                const nextStep = procedure.steps.find(s => s.id === result.nextStepId);
                if (nextStep && isAutoStep(nextStep.action)) {
                  await handleCompleteStep("SUCCESS", true);
                }
              }, 500);
            }
            setSubmitting(false);
            return; // Execution API handled everything
          }
        } catch (apiError) {
          console.error("Error calling execution API, falling back to client-side logic:", apiError);
          // Fall through to client-side logic
        }
      }

      // Fallback: Original client-side execution logic (for backward compatibility)
      const outputVariableName = currentStep.config.outputVariableName || `step_${run.currentStepIndex + 1}_output`;
      const updatedContext = setContextValue(runContext, outputVariableName, stepOutput);

      const newLog = {
        stepId: currentStep.id,
        stepTitle: currentStep.title,
        action: currentStep.action,
        output: stepOutput,
        timestamp: Timestamp.now(),
        outcome,
      };

      const updatedLogs = [...(run.logs || []), newLog];
      let nextStepIndex = run.currentStepIndex + 1;
      let newStatus: ActiveRun["status"] = "IN_PROGRESS";

      // Smart Router: Check routes for non-linear flow
      if (currentStep.routes) {
        const routes = currentStep.routes;
        let targetStepId: string | "COMPLETED" | undefined;

        if (outcome === "SUCCESS" && routes.onSuccessStepId) {
          targetStepId = routes.onSuccessStepId;
        } else if ((outcome === "FAILURE" || outcome === "FLAGGED") && routes.onFailureStepId) {
          targetStepId = routes.onFailureStepId;
        } else if (routes.conditions && routes.conditions.length > 0) {
          for (const condition of routes.conditions) {
            const variableValue = getContextValue(updatedContext, condition.variable);
            if (variableValue === undefined) continue;

            let conditionMet = false;
            const { operator, value } = condition;
            const compareValue = typeof value === "string" && !isNaN(Number(value)) ? Number(value) : value;
            const varValue = typeof variableValue === "string" && !isNaN(Number(variableValue)) ? Number(variableValue) : variableValue;

            switch (operator) {
              case ">": conditionMet = Number(varValue) > Number(compareValue); break;
              case "<": conditionMet = Number(varValue) < Number(compareValue); break;
              case ">=": conditionMet = Number(varValue) >= Number(compareValue); break;
              case "<=": conditionMet = Number(varValue) <= Number(compareValue); break;
              case "==": conditionMet = String(varValue) === String(compareValue); break;
              case "!=": conditionMet = String(varValue) !== String(compareValue); break;
              case "contains": conditionMet = String(varValue).includes(String(compareValue)); break;
              case "startsWith": conditionMet = String(varValue).startsWith(String(compareValue)); break;
              case "endsWith": conditionMet = String(varValue).endsWith(String(compareValue)); break;
            }

            if (conditionMet) {
              targetStepId = condition.targetStepId;
              break;
            }
          }
        }

        if (!targetStepId && routes.defaultNextStepId) {
          targetStepId = routes.defaultNextStepId;
        }

        if (targetStepId) {
          if (targetStepId === "COMPLETED") {
            newStatus = "COMPLETED";
            nextStepIndex = run.currentStepIndex;
          } else {
            const targetStepIndex = procedure.steps.findIndex((s) => s.id === targetStepId);
            if (targetStepIndex !== -1) {
              nextStepIndex = targetStepIndex;
            } else {
              nextStepIndex = run.currentStepIndex + 1;
            }
          }
        } else {
          nextStepIndex = run.currentStepIndex + 1;
        }
      }

      if (outcome === "FLAGGED" || autoFlagged) {
        newStatus = "FLAGGED";
        if (!currentStep.routes?.onFailureStepId) {
          nextStepIndex = run.currentStepIndex;
        }
      } else if (nextStepIndex >= procedure.steps.length) {
        newStatus = "COMPLETED";
      }

      // Helper function to remove undefined values from object
      const removeUndefined = (obj: any): any => {
        const cleaned: any = {};
        for (const key in obj) {
          if (obj[key] !== undefined) {
            cleaned[key] = obj[key];
          }
        }
        return cleaned;
      };

      const updateData: any = {
        currentStepIndex: newStatus === "COMPLETED" ? run.currentStepIndex : nextStepIndex,
        status: newStatus,
        logs: updatedLogs,
      };

      if (newStatus === "COMPLETED") {
        updateData.completedAt = serverTimestamp();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      // Handoff Logic: Assign next step based on assignment config
      if (newStatus !== "COMPLETED" && nextStepIndex < procedure.steps.length) {
        const nextStep = procedure.steps[nextStepIndex];
        const assignment = nextStep.assignment || 
          (nextStep.assigneeType ? {
            type: nextStep.assigneeType === "TEAM" ? "TEAM_QUEUE" : nextStep.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
            assigneeId: nextStep.assigneeId,
          } : null);

        if (assignment) {
          if (assignment.type === "STARTER") {
            // Assign to the person who started the run
            const starterId = run.startedBy || userId;
            if (starterId) {
              updateData.currentAssigneeId = starterId;
              updateData.assigneeType = "USER";
              updateData.status = "IN_PROGRESS";
            }
          } else if (assignment.type === "SPECIFIC_USER" && assignment.assigneeId) {
            // Assign to specific user
            updateData.currentAssigneeId = assignment.assigneeId;
            updateData.assigneeType = "USER";
            updateData.status = "IN_PROGRESS";
          } else if (assignment.type === "TEAM_QUEUE" && assignment.assigneeId) {
            // Assign to team queue (any member can claim)
            updateData.currentAssigneeId = assignment.assigneeId;
            updateData.assigneeType = "TEAM";
            updateData.status = "OPEN_FOR_CLAIM"; // New status for team queue
          }
        } else {
          // No assignment - default to starter
          const starterId = run.startedBy || userId;
          if (starterId) {
            updateData.currentAssigneeId = starterId;
            updateData.assigneeType = "USER";
          }
        }
      }

      // Remove any undefined values before updating
      const cleanedUpdateData = removeUndefined(updateData);
      await updateDoc(doc(db, "active_runs", run.id), cleanedUpdateData);

      // Create notifications for assignment
      if ((newStatus === "IN_PROGRESS" || newStatus === "OPEN_FOR_CLAIM") && nextStepIndex < procedure.steps.length) {
        const nextStep = procedure.steps[nextStepIndex];
        const assignment = nextStep.assignment || 
          (nextStep.assigneeType ? {
            type: nextStep.assigneeType === "TEAM" ? "TEAM_QUEUE" : nextStep.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
            assigneeId: nextStep.assigneeId,
          } : null);

        if (assignment && assignment.type === "SPECIFIC_USER" && assignment.assigneeId && userProfile) {
          // Notify specific user
          try {
            const notificationData: any = {
              recipientId: assignment.assigneeId,
              triggerBy: {
                userId: userId || "",
                name: userProfile.displayName,
              },
              type: "ASSIGNMENT",
              title: `New Task Assigned: ${nextStep.title}`,
              message: `A new task "${nextStep.title}" has been assigned to you.`,
              link: `/run/${run.id}`,
              isRead: false,
              createdAt: serverTimestamp(),
              runId: run.id,
              stepId: nextStep.id,
            };

            // Only add avatar if it exists
            if (userProfile.photoURL) {
              notificationData.triggerBy.avatar = userProfile.photoURL;
            }

            await addDoc(collection(db, "notifications"), notificationData);
          } catch (error) {
            console.error("Error creating notification:", error);
          }
        } else if (assignment && assignment.type === "TEAM_QUEUE" && assignment.assigneeId) {
          // Notify all team members (would need to fetch team members)
          // For MVP, we'll skip team notifications for now
          console.log("Team queue assignment - notifications to team members would go here");
        }
      }

      if (newStatus === "COMPLETED" && userProfile) {
        try {
          const notificationData: any = {
            recipientId: userId || "",
            triggerBy: {
              userId: userId || "",
              name: userProfile.displayName,
            },
            type: "COMPLETION",
            title: `Process Completed: ${run.procedureTitle}`,
            message: `The process "${run.procedureTitle}" has been completed successfully.`,
            link: `/run/${run.id}`,
            isRead: false,
            createdAt: serverTimestamp(),
            runId: run.id,
          };

          // Only add avatar if it exists
          if (userProfile.photoURL) {
            notificationData.triggerBy.avatar = userProfile.photoURL;
          }

          await addDoc(collection(db, "notifications"), notificationData);
        } catch (error) {
          console.error("Error creating completion notification:", error);
        }
      }

      setStepOutput(null);
      setValidationError(null);
      setRunContext(updatedContext);
    } catch (error) {
      console.error("Error completing step:", error);
      alert("Failed to complete step. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm font-medium text-slate-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !run || !procedure) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <XCircle className="mx-auto h-16 w-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-sm text-slate-600 mb-6">{error || "Run or procedure not found"}</p>
          <button
            onClick={() => router.push("/inbox")}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inbox
          </button>
        </div>
      </div>
    );
  }

  const progress = procedure.steps.length > 0
    ? ((run.currentStepIndex + 1) / procedure.steps.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={typeof window !== "undefined" ? window.innerWidth : 0}
          height={typeof window !== "undefined" ? window.innerHeight : 0}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Premium Header - Zen Mode */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className={`${isMobile ? "mx-auto max-w-2xl" : ""} px-6 py-5`}>
          <div className="flex items-center justify-between mb-4">
            {/* Back Button */}
            <button
              onClick={() => router.push("/inbox")}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100/80 transition-all"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Process Name - Center */}
            <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-none">
              {run.procedureTitle}
            </h1>

            {/* Time Elapsed */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">{timeElapsed}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step {run.currentStepIndex + 1} of {procedure.steps.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-full shadow-sm"
              />
            </div>
          </div>

          {/* Status Badge */}
          {run.status === "FLAGGED" && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700">
              <Flag className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Flagged - Requires Approval</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Split View (Desktop) or Stacked (Mobile) */}
      <main className={`${isMobile ? "px-0" : "grid grid-cols-[35%_65%] gap-0 h-[calc(100vh-120px)]"} pb-32 md:pb-0`}>
        {/* Left Panel: Context/History (Desktop) */}
        {!isMobile && run && procedure && (
          <div className="border-r border-slate-200 bg-white overflow-hidden">
            <ContextPanel run={run} procedure={procedure} />
          </div>
        )}

        {/* Right Panel: Active Task (Desktop) or Full Width (Mobile) */}
        <div className={`${isMobile ? "px-6 py-12" : "overflow-y-auto px-8 py-12"} ${!isMobile ? "sticky top-0" : ""}`}>
        {run.status === "COMPLETED" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-green-400 rounded-full blur-3xl opacity-30 animate-pulse" />
              <CheckCircle2 className="relative h-32 w-32 text-green-500 mx-auto" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">All Done! 🎉</h2>
            <p className="text-xl text-slate-600 max-w-md mb-12 font-medium">
              You've successfully completed all steps. Great work!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={async () => {
                  try {
                    await generateRunCertificate(run, procedure, "User", "Organization");
                  } catch (error) {
                    console.error("Error generating PDF:", error);
                    alert("Failed to generate PDF. Please try again.");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-xl"
              >
                <FileText className="h-5 w-5" strokeWidth={2} />
                Download Certificate
              </button>
              <button
                onClick={() => router.push("/inbox")}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all hover:scale-105 hover:bg-slate-50"
              >
                Return to Inbox
              </button>
            </div>
          </motion.div>
        ) : currentStep ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Step Header - Hero */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white text-3xl font-bold shadow-xl shadow-blue-500/30"
                >
                  {run.currentStepIndex + 1}
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                  {currentStep.title}
                </h1>
                <div className="flex items-center justify-center">
                  <AddToCalendarButton
                    title={currentStep.title}
                    description={currentStep.description || ATOMIC_ACTION_METADATA[currentStep.action].description}
                    startTime={run.startedAt ? new Date(run.startedAt.getTime() + (run.currentStepIndex * 60 * 60 * 1000)) : new Date()}
                    duration={60}
                  />
                </div>
                <p className="text-lg text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
                  {currentStep.description || ATOMIC_ACTION_METADATA[currentStep.action].description}
                </p>
              </div>

              {/* Task Card - Premium */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/5 p-8 md:p-12"
              >
                {/* Task Renderer */}
                <div className="mb-8">
                  <TaskRenderer
                    step={resolvedStep || currentStep}
                    output={stepOutput}
                    setOutput={setStepOutput}
                    runContext={runContext}
                    setProcessing={setProcessing}
                    setValidationError={setValidationError}
                    validationError={validationError}
                    run={run}
                    procedure={procedure}
                    handleCompleteStep={handleCompleteStep}
                    submitting={submitting}
                    runId={run?.id}
                    resolvedConfig={resolvedConfig}
                  />
                </div>

                {/* Validation Error */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 rounded-2xl border-2 border-rose-200 bg-rose-50/80 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" strokeWidth={2} />
                        <span className="text-sm font-semibold text-rose-700">{validationError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons - Desktop */}
                {currentStep.action !== "COMPARE" && currentStep.action !== "VALIDATE" && currentStep.action !== "GATEWAY" && currentStep.action !== "AUTHORIZE" && !currentStep.config.isAiAutomated && (
                  <div className="hidden md:flex flex-col gap-3 pt-6 border-t border-slate-200/80">
                    <motion.button
                      onClick={() => handleCompleteStep("SUCCESS")}
                      disabled={
                        submitting || 
                        processing || 
                        !!validationError || 
                        run?.status === "FLAGGED" ||
                        (currentStep.action === "INPUT" && currentStep.config.required && !stepOutput?.trim()) ||
                        (currentStep.action === "IMPORT" && !stepOutput?.downloadUrl)
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-5 text-lg font-bold text-white shadow-xl shadow-slate-900/30 transition-all hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                          Processing...
                        </span>
                      ) : (
                        "Complete & Continue →"
                      )}
                    </motion.button>
                  </div>
                )}

                {/* Flagged Status Warning */}
                {run?.status === "FLAGGED" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 rounded-2xl border-2 border-rose-300 bg-rose-50/80 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <div className="flex-1">
                        <p className="text-base font-bold text-rose-900 mb-2">
                          {currentStep?.action === "GOOGLE_SHEET_APPEND" || 
                           currentStep?.config?.isAiAutomated ||
                           currentStep?.action === "TRANSMIT" ||
                           currentStep?.action === "STORE"
                            ? "Process Paused - System Error"
                            : "Task Flagged"}
                        </p>
                        <p className="text-sm text-rose-700 leading-relaxed font-medium mb-3">
                          {currentStep?.action === "GOOGLE_SHEET_APPEND" || 
                           currentStep?.config?.isAiAutomated ||
                           currentStep?.action === "TRANSMIT" ||
                           currentStep?.action === "STORE"
                            ? "An issue occurred during automatic execution. The admin has been notified and will resolve this issue."
                            : "This task has been flagged and requires manager approval to continue."}
                        </p>
                        {(run as any)?.errorDetail && (
                          <div className="mt-3 rounded-lg bg-rose-100/50 border border-rose-200 p-3">
                            <p className="text-xs font-semibold text-rose-800 mb-1">Error Details:</p>
                            <p className="text-xs text-rose-700 font-mono break-all">
                              {(run as any).errorDetail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-12 text-center shadow-xl">
            <p className="text-slate-600 font-medium">No steps found in this procedure.</p>
          </div>
        )}
        </div>

        {/* Mobile: Context Panel (Bottom Sheet) */}
        {isMobile && run && procedure && (
          <ContextPanel
            run={run}
            procedure={procedure}
            isMobile={true}
            isExpanded={contextExpanded}
            onToggle={() => setContextExpanded(!contextExpanded)}
          />
        )}
      </main>

      {/* Mobile Sticky Button */}
      {currentStep && currentStep.action !== "COMPARE" && currentStep.action !== "VALIDATE" && currentStep.action !== "GATEWAY" && currentStep.action !== "AUTHORIZE" && !currentStep.config.isAiAutomated && run.status !== "COMPLETED" && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 p-4 shadow-2xl safe-area-inset-bottom">
          <motion.button
            onClick={() => handleCompleteStep("SUCCESS")}
            disabled={
              submitting || 
              processing || 
              !!validationError || 
              run?.status === "FLAGGED" ||
              (currentStep.action === "INPUT" && currentStep.config.required && !stepOutput?.trim()) ||
              (currentStep.action === "IMPORT" && !stepOutput?.downloadUrl)
            }
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-lg font-bold text-white shadow-xl shadow-slate-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                Processing...
              </span>
            ) : (
              "Complete & Continue →"
            )}
          </motion.button>
        </div>
      )}

      {/* Task Chat - Floating Button */}
      {currentStep && userId && userProfile && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-40">
          <TaskChat
            runId={run.id}
            currentStepId={currentStep.id}
            userId={userId}
            userName={userProfile.displayName}
            userAvatar={userProfile.photoURL}
            userEmail={userProfile.email}
          />
        </div>
      )}
    </div>
  );
}
