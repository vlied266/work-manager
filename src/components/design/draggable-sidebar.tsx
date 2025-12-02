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

  const colorClasses = {
    blue: "bg-blue-50/80 border-blue-200/80 text-blue-700 hover:bg-blue-100/90 hover:border-blue-300",
    green: "bg-green-50/80 border-green-200/80 text-green-700 hover:bg-green-100/90 hover:border-green-300",
    yellow: "bg-yellow-50/80 border-yellow-200/80 text-yellow-700 hover:bg-yellow-100/90 hover:border-yellow-300",
    purple: "bg-purple-50/80 border-purple-200/80 text-purple-700 hover:bg-purple-100/90 hover:border-purple-300",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab active:cursor-grabbing rounded-2xl border-2 p-5 transition-all backdrop-blur-sm ${
        colorClasses[metadata.color as keyof typeof colorClasses] || colorClasses.blue
      } ${isDragging ? "shadow-2xl z-50 opacity-90 scale-105" : "shadow-sm hover:shadow-lg"}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            metadata.color === "blue" ? "bg-blue-100 text-blue-600" :
            metadata.color === "green" ? "bg-green-100 text-green-600" :
            metadata.color === "yellow" ? "bg-yellow-100 text-yellow-600" :
            "bg-purple-100 text-purple-600"
          } shadow-sm`}>
            <IconComponent className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 mb-1">{metadata.label}</h4>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium">{metadata.description}</p>
        </div>
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <LucideIcons.GripVertical className="h-4 w-4 text-slate-400" strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}

export function DraggableSidebar() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50/50 via-white to-white border-r border-slate-200/80 backdrop-blur-sm">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl p-8 pb-6 border-b border-slate-200/80 z-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Atomic Actions</h2>
            <p className="text-xs text-slate-500 font-medium">Drag to add to your procedure</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8 min-h-0">
        <div className="space-y-8 pt-8">
        {Object.entries(ATOMIC_ACTIONS_BY_GROUP).map(([groupName, actions]) => {
          const groupMetadata = ATOMIC_ACTION_METADATA[actions[0]];
          const groupColor = groupMetadata.color;

          return (
            <motion.div
              key={groupName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${
                    groupColor === "blue"
                      ? "bg-blue-500"
                      : groupColor === "green"
                      ? "bg-green-500"
                      : groupColor === "yellow"
                      ? "bg-yellow-500"
                      : "bg-purple-500"
                  } shadow-sm`}
                />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  {groupName}
                </h3>
              </div>
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
