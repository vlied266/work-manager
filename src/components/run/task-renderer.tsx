"use client";

import { useState, useRef, useEffect } from "react";
import { AtomicStep, AtomicAction } from "@/types/schema";
import { CheckCircle2, XCircle, AlertTriangle, Upload, FileText, Calendar, Hash, PenTool } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getContextValue, evaluateComparison } from "@/lib/engine";
import { ResolvedConfig, getConfigSource } from "@/lib/engine/resolver";
import { ValidateRenderer } from "./validate-renderer";
import { AuthorizeRenderer } from "./authorize-renderer";
import { GenerateRenderer } from "./generate-renderer";
import { TransmitRenderer } from "./transmit-renderer";
import { StoreRenderer } from "./store-renderer";
import { TransformRenderer } from "./transform-renderer";
import { OrganiseRenderer } from "./organise-renderer";
import { CalculateRenderer } from "./calculate-renderer";
import { NegotiateRenderer } from "./negotiate-renderer";
import { TableInputRenderer } from "./table-input-renderer";
import { GatewayRenderer } from "./gateway-renderer";
import { AITaskRenderer } from "./ai-task-renderer";

interface TaskRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  setProcessing: (value: boolean) => void;
  setValidationError: (error: string | null) => void;
  run: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED", autoFlagged?: boolean) => void;
  submitting: boolean;
  runId?: string;
  resolvedConfig?: any;
}

