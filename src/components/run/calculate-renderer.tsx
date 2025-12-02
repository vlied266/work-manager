"use client";

import { useState, useEffect } from "react";
import { AtomicStep } from "@/types/schema";
import { Calculator, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface CalculateRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function CalculateRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: CalculateRendererProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<number | null>(
    output?.result ?? null
  );
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Auto-calculate when step loads if formula is provided
  useEffect(() => {
    if (step.config.formula && calculationResult === null) {
      handleCalculate();
    }
  }, [step.config.formula]);

  const handleCalculate = async () => {
    if (!step.config.formula) return;

    setIsCalculating(true);
    setCalculationError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Get variable values from context
      const variables: Record<string, number> = {};
      if (step.config.variables) {
        Object.entries(step.config.variables).forEach(([key, varName]) => {
          const value = getContextValue(runContext, varName as string);
          if (value !== undefined) {
            variables[key] = Number(value) || 0;
          }
        });
      }

      // Replace variables in formula
      let formula = step.config.formula;
      Object.entries(variables).forEach(([key, value]) => {
        formula = formula.replace(new RegExp(`\\b${key}\\b`, "g"), String(value));
      });

      // Evaluate formula (simplified - in production, use a safe math evaluator)
      // For now, support basic operations: +, -, *, /, (, )
      try {
        // Basic safety check - only allow numbers and operators
        if (!/^[0-9+\-*/().\s]+$/.test(formula)) {
          throw new Error("Invalid formula format");
        }

        const result = Function(`"use strict"; return (${formula})`)();
        setCalculationResult(result);
        setOutput({
          result,
          formula: step.config.formula,
          variables: step.config.variables,
          calculatedAt: new Date().toISOString(),
        });
      } catch (evalError) {
        throw new Error("Failed to evaluate formula. Please check the syntax.");
      }
    } catch (error: any) {
      setCalculationError(error.message || "Calculation failed");
      setOutput({
        error: error.message,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleComplete = () => {
    if (calculationResult === null || calculationError) {
      alert("Please calculate first or fix the error.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Calculation</p>
        <p className="text-xs text-blue-700">
          Apply mathematical formula or computation
        </p>
      </div>

      {step.config.formula && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Formula:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <p className="text-sm text-slate-900 font-mono">{step.config.formula}</p>
          </div>
        </div>
      )}

      {step.config.variables && Object.keys(step.config.variables).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Variables:</p>
          <div className="space-y-2">
            {Object.entries(step.config.variables).map(([key, varName]) => {
              const value = getContextValue(runContext, varName as string);
              return (
                <div key={key} className="rounded-lg border border-slate-300 bg-white px-4 py-2">
                  <span className="text-xs font-medium text-slate-600">{key}:</span>
                  <span className="ml-2 text-sm text-slate-900 font-mono">
                    {value !== undefined ? String(value) : "Not found"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCalculating && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-blue-900">Calculating...</p>
        </div>
      )}

      {calculationError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-900">{calculationError}</p>
          </div>
        </div>
      )}

      {calculationResult !== null && !calculationError && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-semibold text-green-900">Result:</p>
          </div>
          <div className="rounded-lg border border-green-300 bg-white px-4 py-3">
            <p className="text-2xl font-bold text-green-900">{calculationResult}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {calculationResult === null && !isCalculating && (
          <button
            onClick={handleCalculate}
            disabled={!step.config.formula}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="mr-2 inline h-4 w-4" />
            Calculate
          </button>
        )}
        {calculationResult !== null && !calculationError && (
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

