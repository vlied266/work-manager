"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { CustomNode } from "./flow/CustomNode";
import { GoogleSheetNode } from "./flow/GoogleSheetNode";
import { AtomicStep, ATOMIC_ACTION_METADATA } from "@/types/schema";
import { GoogleSheetFlowConfig } from "./sidebar/GoogleSheetFlowConfig";

interface VisualEditorProps {
  tasks: AtomicStep[];
  onNodeUpdate?: (nodeId: string, data: any) => void;
  onNodeSelect?: (nodeId: string | null) => void;
}

const nodeTypes = {
  custom: CustomNode,
  googleSheet: GoogleSheetNode,
};

// Dagre layout configuration
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: "TB" | "LR" = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100, // Horizontal spacing between nodes
    ranksep: 150, // Vertical spacing between ranks
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.width || 280, 
      height: node.height || 120 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.width || 280) / 2,
        y: nodeWithPosition.y - (node.height || 120) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function VisualEditorContent({ tasks, onNodeUpdate, onNodeSelect }: VisualEditorProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { setNodes, getNodes } = useReactFlow();

  // Convert tasks to nodes (initial positions will be set by dagre)
  const initialNodes: Node[] = useMemo(() => {
    return tasks.map((step, index) => {
      // Use GoogleSheetNode for GOOGLE_SHEET_APPEND actions
      const nodeType = step.action === "GOOGLE_SHEET_APPEND" ? "googleSheet" : "custom";
      
      return {
        id: step.id || `step-${index}`,
        type: nodeType,
        position: { x: 0, y: 0 }, // Will be set by dagre
        width: 280,
        height: 120,
        data: step.action === "GOOGLE_SHEET_APPEND" 
          ? {
              fileName: step.config?.fileName,
              sheetId: step.config?.sheetId,
              mapping: step.config?.mapping || { A: "", B: "", C: "" },
            }
          : {
              step,
              stepIndex: index,
            },
      };
    });
  }, [tasks]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    // Call parent callback to select the step
    if (onNodeSelect) {
      onNodeSelect(node.id);
    }
  }, [onNodeSelect]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    // Deselect step in parent
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );

    // Update selected node
    setSelectedNode((prev) => {
      if (prev && prev.id === nodeId) {
        return { ...prev, data: { ...prev.data, ...data } };
      }
      return prev;
    });

    // Call parent callback if provided
    if (onNodeUpdate) {
      onNodeUpdate(nodeId, data);
    }
  }, [setNodes, onNodeUpdate]);

  // Create edges connecting sequential steps
  const initialEdges: Edge[] = useMemo(() => {
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

  // Apply dagre layout to nodes and edges
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (initialNodes.length === 0) {
      return { nodes: initialNodes, edges: initialEdges };
    }
    
    // If no edges, create sequential edges for layout calculation
    const edgesToLayout = initialEdges.length > 0 
      ? initialEdges 
      : initialNodes.slice(0, -1).map((node, idx) => ({
          id: `${node.id}-${initialNodes[idx + 1].id}`,
          source: node.id,
          target: initialNodes[idx + 1].id,
        }));
    
    // Only apply layout if we have edges or multiple nodes
    if (edgesToLayout.length > 0 || initialNodes.length > 1) {
      return getLayoutedElements(initialNodes, edgesToLayout, "TB");
    }
    
    // Single node - center it
    return {
      nodes: initialNodes.map(node => ({
        ...node,
        position: { x: 400, y: 300 },
      })),
      edges: [],
    };
  }, [initialNodes, initialEdges]);

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
    <div className="h-full w-full rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 overflow-hidden relative">
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        className="bg-gradient-to-br from-slate-50/50 to-blue-50/30"
      >
        <Background color="#E2E8F0" gap={20} size={1} />
        <Controls className="!bg-white/80 !backdrop-blur-xl !border !border-white/60 !rounded-xl !shadow-lg" />
        <MiniMap
          className="!bg-white/80 !backdrop-blur-xl !border !border-white/60 !rounded-xl"
          nodeColor={(node) => {
            const step = (node.data as { step: AtomicStep })?.step;
            if (step) {
              const metadata = ATOMIC_ACTION_METADATA[step.action];
              return metadata?.color || "#6B7280";
            }
            return "#10B981"; // Default green for Google Sheet nodes
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Properties Panel for selected node */}
      {selectedNode && selectedNode.type === "googleSheet" && (
        <div className="absolute top-4 right-4 w-96 h-[calc(100%-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl shadow-black/10 overflow-hidden z-10">
          <GoogleSheetFlowConfig
            node={selectedNode}
            updateNodeData={updateNodeData}
          />
        </div>
      )}
    </div>
  );
}

export function VisualEditor({ tasks, onNodeUpdate, onNodeSelect }: VisualEditorProps) {
  return (
    <ReactFlowProvider>
      <VisualEditorContent tasks={tasks} onNodeUpdate={onNodeUpdate} onNodeSelect={onNodeSelect} />
    </ReactFlowProvider>
  );
}