export function TaskRenderer({
  step,
  output,
  setOutput,
  runContext,
  setProcessing,
  setValidationError,
  validationError,
  run,
  handleCompleteStep,
  submitting,
  runId,
  resolvedConfig,
}: TaskRendererProps) {
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mismatchReason, setMismatchReason] = useState(output?.reason || "");

  // Safety check: ensure step and config exist
  if (!step) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">No step data available.</p>
      </div>
    );
  }

  // Ensure config exists
  const stepConfig = step.config || {};

  // Check if this is an AI-automated task
  if (stepConfig.isAiAutomated) {
    return (
      <AITaskRenderer
        step={step}
        run={run}
        runContext={runContext}
        onComplete={(aiOutput) => {
          setOutput(aiOutput);
          handleCompleteStep("SUCCESS");
        }}
      />
    );
  }

  switch (step.action) {
    case "INPUT":
      return (
        <InputDataRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          setValidationError={setValidationError}
        />
      );

    case "COMPARE":
      return (
        <CompareRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          run={run}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
          mismatchReason={mismatchReason}
          setMismatchReason={setMismatchReason}
          resolvedConfig={resolvedConfig}
        />
      );

    case "FETCH":
    case "IMPORT":
      // For now, treat FETCH as IMPORT_FILE
      return (
        <ImportFileRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          setProcessing={setProcessing}
          uploading={uploading}
          setUploading={setUploading}
          downloadUrl={downloadUrl}
          setDownloadUrl={setDownloadUrl}
          runId={runId}
          setValidationError={setValidationError}
        />
      );

    case "MOVE_OBJECT":
    case "TRANSFORM_OBJECT":
    case "INSPECT":
      return (
        <LaborRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          setProcessing={setProcessing}
          uploading={uploading}
          setUploading={setUploading}
          runId={runId}
        />
      );

    case "VALIDATE":
      return (
        <ValidateRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "AUTHORIZE":
      return (
        <AuthorizeRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
          runId={runId}
        />
      );

    case "GENERATE":
      return (
        <GenerateRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "TRANSMIT":
      return (
        <TransmitRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "STORE":
      return (
        <StoreRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "TRANSFORM":
      return (
        <TransformRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "ORGANISE":
      return (
        <OrganiseRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "CALCULATE":
      return (
        <CalculateRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "NEGOTIATE":
      return (
        <NegotiateRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    case "GATEWAY":
      return (
        <GatewayRenderer
          step={{ ...step, config: stepConfig }}
          output={output}
          setOutput={setOutput}
          runContext={runContext}
          handleCompleteStep={handleCompleteStep}
          submitting={submitting}
        />
      );

    default:
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">
            Task type "{step.action}" is not yet implemented.
          </p>
        </div>
      );
  }
}

// Import File Renderer
function ImportFileRenderer({
  step,
  output,
  setOutput,
  setProcessing,
  uploading,
  setUploading,
  downloadUrl,
  setDownloadUrl,
  runId,
  setValidationError,
}: {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  setProcessing: (value: boolean) => void;
  uploading: boolean;
  setUploading: (value: boolean) => void;
  downloadUrl: string | null;
  setDownloadUrl: (value: string | null) => void;
  runId?: string;
  setValidationError?: (error: string | null) => void;
}) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setProcessing(true);
    setUploadProgress(0);

    try {
      // Create storage path: uploads/{orgId}/{runId}/{timestamp}_{filename}
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `uploads/${organizationId}/${runId || "temp"}/${timestamp}_${sanitizedFilename}`;
      const storageRef = ref(storage, storagePath);

      // Upload file with progress tracking
      const uploadTask = uploadBytes(storageRef, file);
      
      // Simulate progress (Firebase Storage doesn't provide native progress for uploadBytes)
      // In production, you might want to use uploadBytesResumable for real progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get download URL
      const url = await getDownloadURL(storageRef);

      setDownloadUrl(url);
      setOutput({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath,
        downloadUrl: url,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      setValidationError(`Failed to upload file: ${(error as Error).message}`);
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setProcessing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: false,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`rounded-3xl border-2 border-dashed p-16 text-center transition-all cursor-pointer ${
          isDragActive
            ? "border-blue-500 bg-blue-50/80 scale-[1.02]"
            : uploading
            ? "border-slate-300 bg-slate-50"
            : "border-slate-300 bg-gradient-to-br from-slate-50 to-white hover:border-blue-400 hover:bg-blue-50/50 hover:scale-[1.01]"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" strokeWidth={2} />
            <div className="space-y-2">
              <p className="text-base font-bold text-slate-700">Uploading file...</p>
              <div className="w-full max-w-xs mx-auto">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                  />
                </div>
                <p className="text-sm font-semibold text-slate-600 mt-2 text-center">{uploadProgress}%</p>
              </div>
              <p className="text-sm text-slate-500">Please wait while we process your file</p>
            </div>
          </div>
        ) : (
          <div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-100 mb-6"
            >
              <Upload className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
            </motion.div>
            <p className="text-xl font-bold text-slate-900 mb-2">
              {isDragActive ? "Drop file here" : "Upload File"}
            </p>
            <p className="text-base text-slate-600 mb-1">
              {isDragActive ? "Release to upload" : "Click to browse or drag and drop"}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              PDF, Images, CSV, Excel files supported
            </p>
          </div>
        )}
      </div>

      {downloadUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">
                  {output?.fileName || "File uploaded"}
                </p>
                <p className="text-sm text-slate-600 font-medium">
                  {(output?.fileSize / 1024).toFixed(2)} KB • Uploaded successfully
                </p>
              </div>
            </div>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-green-300 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition-all hover:bg-green-50 hover:scale-105"
            >
              <FileText className="h-4 w-4" strokeWidth={2} />
              Download
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Input Data Renderer
function InputDataRenderer({
  step,
  output,
  setOutput,
  setValidationError,
}: {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  setValidationError: (error: string | null) => void;
}) {
  const stepConfig = step.config || {};
  const inputType = stepConfig.inputType || "text";
  const placeholder = stepConfig.placeholder || `Enter ${inputType}`;
  const fieldLabel = stepConfig.fieldLabel || "Input";

  // Handle table input type
  if (inputType === "table") {
    return (
      <TableInputRenderer
        step={step}
        output={output}
        setOutput={setOutput}
        setValidationError={setValidationError}
      />
    );
  }

  const handleChange = (value: string) => {
    // For number type, prevent non-numeric input
    if (inputType === "number" && value !== "" && value !== "-" && value !== ".") {
      // Allow only numbers, decimal point, and minus sign
      const numericRegex = /^-?\d*\.?\d*$/;
      if (!numericRegex.test(value)) {
        setValidationError("Please enter a valid number");
        return;
      }
    }

    setOutput(value);

    // Real-time validation
    if (stepConfig.required && !value.trim()) {
      setValidationError("This field is required");
      return;
    }

    if (inputType === "number" && value !== "" && value !== "-" && value !== ".") {
      const num = parseFloat(value);
      if (isNaN(num)) {
        setValidationError("Please enter a valid number");
        return;
      }
    }

    if (inputType === "date" && value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        setValidationError("Please enter a valid date");
        return;
      }
    }

    if (inputType === "email" && value && !value.includes("@")) {
      setValidationError("Please enter a valid email address");
      return;
    }

    if (stepConfig.validationRegex && value) {
      const regex = new RegExp(stepConfig.validationRegex);
      if (!regex.test(value)) {
        setValidationError(stepConfig.validationMessage || "Invalid format");
        return;
      }
    }

    setValidationError(null);
  };

  const getInputIcon = () => {
    switch (inputType) {
      case "number":
        return <Hash className="h-5 w-5 text-slate-400" />;
      case "date":
        return <Calendar className="h-5 w-5 text-slate-400" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <label className="block text-base font-bold text-slate-900 mb-4 tracking-tight">
          {fieldLabel}
          {stepConfig.required && <span className="text-rose-500 ml-1">*</span>}
        </label>

        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
            <div className="text-slate-400 group-focus-within:text-blue-500 transition-colors">
              {getInputIcon()}
            </div>
          </div>
          {inputType === "date" ? (
            <input
              type="date"
              value={output || ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              required={stepConfig.required}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-6 py-5 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
          ) : (
            <input
              type={inputType === "number" ? "number" : inputType === "email" ? "email" : "text"}
              value={output || ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              required={stepConfig.required}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-6 py-5 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
          )}
        </div>

        {stepConfig.placeholder && (
          <p className="mt-2 text-xs text-slate-500">{stepConfig.placeholder}</p>
        )}
      </div>
    </div>
  );
}

// Compare Renderer
function CompareRenderer({
  step,
  output,
  setOutput,
  runContext,
  run,
  handleCompleteStep,
  submitting,
  mismatchReason,
  setMismatchReason,
  resolvedConfig,
}: {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  run: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED", autoFlagged?: boolean) => void;
  submitting: boolean;
  mismatchReason: string;
  setMismatchReason: (value: string) => void;
  resolvedConfig?: ResolvedConfig | null;
}) {
  const [showMismatchReason, setShowMismatchReason] = useState(false);

  const stepConfig = step.config || {};
  
  // Get resolved values from config (if resolved) or from runContext
  const targetAConfig = resolvedConfig?.targetA ?? stepConfig.targetA;
  const targetBConfig = resolvedConfig?.targetB ?? stepConfig.targetB;

  // Extract actual values - if resolved config has the value directly, use it
  // Otherwise, try to get from runContext
  let targetAValue: any = undefined;
  let targetBValue: any = undefined;

  if (targetAConfig && targetAConfig !== "__manual__") {
    // Check if it's already resolved (not a variable reference)
    if (typeof targetAConfig === "string" && !targetAConfig.startsWith("{{") && !targetAConfig.includes("step_")) {
      targetAValue = targetAConfig;
    } else {
      // Try to extract variable name and get from context
      const varName = targetAConfig.replace(/\{\{|\}\}/g, "").trim();
      targetAValue = getContextValue(runContext, varName);
    }
  }

  if (targetBConfig && targetBConfig !== "__manual__") {
    if (typeof targetBConfig === "string" && !targetBConfig.startsWith("{{") && !targetBConfig.includes("step_")) {
      targetBValue = targetBConfig;
    } else {
      const varName = targetBConfig.replace(/\{\{|\}\}/g, "").trim();
      targetBValue = getContextValue(runContext, varName);
    }
  }

  // Auto-evaluate comparison if both values are available
  const comparisonResult =
    targetAValue !== undefined && targetBValue !== undefined
      ? evaluateComparison(
          targetAValue,
          targetBValue,
          stepConfig.comparisonType || "exact"
        )
      : null;

  // Get source information for badges
  const targetASource = resolvedConfig ? getConfigSource(resolvedConfig, "targetA") : null;
  const targetBSource = resolvedConfig ? getConfigSource(resolvedConfig, "targetB") : null;

  const handleMatch = () => {
    setOutput({ ...output, match: true });
    handleCompleteStep("SUCCESS");
  };

  const handleMismatch = () => {
    // Force mismatch reason - user CANNOT proceed without entering a reason
    if (!mismatchReason.trim()) {
      setShowMismatchReason(true);
      return;
    }
    setOutput({ ...output, match: false, reason: mismatchReason });
    handleCompleteStep("FLAGGED", true);
  };

  return (
    <div className="space-y-4">
      {/* System Analysis Box */}
      {comparisonResult && (
        <div
          className={`rounded-xl border p-4 ${
            comparisonResult.match
              ? "border-green-200 bg-green-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {comparisonResult.match ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 mb-1">System Analysis</p>
              <p
                className={`text-sm ${
                  comparisonResult.match ? "text-green-700" : "text-rose-700"
                }`}
              >
                {comparisonResult.match
                  ? "✓ System detected a Match"
                  : `✗ System detected a Mismatch: ${comparisonResult.diff}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Split View - Premium */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Target A</h3>
            {targetASource && (
              <DataSourceBadge
                stepTitle={targetASource.stepTitle}
                variableName={targetASource.variableName}
              />
            )}
          </div>
          {targetAConfig && targetAConfig !== "__manual__" ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 min-h-[100px]">
                {targetAValue !== undefined ? (
                  <div>
                    {typeof targetAValue === "object" ? (
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(targetAValue, null, 2)}
                      </pre>
                    ) : (
                      <span className="font-medium">{String(targetAValue)}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Value not found in context</span>
                )}
              </div>
              {targetAValue === undefined && (
                <p className="text-xs text-rose-600">
                  ⚠️ Variable not found. Make sure the previous step has completed.
                </p>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={output?.targetA || ""}
              onChange={(e) => setOutput({ ...output, targetA: e.target.value })}
              placeholder="Enter value for Target A"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          )}
        </div>
        <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Target B</h3>
            {targetBSource && (
              <DataSourceBadge
                stepTitle={targetBSource.stepTitle}
                variableName={targetBSource.variableName}
              />
            )}
          </div>
          {targetBConfig && targetBConfig !== "__manual__" ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 min-h-[100px]">
                {targetBValue !== undefined ? (
                  <div>
                    {typeof targetBValue === "object" ? (
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(targetBValue, null, 2)}
                      </pre>
                    ) : (
                      <span className="font-medium">{String(targetBValue)}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Value not found in context</span>
                )}
              </div>
              {targetBValue === undefined && (
                <p className="text-xs text-rose-600">
                  ⚠️ Variable not found. Make sure the previous step has completed.
                </p>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={output?.targetB || ""}
              onChange={(e) => setOutput({ ...output, targetB: e.target.value })}
              placeholder="Enter value for Target B"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          )}
        </div>
      </div>

      {/* Action Buttons - Premium */}
      <div className="flex gap-4 pt-6 border-t border-slate-200">
        <motion.button
          onClick={handleMatch}
          disabled={submitting || run?.status === "FLAGGED"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-5 text-base font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
            <span>Match</span>
          </div>
        </motion.button>
        <motion.button
          onClick={handleMismatch}
          disabled={submitting || run?.status === "FLAGGED" || showMismatchReason}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 px-8 py-5 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center justify-center gap-3">
            <XCircle className="h-5 w-5" strokeWidth={2.5} />
            <span>Mismatch</span>
          </div>
        </motion.button>
      </div>

      {/* Mismatch Reason Input - REQUIRED */}
      {showMismatchReason && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-white p-6 shadow-lg"
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <label className="block text-base font-bold text-rose-900 mb-2">
                Explain the Discrepancy <span className="text-rose-500">*</span>
              </label>
              <p className="text-sm text-rose-700 mb-4 font-medium">
                You must provide a reason for the mismatch before proceeding. This will flag the run for review.
              </p>
            </div>
          </div>
          <textarea
            value={mismatchReason}
            onChange={(e) => setMismatchReason(e.target.value)}
            placeholder="Please explain why these values don't match... (Required)"
            rows={4}
            className="w-full rounded-xl border-2 border-rose-300 bg-white px-4 py-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
            autoFocus
          />
          <div className="mt-4 flex gap-3">
            <motion.button
              onClick={() => {
                if (mismatchReason.trim()) {
                  handleMismatch();
                }
              }}
              disabled={!mismatchReason.trim() || submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Flag & Continue
            </motion.button>
            <button
              onClick={() => {
                setShowMismatchReason(false);
                setMismatchReason("");
              }}
              className="rounded-xl border-2 border-rose-300 bg-white px-6 py-3.5 text-base font-semibold text-rose-700 transition-all hover:bg-rose-50"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Labor Renderer (Physical Tasks)
function LaborRenderer({
  step,
  output,
  setOutput,
  setProcessing,
  uploading,
  setUploading,
  runId,
}: {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  setProcessing: (value: boolean) => void;
  uploading: boolean;
  setUploading: (value: boolean) => void;
  runId?: string;
}) {
  const stepConfig = step.config || {};
  
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setProcessing(true);

    try {
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `runs/${runId || "temp"}/step-${step.id}/proof_${timestamp}_${sanitizedFilename}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setOutput({
        proofType: stepConfig.proofType || "photo",
        proofUrl: url,
        proofPath: storagePath,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error uploading proof:", error);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
    },
    multiple: false,
  });

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-base font-semibold text-blue-900 mb-3">Instructions</h3>
        <p className="text-sm text-blue-800 whitespace-pre-wrap">
          {(step.config || {}).instructions || step.title || "Please follow the instructions above."}
        </p>
      </div>

      {/* Proof Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          {(step.config || {}).proofType === "signature" ? "Digital Signature" : "Upload Proof"}
        </h3>

        {output?.proofUrl ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Proof uploaded</p>
                  <p className="text-xs text-slate-600">
                    {new Date(output.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <a
                href={output.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition-all hover:bg-green-50"
              >
                View
              </a>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : uploading
                ? "border-slate-300 bg-slate-50"
                : "border-slate-300 bg-slate-50 hover:border-slate-400"
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-600" />
                <p className="text-sm font-medium text-slate-700">Uploading proof...</p>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  {isDragActive ? "Drop image here" : "Click to upload or drag and drop"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {stepConfig.proofType === "signature"
                    ? "Upload signature image"
                    : "Upload photo as proof"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

