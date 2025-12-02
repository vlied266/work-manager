"use client";

import { useState, useEffect } from "react";
import { AtomicStep } from "@/types/schema";
import { RefreshCw, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface TransformRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function TransformRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: TransformRendererProps) {
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedData, setTransformedData] = useState<any>(output?.transformedData || null);

  // Auto-transform when step loads if transformation rule is provided
  useEffect(() => {
    if (step.config.transformationRule && !transformedData) {
      handleTransform();
    }
  }, [step.config.transformationRule]);

  const handleTransform = async () => {
    if (!step.config.transformationRule) return;

    setIsTransforming(true);

    try {
      // Simulate transformation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get source data from context
      let sourceData = null;
      if (step.config.outputVariableName) {
        sourceData = getContextValue(runContext, step.config.outputVariableName);
      }

      // Apply transformation rule (simplified - in real app, this would parse and apply the rule)
      let result = sourceData;
      
      // Basic transformations
      if (step.config.transformationRule.includes("uppercase")) {
        result = typeof sourceData === "string" ? sourceData.toUpperCase() : sourceData;
      } else if (step.config.transformationRule.includes("lowercase")) {
        result = typeof sourceData === "string" ? sourceData.toLowerCase() : sourceData;
      } else if (step.config.transformationRule.includes("trim")) {
        result = typeof sourceData === "string" ? sourceData.trim() : sourceData;
      } else if (step.config.transformationRule.includes("JSON")) {
        try {
          result = typeof sourceData === "string" ? JSON.parse(sourceData) : sourceData;
        } catch {
          result = sourceData;
        }
      }

      setTransformedData(result);
      setOutput({
        transformedData: result,
        originalData: sourceData,
        transformationRule: step.config.transformationRule,
        transformedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Transformation error:", error);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleComplete = () => {
    if (!transformedData) {
      alert("Please transform data first.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Data Transformation</p>
        <p className="text-xs text-blue-700">
          Convert data from one format to another
        </p>
      </div>

      {step.config.transformationRule && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Transformation Rule:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <p className="text-sm text-slate-900 font-mono">{step.config.transformationRule}</p>
          </div>
        </div>
      )}

      {isTransforming && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-blue-900">Transforming data...</p>
        </div>
      )}

      {transformedData && !isTransforming && (
        <div className="space-y-3">
          {output?.originalData !== undefined && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Original Data:</p>
              <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                  {JSON.stringify(output.originalData, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Transformed Data:</p>
            </div>
            <div className="rounded-lg border border-green-300 bg-white px-4 py-3">
              <pre className="text-xs text-slate-900 whitespace-pre-wrap font-mono">
                {typeof transformedData === "object"
                  ? JSON.stringify(transformedData, null, 2)
                  : String(transformedData)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!transformedData && !isTransforming && (
          <button
            onClick={handleTransform}
            disabled={!step.config.transformationRule}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="mr-2 inline h-4 w-4" />
            Transform Data
          </button>
        )}
        {transformedData && (
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="flex-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Complete & Continue
          </button>
        )}
      </div>
    </div>
  );
}

