"use client";

import { Info } from "lucide-react";
import { motion } from "framer-motion";

interface DataSourceBadgeProps {
  stepTitle: string;
  variableName: string;
  className?: string;
}

export function DataSourceBadge({ stepTitle, variableName, className = "" }: DataSourceBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 ${className}`}
    >
      <Info className="h-3 w-3" />
      <span>
        Source: <span className="font-semibold">{stepTitle}</span>
      </span>
    </motion.div>
  );
}

