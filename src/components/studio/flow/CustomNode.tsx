"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { AtomicStep } from "@/types/schema";
import { ATOMIC_ACTION_METADATA } from "@/types/schema";
import * as LucideIcons from "lucide-react";

interface CustomNodeData extends Record<string, unknown> {
  step: AtomicStep;
  stepIndex: number;
}

export const CustomNode = memo((props: NodeProps<Node<CustomNodeData>>) => {
  const { data, selected } = props;
  if (!data) return null;
  const { step, stepIndex } = data;
  const metadata = ATOMIC_ACTION_METADATA[step.action] || {
    label: step.action,
    color: "#6B7280",
    icon: "Type",
  };

  // Get icon component
  const IconComponent = (LucideIcons as any)[metadata.icon] || LucideIcons.Type;

  return (
    <div 
      className={`px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border-2 shadow-lg shadow-black/5 min-w-[200px] max-w-[280px] hover:shadow-xl transition-all ${
        selected 
          ? "border-blue-500 ring-2 ring-blue-200" 
          : "border-white/60 hover:border-slate-300"
      }`}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full"
      />

      {/* Node Content */}
      <div className="space-y-2">
        {/* Step Number & Icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-400">Step {stepIndex + 1}</span>
          <div 
            className="p-1.5 rounded-lg"
            style={{
              backgroundColor: `${metadata.color}15`,
            }}
          >
            <IconComponent 
              className="h-4 w-4" 
              style={{ color: metadata.color }}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-tight">
          {step.title || "Untitled Step"}
        </h3>

        {/* Action Type Badge */}
        <div className="flex items-center gap-1.5 pt-1">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: `${metadata.color}20`,
              color: metadata.color,
            }}
          >
            {metadata.label}
          </span>
        </div>
      </div>

      {/* Source Handles (Bottom) */}
      {(step.action === "VALIDATE" || step.action === "COMPARE") ? (
        <>
          {/* Success Handle (Left) */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="success"
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !rounded-full"
            style={{ left: "30%" }}
          />
          {/* Failure Handle (Right) */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="failure"
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !rounded-full"
            style={{ left: "70%" }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full"
        />
      )}
    </div>
  );
});

CustomNode.displayName = "CustomNode";

