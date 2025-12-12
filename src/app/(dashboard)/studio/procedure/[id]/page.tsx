"use client";

import { useEffect, useState, use } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure, AtomicStep, AtomicAction, ATOMIC_ACTION_METADATA } from "@/types/schema";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ArrowLeft, ArrowRight, X, Trash2, FileText, Loader2, AlertTriangle, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DraggableSidebar } from "@/components/design/draggable-sidebar";
import { SortableCanvas } from "@/components/design/sortable-canvas";
import { ConfigPanel } from "@/components/design/config-panel";
import { useRouter } from "next/navigation";
import { useProcedureValidation } from "@/hooks/use-procedure-validation";
import { useStudioTour } from "@/components/studio/StudioTour";
import { HelpCircle, Edit3, Smartphone, List, Network, Play, Settings } from "lucide-react";
import { MobilePreview } from "@/components/studio/mobile-preview";
import { VisualEditor } from "@/components/studio/VisualEditor";
import { useOrgId } from "@/hooks/useOrgData";
import { useOrganization } from "@/contexts/OrganizationContext";
import { TriggerConfigModal } from "@/components/studio/TriggerConfigModal";
import { DescriptionModal } from "@/components/studio/DescriptionModal";

interface ProcedureBuilderPageProps {
  params: Promise<{ id: string }>;
}

