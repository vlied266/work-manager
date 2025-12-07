"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { FileSpreadsheet } from "lucide-react";

interface GoogleSheetNodeData extends Record<string, unknown> {
  fileName?: string;
  sheetId?: string;
}

export const GoogleSheetNode = memo((props: NodeProps<Node<GoogleSheetNodeData>>) => {
  const { data } = props;
  if (!data) return null;

  const { fileName } = data;
  const displayName = fileName || "Select a file...";

  return (
    <div className="px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-xl border-2 border-green-500 shadow-lg shadow-black/5 min-w-[200px] max-w-[280px] hover:shadow-xl transition-all">
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ borderRadius: "50%" }}
      />

      {/* Node Content */}
      <div className="space-y-2">
        {/* Icon & Title */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-100">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            Append to Sheet
          </h3>
        </div>

        {/* File Name / Subtitle */}
        <div className="pt-1">
          <p className={`text-xs font-medium ${
            fileName ? "text-slate-700" : "text-slate-400 italic"
          }`}>
            {displayName}
          </p>
        </div>
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ borderRadius: "50%" }}
      />
    </div>
  );
});

GoogleSheetNode.displayName = "GoogleSheetNode";

