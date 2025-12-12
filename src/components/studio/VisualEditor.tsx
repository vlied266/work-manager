"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
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
  Connection,
  addEdge,
  useEdgesState,
  useNodesState,
  NodeChange,
  applyNodeChanges,
  EdgeChange,
  applyEdgeChanges,
  getOutgoers,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { CustomNode } from "./flow/CustomNode";
import { GoogleSheetNode } from "./flow/GoogleSheetNode";
import { GatewayNode } from "./flow/GatewayNode";
import { TriggerNode } from "./flow/TriggerNode";
import { CustomEdge } from "./flow/CustomEdge";
import { AtomicStep, ATOMIC_ACTION_METADATA, Procedure } from "@/types/schema";
import { GoogleSheetFlowConfig } from "./sidebar/GoogleSheetFlowConfig";

interface VisualEditorProps {
  tasks: AtomicStep[];
  onNodeUpdate?: (nodeId: string, data: any) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onConnect?: (connection: Connection, sourceStep: AtomicStep, targetStepId: string | null) => void;
  onAddStep?: (action: string, position: { x: number; y: number }) => void;
  onDeleteStep?: (stepId: string) => void;
  onEdgesDelete?: (edges: Edge[]) => void; // Direct handler for edge deletion
  procedureTrigger?: Procedure["trigger"];
}

const nodeTypes = {
  custom: CustomNode,
  googleSheet: GoogleSheetNode,
  gateway: GatewayNode,
  trigger: TriggerNode,
};

const edgeTypes = {
  default: CustomEdge,
};

