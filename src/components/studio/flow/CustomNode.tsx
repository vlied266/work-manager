"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { AtomicStep } from "@/types/schema";
import { ATOMIC_ACTION_METADATA } from "@/types/schema";
import * as LucideIcons from "lucide-react";
import { Edit2, Trash2, Phone, Mail, Package, Truck, FileText, Archive, Wrench, ClipboardList, Handshake, Search } from "lucide-react";

interface CustomNodeData extends Record<string, unknown> {
  step: AtomicStep;
  stepIndex: number;
  onDelete?: (stepId: string) => void;
}

export const CustomNode = memo((props: NodeProps<Node<CustomNodeData>>) => {
  const { data, selected } = props;
  if (!data) return null;
  const { step, stepIndex, onDelete } = data;
  const metadata = ATOMIC_ACTION_METADATA[step.action] || {
    label: step.action,
    color: "#6B7280",
    icon: "Type",
  };

  // Get icon component - Dynamic for MANUAL_TASK based on taskSubType, NEGOTIATE, and INSPECT
  let IconComponent: React.ElementType;
  if (step.action === "NEGOTIATE") {
    IconComponent = Handshake;
  } else if (step.action === "INSPECT") {
    IconComponent = Search;
  } else if (step.action === "MANUAL_TASK" && step.config?.taskSubType) {
    const taskSubType = step.config.taskSubType;
    switch (taskSubType) {
      case "contact":
        IconComponent = Phone; // or Mail, but Phone is more common for "Contact/Call"
        break;
      case "logistics":
        IconComponent = Package; // or Truck, but Package is more common
        break;
      case "admin":
        IconComponent = FileText; // or Archive, but FileText is more common
        break;
      case "maintenance":
        IconComponent = Wrench;
        break;
      case "generic":
      default:
        IconComponent = ClipboardList;
        break;
    }
  } else {
    IconComponent = (LucideIcons as any)[metadata.icon] || LucideIcons.Type;
  }

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
        isConnectable={true}
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

        {/* Right: Action buttons (visible on hover) */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete && step.id) {
                  onDelete(step.id);
                }
              }}
              className="p-0.5 rounded hover:bg-red-50 transition-colors"
              title="Delete step"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-600 cursor-pointer" />
            </button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 py-3 space-y-1.5">
        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-tight">
          {step.title || "Untitled Step"}
        </h3>

        {/* Output Variable (for INPUT, APPROVAL, MANUAL_TASK, NEGOTIATE, INSPECT, AI_PARSE, DB_INSERT, and HTTP_REQUEST steps) */}
        {(step.action === "INPUT" || step.action === "APPROVAL" || step.action === "MANUAL_TASK" || step.action === "NEGOTIATE" || step.action === "INSPECT" || step.action === "AI_PARSE" || step.action === "DB_INSERT" || step.action === "HTTP_REQUEST") && step.config?.outputVariableName && (
          <p className="text-[10px] font-mono text-purple-600 font-semibold">
            Var: {step.config.outputVariableName}
          </p>
        )}

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
      {(step.action === "VALIDATE" || step.action === "COMPARE" || step.action === "APPROVAL") ? (
        <>
          {/* Success Handle (Left) - Labeled */}
          <div className="relative">
            <Handle
              type="source"
              position={Position.Bottom}
              id="success"
              isConnectable={true}
              className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !rounded-full !cursor-crosshair"
              style={{ left: "30%", bottom: "-6px" }}
            />
            {/* Label */}
            <div 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-[10px] font-semibold text-green-600 whitespace-nowrap pointer-events-none"
              style={{ left: "30%" }}
            >
              {step.action === "COMPARE" ? "Match" : step.action === "APPROVAL" ? "Approved" : "Pass"}
            </div>
          </div>
          {/* Failure Handle (Right) - Labeled */}
          <div className="relative">
            <Handle
              type="source"
              position={Position.Bottom}
              id="failure"
              isConnectable={true}
              className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !rounded-full !cursor-crosshair"
              style={{ left: "70%", bottom: "-6px" }}
            />
            {/* Label */}
            <div 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-[10px] font-semibold text-red-600 whitespace-nowrap pointer-events-none"
              style={{ left: "70%" }}
            >
              {step.action === "COMPARE" ? "Mismatch" : step.action === "APPROVAL" ? "Rejected" : "Fail"}
            </div>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          isConnectable={true}
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full !cursor-crosshair"
        />
      )}
    </div>
  );
});

CustomNode.displayName = "CustomNode";

