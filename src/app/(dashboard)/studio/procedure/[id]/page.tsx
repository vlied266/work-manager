"use client";

import { useEffect, useState, use } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure, AtomicStep, AtomicAction, ATOMIC_ACTION_METADATA } from "@/types/schema";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ArrowLeft, X, Trash2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DraggableSidebar } from "@/components/design/draggable-sidebar";
import { SortableCanvas } from "@/components/design/sortable-canvas";
import { ConfigPanel } from "@/components/design/config-panel";
import { useRouter } from "next/navigation";
import { useProcedureValidation } from "@/hooks/use-procedure-validation";
import { useStudioTour } from "@/components/studio/StudioTour";
import { HelpCircle } from "lucide-react";

interface ProcedureBuilderPageProps {
  params: Promise<{ id: string }>;
}

export default function ProcedureBuilderPage({ params: paramsPromise }: ProcedureBuilderPageProps) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [procedureTitle, setProcedureTitle] = useState("");
  const [procedureDescription, setProcedureDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);


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
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setProcedure(tempProcedure);
          setProcedureTitle(tempProcedure.title);
          setProcedureDescription(tempProcedure.description);
          setIsPublished(false);
          setLoading(false);
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
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving procedure:", error);
      alert("Failed to save procedure");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async (action: AtomicAction) => {
    // Create procedure in memory if it doesn't exist yet
    if (!procedure) {
      const newStep: AtomicStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${ATOMIC_ACTION_METADATA[action].label} Step`,
        action,
        config: {},
      };
      // Create a temporary procedure object in memory (not saved to Firestore yet)
      const tempProcedure: Procedure = {
        id: `temp-${Date.now()}`,
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
    };
    const updatedSteps = [...procedure.steps, newStep];
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
  const isFirstProcedure = id === "new" || (procedure?.id && procedure.id.startsWith("temp-"));
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
    <div className="min-h-screen bg-white">
      {/* Premium Header with Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="mx-auto max-w-[1800px] px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20"
              >
                <FileText className="h-7 w-7" strokeWidth={1.5} />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-1.5">
                  Procedure Builder
                </h1>
                <p className="text-sm font-medium text-slate-500 tracking-wide">
                  Build procedures from atomic tasks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={startTour}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2.5 rounded-2xl border border-blue-200 bg-blue-50/80 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-100/80 hover:shadow-md"
                title="Start Studio Tour"
              >
                <HelpCircle className="h-4 w-4" strokeWidth={2} />
                Help
              </motion.button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  Back to Studio
                </Link>
              </motion.div>
              {procedure && procedure.id && !procedure.id.startsWith("temp-") && (
                <motion.button
                  onClick={handleDeleteProcedure}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-rose-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50/80 hover:shadow-md"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                  Delete
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Procedure Info - Premium Card */}
      <div className="mx-auto max-w-[1800px] px-8 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-10 shadow-xl shadow-slate-900/5 mb-8"
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3 tracking-wide">
                Procedure Title *
              </label>
              <input
                type="text"
                value={procedureTitle}
                onChange={(e) => setProcedureTitle(e.target.value)}
                placeholder="e.g., Invoice Generation"
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3 tracking-wide">
                Description *
              </label>
              <input
                type="text"
                value={procedureDescription}
                onChange={(e) => setProcedureDescription(e.target.value)}
                placeholder="Brief description of what this procedure does..."
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-6 w-6 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
              />
              <label htmlFor="isPublished" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Published (visible in Process Composer)
              </label>
            </div>
            {procedure && procedure.id && !procedure.id.startsWith("temp-") ? (
              <>
                <motion.button
                  onClick={handleSaveProcedure}
                  disabled={!procedureTitle.trim() || !procedureDescription.trim() || !validation.isValid || saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-10 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </motion.button>
                {!validation.isValid && validation.errorCount > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-rose-600 font-semibold mt-2"
                  >
                    {validation.errorCount} step{validation.errorCount !== 1 ? "s" : ""} need attention before publishing
                  </motion.p>
                )}
              </>
            ) : (
              <>
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
                  className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-10 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/30 transition-all hover:shadow-xl hover:shadow-slate-900/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {saving ? "Creating..." : "Create Procedure"}
                </motion.button>
                {!validation.isValid && validation.errorCount > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-rose-600 font-semibold mt-2"
                  >
                    {validation.errorCount} step{validation.errorCount !== 1 ? "s" : ""} need attention before publishing
                  </motion.p>
                )}
              </>
            )}
          </div>
          {procedure && procedure.steps.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-xl bg-blue-50/80 border border-blue-200/80 p-5 backdrop-blur-sm"
            >
              <p className="text-sm text-blue-900 font-semibold">
                💡 Add at least one atomic task from the library to create the procedure
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Main Content - 3 Pane Layout - Premium */}
      <main className="mx-auto max-w-[1800px] px-8 pb-12">
        <DesignerDndContext
          selectedProcedure={procedure}
          onStepsChange={handleStepsChange}
          onDropAction={handleAddStep}
        >
          <div className="grid grid-cols-[320px_1fr_480px] gap-8 h-[calc(100vh-380px)] rounded-3xl overflow-hidden border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-900/10">
            {/* Left Pane: Atomic Actions Toolbox - Always Visible */}
            <div data-tour="toolbox" className="h-full min-h-0 overflow-hidden">
              <DraggableSidebar />
            </div>

            {/* Center Pane: Procedure Builder Canvas - Always visible with drop zone */}
            <div data-tour="canvas" className="h-full">
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

            {/* Right Pane: Step Inspector */}
            <div data-tour="config-panel" className="h-full">
              <ConfigPanel
                step={procedure && selectedStepId ? procedure.steps.find(s => s.id === selectedStepId) || null : null}
                allSteps={procedure?.steps || []}
                onUpdate={handleStepUpdate}
                validationError={selectedStepId ? validationErrorsMap.get(selectedStepId) : null}
              />
            </div>
          </div>
        </DesignerDndContext>
      </main>
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
    if (!over) return;

    // Handle dropping atomic action onto canvas (works even if procedure doesn't exist yet)
    if (active.data.current?.type === "atomic-action" && over.id === "canvas-drop-zone") {
      const action = active.data.current.action as AtomicAction;
      onDropAction(action);
      return;
    }

    // Handle reordering steps (only if procedure exists)
    if (selectedProcedure && active.data.current?.type === "step" && active.id !== over.id) {
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

