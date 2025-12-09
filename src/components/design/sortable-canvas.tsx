"use client";

import {
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AtomicStep, AtomicAction, ATOMIC_ACTION_METADATA } from "@/types/schema";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface SortableStepItemProps {
  step: AtomicStep;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  validationError?: string | null;
}

function SortableStepItem({ step, index, isSelected, onClick, onDelete, validationError }: SortableStepItemProps) {
  const metadata = (step.action && step.action in ATOMIC_ACTION_METADATA) 
    ? ATOMIC_ACTION_METADATA[step.action as AtomicAction] 
    : null;
  const IconComponent = metadata ? ((LucideIcons as any)[metadata.icon] || LucideIcons.Type) : LucideIcons.Type;
  const [showTooltip, setShowTooltip] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
    data: {
      type: "step",
      step,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasError = !!validationError;

  return (
    <div className="relative flex items-start gap-4">
      {/* Vertical Timeline Line - Only show if not last step */}
      {index < 1000 && (
        <div className="absolute left-5 top-12 w-0.5 h-8 bg-slate-200" />
      )}
      
      {/* Step Number Badge */}
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-sm shadow-sm border-2 border-white flex-shrink-0">
        {index + 1}
      </div>

      {/* Step Card */}
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={`group relative flex-1 rounded-2xl bg-white shadow-sm border border-slate-100 px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
          isSelected ? "ring-2 ring-blue-500 bg-blue-50/30" : ""
        } ${hasError ? "ring-1 ring-orange-300 bg-orange-50/20" : ""}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            metadata?.color === "blue" ? "bg-blue-100 text-blue-600" :
            metadata?.color === "green" ? "bg-green-100 text-green-600" :
            metadata?.color === "yellow" ? "bg-yellow-100 text-yellow-600" :
            "bg-purple-100 text-purple-600"
          }`}>
            <IconComponent className="h-5 w-5" strokeWidth={2} />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-800 tracking-tight truncate">{step.title}</h4>
              {hasError && (
                <div className="relative">
                  <AlertTriangle 
                    className="h-4 w-4 text-orange-500 cursor-help" 
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  />
                  {showTooltip && validationError && (
                    <div className="absolute left-0 top-6 z-50 rounded-lg bg-slate-900 text-white text-xs p-2 shadow-xl whitespace-nowrap">
                      {validationError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-slate-600" {...attributes} {...listeners}>
            <LucideIcons.GripVertical className="h-4 w-4" strokeWidth={2} />
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface SortableCanvasProps {
  steps: AtomicStep[];
  selectedStepId: string | null;
  onStepsChange: (steps: AtomicStep[]) => void;
  onStepSelect: (stepId: string | null) => void;
  onDropAction: (action: AtomicAction) => void;
  onDeleteStep: (stepId: string) => void;
  validationErrors?: Map<string, string>;
}

export function SortableCanvas({
  steps,
  selectedStepId,
  onStepsChange,
  onStepSelect,
  onDropAction,
  onDeleteStep,
  validationErrors,
}: SortableCanvasProps) {
  const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({
    id: "canvas-drop-zone",
  });
  
  // Additional drop zone at the end of the list for adding new steps
  const { setNodeRef: setEndRef, isOver: isEndOver } = useDroppable({
    id: "canvas-end-drop-zone",
  });

  return (
    <div
      ref={setCanvasRef}
      className={`relative h-full w-full overflow-y-auto overflow-x-hidden transition-all duration-700 ${
        isCanvasOver ? "bg-blue-50/30" : ""
      }`}
      style={{ minHeight: 0 }}
    >
      {steps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
            <div className="relative h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 flex items-center justify-center shadow-sm">
              <LucideIcons.Move className="h-7 w-7 text-[#86868b]" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-1.5">
            Drag atomic tasks here
          </h3>
          <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
            Start building your procedure by dragging tasks from the toolbox
          </p>
        </motion.div>
      ) : (
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-8 max-w-2xl mx-auto py-4">
            <AnimatePresence>
              {steps.map((step, index) => (
                <SortableStepItem
                  key={step.id}
                  step={step}
                  index={index}
                  isSelected={selectedStepId === step.id}
                  onClick={() => onStepSelect(selectedStepId === step.id ? null : step.id)}
                  onDelete={() => onDeleteStep(step.id)}
                  validationError={validationErrors?.get(step.id) || null}
                />
              ))}
            </AnimatePresence>
            {/* Drop zone at the end for adding new steps */}
            <div 
              ref={setEndRef}
              className={`h-20 rounded-2xl border-2 border-dashed transition-all ${
                isEndOver 
                  ? "border-blue-400/60 bg-blue-50/40" 
                  : "border-slate-200"
              }`}
            />
          </div>
        </SortableContext>
      )}
    </div>
  );
}
