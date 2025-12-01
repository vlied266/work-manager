"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Workflow, 
  Users, 
  Play, 
  CheckCircle2, 
  ArrowRight,
  UserPlus,
  X,
  Save
} from "lucide-react";
import { useProcesses } from "@/hooks/use-processes";
import { useOrganizationUsers } from "@/hooks/use-organization-users";
import { useAuth } from "@/hooks/use-auth";
import { ProcessDefinition, Procedure, ProcedureAssignment, ActiveRun } from "@/types/workos";
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface ProcedureWithDetails extends Procedure {
  order: number;
  assignedUserId?: string;
}

export default function ManagerDashboard() {
  const { profile, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { processes, loading: processesLoading } = useProcesses();
  const { users } = useOrganizationUsers();

  const [selectedProcess, setSelectedProcess] = useState<ProcessDefinition | null>(null);
  const [proceduresWithDetails, setProceduresWithDetails] = useState<ProcedureWithDetails[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProcedureDetails = async () => {
      if (!selectedProcess) {
        setProceduresWithDetails([]);
        return;
      }

      // Validate procedures array exists and is valid
      if (!selectedProcess.procedures || !Array.isArray(selectedProcess.procedures) || selectedProcess.procedures.length === 0) {
        console.warn("No procedures found in selected process:", selectedProcess);
        setProceduresWithDetails([]);
        return;
      }

      const details = await Promise.all(
        selectedProcess.procedures
          .filter((ref) => {
            // Filter out invalid references
            if (!ref || typeof ref !== "object") {
              console.warn("Invalid procedure reference (not an object):", ref);
              return false;
            }
            // Support both 'procedureId' and 'id' fields for backward compatibility
            const refObj = ref as Record<string, unknown>;
            const procedureId = (refObj.procedureId as string) || (refObj.id as string);
            if (!procedureId || typeof procedureId !== "string") {
              console.warn("Invalid procedure reference (missing procedureId/id):", ref);
              return false;
            }
            return true;
          })
          .map(async (ref) => {
            try {
              // Support both 'procedureId' and 'id' fields
              const refObj = ref as Record<string, unknown>;
              const procedureId = (refObj.procedureId as string) || (refObj.id as string);
              const procDoc = await getDoc(doc(db, "procedures", procedureId));
              if (!procDoc.exists()) {
                console.warn(`Procedure ${procedureId} not found in Firestore`);
                return null;
              }
              const procData = procDoc.data() as Procedure;
              return {
                id: procDoc.id,
                ...procData,
                order: typeof refObj.order === "number" ? refObj.order : 0,
              } as ProcedureWithDetails;
            } catch (err) {
              const refObj = ref as Record<string, unknown>;
              const procedureId = (refObj.procedureId as string) || (refObj.id as string);
              console.error(`Error loading procedure ${procedureId}:`, err);
              return null;
            }
          })
      );

      const validDetails = details.filter((d): d is ProcedureWithDetails => d !== null);
      setProceduresWithDetails(validDetails);
    };

    loadProcedureDetails();
  }, [selectedProcess]);

  const handleAssignUser = (procedureId: string, userId: string) => {
    setProceduresWithDetails((prev) =>
      prev.map((proc) =>
        proc.id === procedureId ? { ...proc, assignedUserId: userId } : proc
      )
    );
  };

  const handleRemoveAssignment = (procedureId: string) => {
    setProceduresWithDetails((prev) =>
      prev.map((proc) =>
        proc.id === procedureId ? { ...proc, assignedUserId: undefined } : proc
      )
    );
  };

  const handleLaunchProcess = async () => {
    if (!selectedProcess || !firebaseUser || !profile?.organizationId) {
      setError("Missing required data.");
      return;
    }

    // Validate all procedures are assigned
    const unassigned = proceduresWithDetails.filter((p) => !p.assignedUserId);
    if (unassigned.length > 0) {
      setError(`Please assign users to all procedures. ${unassigned.length} procedure(s) are unassigned.`);
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      // Create procedure assignments
      const assignments: ProcedureAssignment[] = proceduresWithDetails.map((proc) => ({
        procedureId: proc.id,
        procedureName: proc.name,
        assignedToUserId: proc.assignedUserId!,
        order: proc.order,
        completed: false,
      }));

      // Validate we have procedures
      if (proceduresWithDetails.length === 0) {
        throw new Error("No procedures found. Please ensure all procedures are loaded.");
      }

      // Get the first procedure to start with
      const sortedProcedures = proceduresWithDetails.sort((a, b) => a.order - b.order);
      const firstProcedure = sortedProcedures[0];

      if (!firstProcedure) {
        throw new Error("Could not determine first procedure.");
      }

      // Create flattened steps with procedure labels
      const allSteps = sortedProcedures
        .flatMap((proc) =>
          (proc.steps || []).map((step) => ({
            ...step,
            procedureLabel: proc.name,
            procedureSourceId: proc.id,
          }))
        );

      if (allSteps.length === 0) {
        throw new Error("No steps found in procedures. Please ensure procedures have steps defined.");
      }

      // Create active run
      const newRun: Omit<ActiveRun, "id"> = {
        organizationId: profile.organizationId,
        procedureId: `process:${selectedProcess.id}`,
        processId: selectedProcess.id,
        processName: selectedProcess.name,
        procedureName: selectedProcess.name,
        procedureSnapshot: {
          id: `process:${selectedProcess.id}`,
          organizationId: profile.organizationId,
          teamId: firstProcedure.teamId || "",
          name: selectedProcess.name,
          description: selectedProcess.description || "",
          steps: allSteps,
          updatedAt: serverTimestamp(),
          createdBy: firebaseUser.uid,
        },
        startedBy: firebaseUser.uid,
        status: "IN_PROGRESS",
        currentStepIndex: 0,
        currentProcedureIndex: 0,
        procedureAssignments: assignments,
        logs: [],
        startedAt: serverTimestamp(),
      };

      const runRef = await addDoc(collection(db, "active_runs"), newRun);
      setSuccess("Process launched successfully!");
      
      setTimeout(() => {
        router.push(`/run/${runRef.id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setAssigning(false);
    }
  };

  const handleSelectProcess = (process: ProcessDefinition) => {
    setSelectedProcess(process);
    setError(null);
    setSuccess(null);
  };

  const handleClearSelection = () => {
    setSelectedProcess(null);
    setProceduresWithDetails([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Manager Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Process Assignment Center</h1>
        <p className="text-muted">
          Select a process, assign procedures to users, and launch the workflow.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Process Selection */}
        <section className="space-y-6 rounded-3xl bg-white/80 p-6 shadow-subtle ring-1 ring-white/60 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-muted">
            <Workflow className="h-5 w-5 text-accent" />
            <p className="text-xs uppercase tracking-[0.4em]">Available Processes</p>
          </div>

          {processesLoading ? (
            <div className="rounded-2xl border border-ink/10 bg-base/60 p-6 text-center text-muted">
              Loading processes...
            </div>
          ) : processes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/10 px-6 py-10 text-center text-muted">
              No processes defined yet. Create one in Process Builder.
            </div>
          ) : (
            <div className="space-y-3">
              {processes.map((process) => (
                <button
                  key={process.id}
                  onClick={() => handleSelectProcess(process)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                    selectedProcess?.id === process.id
                      ? "border-[#007AFF] bg-[#007AFF]/10 shadow-md"
                      : "border-ink/20 bg-white/80 hover:border-[#007AFF]/40 hover:bg-[#007AFF]/5"
                  }`}
                >
                  <h3 className="font-semibold text-ink">{process.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {process.procedures.length} procedure(s)
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Procedure Assignment */}
        <section className="space-y-6 rounded-3xl bg-white/80 p-6 shadow-subtle ring-1 ring-white/60 backdrop-blur-xl">
          {!selectedProcess ? (
            <div className="rounded-2xl border border-dashed border-ink/10 px-6 py-20 text-center text-muted">
              <Workflow className="mx-auto h-12 w-12 text-muted/50" />
              <p className="mt-4 text-sm">Select a process from the left to assign procedures</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 text-muted">
                    <Users className="h-5 w-5 text-accent" />
                    <p className="text-xs uppercase tracking-[0.4em]">Assign Procedures</p>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{selectedProcess.name}</h2>
                  <p className="text-sm text-muted">{selectedProcess.description}</p>
                </div>
                <button
                  onClick={handleClearSelection}
                  className="rounded-2xl border-2 border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-all hover:border-ink/40 hover:bg-ink/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {proceduresWithDetails.length === 0 ? (
                <div className="rounded-2xl border border-ink/10 bg-base/60 p-6 text-center text-muted">
                  Loading procedure details...
                </div>
              ) : (
                <div className="space-y-4">
                  {proceduresWithDetails
                    .sort((a, b) => a.order - b.order)
                    .map((proc, index) => (
                      <motion.div
                        key={proc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-subtle"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007AFF]/10 text-sm font-semibold text-[#007AFF]">
                                {index + 1}
                              </span>
                              <div>
                                <h3 className="font-semibold text-ink">{proc.name}</h3>
                                <p className="text-sm text-muted">{proc.description}</p>
                                <p className="mt-1 text-xs text-muted">
                                  {proc.steps.length} step(s)
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {proc.assignedUserId ? (
                              <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2">
                                <span className="text-sm font-semibold text-emerald-700">
                                  {users.find((u) => u.uid === proc.assignedUserId)?.displayName || "Unknown"}
                                </span>
                                <button
                                  onClick={() => handleRemoveAssignment(proc.id)}
                                  className="rounded-full bg-emerald-200 p-1 text-emerald-700 hover:bg-emerald-300"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignUser(proc.id, e.target.value);
                                  }
                                }}
                                className="rounded-2xl border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink outline-none transition-all hover:border-[#007AFF]/40 focus:border-[#007AFF]"
                              >
                                <option value="">Assign user...</option>
                                {users.map((user) => (
                                  <option key={user.uid} value={user.uid}>
                                    {user.displayName} ({user.email})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleLaunchProcess}
                  disabled={assigning || proceduresWithDetails.some((p) => !p.assignedUserId)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#007AFF] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#007AFF]/30 transition-all hover:bg-[#0051D5] hover:shadow-xl hover:shadow-[#007AFF]/40 disabled:opacity-50 disabled:hover:shadow-lg"
                >
                  {assigning ? (
                    <>
                      <Save className="h-4 w-4 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Launch Process
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

