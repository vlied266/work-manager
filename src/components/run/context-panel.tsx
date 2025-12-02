"use client";

import { ActiveRun, Procedure, RunLog, AtomicStep } from "@/types/schema";
import { 
  CheckCircle2, XCircle, Flag, Clock, FileText, 
  Image, File, Download, Eye, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ContextPanelProps {
  run: ActiveRun;
  procedure: Procedure;
  isMobile?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function ContextPanel({ 
  run, 
  procedure, 
  isMobile = false,
  isExpanded = false,
  onToggle
}: ContextPanelProps) {
  const [viewingFile, setViewingFile] = useState<{ url: string; type: string } | null>(null);

  // Get completed steps (from logs)
  const completedSteps = run.logs || [];
  
  // Get step details for each log
  const stepsWithDetails = completedSteps.map((log) => {
    const step = procedure.steps.find(s => s.id === log.stepId);
    return {
      log,
      step,
      stepIndex: procedure.steps.findIndex(s => s.id === log.stepId),
    };
  });

  const renderOutput = (log: RunLog, step: AtomicStep | undefined) => {
    const output = log.output;
    
    if (!output) {
      return (
        <div className="text-xs text-slate-400 italic">No output</div>
      );
    }

    // File URL (from IMPORT or proof uploads)
    if (typeof output === "object" && output.downloadUrl) {
      const url = output.downloadUrl;
      const fileName = output.fileName || output.proofPath || "File";
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      
      return (
        <div className="space-y-2">
          {isImage ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img
                src={url}
                alt={fileName}
                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewingFile({ url, type: "image" })}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                <Eye className="h-5 w-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <File className="h-4 w-4 text-slate-600" />
              <span className="flex-1 text-xs font-medium text-slate-700 truncate">{fileName}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-3 w-3" />
                View
              </a>
            </div>
          )}
        </div>
      );
    }

    // Signature/Proof Image
    if (typeof output === "object" && output.proofUrl) {
      return (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <img
              src={output.proofUrl}
              alt="Proof"
              className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setViewingFile({ url: output.proofUrl, type: "image" })}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
              <Eye className="h-5 w-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
            </div>
          </div>
          {output.uploadedAt && (
            <p className="text-xs text-slate-500">
              Uploaded: {new Date(output.uploadedAt).toLocaleString()}
            </p>
          )}
        </div>
      );
    }

    // Text/Number/String
    if (typeof output === "string" || typeof output === "number") {
      const displayValue = typeof output === "string" && output.length > 100
        ? output.substring(0, 100) + "..."
        : String(output);
      
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-900 break-words">{displayValue}</p>
        </div>
      );
    }

    // Object (JSON)
    if (typeof output === "object") {
      // Try to extract meaningful fields
      const keys = Object.keys(output);
      if (keys.length === 0) {
        return <div className="text-xs text-slate-400 italic">Empty object</div>;
      }

      // If it's a simple key-value object, show it nicely
      if (keys.length <= 3 && keys.every(k => typeof output[k] === "string" || typeof output[k] === "number")) {
        return (
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {keys.map((key) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-xs font-semibold text-slate-600 capitalize">{key}:</span>
                <span className="text-xs text-slate-900 flex-1">{String(output[key])}</span>
              </div>
            ))}
          </div>
        );
      }

      // Complex object - show JSON preview
      const jsonStr = JSON.stringify(output, null, 2);
      const preview = jsonStr.length > 150 ? jsonStr.substring(0, 150) + "..." : jsonStr;
      
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
            {preview}
          </pre>
        </div>
      );
    }

    return (
      <div className="text-xs text-slate-400 italic">Unknown output type</div>
    );
  };

  const getOutcomeIcon = (outcome: RunLog["outcome"]) => {
    switch (outcome) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "FAILURE":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "FLAGGED":
        return <Flag className="h-4 w-4 text-rose-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getOutcomeColor = (outcome: RunLog["outcome"]) => {
    switch (outcome) {
      case "SUCCESS":
        return "border-green-200 bg-green-50";
      case "FAILURE":
        return "border-red-200 bg-red-50";
      case "FLAGGED":
        return "border-rose-200 bg-rose-50";
      default:
        return "border-slate-200 bg-slate-50";
    }
  };

  const content = (
    <div className="space-y-4">
      {stepsWithDetails.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">No completed steps yet</p>
          <p className="text-xs text-slate-500 mt-1">Previous step outputs will appear here</p>
        </div>
      ) : (
        stepsWithDetails.map(({ log, step, stepIndex }, idx) => (
          <motion.div
            key={log.stepId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-xl border-2 p-4 ${getOutcomeColor(log.outcome)}`}
          >
            {/* Step Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getOutcomeIcon(log.outcome)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500">
                      Step {stepIndex + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      {log.action}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    {log.stepTitle || step?.title || "Unknown Step"}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {log.timestamp instanceof Date
                        ? log.timestamp.toLocaleTimeString()
                        : new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="mt-3 pt-3 border-t border-slate-200/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Output
                </span>
              </div>
              {renderOutput(log, step)}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  // Mobile: Collapsible Accordion
  if (isMobile) {
    return (
      <div className="border-t border-slate-200 bg-white/95 backdrop-blur-xl">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <span className="font-semibold text-slate-900">Previous Steps</span>
            {stepsWithDetails.length > 0 && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {stepsWithDetails.length}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-600" />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: Fixed Sidebar
  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <FileText className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Run History</h3>
          {stepsWithDetails.length > 0 && (
            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              {stepsWithDetails.length}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {content}
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setViewingFile(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden bg-white shadow-2xl">
            {viewingFile.type === "image" ? (
              <img
                src={viewingFile.url}
                alt="Preview"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            ) : (
              <div className="p-8">
                <p className="text-sm text-slate-600 mb-4">File Preview</p>
                <a
                  href={viewingFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </a>
              </div>
            )}
            <button
              onClick={() => setViewingFile(null)}
              className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm p-2 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors shadow-lg"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

