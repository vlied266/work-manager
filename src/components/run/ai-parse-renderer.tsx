"use client";

import { useState } from "react";
import { AtomicStep } from "@/types/schema";
import { FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

interface AIParseRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runLogs: any[];
  procedureSteps: any[];
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
  runContext?: any; // For resolving variables
}

export function AIParseRenderer({
  step,
  output,
  setOutput,
  runLogs,
  procedureSteps,
  handleCompleteStep,
  submitting,
  runContext,
}: AIParseRendererProps) {
  const { organizationId } = useOrganization();
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<"idle" | "success" | "error">(
    output?.status || "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resolve fileUrl from variables
  const resolveVariable = (value: string): string => {
    if (!value || typeof value !== "string") return value;
    
    // Check if it's a mustache variable
    const match = value.match(/\{\{([^}]+)\}\}/);
    if (!match) return value;
    
    const varPath = match[1].trim();
    const parts = varPath.split(".");
    
    // Try to resolve from runContext first
    if (runContext) {
      let current: any = runContext;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          return value; // Variable not found
        }
      }
      return current || value;
    }
    
    return value;
  };

  // Resolve fileUrl from various sources
  let fileUrl: string | undefined;
  
  // Priority 1: Check if fileSourceStepId is TRIGGER_EVENT
  if (step.config?.fileSourceStepId === "TRIGGER_EVENT") {
    fileUrl = runContext?.trigger?.file || runContext?.trigger?.fileUrl || runContext?.trigger?.filePath ||
              runContext?.initialInput?.fileUrl || runContext?.initialInput?.filePath;
  }
  // Priority 2: Check if fileSourceStepId points to a previous step
  else if (step.config?.fileSourceStepId) {
    const sourceStepId = step.config.fileSourceStepId;
    const sourceStepIndex = procedureSteps.findIndex(s => s.id === sourceStepId);
    if (sourceStepIndex >= 0 && runLogs[sourceStepIndex]) {
      const sourceOutput = runLogs[sourceStepIndex].output;
      fileUrl = sourceOutput?.fileUrl || sourceOutput?.filePath || sourceOutput?.file;
    }
  }
  // Priority 3: Use fileUrl from config (with variable resolution)
  else if (step.config?.fileUrl) {
    fileUrl = resolveVariable(step.config.fileUrl);
  }
  // Priority 4: Fallback to initialInput
  else {
    fileUrl = runContext?.initialInput?.fileUrl || runContext?.initialInput?.filePath;
  }
  
  const fieldsToExtract = step.config?.fieldsToExtract || [];
  const fileType = step.config?.fileType;

  const handleParse = async () => {
    if (!organizationId) {
      setErrorMessage("Organization ID is required");
      setParseStatus("error");
      return;
    }

    if (!fileUrl) {
      setErrorMessage("File URL is required. Please ensure the file is uploaded or the file path is configured.");
      setParseStatus("error");
      return;
    }

    if (!fieldsToExtract || fieldsToExtract.length === 0) {
      setErrorMessage("Fields to extract are required");
      setParseStatus("error");
      return;
    }

    setIsParsing(true);
    setParseStatus("idle");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/parse-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          fieldsToExtract,
          fileType,
          orgId: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to parse document");
      }

      const result = await response.json();
      setParseStatus("success");
      setOutput({
        status: "success",
        extractedData: result.extractedData,
        fileType: result.fileType,
        fieldsExtracted: result.fieldsExtracted,
        parsedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      setParseStatus("error");
      setErrorMessage(error.message || "Failed to parse document");
      setOutput({
        status: "error",
        error: error.message || "Failed to parse document",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleComplete = () => {
    if (parseStatus !== "success") {
      setErrorMessage("Please parse the document first.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <p className="text-xs font-semibold text-purple-900 mb-1">
          <FileText className="inline h-3.5 w-3.5 mr-1" /> AI Document Parser
        </p>
        <p className="text-xs text-purple-700">
          Extract structured data from {fileType || "document"} file
        </p>
      </div>

      {fileUrl && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-1">File:</p>
          <p className="text-xs text-slate-600 font-mono break-all">{fileUrl}</p>
        </div>
      )}

      {fieldsToExtract.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Fields to Extract:</p>
          <div className="flex flex-wrap gap-2">
            {fieldsToExtract.map((field, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-300"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {parseStatus === "success" && output?.extractedData && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Document parsed successfully
            </p>
          </div>
          <div className="rounded-lg border border-green-300 bg-white p-3 mt-2">
            <pre className="text-xs text-green-900 font-mono overflow-x-auto">
              {JSON.stringify(output.extractedData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {parseStatus === "error" && errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-900">Parse failed</p>
          </div>
          <p className="mt-1 text-xs text-rose-700">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        {parseStatus !== "success" && (
          <button
            onClick={handleParse}
            disabled={isParsing || submitting || !fileUrl || fieldsToExtract.length === 0}
            className="flex-1 rounded-xl bg-purple-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <FileText className="mr-2 inline h-4 w-4" />
                Parse Document
              </>
            )}
          </button>
        )}
        {parseStatus === "success" && (
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

