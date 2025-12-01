"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { ActiveRun, Procedure } from "@/types/workos";
import { useAuth } from "@/hooks/use-auth";

interface RunSnapshot extends ActiveRun {
  id: string;
}

export default function RunPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { firebaseUser, profile, loading: authLoading } = useAuth();

  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [comment, setComment] = useState("");
  const [flagRun, setFlagRun] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const runDoc = await getDoc(doc(db, "active_runs", id));
        if (!runDoc.exists()) {
          setError("Run not found");
          return;
        }
        const runData = { id: runDoc.id, ...(runDoc.data() as ActiveRun) };
        setRun(runData);

        if (runData.procedureSnapshot) {
          setProcedure(runData.procedureSnapshot as Procedure);
        } else {
          const procDoc = await getDoc(doc(db, "procedures", runData.procedureId));
          if (procDoc.exists()) {
            const snapshot = { id: procDoc.id, ...(procDoc.data() as Procedure) };
            setProcedure(snapshot);
            await updateDoc(doc(db, "active_runs", runData.id), { procedureSnapshot: snapshot });
          } else {
            setError("Procedure information missing");
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load run");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const steps = procedure?.steps ?? [];
  const totalSteps = steps.length;
  const currentStep = run && run.currentStepIndex >= 0 && run.currentStepIndex < steps.length 
    ? steps[run.currentStepIndex] 
    : undefined;

  // Debug logging
  useEffect(() => {
    if (run && procedure) {
      console.log("[RunPage] Debug info:", {
        hasRun: !!run,
        hasProcedure: !!procedure,
        stepsCount: steps.length,
        currentStepIndex: run.currentStepIndex,
        hasCurrentStep: !!currentStep,
        procedureAssignments: run.procedureAssignments,
        procedureSnapshotSteps: run.procedureSnapshot?.steps?.length,
      });
    }
  }, [run, procedure, steps.length, run?.currentStepIndex, currentStep]);

  // Check if current step belongs to a procedure that's assigned to this user
  const currentProcedureAssignment = useMemo(() => {
    if (!run?.procedureAssignments || !currentStep?.procedureSourceId) {
      if (run?.procedureAssignments && run.procedureAssignments.length > 0 && !currentStep?.procedureSourceId) {
        console.log("[RunPage] Current step missing procedureSourceId:", {
          step: currentStep,
          stepId: currentStep?.id,
          stepTitle: currentStep?.title,
        });
      }
      return null;
    }
    const assignment = run.procedureAssignments.find(
      (assignment) => assignment.procedureId === currentStep.procedureSourceId
    );
    if (!assignment && run.procedureAssignments.length > 0) {
      console.log("[RunPage] No assignment found for procedure:", {
        procedureSourceId: currentStep.procedureSourceId,
        availableAssignments: run.procedureAssignments.map(a => ({ id: a.procedureId, name: a.procedureName })),
      });
    }
    return assignment;
  }, [run?.procedureAssignments, currentStep?.procedureSourceId]);

  // Check if current procedure is assigned to current user
  const isCurrentProcedureAssignedToUser = useMemo(() => {
    if (!currentProcedureAssignment || !firebaseUser) return true; // If no assignments, allow (backward compatibility)
    return currentProcedureAssignment.assignedToUserId === firebaseUser.uid;
  }, [currentProcedureAssignment, firebaseUser]);

  const allowed = useMemo(() => {
    // Don't check if we're still loading
    if (loading || !run || !procedure) {
      return false;
    }
    
    if (!currentStep || !firebaseUser || !profile) {
      console.log("[RunPage] allowed check failed:", { 
        hasStep: !!currentStep, 
        hasUser: !!firebaseUser, 
        hasProfile: !!profile,
        stepsCount: steps.length,
        currentStepIndex: run?.currentStepIndex,
        hasRun: !!run,
        hasProcedure: !!procedure,
      });
      return false;
    }

    // If procedure assignments exist, check procedure-level assignment first
    if (run?.procedureAssignments && run.procedureAssignments.length > 0) {
      // If procedure is assigned to this user, allow (procedure-level assignment takes precedence)
      if (isCurrentProcedureAssignedToUser) {
        console.log("[RunPage] Procedure-level assignment check passed:", {
          currentProcedure: currentProcedureAssignment?.procedureName,
          assignedTo: currentProcedureAssignment?.assignedToUserId,
          currentUser: firebaseUser.uid,
        });
        return true;
      } else {
        // Procedure not assigned to this user
        console.log("[RunPage] Procedure not assigned to user:", {
          currentProcedure: currentProcedureAssignment?.procedureName,
          assignedTo: currentProcedureAssignment?.assignedToUserId,
          currentUser: firebaseUser.uid,
        });
        return false;
      }
    }

    // If no procedure assignments, fall back to step-level assignment check
    if (currentStep.assigneeType === "SPECIFIC_USER") {
      const isAllowed = currentStep.assigneeId === firebaseUser.uid;
      console.log("[RunPage] SPECIFIC_USER check:", { 
        assigneeId: currentStep.assigneeId, 
        userId: firebaseUser.uid, 
        isAllowed 
      });
      return isAllowed;
    }

    if (currentStep.assigneeType === "ANY_TEAM_MEMBER") {
      const isAllowed = profile.teamIds.includes(currentStep.assigneeId);
      console.log("[RunPage] ANY_TEAM_MEMBER check:", { 
        assigneeId: currentStep.assigneeId, 
        teamIds: profile.teamIds, 
        isAllowed 
      });
      return isAllowed;
    }

    if (currentStep.assigneeType === "TEAM_ROUND_ROBIN") {
      const isAllowed = profile.teamIds.includes(currentStep.assigneeId);
      console.log("[RunPage] TEAM_ROUND_ROBIN check:", { 
        assigneeId: currentStep.assigneeId, 
        teamIds: profile.teamIds, 
        isAllowed 
      });
      return isAllowed;
    }

    console.log("[RunPage] No matching assignee type:", currentStep.assigneeType);
    return false;
  }, [currentStep, firebaseUser, profile, run?.procedureAssignments, isCurrentProcedureAssignedToUser, currentProcedureAssignment]);

  const completed = run?.status === "COMPLETED" || (run && run.currentStepIndex >= totalSteps);

  const uploadProof = async () => {
    if (!selectedFile || !run || !currentStep || !firebaseUser) {
      console.error("[RunPage] Missing data for upload:", {
        hasFile: !!selectedFile,
        hasRun: !!run,
        hasStep: !!currentStep,
        hasUser: !!firebaseUser,
      });
      return null;
    }

    try {
      // Sanitize filename to avoid issues with special characters
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `runs/${run.id}/${currentStep.id}/${Date.now()}_${sanitizedFileName}`;
      const storageRef = ref(storage, path);
      
      console.log("[RunPage] Uploading file:", { path, size: selectedFile.size, type: selectedFile.type });
      
      // Upload with metadata
      await uploadBytes(storageRef, selectedFile, {
        contentType: selectedFile.type || "application/octet-stream",
        customMetadata: {
          uploadedBy: firebaseUser.uid,
          runId: run.id,
          stepId: currentStep.id,
        },
      });
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log("[RunPage] File uploaded successfully:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("[RunPage] File upload error:", error);
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  };

  const handleComplete = async () => {
    if (!run || !procedure || !currentStep || !firebaseUser) {
      console.error("Missing required data:", { run: !!run, procedure: !!procedure, currentStep: !!currentStep, firebaseUser: !!firebaseUser });
      setError("Missing required data. Please refresh the page.");
      return;
    }

    if (!allowed) {
      console.error("Not allowed:", { currentStep, firebaseUser: firebaseUser.uid, profile: profile?.teamIds });
      setError("You are not authorized to complete this step.");
      return;
    }

    // Validation based on input type and category
    const inputType = currentStep.config?.inputType || "TEXT";
    const isRequired = currentStep.config?.required !== false;
    
    // For BASIC_DIGITAL tasks
    if (currentStep.category === "BASIC_DIGITAL") {
      if (inputType === "FILE_UPLOAD" && isRequired && !selectedFile) {
        setError("Please upload the required file.");
        return;
      }
      if (inputType === "SELECTION" && isRequired && !inputValue) {
        setError("Please select an option.");
        return;
      }
      if (inputType === "NUMBER" && isRequired && !inputValue) {
        setError("Please enter a number.");
        return;
      }
      if (inputType === "DATE" && isRequired && !inputValue) {
        setError("Please select a date.");
        return;
      }
      if ((inputType === "TEXT" || !inputType) && isRequired && !inputValue && !selectedFile) {
        setError("Please provide the required input.");
        return;
      }
    }
    
    // For BASIC_LABOR and BASIC_CREATIVE tasks
    if ((currentStep.category === "BASIC_LABOR" || currentStep.category === "BASIC_CREATIVE") && isRequired) {
      if (inputValue !== "DONE") {
        // If proof is required and not checkbox, need file or signature
        if (currentStep.config?.proofType === "PHOTO" && !selectedFile) {
          setError("Please upload a photo as proof.");
          return;
        }
        if (currentStep.config?.proofType === "SIGNATURE" && !comment) {
          setError("Please provide your signature.");
          return;
        }
        if (!currentStep.config?.proofType || currentStep.config.proofType === "CHECKBOX") {
          setError("Please confirm completion.");
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let proofUrl: string | null = null;
      if (selectedFile) {
        try {
          proofUrl = await uploadProof();
        } catch (uploadError) {
          console.error("[RunPage] Upload failed:", uploadError);
          const errorMessage = (uploadError as Error).message || "Unknown error";
          
          // Check if file is required
          const isFileRequired = currentStep.config?.proofType === "PHOTO" || 
                                currentStep.config?.inputType === "FILE_UPLOAD";
          
          if (isFileRequired) {
            setError(`File upload failed: ${errorMessage}. Please check Firebase Storage configuration and rules in Firebase Console.`);
            setSubmitting(false);
            return;
          } else {
            // If file is not required, continue without it but show a warning
            console.warn("[RunPage] File upload failed but continuing without file:", errorMessage);
            setError(`Warning: File upload failed (${errorMessage}), but continuing without file. Please check Firebase Storage rules.`);
            // Continue without file
          }
        }
      }

      const nextIndex = run.currentStepIndex + 1;
      const isStepFinished = nextIndex >= procedure.steps.length;

      // Check if current procedure is finished
      const currentProcedureId = currentStep.procedureSourceId;
      let isProcedureFinished = false;
      let nextProcedureIndex = run.currentProcedureIndex || 0;
      
      if (currentProcedureId && run.procedureAssignments) {
        // Find all steps of current procedure
        const currentProcedureSteps = steps.filter(
          (step) => step.procedureSourceId === currentProcedureId
        );
        const currentProcedureStepIndex = currentProcedureSteps.findIndex(
          (step) => step.id === currentStep.id
        );
        isProcedureFinished = currentProcedureStepIndex === currentProcedureSteps.length - 1;
        
        // If procedure is finished, mark it as completed and move to next procedure
        if (isProcedureFinished && nextIndex < totalSteps) {
          const updatedAssignments = run.procedureAssignments.map((assignment) =>
            assignment.procedureId === currentProcedureId
              ? { ...assignment, completed: true, completedAt: Timestamp.now() }
              : assignment
          );
          
          // Find next procedure that's not completed
          const nextAssignment = updatedAssignments
            .sort((a, b) => a.order - b.order)
            .find((a) => !a.completed);
          
          if (nextAssignment) {
            nextProcedureIndex = updatedAssignments.findIndex(
              (a) => a.procedureId === nextAssignment.procedureId
            );
          }
          
          await updateDoc(doc(db, "active_runs", run.id), {
            procedureAssignments: updatedAssignments,
            currentProcedureIndex: nextProcedureIndex,
          });
        }
      }

      const isProcessFinished = isStepFinished && 
        (!run.procedureAssignments || 
         run.procedureAssignments.every((a) => a.completed));

      const outcome =
        flagRun || (currentStep.digitalAction === "COMPARE" && inputValue === "MISMATCH")
          ? "FLAGGED"
          : "SUCCESS";

      const logEntry = {
        stepId: currentStep.id,
        stepTitle: currentStep.title,
        performedBy: firebaseUser.uid,
        performedAt: Timestamp.now(), // Use Timestamp.now() instead of serverTimestamp() for arrays
        inputData: {
          value: inputValue || "DONE",
          comment: comment || null,
          proofUrl,
        },
        outcome,
        procedureLabel: currentStep.procedureLabel,
      };

      await updateDoc(doc(db, "active_runs", run.id), {
        currentStepIndex: nextIndex,
        status: isProcessFinished ? "COMPLETED" : run.status,
        logs: [...(run.logs || []), logEntry],
      });

      if (isProcessFinished) {
        setSuccess("🎉 Process completed successfully!");
      } else if (isProcedureFinished) {
        setSuccess("✅ Procedure completed! Next procedure will be available to assigned user.");
      } else {
        setSuccess(`✅ Step ${run.currentStepIndex + 1} completed! Moving to step ${nextIndex + 1}...`);
      }
      setInputValue("");
      setComment("");
      setFlagRun(false);
      setSelectedFile(null);

      const updatedRun = await getDoc(doc(db, "active_runs", run.id));
      if (updatedRun.exists()) {
        setRun({ id: updatedRun.id, ...(updatedRun.data() as ActiveRun) });
      }

      if (isProcessFinished) {
        setTimeout(() => router.push("/inbox"), 1500);
      } else if (isProcedureFinished) {
        // If procedure finished but process not finished, redirect to inbox
        setTimeout(() => router.push("/inbox"), 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update run.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = () => {
    if (!currentStep) return null;
    if (currentStep.category === "BASIC_DIGITAL") {
      if (currentStep.digitalAction === "COMPARE") {
        return (
          <div className="space-y-4">
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
              Compare <strong>{currentStep.config?.targetA}</strong> with{" "}
              <strong>{currentStep.config?.targetB}</strong>
            </div>
            <select
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
            >
              <option value="">Select result</option>
              <option value="MATCH">Match</option>
              <option value="MISMATCH">Mismatch</option>
            </select>
            {inputValue === "MISMATCH" && (
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
                placeholder="Describe the discrepancy..."
              />
            )}
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={flagRun}
                onChange={(e) => setFlagRun(e.target.checked)}
                className="h-4 w-4 rounded border-ink/20 text-amber-600 focus:ring-amber-600"
              />
              Flag this run for correction
            </label>
          </div>
        );
      }

      // Handle different input types
      const inputType = currentStep.config?.inputType || "TEXT";
      
      if (inputType === "FILE_UPLOAD") {
        return (
          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
              Upload the required file for this step.
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted">Upload File <span className="text-red-500">*</span></p>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-dashed border-ink/20 px-4 py-3 text-sm"
                required
              />
              {selectedFile && (
                <p className="text-xs text-muted">Selected: {selectedFile.name}</p>
              )}
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder="Additional comments (optional)..."
            />
          </div>
        );
      }

      if (inputType === "NUMBER") {
        return (
          <div className="space-y-4">
            <label className="space-y-1 text-sm text-muted">
              Enter Number <span className="text-red-500">*</span>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                placeholder="Enter a number..."
                required
              />
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder="Additional comments (optional)..."
            />
          </div>
        );
      }

      if (inputType === "DATE") {
        return (
          <div className="space-y-4">
            <label className="space-y-1 text-sm text-muted">
              Select Date <span className="text-red-500">*</span>
              <input
                type="date"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                required
              />
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder="Additional comments (optional)..."
            />
          </div>
        );
      }

      // Default: TEXT input
      return (
        <div className="space-y-4">
          <textarea
            rows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="Document your outcome or paste the source link..."
            required={currentStep.config?.required !== false}
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">Attach supporting file (optional)</p>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-dashed border-ink/20 px-4 py-3 text-sm"
            />
            {selectedFile && (
              <p className="text-xs text-muted">Selected: {selectedFile.name}</p>
            )}
          </div>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="Additional comments (optional)..."
          />
        </div>
      );
    }

    if (currentStep.category === "BASIC_LABOR" || currentStep.category === "BASIC_CREATIVE") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
            {currentStep.config?.instructions || "Follow the instructions and confirm completion."}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={inputValue === "DONE"}
              onChange={(e) => setInputValue(e.target.checked ? "DONE" : "")}
              className="h-4 w-4 rounded border-ink/20 text-accent focus:ring-accent"
            />
            I confirm the work is completed.
          </label>
          {currentStep.config?.proofType && currentStep.config.proofType !== "CHECKBOX" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted">
                Proof ({currentStep.config.proofType})
              </p>
              {currentStep.config.proofType === "PHOTO" ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-dashed border-ink/20 px-4 py-3 text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-accent"
                  placeholder="Type your signature"
                />
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <p className="text-sm text-muted">
        No interactive UI required. Confirm once the machine cycle has completed successfully.
      </p>
    );
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading run...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base text-center">
        <p className="text-lg font-semibold text-red-500">{error}</p>
        <button
          onClick={() => router.push("/inbox")}
          className="mt-4 rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  if (!run || !procedure) {
    if (loading || authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-base text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading run...
        </div>
      );
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base text-center">
        <p className="text-lg font-semibold text-red-500">
          {error || "Run or procedure data missing"}
        </p>
        <button
          onClick={() => router.push("/inbox")}
          className="mt-4 rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base text-center">
        <p className="text-lg font-semibold text-amber-600">
          No current step available
        </p>
        <p className="mt-2 text-sm text-muted">
          Step index: {run.currentStepIndex} of {totalSteps} total steps
        </p>
        <p className="mt-2 text-xs text-muted">
          This might mean the run has completed or there&apos;s a data issue.
        </p>
        <button
          onClick={() => router.push("/inbox")}
          className="mt-4 rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push("/inbox")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inbox
      </button>

      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Executing</p>
        <h1 className="text-3xl font-semibold text-ink">{run.processName || procedure.name}</h1>
        
        {/* Enhanced Progress Bar */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">
              Step {run.currentStepIndex + 1} of {totalSteps}
            </span>
            <span className="font-bold text-[#007AFF]">
              {Math.round(((run.currentStepIndex + 1) / totalSteps) * 100)}% Complete
            </span>
          </div>
          
          {/* Main Progress Bar */}
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-base shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#0051D5] transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${((run.currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-ink/60">
                {run.currentStepIndex + 1} / {totalSteps}
              </span>
            </div>
          </div>

          {/* Step Indicators - Show last 3, current, and next 2 */}
          {totalSteps > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
              {steps.slice(
                Math.max(0, run.currentStepIndex - 2),
                Math.min(totalSteps, run.currentStepIndex + 3)
              ).map((step, idx) => {
                const actualIndex = Math.max(0, run.currentStepIndex - 2) + idx;
                const isCompleted = actualIndex < run.currentStepIndex;
                const isCurrent = actualIndex === run.currentStepIndex;
                const isUpcoming = actualIndex > run.currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className={`flex min-w-[120px] flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all ${
                      isCurrent
                        ? "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/30 scale-105"
                        : isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-base text-muted border border-ink/10"
                    }`}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? "bg-white text-[#007AFF]"
                        : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-ink/20 text-ink/40"
                    }`}>
                      {isCompleted ? "✓" : actualIndex + 1}
                    </div>
                    <p className={`text-xs font-semibold text-center line-clamp-2 ${
                      isCurrent ? "text-white" : ""
                    }`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <section className="space-y-6 rounded-3xl bg-white/90 p-8 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
        {/* Current Step Header with Visual Indicator */}
        <div className="rounded-2xl border-2 border-[#007AFF]/30 bg-[#007AFF]/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/30">
                  <span className="text-lg font-bold">{run.currentStepIndex + 1}</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#007AFF] font-semibold">Current Step</p>
                  <h2 className="text-2xl font-semibold text-ink mt-1">{currentStep.title}</h2>
                </div>
              </div>
              {currentStep.description && (
                <p className="text-sm text-muted ml-13">{currentStep.description}</p>
              )}
              {currentStep.procedureLabel && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink border border-ink/10">
                  <span className="text-muted">Procedure:</span>
                  <span>{currentStep.procedureLabel}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-3">
              {!allowed && (
                <div className="space-y-2">
                  {run.procedureAssignments && currentProcedureAssignment && !isCurrentProcedureAssignedToUser ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <p className="font-semibold">This procedure is assigned to another user.</p>
                      <p className="mt-1 text-xs">
                        Procedure &quot;{currentProcedureAssignment.procedureName}&quot; must be completed by the assigned user before you can proceed.
                      </p>
                      <p className="mt-2 text-xs font-mono">
                        Assigned to: {currentProcedureAssignment.assignedToUserId}
                      </p>
                      <p className="mt-1 text-xs font-mono">
                        Your ID: {firebaseUser?.uid}
                      </p>
                    </div>
                  ) : !currentStep ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p className="font-semibold">No current step available</p>
                      <p className="mt-1 text-xs">
                        Step index: {run.currentStepIndex} of {totalSteps} total steps
                      </p>
                      <p className="mt-1 text-xs">
                        Steps in procedure: {procedure.steps?.length || 0}
                      </p>
                    </div>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-700">
                      Not assigned
                    </span>
                  )}
                </div>
              )}
              {allowed && currentProcedureAssignment && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <p className="font-semibold">Assigned to you</p>
                  <p className="mt-1">Procedure: {currentProcedureAssignment.procedureName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-base/60 p-6">
          {renderInput()}
        </div>

            <AnimatePresence>
              {(error || success) && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl border-2 px-6 py-4 text-sm font-semibold shadow-lg ${
                    error
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-emerald-300 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {success && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                    {error && (
                      <span className="text-2xl">⚠️</span>
                    )}
                    <span>{error || success}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

        <div className="flex flex-col items-end gap-3">
          {!allowed && (
            <p className="text-sm text-amber-600">
              ⚠️ You are not assigned to this step. Contact your team lead to get access.
            </p>
          )}
          {allowed && (() => {
            const inputType = currentStep.config?.inputType || "TEXT";
            const isRequired = currentStep.config?.required !== false;
            const needsInput = isRequired && (
              (inputType === "FILE_UPLOAD" && !selectedFile) ||
              (inputType === "SELECTION" && !inputValue) ||
              (inputType === "NUMBER" && !inputValue) ||
              (inputType === "DATE" && !inputValue) ||
              ((inputType === "TEXT" || !inputType) && !inputValue && !selectedFile)
            );
            return needsInput ? (
              <p className="text-sm text-amber-600">
                ⚠️ Please fill in the required fields above.
              </p>
            ) : null;
          })()}
          <button
            onClick={handleComplete}
            disabled={!allowed || submitting || completed}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#007AFF] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#007AFF]/30 transition-all hover:bg-[#0051D5] hover:shadow-xl hover:shadow-[#007AFF]/40 disabled:opacity-50 disabled:hover:shadow-lg"
          >
            {submitting ? "Recording..." : completed ? "Run Completed" : "Submit Step"}
          </button>
        </div>
      </section>
    </div>
  );
}

