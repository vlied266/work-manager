"use client";

import { useState, useEffect } from "react";
import { AtomicStep } from "@/types/schema";
import { ArrowUpDown, CheckCircle2, Loader2 } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface OrganiseRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function OrganiseRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: OrganiseRendererProps) {
  const [isOrganising, setIsOrganising] = useState(false);
  const [organisedData, setOrganisedData] = useState<any>(output?.organisedData || null);

  // Auto-organise when step loads if rules are provided
  useEffect(() => {
    if ((step.config.sortBy || step.config.groupBy) && !organisedData) {
      handleOrganise();
    }
  }, [step.config.sortBy, step.config.groupBy]);

  const handleOrganise = async () => {
    setIsOrganising(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Get source data from context
      let sourceData = null;
      if (step.config.outputVariableName) {
        sourceData = getContextValue(runContext, step.config.outputVariableName);
      }

      let result = sourceData;

      // Apply sorting
      if (step.config.sortBy && Array.isArray(sourceData)) {
        result = [...sourceData].sort((a, b) => {
          const aVal = a[step.config.sortBy!];
          const bVal = b[step.config.sortBy!];
          if (typeof aVal === "string") {
            return aVal.localeCompare(bVal);
          }
          return (aVal || 0) - (bVal || 0);
        });
      }

      // Apply grouping
      if (step.config.groupBy && Array.isArray(result)) {
        const grouped: Record<string, any[]> = {};
        result.forEach((item) => {
          const key = item[step.config.groupBy!] || "Other";
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(item);
        });
        result = grouped;
      }

      setOrganisedData(result);
      setOutput({
        organisedData: result,
        originalData: sourceData,
        sortBy: step.config.sortBy,
        groupBy: step.config.groupBy,
        organisedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Organisation error:", error);
    } finally {
      setIsOrganising(false);
    }
  };

  const handleComplete = () => {
    if (!organisedData) {
      alert("Please organise data first.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Data Organisation</p>
        <p className="text-xs text-blue-700">
          Sort, filter, or group data
        </p>
      </div>

      {(step.config.sortBy || step.config.groupBy) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Organisation Rules:</p>
          <div className="space-y-2">
            {step.config.sortBy && (
              <div className="rounded-lg border border-slate-300 bg-white px-4 py-2">
                <span className="text-xs font-medium text-slate-600">Sort by:</span>
                <span className="ml-2 text-sm text-slate-900 font-mono">{step.config.sortBy}</span>
              </div>
            )}
            {step.config.groupBy && (
              <div className="rounded-lg border border-slate-300 bg-white px-4 py-2">
                <span className="text-xs font-medium text-slate-600">Group by:</span>
                <span className="ml-2 text-sm text-slate-900 font-mono">{step.config.groupBy}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isOrganising && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-blue-900">Organising data...</p>
        </div>
      )}

      {organisedData && !isOrganising && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-semibold text-green-900">Organised Data:</p>
          </div>
          <div className="rounded-lg border border-green-300 bg-white px-4 py-3 max-h-64 overflow-y-auto">
            <pre className="text-xs text-slate-900 whitespace-pre-wrap font-mono">
              {typeof organisedData === "object"
                ? JSON.stringify(organisedData, null, 2)
                : String(organisedData)}
            </pre>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!organisedData && !isOrganising && (
          <button
            onClick={handleOrganise}
            disabled={!step.config.sortBy && !step.config.groupBy}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpDown className="mr-2 inline h-4 w-4" />
            Organise Data
          </button>
        )}
        {organisedData && (
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