// Dagre layout configuration
// Respects manual positions (from drag & drop) and only auto-layouts nodes without positions
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

  // Separate nodes with manual positions from those needing auto-layout
  const nodesWithManualPosition = new Set<string>();
  const nodesNeedingLayout: Node[] = [];

  nodes.forEach((node) => {
    // Check if node has a manually set position (not 0,0 and not trigger)
    const hasManualPosition = node.position && 
      (node.position.x !== 0 || node.position.y !== 0) &&
      node.id !== "trigger"; // Trigger always at 0,0
    
    if (hasManualPosition) {
      nodesWithManualPosition.add(node.id);
      // Set node position directly in dagre (so edges can still be laid out correctly)
      dagreGraph.setNode(node.id, {
        width: node.width || 256,
        height: node.height || 120,
        x: node.position.x + (node.width || 256) / 2,
        y: node.position.y + (node.height || 120) / 2,
      });
    } else {
      nodesNeedingLayout.push(node);
      dagreGraph.setNode(node.id, { 
        width: node.width || 256, 
        height: node.height || 120 
      });
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Only run layout if there are nodes that need it
  if (nodesNeedingLayout.length > 0) {
    dagre.layout(dagreGraph);
  }

  const layoutedNodes = nodes.map((node) => {
    // If node has manual position, keep it
    if (nodesWithManualPosition.has(node.id)) {
      return node;
    }
    
    // Otherwise, use dagre layout
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.width || 256) / 2,
        y: nodeWithPosition.y - (node.height || 120) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function VisualEditorContent({ tasks, onNodeUpdate, onNodeSelect, onConnect, onAddStep, onDeleteStep, onEdgesDelete, procedureTrigger }: VisualEditorProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  
  // Create edges based on actual routing logic
  const initialEdges: Edge[] = useMemo(() => {
    const edgesArray: Edge[] = [];
    
    // Helper to find step by ID
    const findStepById = (stepId: string): AtomicStep | undefined => {
      return tasks.find(s => s.id === stepId);
    };

    // Connect trigger to first step if trigger exists
    if (procedureTrigger && (procedureTrigger.type === "ON_FILE_CREATED" || procedureTrigger.type === "WEBHOOK") && tasks.length > 0) {
      const firstStepId = tasks[0].id || "step-0";
      edgesArray.push({
        id: "trigger-first",
        source: "trigger",
        target: firstStepId,
        animated: true,
        style: { stroke: "#3B82F6", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3B82F6",
        },
      });
    }

    // Process each step to create edges
    tasks.forEach((step, index) => {
      const sourceId = step.id || `step-${index}`;

      // GATEWAY: Use config.conditions
      if (step.action === "GATEWAY" && step.config?.conditions) {
        step.config.conditions.forEach((condition: any, condIndex: number) => {
          if (condition.nextStepId && condition.nextStepId !== "COMPLETED") {
            // Format condition label
            const operatorSymbols: Record<string, string> = {
              eq: "=",
              neq: "≠",
              gt: ">",
              lt: "<",
              contains: "contains",
            };
            const opSymbol = operatorSymbols[condition.operator] || condition.operator;
            const conditionLabel = `${condition.variable} ${opSymbol} ${condition.value}`;

            edgesArray.push({
              id: `${sourceId}-condition-${condIndex}`,
              source: sourceId,
              sourceHandle: `condition-${condIndex}`,
              target: condition.nextStepId,
              animated: true,
              style: { stroke: "#10B981", strokeWidth: 2.5 },
              label: conditionLabel,
              labelStyle: { 
                fill: "#10B981", 
                fontWeight: 600,
                fontSize: "11px",
                backgroundColor: "white",
                padding: "2px 6px",
                borderRadius: "4px",
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#10B981",
              },
            });
          }
        });

        // Default edge for GATEWAY - ONLY if explicitly configured
        if (step.config?.defaultNextStepId && step.config.defaultNextStepId !== "COMPLETED") {
          edgesArray.push({
            id: `${sourceId}-default`,
            source: sourceId,
            sourceHandle: "default",
            target: step.config.defaultNextStepId,
            animated: true,
            style: { stroke: "#6B7280", strokeWidth: 2, strokeDasharray: "5,5" },
            label: "Default",
            labelStyle: { 
              fill: "#6B7280", 
              fontWeight: 600,
              fontSize: "11px",
              backgroundColor: "white",
              padding: "2px 6px",
              borderRadius: "4px",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#6B7280",
            },
          });
        }
        // NO FALLBACK - If no defaultNextStepId configured, no edge is created
      } 
      // VALIDATE/COMPARE: Use routes (onSuccessStepId, onFailureStepId)
      else if ((step.action === "VALIDATE" || step.action === "COMPARE") && step.routes) {
        if (step.routes.onSuccessStepId && step.routes.onSuccessStepId !== "COMPLETED") {
          edgesArray.push({
            id: `${sourceId}-success`,
            source: sourceId,
            sourceHandle: "success",
            target: step.routes.onSuccessStepId,
            animated: true,
            style: { stroke: "#10B981", strokeWidth: 2.5 },
            label: "True",
            labelStyle: { 
              fill: "#10B981", 
              fontWeight: 600,
              fontSize: "11px",
              backgroundColor: "white",
              padding: "2px 6px",
              borderRadius: "4px",
            },
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
            sourceHandle: "failure",
            target: step.routes.onFailureStepId,
            animated: true,
            style: { stroke: "#EF4444", strokeWidth: 2.5 },
            label: "False",
            labelStyle: { 
              fill: "#EF4444", 
              fontWeight: 600,
              fontSize: "11px",
              backgroundColor: "white",
              padding: "2px 6px",
              borderRadius: "4px",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#EF4444",
            },
          });
        }
        
        // Default next step for VALIDATE/COMPARE - ONLY if explicitly configured
        if (step.routes.defaultNextStepId && step.routes.defaultNextStepId !== "COMPLETED") {
          edgesArray.push({
            id: `${sourceId}-default`,
            source: sourceId,
            sourceHandle: "default",
            target: step.routes.defaultNextStepId,
            animated: true,
            style: { stroke: "#6366F1", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#6366F1",
            },
          });
        }
        // NO FALLBACK - If no routes configured, no edge is created
      }
      // Standard steps: Use routes.defaultNextStepId - ONLY if explicitly configured
      else {
        if (step.routes?.defaultNextStepId && step.routes.defaultNextStepId !== "COMPLETED") {
          edgesArray.push({
            id: `${sourceId}-next`,
            source: sourceId,
            sourceHandle: "default",
            target: step.routes.defaultNextStepId,
            animated: true,
            style: { stroke: "#6366F1", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#6366F1",
            },
          });
        }
        // NO FALLBACK - If no defaultNextStepId configured, no edge is created
      }
    });
    
    return edgesArray;
  }, [tasks, procedureTrigger]);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Convert tasks to nodes (initial positions will be set by dagre)
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];

    // Add Trigger Node if there's an automated trigger
    if (procedureTrigger && (procedureTrigger.type === "ON_FILE_CREATED" || procedureTrigger.type === "WEBHOOK")) {
      nodes.push({
        id: "trigger",
        type: "trigger",
        position: { x: 0, y: 0 },
        width: 128,
        height: 128,
        data: {
          triggerType: procedureTrigger.type,
          label: procedureTrigger.type === "ON_FILE_CREATED" ? "File Upload" : "Webhook",
        },
      });
    }

    // Add step nodes
    tasks.forEach((step, index) => {
      let nodeType = "custom";
      
      if (step.action === "GOOGLE_SHEET_APPEND") {
        nodeType = "googleSheet";
      } else if (step.action === "GATEWAY") {
        nodeType = "gateway";
      }
      
      // Use stored position if available, otherwise will be set by dagre
      const storedPosition = step.ui?.position;
      
      nodes.push({
        id: step.id || `step-${index}`,
        type: nodeType,
        position: storedPosition || { x: 0, y: 0 }, // Use stored position or let dagre set it
        width: nodeType === "gateway" ? 256 : 256, // w-64 = 256px
        height: nodeType === "gateway" ? 120 : 120,
        data: step.action === "GOOGLE_SHEET_APPEND" 
          ? {
              fileName: step.config?.fileName,
              sheetId: step.config?.sheetId,
              mapping: step.config?.mapping || { A: "", B: "", C: "" },
            }
          : nodeType === "gateway"
          ? {
              step,
              stepIndex: index,
              onDelete: onDeleteStep,
            }
          : {
              step,
              stepIndex: index,
              onDelete: onDeleteStep,
            },
      });
    });

    return nodes;
  }, [tasks, procedureTrigger]);

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


  // Apply dagre layout to nodes and edges
  const { nodes: layoutedNodes } = useMemo(() => {
    if (initialNodes.length === 0) {
      return { nodes: initialNodes };
    }
    
    // Use current edges for layout calculation
    const edgesToLayout = edges.length > 0 
      ? edges 
      : initialEdges.length > 0
        ? initialEdges
        : initialNodes.slice(0, -1).map((node, idx) => ({
            id: `${node.id}-${initialNodes[idx + 1].id}`,
            source: node.id,
            target: initialNodes[idx + 1].id,
          }));
    
    // Only apply layout if we have edges or multiple nodes
    if (edgesToLayout.length > 0 || initialNodes.length > 1) {
      const layouted = getLayoutedElements(initialNodes, edgesToLayout, "TB");
      return { nodes: layouted.nodes };
    }
    
    // Single node - center it
    return {
      nodes: initialNodes.map(node => ({
        ...node,
        position: { x: 400, y: 300 },
      })),
    };
  }, [initialNodes, edges]);

  // Update edges when initialEdges change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle edge deletion from delete button
  const handleEdgeDelete = useCallback((edgeId: string) => {
    // Find the edge before deletion
    const deletedEdge = edges.find((e) => e.id === edgeId);
    
    if (deletedEdge && deletedEdge.source && deletedEdge.target && onConnect) {
      const sourceStep = tasks.find((s) => s.id === deletedEdge.source);
      if (sourceStep) {
        // Call onConnect with null to disconnect in procedure
        const connection: Connection = {
          source: deletedEdge.source,
          target: deletedEdge.target,
          sourceHandle: deletedEdge.sourceHandle || undefined,
        };
        onConnect(connection, sourceStep, null);
      }
    }
    
    // Remove edge from state
    setEdges((currentEdges) => currentEdges.filter((e) => e.id !== edgeId));
  }, [edges, tasks, onConnect]);

  // Handle edge changes (including deletion)
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    // Handle edge deletion BEFORE applying changes (so we can access the edge)
    const deletedEdges = changes.filter((change) => change.type === "remove");
    
    if (deletedEdges.length > 0) {
      // If onEdgesDelete is provided, use it (direct handler)
      if (onEdgesDelete) {
        // Get current edges before deletion
        setEdges((currentEdges) => {
          const edgesToDelete = deletedEdges
            .map((change) => {
              if (change.id) {
                return currentEdges.find((e) => e.id === change.id);
              }
              return null;
            })
            .filter((e): e is Edge => e !== null);
          
          if (edgesToDelete.length > 0) {
            onEdgesDelete(edgesToDelete);
          }
          
          // Apply the changes (remove edges from state)
          return applyEdgeChanges(changes, currentEdges);
        });
      } else if (onConnect) {
        // Fallback to onConnect if onEdgesDelete not provided
        setEdges((currentEdges) => {
          deletedEdges.forEach((change) => {
            const deletedEdgeId = change.id;
            if (deletedEdgeId) {
              const deletedEdge = currentEdges.find((e) => e.id === deletedEdgeId);
              if (deletedEdge && deletedEdge.source && deletedEdge.target) {
                const sourceStep = tasks.find((s) => s.id === deletedEdge.source);
                if (sourceStep) {
                  const connection: Connection = {
                    source: deletedEdge.source,
                    target: deletedEdge.target,
                    sourceHandle: deletedEdge.sourceHandle || undefined,
                  };
                  onConnect(connection, sourceStep, null);
                }
              }
            }
          });
          return applyEdgeChanges(changes, currentEdges);
        });
      } else {
        // Just apply changes if no handler provided
        setEdges((eds) => applyEdgeChanges(changes, eds));
      }
    } else {
      // Apply changes to edges state (for non-deletion changes like selection)
      setEdges((eds) => applyEdgeChanges(changes, eds));
    }
  }, [tasks, onConnect, onEdgesDelete, setEdges]);

  // Initialize nodes state for drag & drop
  const [nodes, setNodesState, onNodesChange] = useNodesState(layoutedNodes);

  // Update nodes when layoutedNodes change
  useEffect(() => {
    setNodesState(layoutedNodes);
  }, [layoutedNodes, setNodesState]);

  // Handle node drag end - save position to step metadata
  const handleNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // Find the corresponding step
    const step = tasks.find(s => s.id === node.id);
    if (step && onNodeUpdate) {
      // Update step with new position
      onNodeUpdate(node.id, {
        ...step,
        ui: {
          position: node.position,
        },
      });
    }
  }, [tasks, onNodeUpdate]);

  // Handle drop from sidebar (HTML5 drag & drop for React Flow)
  const onDragOver = useCallback((event: React.DragEvent) => {
    // Always prevent default to allow drop
    event.preventDefault();
    event.stopPropagation();
    
    // Check if it's a React Flow drag
    const hasReactFlowData = event.dataTransfer.types.includes("application/reactflow");
    if (hasReactFlowData) {
      event.dataTransfer.dropEffect = "move";
      console.log("[VisualEditor] DragOver with React Flow data:", {
        types: Array.from(event.dataTransfer.types),
        effectAllowed: event.dataTransfer.effectAllowed
      });
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Check if this is a React Flow drag
      const action = event.dataTransfer.getData("application/reactflow");
      console.log("[VisualEditor] Drop event:", { 
        action, 
        hasOnAddStep: !!onAddStep,
        dataTransferTypes: event.dataTransfer.types,
        allData: Array.from(event.dataTransfer.types).map(type => ({
          type,
          data: event.dataTransfer.getData(type)
        }))
      });
      
      if (!action) {
        console.warn("[VisualEditor] No React Flow action data found in drop event");
        return;
      }

      if (!onAddStep) {
        console.warn("[VisualEditor] onAddStep callback is not provided");
        return;
      }

      // Get drop position in flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      console.log("[VisualEditor] Calling onAddStep with:", { action, position });
      onAddStep(action, position);
    },
    [screenToFlowPosition, onAddStep]
  );

  // Helper function to detect cycles using proper DAG check
  // A connection from Source to Target is INVALID only if Target can already reach Source
  const wouldCreateCycle = useCallback((sourceId: string, targetId: string): boolean => {
    if (sourceId === targetId) return true;
    
    // Check if Target eventually leads back to Source (DFS)
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return false;
    
    const hasCycle = (node: Node, visited = new Set<string>()): boolean => {
      if (visited.has(node.id)) return false; // Already visited this path
      visited.add(node.id);
      
      if (node.id === sourceId) return true; // Found a path back to source! This creates a cycle.
      
      // Get all nodes that this node connects to (outgoers)
      const outgoers = getOutgoers(node, nodes, edges);
      
      // Check if any outgoer eventually leads back to source
      return outgoers.some(outgoer => hasCycle(outgoer, new Set(visited)));
    };
    
    return hasCycle(targetNode);
  }, [nodes, edges]);

  // Handle connection (drag-to-connect) - Graph-based wiring system
  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    // Prevent self-connections
    if (connection.source === connection.target) {
      alert("⚠️ Cannot connect a step to itself.");
      return;
    }

    // Prevent cycles (connecting to ancestors) - Allow branching!
    if (wouldCreateCycle(connection.source, connection.target)) {
      alert("⚠️ Cannot create a cycle. This connection would create a circular dependency.");
      return;
    }

    // Find source and target steps
    const sourceStep = tasks.find(s => s.id === connection.source);
    const targetStepId = connection.target;
    
    if (!sourceStep) {
      // Handle trigger connections
      if (connection.source === "trigger" && onConnect) {
        // Trigger connections are handled differently - they don't update step config
        // Just show a message
        alert("ℹ️ Trigger connections are automatic. The trigger connects to the first step.");
        return;
      }
      return;
    }

    // Identify the slot based on sourceHandle
    // This determines which config field to update
    const sourceHandle = connection.sourceHandle || "default";
    
    // Optimistic update: Add edge immediately for instant feedback
    // Note: The edge will be regenerated from procedure steps after Firestore update,
    // but this provides instant visual feedback
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}-${sourceHandle}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: sourceHandle,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#94a3b8",
      },
    };
    
    // Add edge optimistically (will be replaced when initialEdges updates)
    setEdges((eds) => {
      // Check if edge already exists
      const exists = eds.some(e => 
        e.source === newEdge.source && 
        e.target === newEdge.target && 
        (e.sourceHandle || "default") === (newEdge.sourceHandle || "default")
      );
      if (exists) return eds;
      return [...eds, newEdge];
    });

    // Call parent callback to update procedure (this will persist to Firestore)
    // The parent's handleConnect will identify the slot and update the correct config field
    // After this completes, initialEdges will be regenerated and edges will sync
    if (onConnect) {
      onConnect(connection, sourceStep, targetStepId);
    }
  }, [tasks, onConnect, wouldCreateCycle, setEdges]);

  if (tasks.length === 0) {
    return (
      <div 
        className="flex h-full items-center justify-center rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 relative"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="text-center">
          <p className="text-slate-500 text-sm">No steps to display</p>
          <p className="text-slate-400 text-xs mt-1">Drag an atomic task here to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 overflow-hidden relative"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges.map(edge => ({
          ...edge,
          type: "default",
          data: {
            ...edge.data,
            onDelete: handleEdgeDelete,
          },
        }))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Strict}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onEdgeClick={(event, edge) => {
          // Select edge on click
          setEdges((eds) =>
            eds.map((e) => ({
              ...e,
              selected: e.id === edge.id,
            }))
          );
        }}
        onConnect={handleConnect}
        onNodesChange={onNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgesChange={handleEdgesChange}
        onPaneDragOver={onDragOver}
        onPaneDrop={onDrop}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        className="bg-gradient-to-br from-slate-50/50 to-blue-50/30"
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#94a3b8",
          },
          deletable: true,
          selectable: true,
          focusable: true,
        }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        edgesDeletable={true}
        edgesFocusable={true}
        edgesUpdatable={false}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        onEdgesDelete={(deletedEdges) => {
          // Handle edge deletion via keyboard (Delete/Backspace) - Direct update
          if (onEdgesDelete) {
            onEdgesDelete(deletedEdges);
          } else if (onConnect) {
            // Fallback to onConnect if onEdgesDelete not provided
            deletedEdges.forEach((deletedEdge) => {
              const sourceStep = tasks.find((s) => s.id === deletedEdge.source);
              if (sourceStep && deletedEdge.source && deletedEdge.target) {
                const connection: Connection = {
                  source: deletedEdge.source,
                  target: deletedEdge.target,
                  sourceHandle: deletedEdge.sourceHandle || undefined,
                };
                onConnect(connection, sourceStep, null);
              }
            });
          }
        }}
      >
        <Background variant="dots" gap={12} size={1} color="#CBD5E1" />
        <Controls className="!bg-white/90 !backdrop-blur-xl !border !border-slate-200 !rounded-xl !shadow-lg" />
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

export function VisualEditor({ tasks, onNodeUpdate, onNodeSelect, onConnect, onAddStep, onDeleteStep, onEdgesDelete, procedureTrigger }: VisualEditorProps) {
  return (
    <ReactFlowProvider>
      <VisualEditorContent tasks={tasks} onNodeUpdate={onNodeUpdate} onNodeSelect={onNodeSelect} onConnect={onConnect} onAddStep={onAddStep} onDeleteStep={onDeleteStep} onEdgesDelete={onEdgesDelete} procedureTrigger={procedureTrigger} />
    </ReactFlowProvider>
  );
}

