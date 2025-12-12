"use client";

import { memo } from "react";
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
import { X } from "lucide-react";

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps) => {
  const onDelete = data?.onDelete;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? "#3B82F6" : style.stroke || "#94a3b8",
        }}
      />
      {selected && onDelete && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="nodrag nopan"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors z-10"
              title="Delete connection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomEdge.displayName = "CustomEdge";

