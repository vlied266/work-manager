"use client";

import { useState } from "react";
import { AtomicStep } from "@/types/schema";
import { Database, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface StoreRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function StoreRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: StoreRendererProps) {
  const [isStoring, setIsStoring] = useState(false);
  const [storageStatus, setStorageStatus] = useState<"idle" | "success" | "error">(
    output?.status || "idle"
  );

  const handleStore = async () => {
    setIsStoring(true);
    setStorageStatus("idle");

    try {
      // Get data to store from context if specified
      let dataToStore = null;
      if (step.config.storagePath) {
        // In a real app, this would save to database/file/cache
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStorageStatus("success");
        setOutput({
          status: "success",
          storageType: step.config.storageType || "database",
          storagePath: step.config.storagePath,
          storedAt: new Date().toISOString(),
          data: dataToStore,
        });
      } else {
        // Manual storage confirmation
        setStorageStatus("success");
        setOutput({
          status: "success",
          storageType: step.config.storageType || "database",
          storedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      setStorageStatus("error");
      setOutput({
        status: "error",
        error: String(error),
      });
    } finally {
      setIsStoring(false);
    }
  };

  const handleComplete = () => {
    if (storageStatus !== "success") {
      alert("Please store data first.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  const getStorageTypeLabel = () => {
    switch (step.config.storageType) {
      case "database":
        return "Database";
      case "file":
        return "File System";
      case "cache":
        return "Cache";
      default:
        return "Storage";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Data Storage</p>
        <p className="text-xs text-blue-700">
          Save data to {getStorageTypeLabel().toLowerCase()}
        </p>
      </div>

      {step.config.storagePath && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Storage Path:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <p className="text-sm text-slate-900 font-mono">{step.config.storagePath}</p>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 mt-2">
              Type: {getStorageTypeLabel()}
            </span>
          </div>
        </div>
      )}

      {storageStatus === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Data stored successfully
            </p>
          </div>
          {output?.storedAt && (
            <p className="mt-1 text-xs text-green-700">
              {new Date(output.storedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {storageStatus === "error" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-900">Storage failed</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {storageStatus !== "success" && (
          <button
            onClick={handleStore}
            disabled={isStoring || submitting}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStoring ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Storing...
              </>
            ) : (
              <>
                <Database className="mr-2 inline h-4 w-4" />
                Store Data
              </>
            )}
          </button>
        )}
        {storageStatus === "success" && (
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

