"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./flow/CustomNode";
import { AtomicStep, ATOMIC_ACTION_METADATA } from "@/types/schema";

interface VisualEditorProps {
  tasks: AtomicStep[];
}

const nodeTypes = {
  custom: CustomNode,
};

export function VisualEditor({ tasks }: VisualEditorProps) {
  // Convert tasks to nodes with auto-layout
  const nodes: Node[] = useMemo(() => {
    return tasks.map((step, index) => ({
      id: step.id || `step-${index}`,
      type: "custom",
      position: {
        x: 400, // Center horizontally
        y: index * 200, // Vertical spacing
      },
      data: {
        step,
        stepIndex: index,
      },
    }));
  }, [tasks]);

  // Create edges connecting sequential steps
  const edges: Edge[] = useMemo(() => {
    const edgesArray: Edge[] = [];
    
    for (let i = 0; i < tasks.length - 1; i++) {
      const sourceId = tasks[i].id || `step-${i}`;
      const targetId = tasks[i + 1].id || `step-${i + 1}`;
      
      // Check if step has custom routing
      const step = tasks[i];
      if (step.routes) {
        // Handle custom routes
        if (step.routes.onSuccessStepId && step.routes.onSuccessStepId !== "COMPLETED") {
          edgesArray.push({
            id: `${sourceId}-success`,
            source: sourceId,
            target: step.routes.onSuccessStepId,
            animated: true,
            style: { stroke: "#10B981", strokeWidth: 2 },
            label: "Success",
            labelStyle: { fill: "#10B981", fontWeight: 600 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#10B981",
            },
          });
        }
        
        if (step.routes.onFailureStepId) {
          edgesArray.push({
            id: `${sourceId}-failure`,
            source: sourceId,
            target: step.routes.onFailureStepId,
            animated: true,
            style: { stroke: "#EF4444", strokeWidth: 2 },
            label: "Failure",
            labelStyle: { fill: "#EF4444", fontWeight: 600 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#EF4444",
            },
          });
        }
        
        // Default next step
        if (step.routes.defaultNextStepId && step.routes.defaultNextStepId !== "COMPLETED") {
          edgesArray.push({
            id: `${sourceId}-default`,
            source: sourceId,
            target: step.routes.defaultNextStepId,
            animated: true,
            style: { stroke: "#6366F1", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#6366F1",
            },
          });
        } else if (!step.routes.onSuccessStepId && !step.routes.onFailureStepId) {
          // Fallback to sequential if no custom routes
          edgesArray.push({
            id: `${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            animated: true,
            style: { stroke: "#6366F1", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#6366F1",
            },
          });
        }
      } else {
        // Default sequential connection
        edgesArray.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          animated: true,
          style: { stroke: "#6366F1", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#6366F1",
          },
        });
      }
    }
    
    return edgesArray;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60">
        <div className="text-center">
          <p className="text-slate-500 text-sm">No steps to display</p>
          <p className="text-slate-400 text-xs mt-1">Add steps to see the visual flow</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gradient-to-br from-slate-50/50 to-blue-50/30"
      >
        <Background color="#E2E8F0" gap={20} size={1} />
        <Controls className="!bg-white/80 !backdrop-blur-xl !border !border-white/60 !rounded-xl !shadow-lg" />
        <MiniMap
          className="!bg-white/80 !backdrop-blur-xl !border !border-white/60 !rounded-xl"
          nodeColor={(node) => {
            const step = (node.data as { step: AtomicStep }).step;
            const metadata = ATOMIC_ACTION_METADATA[step.action];
            return metadata?.color || "#6B7280";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}

