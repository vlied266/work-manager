"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { FileSpreadsheet, AlertTriangle } from "lucide-react";

interface GoogleSheetNodeData extends Record<string, unknown> {
  fileName?: string;
  sheetId?: string;
}

export const GoogleSheetNode = memo((props: NodeProps<Node<GoogleSheetNodeData>>) => {
  const { data } = props;
  if (!data) return null;

  const { fileName, sheetId } = data;
  const displayName = fileName || "Select a file...";
  const isIncomplete = !sheetId || sheetId === "";

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={`px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-xl border-2 shadow-lg shadow-black/5 min-w-[200px] max-w-[280px] hover:shadow-xl transition-all relative ${
        isIncomplete 
          ? "border-orange-400 hover:border-orange-500" 
          : "border-green-500 hover:border-green-600"
      }`}
      onMouseEnter={() => isIncomplete && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 !border-2 !border-white ${
          isIncomplete ? "!bg-orange-500" : "!bg-green-500"
        }`}
        style={{ borderRadius: "50%" }}
      />

      {/* Node Content */}
      <div className="space-y-2">
        {/* Icon & Title Row */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isIncomplete ? "bg-orange-100" : "bg-green-100"
          }`}>
            <FileSpreadsheet className={`h-4 w-4 ${
              isIncomplete ? "text-orange-600" : "text-green-600"
            }`} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight flex-1">
            Append to Sheet
          </h3>
          
          {/* Warning Icon - Only show when incomplete */}
          {isIncomplete && (
            <div className="relative">
              <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
              
              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute top-full right-0 mt-2 z-50 w-48 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none">
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-900 rotate-45"></div>
                  <p className="font-semibold mb-0.5">Setup Required</p>
                  <p className="text-slate-300">Select a Google Sheet in the properties panel</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Name / Subtitle */}
        <div className="pt-1">
          <p className={`text-xs font-medium ${
            fileName 
              ? "text-slate-700" 
              : isIncomplete 
                ? "text-orange-600 italic font-semibold" 
                : "text-slate-400 italic"
          }`}>
            {displayName}
          </p>
        </div>
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 !border-2 !border-white ${
          isIncomplete ? "!bg-orange-500" : "!bg-green-500"
        }`}
        style={{ borderRadius: "50%" }}
      />
    </div>
  );
});

GoogleSheetNode.displayName = "GoogleSheetNode";

