"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure } from "@/types/schema";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { arrayMove, useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Plus, Save, X, ArrowRight, GripVertical, ArrowDown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProcessDesignPage() {
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [processGroups, setProcessGroups] = useState<ProcessGroup[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcessGroup, setSelectedProcessGroup] = useState<ProcessGroup | null>(null);
  const [processTitle, setProcessTitle] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Process Groups
  useEffect(() => {
    const q = query(
      collection(db, "process_groups"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          procedureSequence: doc.data().procedureSequence || [],
          isActive: doc.data().isActive !== undefined ? doc.data().isActive : true,
        })) as ProcessGroup[];
        groups.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setProcessGroups(groups);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching process groups:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  // Fetch Published Procedures
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
          }))
          .filter((proc) => proc.isPublished === true && proc.processGroupId) as Procedure[];
        procs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setProcedures(procs);
      },
      (error) => {
        console.error("Error fetching procedures:", error);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  const handleCreateProcess = async () => {
    if (!processTitle.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "process_groups"), {
        organizationId,
        title: processTitle.trim(),
        description: processDescription.trim() || undefined,
        icon: "FolderOpen",
        procedureSequence: [],
        isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setProcessTitle("");
      setProcessDescription("");
      setIsActive(true);
    } catch (error) {
      console.error("Error creating process group:", error);
      alert("Failed to create process group");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProcess = async () => {
    if (!selectedProcessGroup || !processTitle.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "process_groups", selectedProcessGroup.id), {
        title: processTitle.trim(),
        description: processDescription.trim() || undefined,
        isActive,
        procedureSequence: selectedProcessGroup.procedureSequence,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving process group:", error);
      alert("Failed to save process group");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProcess = (group: ProcessGroup) => {
    setSelectedProcessGroup(group);
    setProcessTitle(group.title);
    setProcessDescription(group.description || "");
    setIsActive(group.isActive);
  };

  const handleNewProcess = () => {
    setSelectedProcessGroup(null);
    setProcessTitle("");
    setProcessDescription("");
    setIsActive(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !selectedProcessGroup) return;

    // Handle dropping procedure onto canvas
    if (active.data.current?.type === "procedure" && over.id === "process-timeline") {
      const procedureId = active.data.current.procedureId as string;
      if (!selectedProcessGroup.procedureSequence.includes(procedureId)) {
        const updatedSequence = [...selectedProcessGroup.procedureSequence, procedureId];
        setSelectedProcessGroup({ ...selectedProcessGroup, procedureSequence: updatedSequence });
        // Auto-save
        updateDoc(doc(db, "process_groups", selectedProcessGroup.id), {
          procedureSequence: updatedSequence,
          updatedAt: serverTimestamp(),
        }).catch(console.error);
      }
      return;
    }

    // Handle reordering procedures in sequence
    if (active.data.current?.type === "sequence-item" && active.id !== over.id) {
      const sequence = selectedProcessGroup.procedureSequence;
      const oldIndex = sequence.findIndex((id) => id === active.id);
      const newIndex = sequence.findIndex((id) => id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSequence = arrayMove(sequence, oldIndex, newIndex);
        setSelectedProcessGroup({ ...selectedProcessGroup, procedureSequence: newSequence });
        // Auto-save
        updateDoc(doc(db, "process_groups", selectedProcessGroup.id), {
          procedureSequence: newSequence,
          updatedAt: serverTimestamp(),
        }).catch(console.error);
      }
    }
  };

  const handleRemoveProcedure = async (procedureId: string) => {
    if (!selectedProcessGroup) return;
    const updatedSequence = selectedProcessGroup.procedureSequence.filter((id) => id !== procedureId);
    setSelectedProcessGroup({ ...selectedProcessGroup, procedureSequence: updatedSequence });
    // Auto-save
    try {
      await updateDoc(doc(db, "process_groups", selectedProcessGroup.id), {
        procedureSequence: updatedSequence,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error removing procedure:", error);
    }
  };

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Process Composer</h1>
              <p className="mt-1 text-sm text-slate-600">Build processes by composing procedures</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Studio
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Process Selection */}
      <div className="mx-auto max-w-[1600px] px-6 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 shadow-sm mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Process
              </label>
              <select
                value={selectedProcessGroup?.id || ""}
                onChange={(e) => {
                  const group = processGroups.find((g) => g.id === e.target.value);
                  if (group) handleSelectProcess(group);
                  else handleNewProcess();
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select or create new</option>
                {processGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleNewProcess}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                New Process
              </button>
            </div>
          </div>

          {/* Process Form */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedProcessGroup ? "Edit Process" : "New Process"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={processTitle}
                  onChange={(e) => setProcessTitle(e.target.value)}
                  placeholder="e.g., HR Onboarding Flow"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={processDescription}
                  onChange={(e) => setProcessDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe this process flow..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="isActive" className="text-xs text-slate-700">
                  Active (visible in dashboard)
                </label>
              </div>
              <div className="flex gap-2">
                {selectedProcessGroup ? (
                  <button
                    onClick={handleSaveProcess}
                    disabled={!processTitle.trim() || saving}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                ) : (
                  <button
                    onClick={handleCreateProcess}
                    disabled={!processTitle.trim() || saving}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Process"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Pane Layout */}
      <main className="mx-auto max-w-[1600px] px-6 pb-8">
        <ProcessDndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-[320px_1fr] gap-6 h-[calc(100vh-300px)]">
            {/* Left Pane: Procedure Library */}
            <ProcedureLibrary procedures={procedures} />

            {/* Center Pane: Process Timeline */}
            {selectedProcessGroup ? (
              <ProcessTimeline
                processGroup={selectedProcessGroup}
                procedures={procedures}
                onRemoveProcedure={handleRemoveProcedure}
              />
            ) : (
              <div className="flex items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600">Select or create a process to start building</p>
                </div>
              </div>
            )}
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

// Left Pane: Procedure Library
function ProcedureLibrary({ procedures }: { procedures: Procedure[] }) {
  return (
    <div className="h-full overflow-y-auto bg-white/50 backdrop-blur-xl border-r border-slate-200 p-6">
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm pb-4 mb-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Procedure Library</h2>
        <p className="text-xs text-slate-600">Drag to add to your process</p>
      </div>

      {procedures.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No published procedures found</p>
          <p className="text-xs text-slate-400 mt-1">Publish procedures in the Designer first</p>
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
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl border-2 border-blue-200 bg-blue-50 p-4 transition-all hover:bg-blue-100 ${
        isDragging ? "shadow-2xl z-50 opacity-90" : "shadow-sm"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-blue-900">{procedure.title}</h4>
          {procedure.description && (
            <p className="text-xs text-blue-700 mt-1 line-clamp-2">{procedure.description}</p>
          )}
          <p className="text-xs text-blue-600 mt-2">
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
        isOver ? "bg-blue-50/50" : ""
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
        <div className="space-y-4 max-w-2xl mx-auto">
          {sequenceProcedures.map((procedure, index) => (
            <SortableProcedureItem
              key={procedure.id}
              procedure={procedure}
              index={index}
              isLast={index === sequenceProcedures.length - 1}
              onRemove={() => onRemoveProcedure(procedure.id)}
            />
          ))}
        </div>
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
          isDragging ? "shadow-2xl border-blue-500" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold">
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

