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
      className={`relative min-w-[180px] max-w-[220px] ${
        selected 
          ? "ring-2 ring-purple-500 ring-offset-2" 
          : ""
      }`}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !rounded-full"
      />

      {/* Diamond Shape Container */}
      <div 
        className="relative w-[180px] h-[120px] transform rotate-45 bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg border-2 border-white/80"
        style={{
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }}
      >
        {/* Content (rotated back) */}
        <div className="absolute inset-0 transform -rotate-45 flex flex-col items-center justify-center p-4">
          <div 
            className="p-2 rounded-lg mb-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <IconComponent 
              className="h-5 w-5 text-white" 
            />
          </div>
          <h3 className="text-xs font-bold text-white text-center leading-tight mb-1">
            {step.title || "Gateway"}
          </h3>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-white/90">
              {conditionCount} {conditionCount === 1 ? "path" : "paths"}
            </span>
            {hasDefault && (
              <span className="text-[10px] font-semibold text-white/70">+ default</span>
            )}
          </div>
        </div>
      </div>

      {/* Source Handles (Bottom) - Multiple for conditions */}
      {conditionCount > 0 && step.config?.conditions ? (
        <>
          {step.config.conditions.map((condition: any, idx: number) => {
            // Distribute handles evenly across bottom of diamond
            const totalHandles = conditionCount + (hasDefault ? 1 : 0);
            const basePosition = 50; // Center of diamond
            const spacing = totalHandles > 1 ? 30 : 0; // Spacing between handles
            const offset = (idx - (conditionCount - 1) / 2) * spacing;
            const position = basePosition + offset;
            
            return (
              <Handle
                key={`condition-${idx}`}
                type="source"
                position={Position.Bottom}
                id={`condition-${idx}`}
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !rounded-full"
                style={{
                  left: `${Math.max(10, Math.min(90, position))}%`,
                  bottom: "-6px",
                }}
              />
            );
          })}
        </>
      ) : null}

      {/* Default Handle (Bottom Center) */}
      {hasDefault && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full"
          style={{
            left: "50%",
            bottom: "-6px",
          }}
        />
      )}

      {/* Fallback: Single handle if no conditions */}
      {conditionCount === 0 && !hasDefault && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !rounded-full"
          style={{
            bottom: "-6px",
          }}
        />
      )}
    </div>
  );
});

GatewayNode.displayName = "GatewayNode";

