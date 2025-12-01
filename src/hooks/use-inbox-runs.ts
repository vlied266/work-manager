"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun, Procedure, ProcessStep } from "@/types/workos";
import { useAuth } from "@/hooks/use-auth";

interface RunCard {
  id: string;
  procedureName: string;
  currentStep?: ProcessStep;
  currentStepIndex?: number; // Current step index for display
  status: ActiveRun["status"];
  assignmentCopy: string;
  startedAtCopy: string;
  updatedAtCopy: string;
  procedureAssignmentId?: string; // For process-based runs, identifies which procedure assignment
  procedureAssignmentName?: string; // Name of the procedure assignment
  isProcedureCompleted?: boolean; // Whether this specific procedure is completed
  runId: string; // The actual run ID
  procedureSnapshot?: Procedure; // For displaying step count
  hasFlaggedLog?: boolean; // Whether the run has any flagged logs
}

const formatTimestamp = (value?: Timestamp | Date) => {
  if (!value) return " — ";
  const date = value instanceof Timestamp ? value.toDate() : value;
  return date.toLocaleString();
};

export function useInboxRuns() {
  const { profile, firebaseUser } = useAuth();
  const [myRuns, setMyRuns] = useState<ActiveRun[]>([]);
  const [teamRuns, setTeamRuns] = useState<ActiveRun[]>([]);
  const [completedRuns, setCompletedRuns] = useState<ActiveRun[]>([]);
  const [proceduresCache, setProceduresCache] = useState<Record<string, Procedure>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizationId || !firebaseUser) {
      setTimeout(() => {
        setMyRuns([]);
        setTeamRuns([]);
        setLoading(false);
      }, 0);
      return;
    }

    setTimeout(() => setLoading(true), 0);
    const baseQuery = query(
      collection(db, "active_runs"),
      where("organizationId", "==", profile.organizationId),
      orderBy("startedAt", "desc"),
    );

    const unsubscribe = onSnapshot(baseQuery, async (snapshot) => {
      const runs = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...(docSnap.data() as ActiveRun),
          }) satisfies ActiveRun,
      );

      const activeRuns = runs.filter((run) => run.status !== "COMPLETED");
      const completed = runs.filter((run) => run.status === "COMPLETED");
      
      // Use procedureSnapshot if available, otherwise fetch from Firestore
      const newProcedures: Record<string, Procedure> = {};
      for (const run of [...activeRuns, ...completed]) {
        if (run.procedureSnapshot) {
          // Use snapshot from run (for process-based runs)
          newProcedures[run.procedureId] = run.procedureSnapshot as Procedure;
        } else if (!proceduresCache[run.procedureId]) {
          // Fetch from Firestore if not in cache
          const procDoc = await getDoc(doc(db, "procedures", run.procedureId));
          if (procDoc.exists()) {
            newProcedures[run.procedureId] = { id: procDoc.id, ...(procDoc.data() as Procedure) };
          }
        }
      }

      setProceduresCache((prev) => ({ ...prev, ...newProcedures }));

      // Filter completed runs where user participated
      const myCompleted = completed.filter((run) => {
        return run.logs?.some((log) => log.performedBy === firebaseUser.uid);
      });

      // Filter runs assigned to current user
      const mine = activeRuns.filter((run) => {
        // Check procedure assignments first (for process-based runs)
        if (run.procedureAssignments && run.procedureAssignments.length > 0) {
          // Check if ANY procedure assignment is assigned to current user (completed or not)
          // This ensures that if a procedure is completed, the run still shows up if there are other procedures assigned to the user
          const hasMyAssignment = run.procedureAssignments.some(
            (assignment) => assignment.assignedToUserId === firebaseUser.uid
          );
          if (hasMyAssignment) return true;
          
          // Also check current step for immediate assignment
          const procedure = run.procedureSnapshot || proceduresCache[run.procedureId] || newProcedures[run.procedureId];
          if (procedure) {
            const currentStep = procedure.steps[run.currentStepIndex];
            if (currentStep?.procedureSourceId) {
              const currentProcedureAssignment = run.procedureAssignments.find(
                (assignment) => assignment.procedureId === currentStep.procedureSourceId
              );
              if (currentProcedureAssignment && currentProcedureAssignment.assignedToUserId === firebaseUser.uid) {
                return true;
              }
            }
          }
          return false;
        }
        
        // Fallback to step-level assignment check
        const procedure = run.procedureSnapshot || proceduresCache[run.procedureId] || newProcedures[run.procedureId];
        if (!procedure) return false;
        
        const step = procedure.steps[run.currentStepIndex];
        if (!step) return false;

        if (step.assigneeType === "SPECIFIC_USER") {
          return step.assigneeId === firebaseUser.uid;
        }

        if (step.assigneeType === "ANY_TEAM_MEMBER" || step.assigneeType === "TEAM_ROUND_ROBIN") {
          return profile.teamIds.includes(step.assigneeId);
        }

        return false;
      });

      // Filter runs assigned to user's teams
      const teamAssigned = activeRuns.filter((run) => {
        // Don't include runs already in "mine"
        if (mine.includes(run)) return false;
        
        const procedure = run.procedureSnapshot || proceduresCache[run.procedureId] || newProcedures[run.procedureId];
        if (!procedure) return false;
        
        const step = procedure.steps[run.currentStepIndex];
        if (!step) return false;

        if (step.assigneeType === "SPECIFIC_USER") {
          return false; // Already handled in "mine"
        }

        if (step.assigneeType === "ANY_TEAM_MEMBER" || step.assigneeType === "TEAM_ROUND_ROBIN") {
          return profile.teamIds.includes(step.assigneeId);
        }

        return false;
      });

      setMyRuns(mine);
      setTeamRuns(teamAssigned);
      setCompletedRuns(myCompleted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser, proceduresCache, profile]);

  const decoratedRuns = useMemo(() => {
    const decorate = (run: ActiveRun, procedureAssignment?: { id: string; name: string; completed: boolean }): RunCard | null => {
      // Use procedureSnapshot if available (for process-based runs)
      const procedure = run.procedureSnapshot || proceduresCache[run.procedureId];
      if (!procedure) {
        console.warn("[useInboxRuns] Procedure not found for run:", run.id, run.procedureId);
        return null;
      }
      
      // For process-based runs with procedure assignments, find steps for this specific procedure
      let step: ProcessStep | undefined;
      let stepIndex = run.currentStepIndex;
      
      if (run.procedureAssignments && run.procedureAssignments.length > 0 && procedureAssignment) {
        // Find the first step of this procedure assignment
        const procedureSteps = procedure.steps.filter(
          (s) => s.procedureSourceId === procedureAssignment.id
        );
        if (procedureSteps.length > 0) {
          // Find the current step within this procedure
          const completedSteps = run.logs?.filter(
            (log) => log.procedureLabel === procedureAssignment.name
          ).length || 0;
          stepIndex = Math.min(completedSteps, procedureSteps.length - 1);
          step = procedureSteps[stepIndex];
        }
      } else {
        step = procedure.steps[run.currentStepIndex];
      }
      
      if (!step && run.status !== "COMPLETED") {
        console.warn("[useInboxRuns] Step not found:", {
          runId: run.id,
          currentStepIndex: run.currentStepIndex,
          stepsCount: procedure.steps.length,
        });
      }
      
      const assignmentCopy = step
        ? `${step.title || "Step"} · ${step.assigneeType.replace(/_/g, " ")}`
        : run.status === "COMPLETED" ? "Completed" : "Waiting on configuration";
      
      // Get procedure assignment info if available
      let procedureInfo = "";
      if (procedureAssignment) {
        procedureInfo = ` · ${procedureAssignment.name}`;
      } else if (run.procedureAssignments && step?.procedureSourceId) {
        const assignment = run.procedureAssignments.find(
          (a) => a.procedureId === step.procedureSourceId
        );
        if (assignment) {
          procedureInfo = ` · ${assignment.procedureName}`;
        }
      }
      
      const hasFlagged = run.logs?.some((log) => log.outcome === "FLAGGED") || false;
      
      return {
        id: procedureAssignment ? `${run.id}-${procedureAssignment.id}` : run.id || "",
        runId: run.id || "",
        procedureName: procedureAssignment ? procedureAssignment.name : (run.processName || procedure.name),
        currentStep: step,
        currentStepIndex: stepIndex,
        status: procedureAssignment?.completed ? "COMPLETED" : run.status,
        assignmentCopy: assignmentCopy + procedureInfo,
        startedAtCopy: formatTimestamp(run.startedAt as Timestamp),
        updatedAtCopy:
          run.logs && run.logs.length
            ? formatTimestamp(run.logs[run.logs.length - 1].performedAt as Timestamp)
            : "No activity",
        procedureAssignmentId: procedureAssignment?.id,
        procedureAssignmentName: procedureAssignment?.name,
        isProcedureCompleted: procedureAssignment?.completed,
        procedureSnapshot: procedure,
        hasFlaggedLog: hasFlagged,
      };
    };

    // For process-based runs, create separate cards for each procedure assignment
    const expandProcessRuns = (runs: ActiveRun[], filterByUser = false): RunCard[] => {
      const expanded: RunCard[] = [];
      for (const run of runs) {
        if (run.procedureAssignments && run.procedureAssignments.length > 1) {
          // Multi-procedure process: create a card for each procedure assignment
          for (const assignment of run.procedureAssignments) {
            // If filtering by user, only show assignments for current user
            if (filterByUser && assignment.assignedToUserId !== firebaseUser?.uid) {
              continue;
            }
            const card = decorate(run, {
              id: assignment.procedureId,
              name: assignment.procedureName,
              completed: assignment.completed || false,
            });
            if (card) {
              expanded.push(card);
            }
          }
        } else {
          // Single procedure or regular run: create one card
          const card = decorate(run);
          if (card) {
            expanded.push(card);
          }
        }
      }
      return expanded;
    };

    return {
      myTasks: expandProcessRuns(myRuns, true), // Filter by user for my tasks
      teamRuns: expandProcessRuns(teamRuns, false),
      completedTasks: expandProcessRuns(completedRuns, true), // Filter by user for completed tasks
    };
  }, [myRuns, proceduresCache, teamRuns, completedRuns, firebaseUser?.uid]);

  return {
    ...decoratedRuns,
    loading,
    allRuns: { myRuns, teamRuns, completedRuns },
  };
}

