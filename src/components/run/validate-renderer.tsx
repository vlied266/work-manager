"use client";

import { useState, useEffect, useRef } from "react";
import { AtomicStep } from "@/types/schema";
import { CheckCircle2, XCircle } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface ValidateRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function ValidateRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: ValidateRendererProps) {
  const [validationResult, setValidationResult] = useState<{
    passed: boolean;
    message: string;
  } | null>(null);
  const prevOutputRef = useRef<any>(null);

  // Auto-validate when step loads if target is specified
  useEffect(() => {
    if (step.config.target && step.config.rule && step.config.value !== undefined) {
      const targetValue = getContextValue(runContext, step.config.target);
      
      if (targetValue === undefined) {
        setValidationResult({
          passed: false,
          message: `Variable "${step.config.target}" not found in context.`,
        });
        return;
      }

      let passed = false;
      let message = "";

      switch (step.config.rule) {
        case "GREATER_THAN":
          passed = Number(targetValue) > Number(step.config.value);
          message = passed
            ? `✓ Validation passed: ${targetValue} > ${step.config.value}`
            : `✗ Validation failed: ${targetValue} is not greater than ${step.config.value}`;
          break;
        case "LESS_THAN":
          passed = Number(targetValue) < Number(step.config.value);
          message = passed
            ? `✓ Validation passed: ${targetValue} < ${step.config.value}`
            : `✗ Validation failed: ${targetValue} is not less than ${step.config.value}`;
          break;
        case "EQUAL":
          passed = targetValue == step.config.value;
          message = passed
            ? `✓ Validation passed: ${targetValue} == ${step.config.value}`
            : `✗ Validation failed: ${targetValue} != ${step.config.value}`;
          break;
        default:
          message = "Unknown validation rule";
      }

      setValidationResult({ passed, message });
      
      // Only update output if it actually changed to prevent infinite loops
      const newOutput = { passed, targetValue, expectedValue: step.config.value };
      const newOutputStr = JSON.stringify(newOutput);
      const prevOutputStr = prevOutputRef.current ? JSON.stringify(prevOutputRef.current) : null;
      
      if (newOutputStr !== prevOutputStr) {
        prevOutputRef.current = newOutput;
        setOutput(newOutput);
      }
    }
  }, [step.config.target, step.config.rule, step.config.value, runContext, setOutput]);

  const handleValidate = () => {
    if (validationResult?.passed) {
      handleCompleteStep("SUCCESS");
    } else {
      handleCompleteStep("FAILURE");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Validation Rule</p>
        <p className="text-xs text-blue-700">
          {step.config.rule === "GREATER_THAN" && `Value must be greater than ${step.config.value}`}
          {step.config.rule === "LESS_THAN" && `Value must be less than ${step.config.value}`}
          {step.config.rule === "EQUAL" && `Value must equal ${step.config.value}`}
          {!step.config.rule && step.config.validationRule}
        </p>
      </div>

      {step.config.target && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Source Value:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 mb-2">
              From: {step.config.target}
            </span>
            <p className="text-sm text-slate-900">
              {getContextValue(runContext, step.config.target) !== undefined
                ? String(getContextValue(runContext, step.config.target))
                : "Not found"}
            </p>
          </div>
        </div>
      )}

      {validationResult && (
        <div
          className={`rounded-xl border p-4 ${
            validationResult.passed
              ? "border-green-200 bg-green-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {validationResult.passed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  validationResult.passed ? "text-green-900" : "text-rose-900"
                }`}
              >
                {validationResult.message}
              </p>
              {!validationResult.passed && step.config.errorMessage && (
                <p className="mt-1 text-xs text-rose-700">{step.config.errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleValidate}
          disabled={submitting || !validationResult || !validationResult.passed}
          className="flex-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Validate & Continue
        </button>
        {!validationResult?.passed && (
          <button
            onClick={() => handleCompleteStep("FAILURE")}
            disabled={submitting}
            className="rounded-xl border border-rose-300 bg-rose-50 px-6 py-3 text-sm font-medium text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
          >
            <XCircle className="mr-2 inline h-4 w-4" />
            Reject
          </button>
        )}
      </div>
    </div>
  );
}

