"use client";

import { useState, useEffect } from "react";
import { AtomicStep, ActiveRun } from "@/types/schema";
import { FileSpreadsheet, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface GoogleSheetRendererProps {
  step: AtomicStep;
  run: ActiveRun;
  runContext: any;
  onComplete: (output: any) => void;
}

/**
 * Resolve variable references in mapping values
 * Supports {{variable}} syntax with dot notation (e.g., {{step_1.full_name}}, {{form_1.email}})
 * 
 * @example
 * Input: "Applicant: {{form_1.name}}"
 * Context: { form_1: { name: "Saeed", email: "test@example.com" } }
 * Output: "Applicant: Saeed"
 * 
 * @example
 * Input: "{{step_1.output.email}}"
 * Context: { step_1: { output: { email: "user@example.com" } } }
 * Output: "user@example.com"
 */
function resolveMappingValue(value: string, context: any): string {
  if (!value || typeof value !== 'string') return value || '';
  
  // Check if value contains variable references
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  
  // If no placeholders found, return as-is
  if (!placeholderRegex.test(value)) {
    return value;
  }
  
  // Reset regex lastIndex
  placeholderRegex.lastIndex = 0;
  
  // Replace all placeholders with values from context
  let resolved = value;
  let match;
  
  while ((match = placeholderRegex.exec(value)) !== null) {
    const variablePath = match[1].trim();
    
    // Use resolveVariables to get nested values (supports dot notation)
    // We'll use a helper function to safely get nested values
    const varValue = getNestedValue(context, variablePath);
    
    if (varValue !== undefined && varValue !== null) {
      // Replace the placeholder with the actual value
      const replacement = typeof varValue === 'string' 
        ? varValue 
        : typeof varValue === 'object' 
          ? JSON.stringify(varValue) 
          : String(varValue);
      
      resolved = resolved.replace(match[0], replacement);
    }
    // If value not found, keep the original placeholder (or could return empty string)
  }
  
  return resolved;
}

/**
 * Safely get nested value from context using dot notation
 * Supports paths like "step_1.output.email" or "form_1.name"
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.').map(k => k.trim()).filter(k => k.length > 0);
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

export function GoogleSheetRenderer({
  step,
  run,
  runContext,
  onComplete,
}: GoogleSheetRendererProps) {
  const [processing, setProcessing] = useState(true);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const executeGoogleSheetTask = async () => {
      try {
        setProcessing(true);
        setError(null);

        const config = step.config || {};
        const sheetId = config.sheetId;
        const mapping = config.mapping || { A: "", B: "", C: "" };

        if (!sheetId) {
          throw new Error("Google Sheet not configured. Please select a sheet in the Studio.");
        }

        // Resolve mapping values (replace variables with actual values)
        // Supports {{ stepId.fieldKey }} syntax (e.g., {{form_1.name}}, {{step_1.full_name}})
        const resolvedMapping = {
          A: resolveMappingValue(mapping.A || "", runContext),
          B: resolveMappingValue(mapping.B || "", runContext),
          C: resolveMappingValue(mapping.C || "", runContext),
          D: resolveMappingValue(mapping.D || "", runContext),
          E: resolveMappingValue(mapping.E || "", runContext),
          F: resolveMappingValue(mapping.F || "", runContext),
          G: resolveMappingValue(mapping.G || "", runContext),
          H: resolveMappingValue(mapping.H || "", runContext),
          I: resolveMappingValue(mapping.I || "", runContext),
          J: resolveMappingValue(mapping.J || "", runContext),
        };

        // Prepare row data (include all columns A-J that have values)
        const columnLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const rowData: string[] = [];
        
        // Add values for each column that has a mapping
        columnLabels.forEach((col) => {
          const value = resolvedMapping[col as keyof typeof resolvedMapping];
          if (value && value.trim() !== "") {
            rowData.push(value);
          }
        });
        
        // Remove trailing empty values to keep the row compact
        while (rowData.length > 0 && rowData[rowData.length - 1] === "") {
          rowData.pop();
        }

        if (rowData.length === 0) {
          throw new Error("No data to write. Please configure at least one column mapping.");
        }

        console.log("🟡 [Google Sheet] Writing row to sheet:", {
          sheetId,
          rowData,
          originalMapping: mapping,
          resolvedMapping: resolvedMapping,
          context: runContext,
        });

        // Call the test-write API (or the real write API)
        const response = await fetch(`/api/integrations/google/test-write?sheetId=${encodeURIComponent(sheetId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            values: [rowData],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to write to Google Sheet");
        }

        const result = await response.json();
        
        console.log("✅ [Google Sheet] Successfully wrote to sheet:", result);

        setOutput({
          success: true,
          sheetId,
          fileName: config.fileName,
          rowData,
          updatedRange: result.updatedRange,
          updatedRows: result.updatedRows,
          updatedColumns: result.updatedColumns,
        });

        // Auto-complete after a short delay to show the result
        setTimeout(() => {
          onComplete({
            success: true,
            sheetId,
            fileName: config.fileName,
            rowData,
            updatedRange: result.updatedRange,
          });
        }, 1500);
      } catch (err) {
        console.error("Error executing Google Sheet task:", err);
        setError(err instanceof Error ? err.message : "Failed to write to Google Sheet");
        setProcessing(false);
      }
    };

    executeGoogleSheetTask();
  }, [step, run, runContext, onComplete]);

  return (
    <div className="space-y-6">
      {/* Processing State */}
      {processing && !output && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50 p-12 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl mb-6"
          >
            <FileSpreadsheet className="h-10 w-10" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            Writing to Google Sheet...
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Appending data to {step.config?.fileName || "selected sheet"}
          </p>

          {/* Pulsing Gradient Skeleton */}
          <div className="space-y-3 max-w-md mx-auto">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="h-4 rounded-lg bg-gradient-to-r from-green-200 via-blue-200 to-green-200"
                style={{ width: `${80 + i * 10}%` }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Data Written Successfully</h3>
              <p className="text-sm text-slate-600">Row appended to Google Sheet</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Sheet:</p>
              <p className="text-sm text-slate-900">{output.fileName || "Unknown"}</p>
            </div>
            {output.updatedRange && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Updated Range:</p>
                <p className="text-sm text-slate-900 font-mono">{output.updatedRange}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Data Written:</p>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {output.rowData.map((cell: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm font-medium"
                    >
                      {cell || "(empty)"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-rose-600" />
            <h3 className="text-sm font-semibold text-rose-900">Google Sheet Write Failed</h3>
          </div>
          <p className="text-sm text-rose-700">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

