"use client";

import { useDraggable } from "@dnd-kit/core";
import { AtomicAction, ATOMIC_ACTION_METADATA, ATOMIC_ACTIONS_BY_GROUP } from "@/types/schema";
import * as LucideIcons from "lucide-react";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

interface DraggableActionCardProps {
  action: AtomicAction;
}

function DraggableActionCard({ action }: DraggableActionCardProps) {
  const metadata = ATOMIC_ACTION_METADATA[action];
  const IconComponent = (LucideIcons as any)[metadata.icon] || LucideIcons.Type;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `atomic-action-${action}`,
    data: {
      type: "atomic-action",
      action,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        rotate: isDragging ? "2deg" : "0deg",
      }
    : undefined;

  const iconBgColor = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
  }[metadata.color] || "bg-slate-500";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab active:cursor-grabbing rounded-2xl bg-white shadow-sm border border-slate-100 p-4 transition-all duration-200 ${
        isDragging ? "shadow-xl opacity-90 scale-105 ring-1 ring-black/5" : "hover:shadow-md hover:-translate-y-1"
      }`}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-4">
        {/* Large Squircle Icon */}
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBgColor} text-white shadow-md flex-shrink-0`}>
          <IconComponent className="h-7 w-7" strokeWidth={2} />
        </div>
        
        {/* Title Only - No Description */}
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">{metadata.label}</h4>
      </div>
    </motion.div>
  );
}

export function DraggableSidebar() {
  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Clean Header */}
      <div className="relative flex-shrink-0 p-8 pb-6 border-b border-slate-100 z-10">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1">Toolbox</h2>
        <p className="text-xs text-slate-500 font-medium">Atomic tasks</p>
      </div>

      {/* Scrollable Content - Spacious */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8 min-h-0">
        <div className="space-y-8 pt-8">
        {Object.entries(ATOMIC_ACTIONS_BY_GROUP).map(([groupName, actions]) => {
          return (
            <motion.div
              key={groupName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                {groupName}
              </h3>
              <div className="space-y-3">
                {actions.map((action) => (
                  <DraggableActionCard key={action} action={action} />
                ))}
              </div>
            </motion.div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
