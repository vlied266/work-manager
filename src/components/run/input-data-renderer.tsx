"use client";

import { useState } from "react";
import { AtomicStep, ActiveRun } from "@/types/schema";
import { CheckCircle2, Loader2, Hash, Calendar, FileText, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { TableInputRenderer } from "./table-input-renderer";

interface InputDataRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  setValidationError: (error: string | null) => void;
  run?: ActiveRun;
  runId?: string;
  handleCompleteStep?: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED", autoFlagged?: boolean) => void;
  submitting?: boolean;
}

export function InputDataRenderer({
  step,
  output,
  setOutput,
  setValidationError,
  run,
  runId,
  handleCompleteStep,
  submitting,
}: InputDataRendererProps) {
  const router = useRouter();
  const { organizationId, userProfile } = useOrganization();
  const [resuming, setResuming] = useState(false);
  
  const stepConfig = step.config || {};
  const inputType = stepConfig.inputType || "text";
  const placeholder = stepConfig.placeholder || (inputType === "select" ? "Select an option" : `Enter ${inputType}`);
  const fieldLabel = stepConfig.fieldLabel || "Input";
  
  // Parse options for select type - handle both array format and comma-separated string
  const parseOptions = (): Array<{ label: string; value: string }> => {
    const optionsRaw = stepConfig.options;
    if (!optionsRaw) return [];
    
    // If it's already an array of objects
    if (Array.isArray(optionsRaw)) {
      return optionsRaw.map(opt => {
        if (typeof opt === "string") {
          return { label: opt, value: opt };
        }
        return { label: opt.label || opt.value || "", value: opt.value || opt.label || "" };
      });
    }
    
    // If it's a string (comma-separated or newline-separated)
    if (typeof optionsRaw === "string") {
      const optionStrings = optionsRaw.split(/[,\n]/).map(s => s.trim()).filter(s => s);
      return optionStrings.map(opt => ({ label: opt, value: opt }));
    }
    
    return [];
  };
  
  const selectOptions = inputType === "select" ? parseOptions() : [];

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
    if (stepConfig.required && !value.trim() && inputType !== "select") {
      setValidationError("This field is required");
      return;
    }
    
    // For select, check if a valid option is selected
    if (inputType === "select" && stepConfig.required && !value) {
      setValidationError("Please select an option");
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

  const handleSubmit = async () => {
    // Validate required field
    if (inputType === "select") {
      if (stepConfig.required && !output) {
        setValidationError("Please select an option");
        return;
      }
    } else if (stepConfig.required && (!output || (typeof output === "string" && !output.trim()))) {
      setValidationError("This field is required");
      return;
    }

    // Validate based on input type
    if (inputType === "number" && output !== "" && output !== "-" && output !== ".") {
      const num = parseFloat(output);
      if (isNaN(num)) {
        setValidationError("Please enter a valid number");
        return;
      }
    }

    if (inputType === "date" && output) {
      const date = new Date(output);
      if (isNaN(date.getTime())) {
        setValidationError("Please enter a valid date");
        return;
      }
    }

    if (inputType === "email" && output && !output.includes("@")) {
      setValidationError("Please enter a valid email address");
      return;
    }

    if (stepConfig.validationRegex && output) {
      const regex = new RegExp(stepConfig.validationRegex);
      if (!regex.test(output)) {
        setValidationError(stepConfig.validationMessage || "Invalid format");
        return;
      }
    }

    // If run is in WAITING_FOR_USER status, use resume API
    if (run?.status === "WAITING_FOR_USER" && runId && organizationId && userProfile?.uid) {
      setResuming(true);
      try {
        // Prepare output data - ensure it's an object for proper variable resolution
        // Priority: outputVariableName > fieldLabel > "value"
        // If outputVariableName is set, use it as the key (e.g., "result")
        // Otherwise, derive from fieldLabel (e.g., "Log Call Outcome" -> "log_call_outcome")
        let fieldKey: string;
        if (stepConfig.outputVariableName) {
          // Use the configured outputVariableName directly
          fieldKey = stepConfig.outputVariableName;
        } else if (stepConfig.fieldLabel) {
          // Convert fieldLabel to snake_case
          fieldKey = stepConfig.fieldLabel.toLowerCase().replace(/\s+/g, "_");
        } else {
          // Fallback to "value"
          fieldKey = "value";
        }
        
        let outputData: any;
        if (typeof output === "string" || typeof output === "number" || typeof output === "boolean") {
          // Simple value - wrap in object with field key
          outputData = { [fieldKey]: output };
        } else if (output && typeof output === "object") {
          // Already an object - use as is, but ensure it has the expected structure
          // If the object doesn't have the fieldKey, add it
          if (!(fieldKey in output)) {
            // Merge the fieldKey into the existing object
            outputData = { ...output, [fieldKey]: output };
          } else {
            outputData = output;
          }
        } else {
          // Fallback to empty object
          outputData = {};
        }
        
        console.log("[InputDataRenderer] Preparing output data:", {
          rawOutput: output,
          fieldKey,
          outputVariableName: stepConfig.outputVariableName,
          fieldLabel: stepConfig.fieldLabel,
          outputData,
          outputType: typeof output,
        });

        const resumeResponse = await fetch("/api/runs/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId,
            stepId: step.id,
            outcome: "SUCCESS",
            output: outputData,
            orgId: organizationId,
            userId: userProfile.uid,
          }),
        });

        if (!resumeResponse.ok) {
          const errorData = await resumeResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to submit input");
        }

        const result = await resumeResponse.json();
        console.log("[InputDataRenderer] Input submitted and workflow resumed:", result);

        // Show success message
        alert("Input submitted! Workflow is continuing...");

        // Redirect to inbox or refresh the page
        setTimeout(() => {
          router.push("/inbox");
        }, 1000);
      } catch (error: any) {
        console.error("[InputDataRenderer] Error submitting input:", error);
        setValidationError(error.message || "Failed to submit input. Please try again.");
        setResuming(false);
      }
      return;
    }

    // Fallback to original handleCompleteStep for non-WAITING_FOR_USER scenarios
    if (handleCompleteStep) {
      // Ensure output is set before calling handleCompleteStep
      setOutput(output);
      handleCompleteStep("SUCCESS");
    }
  };

  const getInputIcon = () => {
    switch (inputType) {
      case "number":
        return <Hash className="h-5 w-5 text-slate-400" />;
      case "date":
        return <Calendar className="h-5 w-5 text-slate-400" />;
      case "select":
        return <ChevronDown className="h-5 w-5 text-slate-400" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const isSubmitting = submitting || resuming;
  const canSubmit = !isSubmitting && (
    !stepConfig.required || 
    (inputType === "select" ? output : (output && (typeof output !== "string" || output.trim())))
  );

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
              disabled={isSubmitting}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-6 py-5 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : inputType === "select" ? (
            <select
              value={output || ""}
              onChange={(e) => handleChange(e.target.value)}
              required={stepConfig.required}
              disabled={isSubmitting}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-12 py-5 text-base font-semibold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
            >
              <option value="" disabled>
                {placeholder}
              </option>
              {selectOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={inputType === "number" ? "number" : inputType === "email" ? "email" : "text"}
              value={output || ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              required={stepConfig.required}
              disabled={isSubmitting}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-6 py-5 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
        </div>

        {stepConfig.placeholder && (
          <p className="mt-2 text-xs text-slate-500">{stepConfig.placeholder}</p>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!canSubmit}
        whileHover={{ scale: canSubmit ? 1.02 : 1 }}
        whileTap={{ scale: canSubmit ? 0.98 : 1 }}
        className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <div className="flex items-center justify-center gap-3">
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
              <span>Submit & Continue</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  );
}

