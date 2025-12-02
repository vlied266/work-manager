"use client";

import { useEffect, useState, use } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure } from "@/types/schema";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { arrayMove, useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, X, ArrowRight, GripVertical, ArrowDown, Search, Trash2, Workflow } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Process Composer</h1>
                  <p className="text-sm text-slate-600">Compose processes from existing procedures</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Studio
              </Link>
              {processGroup && processGroup.id && !processGroup.id.startsWith("temp-") && (
                <button
                  onClick={handleDeleteProcess}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-medium text-rose-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Process Info */}
      <div className="mx-auto max-w-[1600px] px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg mb-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Process Title *
              </label>
              <input
                type="text"
                value={processTitle}
                onChange={(e) => setProcessTitle(e.target.value)}
                placeholder="e.g., HR Onboarding Flow"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Description *
              </label>
              <input
                type="text"
                value={processDescription}
                onChange={(e) => setProcessDescription(e.target.value)}
                placeholder="Brief description of this process flow..."
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-200"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                Active (visible in dashboard)
              </label>
            </div>
            {processGroup && processGroup.id && !processGroup.id.startsWith("temp-") ? (
              <button
                onClick={handleSaveProcess}
                disabled={!processTitle.trim() || !processDescription.trim() || saving}
                className="rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <button
                onClick={handleCreateProcess}
                disabled={
                  !processTitle.trim() ||
                  !processDescription.trim() ||
                  !processGroup ||
                  processGroup.procedureSequence.length === 0 ||
                  saving
                }
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Creating..." : "Create Process"}
              </button>
            )}
          </div>
          {processGroup && processGroup.procedureSequence.length === 0 && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-900 font-medium">
                💡 Add at least one procedure from the library to create the process
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Main Content - 2 Pane Layout */}
      <main className="mx-auto max-w-[1600px] px-6 pb-8">
        <ProcessDndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-[340px_1fr] gap-6 h-[calc(100vh-320px)] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg">
            {/* Left Pane: Procedure Library (ONLY Procedures, no Atomic Tasks) */}
            <ProcedureLibrary procedures={filteredProcedures} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

            {/* Center Pane: Process Timeline */}
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

// Left Pane: Procedure Library (ONLY Procedures)
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
    <div className="h-full overflow-y-auto bg-white/50 backdrop-blur-xl border-r border-slate-200 p-6">
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm pb-4 mb-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Procedure Library</h2>
        <p className="text-xs text-slate-600 mb-3">Drag to add to your process</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search procedures..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {procedures.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No published procedures found</p>
          <p className="text-xs text-slate-400 mt-1">Publish procedures in the Procedure Builder first</p>
        </div>
      ) : (
        <div className="space-y-3">
          {procedures.map((procedure) => (
            <DraggableProcedureCard key={procedure.id} procedure={procedure} />
          ))}
        </div>
      )}
    </div>
  );
}

// Draggable Procedure Card
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
        rotate: isDragging ? "2deg" : "0deg",
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl border-2 border-green-200 bg-green-50 p-4 transition-all hover:bg-green-100 ${
        isDragging ? "shadow-2xl z-50 opacity-90" : "shadow-sm"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-green-900">{procedure.title}</h4>
          {procedure.description && (
            <p className="text-xs text-green-700 mt-1 line-clamp-2">{procedure.description}</p>
          )}
          <p className="text-xs text-green-600 mt-2">
            {procedure.steps.length} step{procedure.steps.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Center Pane: Process Timeline
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
      className={`h-full overflow-y-auto bg-slate-50/50 p-6 transition-colors ${
        isOver ? "bg-green-50/50" : ""
      }`}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Process Flow</h2>
        <p className="text-xs text-slate-600 mt-1">
          {sequence.length} procedure{sequence.length !== 1 ? "s" : ""} in sequence
        </p>
      </div>

      {sequence.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-2xl border-2 border-dashed border-slate-300 bg-white/50"
        >
          <ArrowRight className="h-16 w-16 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Drag your first Procedure here
          </h3>
          <p className="text-sm text-slate-600 text-center max-w-sm">
            Start building your process by dragging procedures from the left sidebar
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
  );
}

// Sortable Procedure Item in Timeline
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
        className={`group relative rounded-xl border-2 p-4 transition-all ${
          isDragging ? "shadow-2xl border-green-500" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
          >
            <GripVertical className="h-5 w-5 text-slate-400" />
          </div>

          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 font-semibold">
              {index + 1}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-900">{procedure.title}</h3>
            </div>
            {procedure.description && (
              <p className="text-xs text-slate-600 mb-2">{procedure.description}</p>
            )}
            <p className="text-xs text-slate-500">
              {procedure.steps.length} step{procedure.steps.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={onRemove}
            className="flex-shrink-0 rounded-lg p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Flow Arrow */}
      {!isLast && (
        <div className="flex justify-center my-2">
          <ArrowDown className="h-6 w-6 text-slate-400" />
        </div>
      )}
    </>
  );
}

