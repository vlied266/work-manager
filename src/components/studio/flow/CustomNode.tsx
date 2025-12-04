"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { AtomicStep } from "@/types/schema";
import { ATOMIC_ACTION_METADATA } from "@/types/schema";

interface CustomNodeData extends Record<string, unknown> {
  step: AtomicStep;
  stepIndex: number;
}

export const CustomNode = memo((props: NodeProps<Node<CustomNodeData>>) => {
  const { data } = props;
  if (!data) return null;
  const { step, stepIndex } = data;
  const metadata = ATOMIC_ACTION_METADATA[step.action] || {
    label: step.action,
    color: "#6B7280",
    icon: null,
  };

  return (
    <div className="px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 min-w-[200px] max-w-[280px] hover:shadow-xl transition-all">
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white"
        style={{ borderRadius: "50%" }}
      />

      {/* Node Content */}
      <div className="space-y-2">
        {/* Step Number & Action Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-400">Step {stepIndex + 1}</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${metadata.color}20`,
              color: metadata.color,
            }}
          >
            {step.action}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-tight">
          {step.title || "Untitled Step"}
        </h3>

        {/* Input/Output Badges */}
        <div className="flex items-center gap-2 pt-1">
          {step.config?.targetA && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium">
              ← {step.config.targetA}
            </span>
          )}
          {step.config?.targetB && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium">
              ← {step.config.targetB}
            </span>
          )}
        </div>
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white"
        style={{ borderRadius: "50%" }}
      />
    </div>
  );
});

CustomNode.displayName = "CustomNode";

