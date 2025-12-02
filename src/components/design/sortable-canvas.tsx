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
  const metadata = ATOMIC_ACTION_METADATA[step.action];
  const IconComponent = (LucideIcons as any)[metadata.icon] || LucideIcons.Type;
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
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`group relative rounded-2xl border-2 p-6 cursor-pointer transition-all backdrop-blur-sm ${
        hasError
          ? "border-rose-500 bg-rose-50/80 shadow-xl shadow-rose-500/20"
          : isSelected
          ? "border-blue-500 bg-blue-50/80 shadow-xl shadow-blue-500/20"
          : "border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-lg"
      } ${isDragging ? "shadow-2xl scale-105" : ""}`}
      onClick={onClick}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start gap-5">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100/80 rounded-xl transition-colors"
        >
          <LucideIcons.GripVertical className="h-5 w-5 text-slate-400" strokeWidth={2} />
        </div>

        <div className="flex-shrink-0">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${
              metadata.color === "blue"
                ? "bg-blue-100 text-blue-700"
                : metadata.color === "green"
                ? "bg-green-100 text-green-700"
                : metadata.color === "yellow"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            <IconComponent className="h-6 w-6" strokeWidth={1.5} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step {index + 1}</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">{metadata.label}</span>
            {hasError && (
              <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <AlertTriangle className="h-4 w-4 text-rose-600" strokeWidth={2.5} />
                {showTooltip && validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-full mt-2 z-50 w-64 rounded-lg bg-slate-900 text-white text-xs p-3 shadow-xl"
                  >
                    <p className="font-semibold mb-1">⚠️ Configuration Missing</p>
                    <p>{validationError}</p>
                    <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-slate-900" />
                  </motion.div>
                )}
              </div>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">{step.title}</h3>
          {step.config.outputVariableName && (
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Output: <span className="font-mono text-blue-600 font-semibold">{step.config.outputVariableName}</span>
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-3">
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl p-2 text-slate-400 hover:bg-rose-100/80 hover:text-rose-700"
            title="Delete step"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
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
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-full overflow-y-auto bg-gradient-to-br from-slate-50/30 via-white to-white p-10 transition-all duration-300 ${
        isOver ? "bg-blue-50/60" : ""
      }`}
    >
      {steps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full min-h-[500px] rounded-3xl border-2 border-dashed border-slate-300/80 bg-gradient-to-br from-slate-50/50 via-white to-white backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100/80 mb-8 shadow-lg"
          >
            <LucideIcons.Move className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
          </motion.div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
            Drag your first Atomic Task here
          </h3>
          <p className="text-base text-slate-600 text-center max-w-md font-medium leading-relaxed">
            Start building your procedure by dragging atomic actions from the left sidebar
          </p>
        </motion.div>
      ) : (
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-5 max-w-3xl mx-auto">
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
          </div>
        </SortableContext>
      )}
    </div>
  );
}
