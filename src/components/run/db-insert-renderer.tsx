"use client";

import { useState } from "react";
import { AtomicStep } from "@/types/schema";
import { Database, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

interface DBInsertRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runLogs: any[];
  procedureSteps: any[];
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function DBInsertRenderer({
  step,
  output,
  setOutput,
  runLogs,
  procedureSteps,
  handleCompleteStep,
  submitting,
}: DBInsertRendererProps) {
  const { organizationId } = useOrganization();
  const [isInserting, setIsInserting] = useState(false);
  const [insertStatus, setInsertStatus] = useState<"idle" | "success" | "error">(
    output?.status || "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInsert = async () => {
    if (!organizationId) {
      setErrorMessage("Organization ID is required");
      setInsertStatus("error");
      return;
    }

    setIsInserting(true);
    setInsertStatus("idle");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/runs/execute-db-insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step,
          runLogs,
          procedureSteps,
          orgId: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to insert record");
      }

      const result = await response.json();
      setInsertStatus("success");
      setOutput({
        status: "success",
        recordId: result.recordId,
        collectionId: result.collectionId,
        collectionName: result.collectionName,
        data: result.data,
        insertedAt: result.createdAt,
      });
    } catch (error: any) {
      setInsertStatus("error");
      setErrorMessage(error.message || "Failed to insert record");
      setOutput({
        status: "error",
        error: error.message || "Failed to insert record",
      });
    } finally {
      setIsInserting(false);
    }
  };

  const handleComplete = () => {
    if (insertStatus !== "success") {
      setErrorMessage("Please insert the record first.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  const collectionName = step.config?.collectionName || "Unknown";
  const dataPreview = step.config?.data || {};

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💾 Database Insert</p>
        <p className="text-xs text-blue-700">
          Save data to <span className="font-semibold">{collectionName}</span> collection
        </p>
      </div>

      {Object.keys(dataPreview).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Data to Insert:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <pre className="text-xs text-slate-900 font-mono overflow-x-auto">
              {JSON.stringify(dataPreview, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {insertStatus === "success" && output?.recordId && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Record inserted successfully
            </p>
          </div>
          <p className="mt-1 text-xs text-green-700">
            Record ID: {output.recordId}
          </p>
          {output.insertedAt && (
            <p className="mt-1 text-xs text-green-700">
              {new Date(output.insertedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {insertStatus === "error" && errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-900">Insert failed</p>
          </div>
          <p className="mt-1 text-xs text-rose-700">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        {insertStatus !== "success" && (
          <button
            onClick={handleInsert}
            disabled={isInserting || submitting}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInserting ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Inserting...
              </>
            ) : (
              <>
                <Database className="mr-2 inline h-4 w-4" />
                Insert Record
              </>
            )}
          </button>
        )}
        {insertStatus === "success" && (
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

