"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { AtomicStep } from "@/types/schema";
import { ATOMIC_ACTION_METADATA } from "@/types/schema";
import * as LucideIcons from "lucide-react";
import { Edit2 } from "lucide-react";

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

  // Determine icon background color based on action group
  const getIconBgColor = () => {
    if (metadata.group === "Automation") {
      return "bg-purple-50";
    }
    return "bg-blue-50";
  };

  return (
    <div 
      className={`group relative w-64 rounded-xl bg-white border shadow-sm transition-all duration-200 ${
        selected 
          ? "ring-2 ring-blue-500 border-blue-400 shadow-md" 
          : "border-slate-200 hover:shadow-md hover:border-blue-400"
      }`}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full !cursor-crosshair"
      />

      {/* Header Section */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100">
        {/* Left: Icon with colored background */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${getIconBgColor()}`}>
          <IconComponent 
            className="h-4 w-4" 
            style={{ color: metadata.color }}
          />
        </div>

        {/* Right: Edit icon (visible on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 py-3 space-y-1.5">
        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-tight">
          {step.title || "Untitled Step"}
        </h3>

        {/* Subtitle: Action Type */}
        <p className="text-xs text-slate-500 font-medium">
          {metadata.label}
        </p>

        {/* Step Number Badge */}
        <div className="pt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-500 bg-slate-100">
            Step {stepIndex + 1}
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
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !rounded-full !cursor-crosshair"
            style={{ left: "30%" }}
          />
          {/* Failure Handle (Right) */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="failure"
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !rounded-full !cursor-crosshair"
            style={{ left: "70%" }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full !cursor-crosshair"
        />
      )}
    </div>
  );
});

CustomNode.displayName = "CustomNode";

