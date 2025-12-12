"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Zap, Play } from "lucide-react";

interface TriggerNodeData extends Record<string, unknown> {
  triggerType?: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK";
  label?: string;
}

export const TriggerNode = memo((props: NodeProps<Node<TriggerNodeData>>) => {
  const { data, selected } = props;
  if (!data) return null;
  
  const { triggerType = "MANUAL", label = "Start" } = data;
  
  const getTriggerConfig = () => {
    switch (triggerType) {
      case "ON_FILE_CREATED":
        return {
          icon: Play,
          color: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          label: "File Upload",
        };
      case "WEBHOOK":
        return {
          icon: Zap,
          color: "from-purple-500 to-purple-600",
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
          label: "Webhook",
        };
      default:
        return {
          icon: Play,
          color: "from-green-500 to-green-600",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          label: "Manual Start",
        };
    }
  };

  const config = getTriggerConfig();
  const IconComponent = config.icon;

  return (
    <div 
      className={`relative ${
        selected 
          ? "ring-2 ring-blue-500 ring-offset-2 rounded-full" 
          : ""
      }`}
    >
      {/* Circular Node */}
      <div 
        className={`w-32 h-32 rounded-full bg-gradient-to-br ${config.color} shadow-xl border-4 border-white flex flex-col items-center justify-center relative`}
      >
        {/* Icon */}
        <div className={`p-3 rounded-full ${config.bgColor} mb-2`}>
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        
        {/* Label */}
        <span className={`text-xs font-bold ${config.textColor} uppercase tracking-wider`}>
          {config.label}
        </span>
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full"
        style={{
          bottom: "-6px",
        }}
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";

