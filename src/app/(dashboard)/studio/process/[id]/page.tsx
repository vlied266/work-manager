"use client";

import { useEffect, useState, use } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure } from "@/types/schema";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { arrayMove, useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, X, ArrowRight, GripVertical, ArrowDown, Search, Trash2, Workflow, FileText, Loader2, AlertTriangle, ChevronDown, ChevronUp, Link2, Clock } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { VariableSelector, ProcessStep } from "@/components/process/VariableSelector";
import { useOrgId } from "@/hooks/useOrgData";
import { useOrganization } from "@/contexts/OrganizationContext";

interface ProcessComposerPageProps {
  params: Promise<{ id: string }>;
}

export default function ProcessComposerPage({ params: paramsPromise }: ProcessComposerPageProps) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  // Get organizationId from auth context
  const orgIdFromHook = useOrgId();
  const { organizationId: orgIdFromContext } = useOrganization();
  const organizationId = orgIdFromHook || orgIdFromContext || "default-org";
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [processGroup, setProcessGroup] = useState<ProcessGroup | null>(null);
  // Local state for ProcessSteps (richer than procedureSequence)
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [processTitle, setProcessTitle] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proceduresLoading, setProceduresLoading] = useState(true);
  const [proceduresError, setProceduresError] = useState<string | null>(null);

  // Fetch Active/Published Procedures for this organization (Smart Toolbox)
  useEffect(() => {
    // Debug logging
    console.log("🔍 ProcedureLibrary useEffect triggered:", {
      organizationId,
      orgIdFromHook,
      orgIdFromContext,
      isLoaded: !!organizationId && organizationId !== "default-org",
    });

    // Don't run query if organizationId is not available
    if (!organizationId || organizationId === "default-org") {
      console.warn("⚠️ Organization ID not available yet, skipping query");
      setProceduresLoading(false);
      return;
    }

    setProceduresLoading(true);
    setProceduresError(null);
    
    console.log("📡 Fetching procedures with query:", {
      collection: "procedures",
      organizationId,
      // Temporarily removing isPublished filter for testing
      // isPublished: true,
    });
    
    // Build query - temporarily removing isPublished filter to test
    const q = query(
      collection(db, "procedures"),
      where("organizationId", "==", organizationId)
      // Temporarily commented out for testing
      // where("isPublished", "==", true) // Only show published procedures
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📦 Procedures snapshot received:", {
          count: snapshot.docs.length,
          docs: snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            organizationId: doc.data().organizationId,
            isPublished: doc.data().isPublished,
          })),
        });

        const procs = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              steps: data.steps || [],
              trigger: data.trigger || { type: "MANUAL" },
            } as Procedure;
          });
        procs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        
        // Filter by isPublished in memory (temporary workaround)
        const publishedProcs = procs.filter(p => p.isPublished === true);
        
        console.log("✅ Procedures processed:", {
          total: procs.length,
          published: publishedProcs.length,
          unpublished: procs.length - publishedProcs.length,
        });
        
        setProcedures(publishedProcs);
        setProceduresLoading(false);
      },
      (error) => {
        console.error("❌ Error fetching procedures:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          organizationId,
        });
        setProceduresError("Failed to load procedures. Please try again.");
        setProceduresLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId, orgIdFromHook, orgIdFromContext]);

  // Fetch Process Group if editing
  useEffect(() => {
    if (id === "new") {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "process_groups", id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const group = {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            procedureSequence: data.procedureSequence || [],
            isActive: data.isActive !== undefined ? data.isActive : true,
          } as ProcessGroup;
          setProcessGroup(group);
          setProcessTitle(group.title);
          setProcessDescription(group.description || "");
          setIsActive(group.isActive);
          
          // Initialize processSteps from saved data or migrate from procedureSequence
          if (data.processSteps && Array.isArray(data.processSteps)) {
            setProcessSteps(data.processSteps as ProcessStep[]);
          } else {
            // Migrate from old format: create ProcessSteps from procedureSequence
            const steps: ProcessStep[] = (data.procedureSequence || []).map((procId: string, index: number) => {
              const proc = procedures.find(p => p.id === procId);
              if (proc) {
                return {
                  type: 'procedure' as const,
                  instanceId: `step-${index + 1}-${procId}`,
                  procedureId: procId,
                  procedureData: proc,
                  inputMappings: {},
                };
              }
              return null;
            }).filter((s): s is ProcessStep => s !== null);
            setProcessSteps(steps);
          }
        } else {
          router.push("/studio/process/new");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching process group:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, router, procedures]);

  const handleCreateProcess = async () => {
    if (!processTitle.trim() || !processDescription.trim()) {
      alert("Please fill in title and description before creating the process.");
      return;
    }
    
    // Check for at least one procedure step (logic steps don't count)
    const procedureSteps = processSteps.filter(step => step.type === 'procedure');
    if (procedureSteps.length === 0) {
      alert("Please add at least one procedure from the library before creating the process.");
      return;
    }

    // Validate procedure IDs exist
    const procedureIds = procedureSteps.map(step => step.procedureId);
    console.log("🔍 Validating procedure IDs:", procedureIds);
    
    // Verify all procedure IDs exist in the procedures list
    const validIds = procedureIds.filter(id => procedures.some(p => p.id === id));
    if (validIds.length !== procedureIds.length) {
      const invalidIds = procedureIds.filter(id => !procedures.some(p => p.id === id));
      console.warn("⚠️ Invalid procedure IDs found:", invalidIds);
      alert(`Warning: Some procedure IDs are invalid. Only valid procedures will be saved.`);
    }

    setSaving(true);
    try {
      const processData = {
        organizationId: organizationId,
        title: processTitle.trim(),
        description: processDescription.trim(),
        icon: "FolderOpen",
        procedureSequence: validIds.length > 0 ? validIds : procedureIds, // Backward compatibility (only procedures)
        processSteps: processSteps, // New: includes logic steps
        isActive: isActive !== undefined ? isActive : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log("🔨 Creating Process Group:", {
        ...processData,
        procedureCount: processData.procedureSequence.length,
        procedureIds: processData.procedureSequence,
      });
      console.log("🔍 Organization ID:", organizationId);
      
      const docRef = await addDoc(collection(db, "process_groups"), processData);
      
      console.log("✅ Process Group created with ID:", docRef.id);
      console.log("📋 Process Group data saved:", {
        id: docRef.id,
        organizationId: processData.organizationId,
        title: processData.title,
        procedureCount: processData.procedureSequence.length,
        procedureIds: processData.procedureSequence,
        isActive: processData.isActive,
      });
      
      alert(`Process created successfully with ${processData.procedureSequence.length} procedure(s)! Redirecting...`);
      router.push(`/studio/process/${docRef.id}`);
    } catch (error) {
      console.error("❌ Error creating process group:", error);
      alert("Failed to create process group. Please check the console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProcess = async () => {
    if (!processGroup || !processTitle.trim()) {
      alert("Please fill in the title before saving.");
      return;
    }
    
    if (processSteps.length === 0) {
      alert("Please add at least one procedure before saving.");
      return;
    }

    setSaving(true);
    try {
      // Only include procedure steps in procedureSequence (backward compatibility)
      const procedureSequence = processSteps
        .filter(step => step.type === 'procedure')
        .map(step => step.procedureId);
      const updateData = {
        title: processTitle.trim(),
        description: processDescription.trim() || undefined,
        isActive,
        procedureSequence, // Backward compatibility (only procedures)
        processSteps, // New: richer data with input mappings and logic steps
        updatedAt: serverTimestamp(),
      };
      
      console.log("💾 Saving Process Group:", {
        id: processGroup.id,
        ...updateData,
        procedureCount: procedureSequence.length,
        processStepsCount: processSteps.length,
      });
      
      await updateDoc(doc(db, "process_groups", processGroup.id), updateData);
      
      console.log("✅ Process Group saved successfully");
      alert(`Process saved successfully with ${processSteps.length} procedure(s)!`);
    } catch (error) {
      console.error("❌ Error saving process group:", error);
      alert("Failed to save process group. Please check the console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Handle dropping procedure onto canvas
    if (active.data.current?.type === "procedure" && over.id === "process-timeline") {
      const procedureId = active.data.current.procedureId as string;
      const procedureMetadata = active.data.current.procedure; // Full procedure metadata
      
      // Check if procedure already exists in steps
      if (processSteps.some(step => step.type === 'procedure' && step.procedureId === procedureId)) {
        return; // Already added
      }
      
      // Find the full procedure object
      const procedure = procedures.find(p => p.id === procedureId);
      if (!procedure) return;
      
      // Create new ProcessStep
      const newStep: ProcessStep = {
        type: 'procedure',
        instanceId: `step-${Date.now()}-${procedureId}`,
        procedureId: procedureId,
        procedureData: procedureMetadata || procedure,
        inputMappings: {},
      };
      
      const updatedSteps = [...processSteps, newStep];
      setProcessSteps(updatedSteps);
      
      // Update processGroup procedureSequence for backward compatibility (only procedures)
      const updatedSequence = updatedSteps
        .filter(step => step.type === 'procedure')
        .map(step => step.procedureId);
      const tempGroup: ProcessGroup = processGroup || {
        id: `temp-${Date.now()}`,
        organizationId,
        title: processTitle || "New Process",
        description: processDescription || "",
        icon: "FolderOpen",
        procedureSequence: updatedSequence,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updated = { ...tempGroup, procedureSequence: updatedSequence };
      setProcessGroup(updated);
      
      // Auto-save to Firestore only if process group already exists in DB
      if (processGroup?.id && !processGroup.id.startsWith("temp-")) {
        updateDoc(doc(db, "process_groups", processGroup.id), {
          procedureSequence: updatedSequence,
          processSteps: updatedSteps, // Store richer data
          updatedAt: serverTimestamp(),
        }).catch(console.error);
      }
      return;
    }

    // Handle dropping delay/logic step onto canvas
    if (active.data.current?.type === "logic_delay" && over.id === "process-timeline") {
      // Create new Delay Step
      const newStep: ProcessStep = {
        type: 'logic_delay',
        instanceId: `delay-${Date.now()}`,
        config: {
          duration: 1,
          unit: 'days',
        },
      };
      
      const updatedSteps = [...processSteps, newStep];
      setProcessSteps(updatedSteps);
      
      // Update processGroup procedureSequence for backward compatibility (only procedures)
      const updatedSequence = updatedSteps
        .filter(step => step.type === 'procedure')
        .map(step => step.procedureId);
      const tempGroup: ProcessGroup = processGroup || {
        id: `temp-${Date.now()}`,
        organizationId,
        title: processTitle || "New Process",
        description: processDescription || "",
        icon: "FolderOpen",
        procedureSequence: updatedSequence,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updated = { ...tempGroup, procedureSequence: updatedSequence };
      setProcessGroup(updated);
      
      // Auto-save to Firestore only if process group already exists in DB
      if (processGroup?.id && !processGroup.id.startsWith("temp-")) {
        updateDoc(doc(db, "process_groups", processGroup.id), {
          procedureSequence: updatedSequence,
          processSteps: updatedSteps,
          updatedAt: serverTimestamp(),
        }).catch(console.error);
      }
      return;
    }

    // Handle reordering steps in sequence (works for both procedures and logic steps)
    if (active.data.current?.type === "sequence-item" && active.id !== over.id) {
      // Find by instanceId (works for both procedure and delay steps)
      const oldIndex = processSteps.findIndex((step) => step.instanceId === active.id);
      const newIndex = processSteps.findIndex((step) => step.instanceId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSteps = arrayMove(processSteps, oldIndex, newIndex);
        setProcessSteps(newSteps);
        
        // Update procedureSequence (only procedures)
        const newSequence = newSteps
          .filter(step => step.type === 'procedure')
          .map(step => step.procedureId);
        const updated = { ...processGroup!, procedureSequence: newSequence };
        setProcessGroup(updated);
        
        // Auto-save to Firestore only if process group already exists in DB
        if (processGroup?.id && !processGroup.id.startsWith("temp-")) {
          updateDoc(doc(db, "process_groups", processGroup.id), {
            procedureSequence: newSequence,
            processSteps: newSteps,
            updatedAt: serverTimestamp(),
          }).catch(console.error);
        }
      }
    }
  };
  
  // Update input mapping for a step (only for procedure steps)
  const handleUpdateInputMapping = (instanceId: string, inputField: string, value: string) => {
    const updatedSteps = processSteps.map(step => {
      if (step.instanceId === instanceId && step.type === 'procedure') {
        return {
          ...step,
          inputMappings: {
            ...step.inputMappings,
            [inputField]: value,
          },
        };
      }
      return step;
    });
    setProcessSteps(updatedSteps);
    
    // Auto-save if process group exists in DB
    if (processGroup?.id && !processGroup.id.startsWith("temp-")) {
      updateDoc(doc(db, "process_groups", processGroup.id), {
        processSteps: updatedSteps,
        updatedAt: serverTimestamp(),
      }).catch(console.error);
    }
  };

  // Update delay step config
  const handleUpdateDelayConfig = (instanceId: string, config: { duration: number; unit: 'minutes' | 'hours' | 'days' }) => {
    const updatedSteps = processSteps.map(step => {
      if (step.instanceId === instanceId && step.type === 'logic_delay') {
        return {
          ...step,
          config,
        };
      }
      return step;
    });
    setProcessSteps(updatedSteps);
    
    // Auto-save if process group exists in DB
    if (processGroup?.id && !processGroup.id.startsWith("temp-")) {
      updateDoc(doc(db, "process_groups", processGroup.id), {
        processSteps: updatedSteps,
        updatedAt: serverTimestamp(),
      }).catch(console.error);
    }
  };

  const handleRemoveProcedure = async (instanceId: string) => {
    const updatedSteps = processSteps.filter((step) => step.instanceId !== instanceId);
    setProcessSteps(updatedSteps);
    
    // Update procedureSequence (only procedures)
    const updatedSequence = updatedSteps
      .filter(step => step.type === 'procedure')
      .map(step => step.procedureId);
    const updated = { ...processGroup!, procedureSequence: updatedSequence };
    setProcessGroup(updated);
    
    // Auto-save only if process group already exists in DB
    if (processGroup?.id && !processGroup.id.startsWith("temp-")) {
      try {
        await updateDoc(doc(db, "process_groups", processGroup.id), {
          procedureSequence: updatedSequence,
          processSteps: updatedSteps,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error removing step:", error);
      }
    }
  };

  const handleDeleteProcess = async () => {
    if (!processGroup || processGroup.id.startsWith("temp-")) {
      // If it's a temp process, just clear it
      setProcessGroup(null);
      setProcessTitle("");
      setProcessDescription("");
      setIsActive(true);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${processGroup.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "process_groups", processGroup.id));
      router.push("/studio/process/new");
    } catch (error) {
      console.error("Error deleting process group:", error);
      alert("Failed to delete process. Please try again.");
    }
  };

  // Note: Filtering is now handled inside ProcedureLibrary component

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-[#F2F2F7]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 relative overflow-hidden font-sans">
      {/* Minimalist Header with Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/30">
        <div className="mx-auto max-w-[1800px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                <Link
                  href="/studio"
                  className="flex items-center gap-1 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  <span>Back</span>
                </Link>
              </div>
              <div className="h-6 w-[1px] bg-gray-300 mx-2" />
              
              <div className="flex flex-col">
                <input
                  type="text"
                  value={processTitle}
                  onChange={(e) => setProcessTitle(e.target.value)}
                  placeholder="Untitled Process"
                  className="bg-transparent text-xl font-extrabold text-slate-800 tracking-tight placeholder:text-slate-400 focus:outline-none focus:ring-0 p-0 border-none w-[400px]"
                />
                <input
                  type="text"
                  value={processDescription}
                  onChange={(e) => setProcessDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="bg-transparent text-xs font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-0 p-0 border-none w-[400px] mt-0.5"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* iOS-style Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Active</span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 ${
                    isActive ? "bg-[#007AFF]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {processGroup && processGroup.id && !processGroup.id.startsWith("temp-") && (
                <motion.button
                  onClick={handleDeleteProcess}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2 rounded-full hover:bg-rose-50 text-rose-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" strokeWidth={1.5} />
                </motion.button>
              )}

              <div className="h-6 w-[1px] bg-gray-300 mx-1" />

              {processGroup && processGroup.id && !processGroup.id.startsWith("temp-") ? (
                <motion.button
                  onClick={handleSaveProcess}
                  disabled={!processTitle.trim() || !processDescription.trim() || saving}
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
                  onClick={handleCreateProcess}
                  disabled={
                    !processTitle.trim() ||
                    !processDescription.trim() ||
                    processSteps.length === 0 ||
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
                    <>
                      <span>Create Process</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Floating Glass Islands */}
      <main className="mx-auto max-w-[1800px] px-6 pb-6 pt-6 h-[calc(100vh-80px)]">
        <ProcessDndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-[320px_1fr] gap-6 h-full">
            {/* Left Pane: Procedure Library - Floating Glass Island */}
            <ProcedureLibrary 
              procedures={procedures} 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery}
              loading={proceduresLoading}
              error={proceduresError}
            />

            {/* Right Canvas: Process Flow - Floating Glass Island */}
            <ProcessTimeline
              processSteps={processSteps}
              procedures={procedures}
              onRemoveProcedure={handleRemoveProcedure}
              onUpdateInputMapping={handleUpdateInputMapping}
              onUpdateDelayConfig={handleUpdateDelayConfig}
            />
          </div>
        </ProcessDndContext>
      </main>
    </div>
  );
}

// DndContext Wrapper
function ProcessDndContext({
  children,
  onDragEnd,
}: {
  children: React.ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      {children}
      <DragOverlay>
        {/* Drag preview will be handled by individual components */}
      </DragOverlay>
    </DndContext>
  );
}

// Left Pane: Procedure Library - Apple Aesthetic (Smart Toolbox)
function ProcedureLibrary({
  procedures,
  searchQuery,
  onSearchChange,
  loading,
  error,
}: {
  procedures: Procedure[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"procedures" | "logic">("procedures");
  const filteredProcedures = procedures.filter((proc) =>
    proc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full overflow-hidden rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/5 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/20">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight mb-1">Smart Toolbox</h2>
        <p className="text-xs text-slate-600 mb-4">Drag items to build your process</p>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("procedures")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === "procedures"
                ? "bg-[#007AFF] text-white shadow-sm"
                : "bg-white/50 text-slate-600 hover:bg-white/70"
            }`}
          >
            Procedures
          </button>
          <button
            onClick={() => setActiveTab("logic")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === "logic"
                ? "bg-[#007AFF] text-white shadow-sm"
                : "bg-white/50 text-slate-600 hover:bg-white/70"
            }`}
          >
            Logic
          </button>
        </div>
        
        {/* macOS Spotlight-style Search (only for procedures) */}
        {activeTab === "procedures" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search procedures..."
              className="w-full rounded-full bg-white/50 shadow-inner pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-black/5 focus:bg-white/70 transition-all"
            />
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
        {activeTab === "procedures" ? (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-600 font-medium">Loading procedures...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-rose-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 font-medium">{error}</p>
                <p className="text-xs text-slate-500 mt-1">Please refresh the page</p>
              </div>
            ) : filteredProcedures.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 font-medium">No published procedures found</p>
                <p className="text-xs text-slate-500 mt-1">Publish procedures in Studio to add them here</p>
              </div>
            ) : (
              filteredProcedures.map((procedure) => (
                <DraggableProcedureCard key={procedure.id} procedure={procedure} />
              ))
            )}
          </>
        ) : (
          <div className="space-y-3">
            <DraggableDelayCard />
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Procedure Card - Apple Aesthetic (Enhanced with Trigger Info)
function DraggableProcedureCard({ procedure }: { procedure: Procedure }) {
  const triggerType = procedure.trigger?.type || "MANUAL";
  
  // Get trigger badge color and label
  const getTriggerBadge = () => {
    switch (triggerType) {
      case "WEBHOOK":
        return { label: "Webhook", color: "bg-purple-100 text-purple-700" };
      case "ON_FILE_CREATED":
        return { label: "File Trigger", color: "bg-blue-100 text-blue-700" };
      case "MANUAL":
      default:
        return { label: "Manual", color: "bg-slate-100 text-slate-600" };
    }
  };

  const triggerBadge = getTriggerBadge();

  // Extract input requirements from first INPUT step
  const firstInputStep = procedure.steps.find(step => step.action === "INPUT");
  const hasInputs = firstInputStep?.config?.fields && Array.isArray(firstInputStep.config.fields) && firstInputStep.config.fields.length > 0;
  const inputCount = hasInputs ? firstInputStep.config.fields.length : 0;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `procedure-${procedure.id}`,
    data: {
      type: "procedure",
      procedureId: procedure.id,
      // Pass full procedure metadata for drop handling
      procedure: {
        id: procedure.id,
        title: procedure.title,
        description: procedure.description,
        trigger: procedure.trigger,
        steps: procedure.steps,
        inputSchema: firstInputStep?.config || null,
      },
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl bg-white shadow-lg p-4 transition-all ${
        isDragging ? "shadow-2xl z-50 opacity-90 scale-105" : "hover:shadow-xl hover:-translate-y-1"
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-sm">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-tight">{procedure.title}</h4>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${triggerBadge.color}`}>
              {triggerBadge.label}
            </span>
          </div>
          {procedure.description && (
            <p className="text-xs text-slate-600 line-clamp-2 mb-2">{procedure.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>{procedure.steps.length} step{procedure.steps.length !== 1 ? "s" : ""}</span>
            {hasInputs && (
              <>
                <span className="text-slate-300">•</span>
                <span>{inputCount} input{inputCount !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Draggable Delay Card - Logic Step
function DraggableDelayCard() {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: "logic_delay",
    data: {
      type: "logic_delay",
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl bg-white shadow-lg border-2 border-amber-200 p-4 transition-all ${
        isDragging ? "shadow-2xl z-50 opacity-90 scale-105" : "hover:shadow-xl hover:-translate-y-1"
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-sm">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-tight mb-1">Wait / Delay</h4>
          <p className="text-xs text-slate-600 line-clamp-2 mb-2">Add a delay between steps</p>
          <div className="text-xs text-slate-500 font-medium">
            Configure duration on drop
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Right Canvas: Process Flow - Apple Aesthetic
function ProcessTimeline({
  processSteps,
  procedures,
  onRemoveProcedure,
  onUpdateInputMapping,
  onUpdateDelayConfig,
}: {
  processSteps: ProcessStep[];
  procedures: Procedure[];
  onRemoveProcedure: (instanceId: string) => void;
  onUpdateInputMapping: (instanceId: string, inputField: string, value: string) => void;
  onUpdateDelayConfig: (instanceId: string, config: { duration: number; unit: 'minutes' | 'hours' | 'days' }) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "process-timeline",
  });

  // Use instanceId for sortable items (works for both procedures and logic steps)
  const sequence = processSteps.map(step => step.instanceId);

  return (
    <div
      ref={setNodeRef}
      className={`h-full overflow-hidden rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/5 relative ${
        isOver ? "bg-blue-50/30" : ""
      }`}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden p-8">
        {processSteps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full min-h-[400px]"
          >
            {/* Beautiful Empty State */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
              <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                <Workflow className="h-16 w-16 text-blue-500/70 mx-auto" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-2">
              Drag Procedures here
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-sm leading-relaxed">
              Drag published Procedures here to build your flow.
            </p>
          </motion.div>
        ) : (
          <SortableContext items={sequence} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 max-w-2xl mx-auto">
              <AnimatePresence>
                {processSteps.map((step, index) => (
                  <SortableProcedureItem
                    key={step.instanceId}
                    step={step}
                    index={index}
                    isLast={index === processSteps.length - 1}
                    previousSteps={processSteps.slice(0, index)}
                    onRemove={() => onRemoveProcedure(step.instanceId)}
                    onUpdateInputMapping={onUpdateInputMapping}
                    onUpdateDelayConfig={onUpdateDelayConfig}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

// Sortable Procedure Item in Timeline - Apple Aesthetic (Enhanced with Input Mapping)
function SortableProcedureItem({
  step,
  index,
  isLast,
  previousSteps,
  onRemove,
  onUpdateInputMapping,
  onUpdateDelayConfig,
}: {
  step: ProcessStep;
  index: number;
  isLast: boolean;
  previousSteps: ProcessStep[];
  onRemove: () => void;
  onUpdateInputMapping: (instanceId: string, inputField: string, value: string) => void;
  onUpdateDelayConfig: (instanceId: string, config: { duration: number; unit: 'minutes' | 'hours' | 'days' }) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.instanceId, // Use instanceId for both procedures and delay steps
    data: {
      type: "sequence-item",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Handle Delay Step rendering
  if (step.type === 'logic_delay') {
    return (
      <>
        <motion.div
          ref={setNodeRef}
          style={style}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`group relative rounded-xl bg-white shadow-lg border-2 border-amber-200 transition-all ${
            isDragging ? "shadow-2xl scale-105 ring-1 ring-amber-300" : "hover:shadow-xl hover:-translate-y-1"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div
                {...attributes}
                {...listeners}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
              >
                <GripVertical className="h-5 w-5 text-slate-500" strokeWidth={2} />
              </div>

              {/* Clock Icon */}
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800 tracking-tight mb-2">Wait / Delay</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={step.config.duration}
                    onChange={(e) => {
                      const duration = parseInt(e.target.value) || 1;
                      onUpdateDelayConfig(step.instanceId, { ...step.config, duration });
                    }}
                    className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  <select
                    value={step.config.unit}
                    onChange={(e) => {
                      const unit = e.target.value as 'minutes' | 'hours' | 'days';
                      onUpdateDelayConfig(step.instanceId, { ...step.config, unit });
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={onRemove}
                className="flex-shrink-0 rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Connecting Arrow */}
        {!isLast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center my-3"
          >
            <div className="relative">
              <svg className="h-6 w-6 text-blue-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path
                  d="M12 2 L12 18 M8 14 L12 18 L16 14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>
        )}
      </>
    );
  }

  // Procedure Step rendering (existing logic)
  // Extract input fields from first INPUT step
  const inputStep = step.procedureData.steps?.find(s => s.action === "INPUT");
  const inputFields = inputStep?.config?.fields && Array.isArray(inputStep.config.fields) 
    ? inputStep.config.fields 
    : [];
  const hasInputs = inputFields.length > 0;

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group relative rounded-xl bg-white shadow-lg transition-all ${
          isDragging ? "shadow-2xl scale-105 ring-1 ring-[#007AFF]/30" : "hover:shadow-xl hover:-translate-y-1"
        }`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
            >
              <GripVertical className="h-5 w-5 text-slate-500" strokeWidth={2} />
            </div>

            {/* Step Number Badge */}
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-lg">
                {index + 1}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{step.procedureData.title}</h3>
              </div>
              {step.procedureData.description && (
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">{step.procedureData.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span>{step.procedureData.steps.length} step{step.procedureData.steps.length !== 1 ? "s" : ""}</span>
                {hasInputs && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      <span>{inputFields.length} input{inputFields.length !== 1 ? "s" : ""}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={onRemove}
              className="flex-shrink-0 rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Input Mapping Section (Expandable) */}
          {hasInputs && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-200"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-blue-500" />
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Input Mapping</h4>
                </div>
                {inputFields.map((field: string) => (
                  <div key={field} className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700">
                      {field} {inputStep?.config?.required && <span className="text-rose-500">*</span>}
                    </label>
                    <VariableSelector
                      value={step.inputMappings[field] || ""}
                      onChange={(value) => onUpdateInputMapping(step.instanceId, field, value)}
                      previousSteps={previousSteps}
                      placeholder={`Map ${field} from previous steps...`}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Sleek Connecting Arrow */}
      {!isLast && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center my-3"
        >
          <div className="relative">
            {/* Subtle connecting line with arrow */}
            <svg className="h-6 w-6 text-blue-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path
                d="M12 2 L12 18 M8 14 L12 18 L16 14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
      )}
    </>
  );
}