export default function ProcedureBuilderPage({ params: paramsPromise }: ProcedureBuilderPageProps) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const organizationId = useOrgId() || "default-org";
  const { userProfile } = useOrganization();
  const userId = userProfile?.uid || null;
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [procedureTitle, setProcedureTitle] = useState("");
  const [procedureDescription, setProcedureDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false); // false = Edit Mode, true = Preview Mode
  const [viewMode, setViewMode] = useState<"list" | "canvas">("canvas"); // "list" = List View, "canvas" = Flow View (default)
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);


  // Fetch Procedure if editing
  useEffect(() => {
    if (id === "new") {
      setLoading(false);
      return;
    }

    // Check if this is a temp procedure with AI-generated data
    if (id.startsWith("temp-")) {
      const storedData = sessionStorage.getItem(`procedure-${id}`);
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          const tempProcedure: Procedure = {
            id: id,
            organizationId: organizationId,
            processGroupId: "",
            title: data.title || "",
            description: data.description || "",
            isPublished: false,
            steps: data.steps || [],
            trigger: data.trigger || undefined, // FIX: Include trigger from stored data
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setProcedure(tempProcedure);
          setProcedureTitle(tempProcedure.title);
          setProcedureDescription(tempProcedure.description);
          setIsPublished(false);
          setLoading(false);
          console.log("Trigger loaded from AI generation:", tempProcedure.trigger); // Debug log
          return;
        } catch (error) {
          console.error("Error parsing stored procedure data:", error);
        }
      }
    }

    const unsubscribe = onSnapshot(
      doc(db, "procedures", id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const proc = {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            steps: data.steps || [],
            isActive: data.isActive || false, // Default to false if not set
          } as Procedure;
          setProcedure(proc);
          setProcedureTitle(proc.title);
          setProcedureDescription(proc.description);
          setIsPublished(proc.isPublished);
        } else {
          router.push("/studio/procedure/new");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching procedure:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, router]);

  const handleCreateProcedure = async () => {
    if (!procedureTitle.trim() || !procedureDescription.trim() || !procedure || procedure.steps.length === 0) {
      alert("Please fill in title, description, and add at least one step before creating the procedure.");
      return;
    }
    setSaving(true);
    try {
      // Create a default "Uncategorized" process group if needed
      let defaultGroupId: string | null = null;
      const defaultGroupQuery = query(
        collection(db, "process_groups"),
        where("organizationId", "==", organizationId),
        where("title", "==", "Uncategorized")
      );
      const defaultGroupSnapshot = await getDocs(defaultGroupQuery);
      
      if (defaultGroupSnapshot.empty) {
        // Create default group
        const groupRef = await addDoc(collection(db, "process_groups"), {
          organizationId,
          title: "Uncategorized",
          description: "Default group for procedures without a specific category",
          icon: "FolderOpen",
          procedureSequence: [],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        defaultGroupId = groupRef.id;
      } else {
        defaultGroupId = defaultGroupSnapshot.docs[0].id;
      }

      const docRef = await addDoc(collection(db, "procedures"), {
        organizationId,
        processGroupId: defaultGroupId,
        title: procedureTitle.trim(),
        description: procedureDescription.trim(),
        isPublished,
        steps: procedure.steps,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/studio/procedure/${docRef.id}`);
    } catch (error) {
      console.error("Error creating procedure:", error);
      alert("Failed to create procedure");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProcedure = async () => {
    if (!procedure || !procedureTitle.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "procedures", procedure.id), {
        title: procedureTitle.trim(),
        description: procedureDescription.trim(),
        isPublished,
        steps: procedure.steps,
        trigger: procedure.trigger,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving procedure:", error);
      alert("Failed to save procedure");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrigger = (trigger: Procedure["trigger"]) => {
    if (!procedure) return;
    setProcedure({
      ...procedure,
      trigger,
    });
    // Auto-save if procedure exists in DB
    if (procedure.id && !procedure.id.startsWith("temp-")) {
      updateDoc(doc(db, "procedures", procedure.id), {
        trigger,
        updatedAt: serverTimestamp(),
      }).catch((error) => {
        console.error("Error saving trigger:", error);
      });
    }
  };

  const handleStartProcedure = async () => {
    if (!procedure || !procedure.id || procedure.id.startsWith("temp-")) {
      alert("Please save the procedure first before starting it.");
      return;
    }

    if (!procedure.steps || procedure.steps.length === 0) {
      alert("Please add at least one step to the procedure.");
      return;
    }

    // For MANUAL triggers, create a single run immediately
    if (procedure.trigger?.type === "MANUAL" || !procedure.trigger) {
      if (!organizationId || !userId) {
        alert("Please log in to start a procedure.");
        return;
      }

      try {
      setSaving(true);

      // Call the new API
      const response = await fetch("/api/runs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId: procedure.id,
          orgId: organizationId,
          starterUserId: userId,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to start procedure";
        let shouldRedirectToBilling = false;
        
        try {
          const errorData = await response.json();
          
          // Handle specific error types
          if (errorData.error === "LIMIT_REACHED") {
            errorMessage = errorData.message || "You have reached your plan limit.";
            shouldRedirectToBilling = true;
          } else if (errorData.error === "Procedure not found") {
            errorMessage = "The procedure could not be found. Please refresh the page and try again.";
          } else if (errorData.error === "Procedure has no steps") {
            errorMessage = "The procedure has no steps. Please add at least one step.";
          } else if (errorData.error === "Could not determine assignee for first step") {
            errorMessage = "Could not determine who should be assigned to the first step. Please check the step configuration.";
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.details) {
            errorMessage = errorData.details;
          }
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = `Failed to start procedure: ${response.statusText || "Unknown error"}`;
        }
        
        // Show error and optionally redirect to billing
        if (shouldRedirectToBilling) {
          const upgrade = confirm(`${errorMessage}\n\nWould you like to upgrade your plan?`);
          if (upgrade) {
            router.push("/billing");
          }
        } else {
          alert(errorMessage);
        }
        
        setSaving(false);
        return;
      }

      const result = await response.json();

      // Handle redirect based on action
      if (result.action === "REDIRECT_TO_RUN") {
        router.push(`/run/${result.runId}`);
      } else if (result.action === "REDIRECT_TO_MONITOR") {
        // Show notification
        alert(result.message || "Process started! Task assigned to another user.");
        router.push("/monitor");
      } else {
        // Fallback
        router.push(`/run/${result.runId}`);
      }
    } catch (error: any) {
      console.error("Error starting procedure:", error);
      
      // Handle network errors or other unexpected errors
      let errorMessage = "Failed to start procedure. Please try again.";
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setSaving(false);
      return;
      }
      
      setSaving(false);
      return;
    }
    
    // For AUTOMATED triggers, this should not be called (use handleToggleActive instead)
    alert("Automated workflows should be activated, not run manually.");
    setSaving(false);
  };

  const handleToggleActive = async () => {
    if (!procedure || !procedure.id || procedure.id.startsWith("temp-")) {
      alert("Please save the procedure first.");
      return;
    }

    if (!procedure.trigger || procedure.trigger.type === "MANUAL") {
      alert("Only automated workflows can be activated.");
      return;
    }

    if (!organizationId || !userId) {
      alert("Please log in to activate a workflow.");
      return;
    }

    try {
      setSaving(true);
      const newActiveState = !procedure.isActive;

      // CRITICAL: If activating workflow, automatically publish it if not already published
      // This ensures that active workflows are always published and can be found by cron jobs
      const shouldPublish = newActiveState && !procedure.isPublished;
      const newPublishedState = shouldPublish ? true : procedure.isPublished;

      // Update procedure isActive state and isPublished if needed
      await updateDoc(doc(db, "procedures", procedure.id), {
        isActive: newActiveState,
        isPublished: newPublishedState,
        updatedAt: serverTimestamp(),
      });

      setProcedure({
        ...procedure,
        isActive: newActiveState,
        isPublished: newPublishedState,
      });
      
      // Update local state for isPublished
      if (shouldPublish) {
        setIsPublished(true);
      }

      alert(
        newActiveState
          ? "Workflow activated! It will now listen for trigger events."
          : "Workflow deactivated. It will no longer respond to trigger events."
      );
    } catch (error: any) {
      console.error("Error toggling active state:", error);
      alert("Failed to update workflow state. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async (action: AtomicAction, position?: { x: number; y: number }) => {
    // Create procedure in memory if it doesn't exist yet
    if (!procedure) {
      const newStep: AtomicStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${ATOMIC_ACTION_METADATA[action].label} Step`,
        action,
        config: {},
        ...(position && { ui: { position } }), // Store position if provided
      };
      // Create a temporary procedure object in memory (not saved to Firestore yet)
      const tempProcedure: Procedure = {
        id: `temp-${Date.now()}`,
        organizationId: organizationId,
        processGroupId: "", // Will be set when creating
        title: procedureTitle || "New Procedure",
        description: procedureDescription || "",
        isPublished: false,
        steps: [newStep],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProcedure(tempProcedure);
      setSelectedStepId(newStep.id);
      return;
    }

    const newStep: AtomicStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${ATOMIC_ACTION_METADATA[action].label} Step`,
      action,
      config: {},
      ...(position && { ui: { position } }), // Store position if provided
    };

    // Smart Branching Logic: Connect based on selectedStepId (not last step)
    let updatedSteps = [...procedure.steps, newStep];
    
    // If a step is selected, try to connect to it intelligently
    if (selectedStepId) {
      const selectedStepIndex = updatedSteps.findIndex((s) => s.id === selectedStepId);
      if (selectedStepIndex !== -1) {
        const selectedStep = updatedSteps[selectedStepIndex];
        
        // Case 1: Selected node is VALIDATE or COMPARE (branching node)
        if (selectedStep.action === "VALIDATE" || selectedStep.action === "COMPARE") {
          // Ensure routes object exists
          const routes = selectedStep.routes || {};
          
          // If Success slot empty? -> Assign onSuccessStepId
          if (!routes.onSuccessStepId) {
            updatedSteps[selectedStepIndex] = {
              ...selectedStep,
              routes: {
                ...routes,
                onSuccessStepId: newStep.id,
              },
            };
          } 
          // ELSE IF Failure slot empty? -> Assign onFailureStepId
          else if (!routes.onFailureStepId) {
            updatedSteps[selectedStepIndex] = {
              ...selectedStep,
              routes: {
                ...routes,
                onFailureStepId: newStep.id,
              },
            };
          }
          // ELSE -> Do NOT connect (just place on canvas). Do NOT chain to the child.
        }
        // Case 2: Selected node is GATEWAY
        else if (selectedStep.action === "GATEWAY") {
          const conditions = selectedStep.config?.conditions || [];
          const hasDefault = selectedStep.config?.defaultNextStepId;
          
          // Find first condition without nextStepId
          let connectedToCondition = false;
          for (let i = 0; i < conditions.length; i++) {
            if (!conditions[i].nextStepId) {
              const updatedConditions = [...conditions];
              updatedConditions[i] = {
                ...updatedConditions[i],
                nextStepId: newStep.id,
              };
              updatedSteps[selectedStepIndex] = {
                ...selectedStep,
                config: {
                  ...selectedStep.config,
                  conditions: updatedConditions,
                },
              };
              connectedToCondition = true;
              break;
            }
          }
          
          // If no empty condition found, connect to default path
          if (!connectedToCondition && !hasDefault) {
            updatedSteps[selectedStepIndex] = {
              ...selectedStep,
              config: {
                ...selectedStep.config,
                defaultNextStepId: newStep.id,
              },
            };
          }
        }
        // Case 3: Selected node is Standard Step (Input, Email, etc.)
        else {
          // Connect to defaultNextStepId if not set
          if (!selectedStep.routes?.defaultNextStepId) {
            updatedSteps[selectedStepIndex] = {
              ...selectedStep,
              routes: {
                ...selectedStep.routes,
                defaultNextStepId: newStep.id,
              },
            };
          }
        }
      }
    }
    // Fallback: If no step is selected, use old logic (connect to last step if it's VALIDATE/COMPARE)
    else if (updatedSteps.length >= 2) {
      const previousStep = updatedSteps[updatedSteps.length - 2];
      
      if (previousStep.action === "VALIDATE" || previousStep.action === "COMPARE") {
        const hasSuccessConnection = previousStep.routes?.onSuccessStepId;
        const hasFailureConnection = previousStep.routes?.onFailureStepId;
        
        if (!hasSuccessConnection) {
          updatedSteps[updatedSteps.length - 2] = {
            ...previousStep,
            routes: {
              ...previousStep.routes,
              onSuccessStepId: newStep.id,
            },
          };
        } else if (!hasFailureConnection) {
          updatedSteps[updatedSteps.length - 2] = {
            ...previousStep,
            routes: {
              ...previousStep.routes,
              onFailureStepId: newStep.id,
            },
          };
        }
      }
    }

    const updated = { ...procedure, steps: updatedSteps };
    setProcedure(updated);
    setSelectedStepId(newStep.id);

    // Auto-save to Firestore only if procedure already exists in DB
    if (procedure.id && !procedure.id.startsWith("temp-")) {
      try {
        await updateDoc(doc(db, "procedures", procedure.id), {
          steps: updatedSteps,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error saving step:", error);
      }
    }
  };

  const handleStepsChange = async (newSteps: AtomicStep[]) => {
    if (!procedure) return;
    const updated = { ...procedure, steps: newSteps };
    setProcedure(updated);

    // Auto-save to Firestore only if procedure already exists in DB
    if (procedure.id && !procedure.id.startsWith("temp-")) {
      try {
        await updateDoc(doc(db, "procedures", procedure.id), {
          steps: newSteps,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error saving steps:", error);
      }
    }
  };

  const handleStepSelect = (stepId: string | null) => {
    setSelectedStepId(stepId);
  };

  const handleStepUpdate = async (updates: Partial<AtomicStep>) => {
    if (!procedure || !selectedStepId) return;
    const stepIndex = procedure.steps.findIndex((s) => s.id === selectedStepId);
    if (stepIndex === -1) return;

    const updatedSteps = [...procedure.steps];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], ...updates };
    await handleStepsChange(updatedSteps);
  };

  const handleConnect = async (
    connection: { source: string; target: string; sourceHandle?: string | null },
    sourceStep: AtomicStep,
    targetStepId: string | null
  ) => {
    if (!procedure) return;

    const sourceStepIndex = procedure.steps.findIndex((s) => s.id === sourceStep.id);
    if (sourceStepIndex === -1) return;

    const updatedSteps = [...procedure.steps];
    const sourceStepCopy = { ...updatedSteps[sourceStepIndex] };
    const sourceHandle = connection.sourceHandle;

    // Get step titles for notification
    const sourceTitle = sourceStep.title || "Untitled Step";
    const targetStep = targetStepId ? procedure.steps.find((s) => s.id === targetStepId) : null;
    const targetTitle = targetStep?.title || "Untitled Step";

    // Handle disconnection (targetStepId is null)
    if (!targetStepId) {
      // Scenario A: GATEWAY - Remove condition or default path
      if (sourceStep.action === "GATEWAY") {
        if (sourceHandle && sourceHandle.startsWith("condition-")) {
          const conditionIndex = parseInt(sourceHandle.replace("condition-", ""));
          const conditions = [...(sourceStepCopy.config?.conditions || [])];
          if (conditions[conditionIndex]) {
            conditions[conditionIndex] = {
              ...conditions[conditionIndex],
              nextStepId: undefined,
            };
            sourceStepCopy.config = {
              ...sourceStepCopy.config,
              conditions,
            };
            // Condition disconnected successfully
          }
        } else if (sourceHandle === "default") {
          sourceStepCopy.config = {
            ...sourceStepCopy.config,
            defaultNextStepId: undefined,
          };
          // Default path disconnected successfully
        }
      }
      // Scenario B: VALIDATE/COMPARE - Remove success/failure paths
      else if (sourceStep.action === "VALIDATE" || sourceStep.action === "COMPARE") {
        if (sourceHandle === "success" || !sourceHandle) {
          sourceStepCopy.routes = {
            ...sourceStepCopy.routes,
            onSuccessStepId: undefined,
          };
          // Success path disconnected successfully
        } else if (sourceHandle === "failure") {
          sourceStepCopy.routes = {
            ...sourceStepCopy.routes,
            onFailureStepId: undefined,
          };
          // Failure path disconnected successfully
        }
      }
      // Scenario C: Standard Step - Remove defaultNextStepId
      else {
        sourceStepCopy.routes = {
          ...sourceStepCopy.routes,
          defaultNextStepId: undefined,
        };
        // Step disconnected successfully
      }

      updatedSteps[sourceStepIndex] = sourceStepCopy;
      await handleStepsChange(updatedSteps);
      return;
    }

    // Handle connection (targetStepId is provided)
    // Scenario A: GATEWAY - Handle condition or default paths
    if (sourceStep.action === "GATEWAY") {
      if (sourceHandle && sourceHandle.startsWith("condition-")) {
        // Update specific condition's nextStepId
        const conditionIndex = parseInt(sourceHandle.replace("condition-", ""));
        const conditions = [...(sourceStepCopy.config?.conditions || [])];
        
        if (conditions[conditionIndex]) {
          conditions[conditionIndex] = {
            ...conditions[conditionIndex],
            nextStepId: targetStepId,
          };
          sourceStepCopy.config = {
            ...sourceStepCopy.config,
            conditions,
          };
          // Condition connected successfully
        }
      } else if (sourceHandle === "default") {
        // Update defaultNextStepId
        sourceStepCopy.config = {
          ...sourceStepCopy.config,
          defaultNextStepId: targetStepId,
        };
        // Default path connected successfully
      }
    }
    // Scenario B: VALIDATE/COMPARE - Handle success/failure paths
    else if (sourceStep.action === "VALIDATE" || sourceStep.action === "COMPARE") {
      if (sourceHandle === "success" || !sourceHandle) {
        // Update onSuccessStepId
        sourceStepCopy.routes = {
          ...sourceStepCopy.routes,
          onSuccessStepId: targetStepId,
        };
          // Success path connected successfully
      } else if (sourceHandle === "failure") {
        // Update onFailureStepId
        sourceStepCopy.routes = {
          ...sourceStepCopy.routes,
          onFailureStepId: targetStepId,
        };
          // Failure path connected successfully
      }
    }
    // Scenario C: Standard Step - Update defaultNextStepId
    else {
      sourceStepCopy.routes = {
        ...sourceStepCopy.routes,
        defaultNextStepId: targetStepId,
      };
      // Step connected successfully
    }

    updatedSteps[sourceStepIndex] = sourceStepCopy;
    await handleStepsChange(updatedSteps);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!procedure) return;
    
    const updatedSteps = procedure.steps.filter((s) => s.id !== stepId);
    const updated = { ...procedure, steps: updatedSteps };
    setProcedure(updated);
    
    // Clear selection if deleted step was selected
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }

    // Auto-save to Firestore only if procedure already exists in DB
    if (procedure.id && !procedure.id.startsWith("temp-")) {
      try {
        await updateDoc(doc(db, "procedures", procedure.id), {
          steps: updatedSteps,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error deleting step:", error);
      }
    }
  };

  const handleDeleteProcedure = async () => {
    if (!procedure || procedure.id.startsWith("temp-")) {
      // If it's a temp procedure, just clear it
      setProcedure(null);
      setProcedureTitle("");
      setProcedureDescription("");
      setIsPublished(false);
      setSelectedStepId(null);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${procedure.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "procedures", procedure.id));
      router.push("/studio/procedure/new");
    } catch (error) {
      console.error("Error deleting procedure:", error);
      alert("Failed to delete procedure. Please try again.");
    }
  };

  // Validation
  const validation = useProcedureValidation(procedure?.steps || []);
  const validationErrorsMap = new Map(
    validation.errors.map((error) => [error.stepId, error.message])
  );

  // Tour - Auto-start for first-time users (new procedures or temp procedures)
  const isFirstProcedure = Boolean(id === "new" || (procedure?.id && procedure.id.startsWith("temp-")));
  const { startTour } = useStudioTour(isFirstProcedure);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50/30 relative overflow-hidden font-sans">
      {/* Compact Header - Slim Top Bar (Notion/Google Docs style) */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white h-16 flex items-center">
        <div className="mx-auto max-w-[1800px] w-full px-8">
          <div className="flex items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Back Button */}
                <Link
                  href="/studio"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  <span>Back</span>
                </Link>
              
              <div className="h-6 w-px bg-slate-200" />
              
              {/* Title Input (H2 style) */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={procedureTitle}
                  onChange={(e) => setProcedureTitle(e.target.value)}
                  placeholder="Untitled Procedure"
                  className="w-full bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-400 focus:placeholder:text-slate-300 transition-colors"
                />
              </div>
              
              {/* Description Settings Button */}
              <motion.button
                onClick={() => setIsDescriptionModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Edit Description"
              >
                <SettingsIcon className="h-4 w-4" strokeWidth={2} />
              </motion.button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Validation Indicator */}
              {!validation.isValid && validation.errorCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 border border-orange-100/50">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#FF9500]" />
                  <span className="text-xs font-medium text-[#FF9500]">
                    {validation.errorCount} Issue{validation.errorCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <motion.button
                onClick={startTour}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-2 rounded-full hover:bg-black/5 text-gray-500 transition-colors"
                title="Start Tour"
              >
                <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
              </motion.button>

              {procedure && procedure.id && !procedure.id.startsWith("temp-") && (
                <motion.button
                  onClick={handleDeleteProcedure}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2 rounded-full hover:bg-rose-50 text-rose-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" strokeWidth={1.5} />
                </motion.button>
              )}

              {/* Trigger Settings Button */}
              {procedure && (
                <motion.button
                  onClick={() => setIsTriggerModalOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                  title="Trigger Settings"
                >
                  <Settings className="h-5 w-5" strokeWidth={1.5} />
                </motion.button>
              )}

              <div className="h-6 w-[1px] bg-gray-300 mx-1" />

              {procedure && procedure.id && !procedure.id.startsWith("temp-") ? (
                <>
                <motion.button
                  onClick={handleSaveProcedure}
                  disabled={!procedureTitle.trim() || !validation.isValid || saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0071E3] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                    )}
                  </motion.button>
                  {/* Conditional Button: Run vs Activate/Deactivate */}
                  {procedure.trigger?.type === "ON_FILE_CREATED" || procedure.trigger?.type === "WEBHOOK" ? (
                    <motion.button
                      onClick={handleToggleActive}
                      disabled={!procedure || !procedure.steps || procedure.steps.length === 0 || saving}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${
                        procedure.isActive
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      title={
                        procedure.isActive
                          ? "Deactivate workflow (stop listening for events)"
                          : "Activate workflow (start listening for trigger events)"
                      }
                    >
                      {procedure.isActive ? (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Activate</span>
                        </>
                  )}
                </motion.button>
              ) : (
                    <motion.button
                      onClick={handleStartProcedure}
                      disabled={!procedure || !procedure.steps || procedure.steps.length === 0 || saving}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      title={!procedure || !procedure.steps || procedure.steps.length === 0 ? "Add at least one step to start" : "Start Procedure"}
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Run</span>
                    </motion.button>
                  )}
                </>
              ) : (
                <div className="relative group">
                <motion.button
                  onClick={handleCreateProcedure}
                  disabled={
                    !procedureTitle.trim() ||
                    !procedureDescription.trim() ||
                    !procedure ||
                    procedure.steps.length === 0 ||
                    !validation.isValid ||
                    saving
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0071E3] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    title={
                      !procedureTitle.trim()
                        ? "Please enter a procedure title"
                        : !procedureDescription.trim()
                        ? "Please enter a procedure description"
                        : !procedure
                        ? "Please wait for procedure to load"
                        : procedure.steps.length === 0
                        ? "Please add at least one step to the procedure"
                        : !validation.isValid
                        ? `Please fix ${validation.errorCount} validation error${validation.errorCount !== 1 ? "s" : ""}`
                        : saving
                        ? "Creating procedure..."
                        : "Create Procedure"
                    }
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Procedure</span>
                  )}
                </motion.button>
                  {/* Tooltip showing why button is disabled */}
                  {(!procedureTitle.trim() ||
                    !procedureDescription.trim() ||
                    !procedure ||
                    procedure.steps.length === 0 ||
                    !validation.isValid) &&
                    !saving && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg">
                        {!procedureTitle.trim()
                          ? "Enter a procedure title"
                          : !procedureDescription.trim()
                          ? "Enter a procedure description"
                          : !procedure
                          ? "Loading..."
                          : procedure.steps.length === 0
                          ? "Add at least one step"
                          : !validation.isValid
                          ? `${validation.errorCount} validation error${validation.errorCount !== 1 ? "s" : ""} to fix`
                          : ""}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-slate-900"></div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content - Floating Glass Islands */}
      <main className="w-full h-[calc(100vh-64px)] overflow-x-auto">
        <div className="mx-auto min-w-[1400px] max-w-[1800px] px-8 pb-8 pt-8 h-full">
        <DesignerDndContext
          selectedProcedure={procedure}
          onStepsChange={handleStepsChange}
          onDropAction={handleAddStep}
          key={procedure?.id || "new"}
        >
            <div className="grid grid-cols-[300px_1fr_420px] gap-10 h-full min-w-0">
            {/* Left Pane: Toolbox - Floating Glass Island */}
            <div 
              data-tour="toolbox" 
              className="h-full min-w-[300px] overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/5"
            >
              <DraggableSidebar viewMode={viewMode} />
            </div>

            {/* Center Pane: Canvas - Floating Glass Island */}
            <div data-tour="canvas" className="h-full min-h-0 flex flex-col relative">
              <div className="h-full min-h-0 flex flex-col rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/5 relative">
                {/* Mode Toggle Pills - Fixed Header */}
                <div className="flex-shrink-0 flex items-center justify-center gap-4 py-5 px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                  {/* View Mode Toggle - All 4 buttons in one group */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg shadow-black/10 flex items-center gap-2 border border-slate-200/50">
                    {/* List View */}
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setPreviewMode(false);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-2 min-w-[100px] justify-center ${
                        viewMode === "list" && !previewMode
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <List className="h-4 w-4" />
                      List View
                    </button>

                    {/* Flow View */}
                    <button
                      onClick={() => setViewMode("canvas")}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-2 min-w-[100px] justify-center ${
                        viewMode === "canvas"
                          ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/30"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Network className="h-4 w-4" />
                      Flow View
                    </button>

                    {/* Divider - only show when in List View */}
                  {viewMode === "list" && (
                      <div className="h-8 w-px bg-slate-200" />
                    )}

                    {/* Editor - only show when in List View */}
                    {viewMode === "list" && (
                      <button
                        onClick={() => setPreviewMode(false)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-2 min-w-[100px] justify-center ${
                          !previewMode
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/30"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Edit3 className="h-4 w-4" />
                        Editor
                      </button>
                    )}

                    {/* Preview - only show when in List View */}
                    {viewMode === "list" && (
                      <button
                        onClick={() => setPreviewMode(true)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-2 min-w-[100px] justify-center ${
                          previewMode
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                        Preview
                      </button>
                  )}
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {viewMode === "canvas" ? (
                    <div className="h-full w-full">
                      <VisualEditor 
                        tasks={procedure?.steps || []}
                        onNodeUpdate={(nodeId, updatedStepData) => {
                          // Update the corresponding step in the procedure
                          if (procedure) {
                            const stepIndex = procedure.steps.findIndex(s => s.id === nodeId);
                            if (stepIndex !== -1) {
                              const updatedSteps = [...procedure.steps];
                              // If updatedStepData has ui.position, it's a position update from drag
                              if (updatedStepData.ui?.position) {
                                updatedSteps[stepIndex] = {
                                  ...updatedSteps[stepIndex],
                                  ui: updatedStepData.ui,
                                };
                              } else {
                                // Otherwise, it's a config update
                                updatedSteps[stepIndex] = {
                                  ...updatedSteps[stepIndex],
                                  config: {
                                    ...updatedSteps[stepIndex].config,
                                    ...updatedStepData,
                                  },
                                };
                              }
                              handleStepsChange(updatedSteps);
                            }
                          }
                        }}
                        onNodeSelect={handleStepSelect}
                        onConnect={handleConnect}
                        onAddStep={(action, position) => {
                          // Handle adding step from canvas drop with position
                          handleAddStep(action as AtomicAction, position);
                        }}
                        onDeleteStep={async (stepId) => {
                          // Handle step deletion
                          if (!procedure) return;
                          const updatedSteps = procedure.steps.filter(s => s.id !== stepId);
                          await handleStepsChange(updatedSteps);
                          // Deselect if deleted step was selected
                          if (selectedStepId === stepId) {
                            setSelectedStepId(null);
                          }
                        }}
                        onEdgesDelete={async (deletedEdges) => {
                          // Direct edge deletion handler - updates procedure steps immediately
                          if (!procedure) return;
                          
                          const updatedSteps = [...procedure.steps];
                          let hasChanges = false;
                          
                          deletedEdges.forEach((edge) => {
                            const sourceStepIndex = updatedSteps.findIndex(s => s.id === edge.source);
                            if (sourceStepIndex === -1) return;
                            
                            const sourceStep = updatedSteps[sourceStepIndex];
                            const sourceHandle = edge.sourceHandle;
                            
                            // Reset the specific route based on the Handle ID
                            if (sourceHandle === 'success' || sourceHandle === 'pass') {
                              if (sourceStep.routes?.onSuccessStepId) {
                                updatedSteps[sourceStepIndex] = {
                                  ...sourceStep,
                                  routes: {
                                    ...sourceStep.routes,
                                    onSuccessStepId: undefined,
                                  },
                                };
                                hasChanges = true;
                              }
                            } else if (sourceHandle === 'failure' || sourceHandle === 'fail') {
                              if (sourceStep.routes?.onFailureStepId) {
                                updatedSteps[sourceStepIndex] = {
                                  ...sourceStep,
                                  routes: {
                                    ...sourceStep.routes,
                                    onFailureStepId: undefined,
                                  },
                                };
                                hasChanges = true;
                              }
                            } else if (sourceHandle && sourceHandle.startsWith('condition-')) {
                              // Handle Gateway specific condition
                              const condIndex = parseInt(sourceHandle.split('-')[1]);
                              const conditions = [...(sourceStep.config?.conditions || [])];
                              if (conditions[condIndex]?.nextStepId) {
                                conditions[condIndex] = {
                                  ...conditions[condIndex],
                                  nextStepId: undefined,
                                };
                                updatedSteps[sourceStepIndex] = {
                                  ...sourceStep,
                                  config: {
                                    ...sourceStep.config,
                                    conditions,
                                  },
                                };
                                hasChanges = true;
                              }
                            } else {
                              // Default path
                              if (sourceStep.action === "GATEWAY") {
                                if (sourceStep.config?.defaultNextStepId) {
                                  updatedSteps[sourceStepIndex] = {
                                    ...sourceStep,
                                    config: {
                                      ...sourceStep.config,
                                      defaultNextStepId: undefined,
                                    },
                                  };
                                  hasChanges = true;
                                }
                              } else {
                                if (sourceStep.routes?.defaultNextStepId) {
                                  updatedSteps[sourceStepIndex] = {
                                    ...sourceStep,
                                    routes: {
                                      ...sourceStep.routes,
                                      defaultNextStepId: undefined,
                                    },
                                  };
                                  hasChanges = true;
                                }
                              }
                            }
                          });
                          
                          // Save if changed
                          if (hasChanges) {
                            await handleStepsChange(updatedSteps);
                          }
                        }}
                        procedureTrigger={procedure?.trigger}
                      />
                    </div>
                  ) : previewMode ? (
                    <div className="flex justify-center min-h-full overflow-y-auto p-8">
                      <MobilePreview
                        step={procedure && selectedStepId ? procedure.steps.find(s => s.id === selectedStepId) || null : null}
                        allSteps={procedure?.steps || []}
                      />
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto overflow-x-hidden p-8">
                      <SortableCanvas
                        steps={procedure?.steps || []}
                        selectedStepId={selectedStepId}
                        onStepsChange={handleStepsChange}
                        onStepSelect={handleStepSelect}
                        onDropAction={handleAddStep}
                        onDeleteStep={handleDeleteStep}
                        validationErrors={validationErrorsMap}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Pane: Inspector - Floating Glass Island */}
            <div 
              data-tour="config-panel" 
              className="h-full min-w-[420px] overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/5"
            >
              <ConfigPanel
                step={procedure && selectedStepId ? procedure.steps.find(s => s.id === selectedStepId) || null : null}
                allSteps={procedure?.steps || []}
                onUpdate={handleStepUpdate}
                validationError={selectedStepId ? validationErrorsMap.get(selectedStepId) : null}
                procedureTrigger={procedure?.trigger}
              />
            </div>
          </div>
        </DesignerDndContext>
        </div>
      </main>

      {/* Trigger Settings Modal */}
      <TriggerConfigModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        procedure={procedure}
        onSave={handleSaveTrigger}
      />

      {/* Description Modal */}
      <DescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        description={procedureDescription}
        onSave={(desc) => {
          setProcedureDescription(desc);
          // Auto-save if procedure exists
          if (procedure && procedure.id && !procedure.id.startsWith("temp-")) {
            handleSaveProcedure();
          }
        }}
      />
    </div>
  );
}

// DndContext Wrapper Component
function DesignerDndContext({
  children,
  selectedProcedure,
  onStepsChange,
  onDropAction,
}: {
  children: React.ReactNode;
  selectedProcedure: Procedure | null;
  onStepsChange: (steps: AtomicStep[]) => void;
  onDropAction: (action: AtomicAction) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Handle dropping atomic action onto canvas
    if (active.data.current?.type === "atomic-action") {
      // Can drop on canvas drop zone, end drop zone, or on existing steps
      if (over && (
        over.id === "canvas-drop-zone" || 
        over.id === "canvas-end-drop-zone" ||
        (selectedProcedure && selectedProcedure.steps.some(s => s.id === over.id))
      )) {
        const action = active.data.current.action as AtomicAction;
        onDropAction(action);
        return;
      }
      // If dropped outside, do nothing
      return;
    }

    // Handle reordering steps (only if procedure exists and both are steps)
    if (selectedProcedure && active.data.current?.type === "step" && over && active.id !== over.id) {
      const steps = selectedProcedure.steps;
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSteps = arrayMove(steps, oldIndex, newIndex);
        onStepsChange(newSteps);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {/* Drag preview will be handled by individual components */}
      </DragOverlay>
    </DndContext>
  );
}
