"use client";

import { useEffect, useState, use } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure } from "@/types/schema";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { arrayMove, useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, X, ArrowRight, GripVertical, ArrowDown, Search, Trash2, Workflow, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface ProcessComposerPageProps {
  params: Promise<{ id: string }>;
}

export default function ProcessComposerPage({ params: paramsPromise }: ProcessComposerPageProps) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [processGroup, setProcessGroup] = useState<ProcessGroup | null>(null);
  const [processTitle, setProcessTitle] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Published Procedures (ONLY Procedures, no Atomic Tasks)
  useEffect(() => {
    const q = query(
      collection(db, "procedures"),
      where("organizationId", "==", organizationId),
      where("isPublished", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const procs = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            steps: doc.data().steps || [],
          })) as Procedure[];
        procs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setProcedures(procs);
      },
      (error) => {
        console.error("Error fetching procedures:", error);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

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
  }, [id, router]);

  const handleCreateProcess = async () => {
    if (!processTitle.trim() || !processDescription.trim()) {
      alert("Please fill in title and description before creating the process.");
      return;
    }
    
    if (!processGroup || !processGroup.procedureSequence || processGroup.procedureSequence.length === 0) {
      alert("Please add at least one procedure from the library before creating the process.");
      return;
    }

    // Validate procedure IDs exist
    const procedureIds = processGroup.procedureSequence;
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
        procedureSequence: validIds.length > 0 ? validIds : procedureIds, // Use validated IDs or original
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
    
    const procedureIds = processGroup.procedureSequence || [];
    if (procedureIds.length === 0) {
      alert("Please add at least one procedure before saving.");
      return;
    }

    // Validate procedure IDs
    const validIds = procedureIds.filter(id => procedures.some(p => p.id === id));
    if (validIds.length !== procedureIds.length) {
      const invalidIds = procedureIds.filter(id => !procedures.some(p => p.id === id));
      console.warn("⚠️ Invalid procedure IDs found:", invalidIds);
    }

    setSaving(true);
    try {
      const updateData = {
        title: processTitle.trim(),
        description: processDescription.trim() || undefined,
        isActive,
        procedureSequence: validIds.length > 0 ? validIds : procedureIds,
        updatedAt: serverTimestamp(),
      };
      
      console.log("💾 Saving Process Group:", {
        id: processGroup.id,
        ...updateData,
        procedureCount: updateData.procedureSequence.length,
        procedureIds: updateData.procedureSequence,
      });
      
      await updateDoc(doc(db, "process_groups", processGroup.id), updateData);
      
      console.log("✅ Process Group saved successfully");
      alert(`Process saved successfully with ${updateData.procedureSequence.length} procedure(s)!`);
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

    // Create process group in memory if it doesn't exist yet
    if (!processGroup) {
      // Handle dropping procedure onto canvas
      if (active.data.current?.type === "procedure" && over.id === "process-timeline") {
        const procedureId = active.data.current.procedureId as string;
        const tempGroup: ProcessGroup = {
          id: `temp-${Date.now()}`,
          organizationId,
          title: processTitle || "New Process",
          description: processDescription || "",
          icon: "FolderOpen",
          procedureSequence: [procedureId],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProcessGroup(tempGroup);
      }
      return;
    }

    // Handle dropping procedure onto canvas
    if (active.data.current?.type === "procedure" && over.id === "process-timeline") {
      const procedureId = active.data.current.procedureId as string;
      if (!processGroup.procedureSequence.includes(procedureId)) {
        const updatedSequence = [...processGroup.procedureSequence, procedureId];
        const updated = { ...processGroup, procedureSequence: updatedSequence };
        setProcessGroup(updated);
        // Auto-save to Firestore only if process group already exists in DB
        if (processGroup.id && !processGroup.id.startsWith("temp-")) {
          updateDoc(doc(db, "process_groups", processGroup.id), {
            procedureSequence: updatedSequence,
            updatedAt: serverTimestamp(),
          }).catch(console.error);
        }
      }
      return;
    }

    // Handle reordering procedures in sequence
    if (active.data.current?.type === "sequence-item" && active.id !== over.id) {
      const sequence = processGroup.procedureSequence;
      const oldIndex = sequence.findIndex((id) => id === active.id);
      const newIndex = sequence.findIndex((id) => id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSequence = arrayMove(sequence, oldIndex, newIndex);
        const updated = { ...processGroup, procedureSequence: newSequence };
        setProcessGroup(updated);
        // Auto-save to Firestore only if process group already exists in DB
        if (processGroup.id && !processGroup.id.startsWith("temp-")) {
          updateDoc(doc(db, "process_groups", processGroup.id), {
            procedureSequence: newSequence,
            updatedAt: serverTimestamp(),
          }).catch(console.error);
        }
      }
    }
  };

  const handleRemoveProcedure = async (procedureId: string) => {
    if (!processGroup) return;
    const updatedSequence = processGroup.procedureSequence.filter((id) => id !== procedureId);
    const updated = { ...processGroup, procedureSequence: updatedSequence };
    setProcessGroup(updated);
    // Auto-save only if process group already exists in DB
    if (processGroup.id && !processGroup.id.startsWith("temp-")) {
      try {
        await updateDoc(doc(db, "process_groups", processGroup.id), {
          procedureSequence: updatedSequence,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error removing procedure:", error);
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

  // Filter procedures by search query
  const filteredProcedures = procedures.filter((proc) =>
    proc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    !processGroup ||
                    processGroup.procedureSequence.length === 0 ||
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
            <ProcedureLibrary procedures={filteredProcedures} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

            {/* Right Canvas: Process Flow - Floating Glass Island */}
            <ProcessTimeline
              processGroup={processGroup || {
                id: "temp",
                organizationId,
                title: processTitle || "New Process",
                description: processDescription || "",
                icon: "FolderOpen",
                procedureSequence: [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              }}
              procedures={procedures}
              onRemoveProcedure={handleRemoveProcedure}
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

// Left Pane: Procedure Library - Apple Aesthetic
function ProcedureLibrary({
  procedures,
  searchQuery,
  onSearchChange,
}: {
  procedures: Procedure[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <div className="h-full overflow-hidden rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/5 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/20">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight mb-1">Library</h2>
        <p className="text-xs text-slate-600 mb-4">Drag to add to your process</p>
        
        {/* macOS Spotlight-style Search */}
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
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
        {procedures.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">No published procedures</p>
            <p className="text-xs text-slate-500 mt-1">Publish procedures first</p>
          </div>
        ) : (
          procedures.map((procedure) => (
            <DraggableProcedureCard key={procedure.id} procedure={procedure} />
          ))
        )}
      </div>
    </div>
  );
}

// Draggable Procedure Card - Apple Aesthetic
function DraggableProcedureCard({ procedure }: { procedure: Procedure }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `procedure-${procedure.id}`,
    data: {
      type: "procedure",
      procedureId: procedure.id,
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
          <h4 className="text-sm font-semibold text-slate-800 tracking-tight mb-1 leading-tight">{procedure.title}</h4>
          {procedure.description && (
            <p className="text-xs text-slate-600 line-clamp-2 mb-2">{procedure.description}</p>
          )}
          <p className="text-xs text-slate-500 font-medium">
            {procedure.steps.length} step{procedure.steps.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Right Canvas: Process Flow - Apple Aesthetic
function ProcessTimeline({
  processGroup,
  procedures,
  onRemoveProcedure,
}: {
  processGroup: ProcessGroup;
  procedures: Procedure[];
  onRemoveProcedure: (procedureId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "process-timeline",
  });

  const sequence = processGroup.procedureSequence || [];
  const sequenceProcedures = sequence
    .map((id) => procedures.find((p) => p.id === id))
    .filter((p): p is Procedure => p !== undefined);

  return (
    <div
      ref={setNodeRef}
      className={`h-full overflow-hidden rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/5 relative ${
        isOver ? "bg-blue-50/30" : ""
      }`}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden p-8">
        {sequence.length === 0 ? (
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
                {sequenceProcedures.map((procedure, index) => (
                  <SortableProcedureItem
                    key={procedure.id}
                    procedure={procedure}
                    index={index}
                    isLast={index === sequenceProcedures.length - 1}
                    onRemove={() => onRemoveProcedure(procedure.id)}
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

// Sortable Procedure Item in Timeline - Apple Aesthetic
function SortableProcedureItem({
  procedure,
  index,
  isLast,
  onRemove,
}: {
  procedure: Procedure;
  index: number;
  isLast: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: procedure.id,
    data: {
      type: "sequence-item",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group relative rounded-xl bg-white shadow-lg p-5 transition-all ${
          isDragging ? "shadow-2xl scale-105 ring-1 ring-[#007AFF]/30" : "hover:shadow-xl hover:-translate-y-1"
        }`}
      >
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
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{procedure.title}</h3>
            </div>
            {procedure.description && (
              <p className="text-xs text-slate-600 mb-2 line-clamp-2">{procedure.description}</p>
            )}
            <p className="text-xs text-slate-500 font-medium">
              {procedure.steps.length} step{procedure.steps.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Remove Button */}
          <button
            onClick={onRemove}
            className="flex-shrink-0 rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
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
