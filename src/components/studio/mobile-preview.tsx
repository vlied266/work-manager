"use client";

import { AtomicStep } from "@/types/schema";
import { TaskRenderer } from "@/components/run/task-renderer";
import { useState } from "react";
import { motion } from "framer-motion";
import { resolveConfig, ResolvedConfig } from "@/lib/engine/resolver";

interface MobilePreviewProps {
  step: AtomicStep | null;
  allSteps: AtomicStep[];
}

export function MobilePreview({ step, allSteps }: MobilePreviewProps) {
  const [output, setOutput] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create a mock run context for preview
  const mockRunContext: any = {};
  const mockRun: any = {
    id: "preview",
    status: "IN_PROGRESS",
  };

  // Resolve config for preview (using empty logs since it's a preview)
  const resolvedConfig: ResolvedConfig | null = step ? resolveConfig(step.config || {}, [], allSteps) : null;

  // Use the original step (TaskRenderer will use resolvedConfig prop)
  const resolvedStep: AtomicStep | null = step;

  // Mock handlers for preview
  const handleCompleteStep = (_outcome: "SUCCESS" | "FAILURE" | "FLAGGED", _autoFlagged?: boolean) => {
    // No-op in preview
  };

  const setProcessing = (_value: boolean) => {
    // No-op in preview
  };

  const setValidationError = (_error: string | null) => {
    // No-op in preview
  };

  if (!resolvedStep) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-50 to-[#F2F2F7]">
        <div className="text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
            <div className="relative h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 flex items-center justify-center shadow-sm">
              <span className="text-3xl">📱</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#86868b]">
            Select a step to see how it will look on mobile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center min-h-full p-8 bg-gradient-to-b from-gray-50 to-[#F2F2F7]">
      {/* iPhone 15 Pro Frame - Modern Bezel-less Design */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-[375px] max-h-[calc(100vh-200px)] flex-shrink-0 bg-black rounded-[3.5rem] p-1.5 shadow-2xl"
        style={{
          boxShadow: "0 25px 80px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)",
          height: "min(812px, calc(100vh - 200px))",
        }}
      >
        {/* Dynamic Island (iPhone 15 Pro style) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-10 flex items-center justify-center">
          <div className="w-16 h-1.5 bg-gray-800 rounded-full" />
        </div>
        
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative flex flex-col">
          {/* Status Bar */}
          <div className="flex-shrink-0 h-14 bg-white flex items-center justify-between px-6 pt-8 pb-2 text-[#1D1D1F] text-xs font-semibold">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-[#1D1D1F] rounded-sm" />
              <div className="w-6 h-2 border border-[#1D1D1F] rounded-sm" />
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white">
            <div className="p-6 pb-24">
              <TaskRenderer
                step={resolvedStep}
                output={output}
                setOutput={setOutput}
                runContext={mockRunContext}
                setProcessing={setProcessing}
                setValidationError={setValidationError}
                run={mockRun}
                handleCompleteStep={handleCompleteStep}
                submitting={submitting}
                runId="preview"
                resolvedConfig={resolvedConfig || undefined}
              />
            </div>
          </div>

          {/* Home Indicator (iPhone 15 Pro style) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-36 h-1 bg-[#1D1D1F] rounded-full z-10" />
        </div>
      </motion.div>
    </div>
  );
}
