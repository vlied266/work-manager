"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { AtomicStep } from "@/types/schema";
import { ATOMIC_ACTION_METADATA } from "@/types/schema";
import * as LucideIcons from "lucide-react";

interface GatewayNodeData extends Record<string, unknown> {
  step: AtomicStep;
  stepIndex: number;
}

export const GatewayNode = memo((props: NodeProps<Node<GatewayNodeData>>) => {
  const { data, selected } = props;
  if (!data) return null;
  const { step, stepIndex } = data;
  const metadata = ATOMIC_ACTION_METADATA[step.action] || {
    label: step.action,
    color: "#8B5CF6",
    icon: "GitBranch",
  };

  // Get icon component
  const IconComponent = (LucideIcons as any)[metadata.icon] || LucideIcons.GitBranch;

  // Count conditions for multiple handles
  const conditionCount = step.config?.conditions?.length || 0;
  const hasDefault = step.config?.defaultNextStepId && step.config.defaultNextStepId !== "COMPLETED";

  return (
    <div 
      className={`group relative w-64 rounded-xl bg-white border shadow-sm transition-all duration-200 ${
        selected 
          ? "ring-2 ring-purple-500 border-purple-400 shadow-md" 
          : "border-purple-200 hover:shadow-md hover:border-purple-400"
      }`}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !rounded-full !cursor-crosshair"
      />

      {/* Purple Header Section */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">
            <IconComponent className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white leading-tight">
              {step.title || "Gateway"}
            </h3>
            <p className="text-xs text-white/80 font-medium">
              {conditionCount} {conditionCount === 1 ? "condition" : "conditions"}
              {hasDefault && " + default"}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 py-3 space-y-2">
        {/* Step Number Badge */}
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold text-purple-600 bg-purple-50">
            Step {stepIndex + 1} • Logic
          </span>
        </div>

        {/* Conditions Preview */}
        {conditionCount > 0 && step.config?.conditions && (
          <div className="space-y-1">
            {step.config.conditions.slice(0, 2).map((condition: any, idx: number) => (
              <div key={idx} className="text-xs text-slate-600 font-medium truncate">
                {condition.variable} {condition.operator} {condition.value}
              </div>
            ))}
            {conditionCount > 2 && (
              <div className="text-xs text-slate-400">+{conditionCount - 2} more</div>
            )}
          </div>
        )}
      </div>

      {/* Source Handles (Bottom) - Labeled */}
      {conditionCount > 0 && step.config?.conditions ? (
        <>
          {step.config.conditions.map((condition: any, idx: number) => {
            // Distribute handles evenly
            const totalHandles = conditionCount + (hasDefault ? 1 : 0);
            const spacing = totalHandles > 1 ? 80 / (totalHandles + 1) : 50;
            const position = 10 + (idx + 1) * spacing;
            
            return (
              <div key={`condition-${idx}`} className="relative">
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={`condition-${idx}`}
                  className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !rounded-full !cursor-crosshair"
                  style={{
                    left: `${position}%`,
                  }}
                />
                {/* Label */}
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] font-semibold text-green-600 whitespace-nowrap"
                  style={{ left: `${position}%` }}
                >
                  True
                </div>
              </div>
            );
          })}
        </>
      ) : null}

      {/* Default Handle (Bottom Right) */}
      {hasDefault && (
        <div className="relative">
          <Handle
            type="source"
            position={Position.Bottom}
            id="default"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full !cursor-crosshair"
            style={{
              left: conditionCount > 0 ? "85%" : "50%",
            }}
          />
          {/* Label */}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] font-semibold text-slate-600 whitespace-nowrap"
            style={{ left: conditionCount > 0 ? "85%" : "50%" }}
          >
            Default
          </div>
        </div>
      )}

      {/* Fallback: Single handle if no conditions */}
      {conditionCount === 0 && !hasDefault && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !rounded-full !cursor-crosshair"
        />
      )}
    </div>
  );
});

GatewayNode.displayName = "GatewayNode";

