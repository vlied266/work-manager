"use client";

import { useEffect, useState, use } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure, AtomicStep, AtomicAction, ATOMIC_ACTION_METADATA } from "@/types/schema";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ArrowLeft, ArrowRight, X, Trash2, FileText, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DraggableSidebar } from "@/components/design/draggable-sidebar";
import { SortableCanvas } from "@/components/design/sortable-canvas";
import { ConfigPanel } from "@/components/design/config-panel";
import { useRouter } from "next/navigation";
import { useProcedureValidation } from "@/hooks/use-procedure-validation";
import { useStudioTour } from "@/components/studio/StudioTour";
import { HelpCircle, Edit3, Smartphone, List, Network } from "lucide-react";
import { MobilePreview } from "@/components/studio/mobile-preview";
import { VisualEditor } from "@/components/studio/VisualEditor";

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
  const [previewMode, setPreviewMode] = useState(false); // false = Edit Mode, true = Preview Mode
  const [viewMode, setViewMode] = useState<"list" | "canvas">("list"); // "list" = List View, "canvas" = Flow View


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
      {/* Minimalist Header with Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/30">
        <div className="mx-auto max-w-[1800px] px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                <Link
                  href="/studio"
                  className="flex items-center gap-1 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  <span>Back</span>
                </Link>
              </div>
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

              <div className="h-6 w-[1px] bg-gray-300 mx-1" />

              {procedure && procedure.id && !procedure.id.startsWith("temp-") ? (
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
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Remove the old Procedure Info Card section since it's now in the header */}
      
      {/* Main Content - Floating Glass Islands */}
      <main className="mx-auto max-w-[1800px] px-8 pb-8 pt-8 h-[calc(100vh-100px)]">
        <DesignerDndContext
          selectedProcedure={procedure}
          onStepsChange={handleStepsChange}
          onDropAction={handleAddStep}
          key={procedure?.id || "new"}
        >
          <div className="grid grid-cols-[300px_1fr_420px] gap-10 h-full">
            {/* Left Pane: Toolbox - Floating Glass Island */}
            <div 
              data-tour="toolbox" 
              className="h-full overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/5"
            >
              <DraggableSidebar />
            </div>

            {/* Center Pane: Canvas - Floating Glass Island */}
            <div data-tour="canvas" className="h-full min-h-0 flex flex-col relative">
              {/* Editable H1 Title */}
              <div className="mb-6">
                <input
                  type="text"
                  value={procedureTitle}
                  onChange={(e) => setProcedureTitle(e.target.value)}
                  placeholder="Untitled Procedure"
                  className="bg-transparent text-4xl font-extrabold text-slate-800 tracking-tight placeholder:text-slate-400 focus:outline-none focus:ring-0 p-0 border-none w-full"
                />
              </div>

              <div className="h-full min-h-0 flex flex-col rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/5 relative">
                {/* Mode Toggle Pills - Fixed Header */}
                <div className="flex-shrink-0 flex items-center justify-between py-4 px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                  {/* View Mode Toggle (List/Canvas) */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-full p-1 shadow-lg shadow-black/10 flex items-center gap-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
                        viewMode === "list" ? "bg-white text-slate-800 shadow-md" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                      List View
                    </button>
                    <button
                      onClick={() => setViewMode("canvas")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
                        viewMode === "canvas" ? "bg-white text-slate-800 shadow-md" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      <Network className="h-3.5 w-3.5" />
                      Flow View
                    </button>
                  </div>

                  {/* Preview Mode Toggle (only show in List View) */}
                  {viewMode === "list" && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-full p-1 shadow-lg shadow-black/10 flex items-center gap-1">
                      <button
                        onClick={() => setPreviewMode(false)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all ${
                          !previewMode ? "bg-white text-slate-800 shadow-md" : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        onClick={() => setPreviewMode(true)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all ${
                          previewMode ? "bg-white text-slate-800 shadow-md" : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {viewMode === "canvas" ? (
                    <div className="h-full w-full">
                      <VisualEditor tasks={procedure?.steps || []} />
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
              className="h-full overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/5"
            >
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
