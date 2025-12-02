"use client";

import { useState, useEffect } from "react";
import { AtomicStep } from "@/types/schema";
import { GitBranch, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface GatewayRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function GatewayRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: GatewayRendererProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    matched: boolean;
    condition?: any;
    targetStepId?: string;
  } | null>(null);

  // Auto-evaluate when step loads
  useEffect(() => {
    if (step.config.gatewayConditions && step.config.gatewayConditions.length > 0) {
      handleEvaluate();
    }
  }, [step.config.gatewayConditions, runContext]);

  const evaluateCondition = (condition: {
    variable: string;
    operator: string;
    value: any;
  }): boolean => {
    const variableValue = getContextValue(runContext, condition.variable);
    if (variableValue === undefined) return false;

    const { operator, value } = condition;
    const compareValue = typeof value === "string" && !isNaN(Number(value)) ? Number(value) : value;
    const varValue = typeof variableValue === "string" && !isNaN(Number(variableValue)) ? Number(variableValue) : variableValue;

    switch (operator) {
      case ">":
        return Number(varValue) > Number(compareValue);
      case "<":
        return Number(varValue) < Number(compareValue);
      case ">=":
        return Number(varValue) >= Number(compareValue);
      case "<=":
        return Number(varValue) <= Number(compareValue);
      case "==":
        return String(varValue) === String(compareValue);
      case "!=":
        return String(varValue) !== String(compareValue);
      case "contains":
        return String(varValue).includes(String(compareValue));
      case "startsWith":
        return String(varValue).startsWith(String(compareValue));
      case "endsWith":
        return String(varValue).endsWith(String(compareValue));
      default:
        return false;
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    setEvaluationResult(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check all conditions
      if (step.config.gatewayConditions) {
        for (const condition of step.config.gatewayConditions) {
          if (evaluateCondition(condition)) {
            setEvaluationResult({
              matched: true,
              condition,
              targetStepId: condition.targetStepId,
            });
            setOutput({
              matched: true,
              condition,
              targetStepId: condition.targetStepId,
              evaluatedAt: new Date().toISOString(),
            });
            setEvaluating(false);
            // Auto-complete and route
            handleCompleteStep("SUCCESS");
            return;
          }
        }
      }

      // No condition matched, use default
      setEvaluationResult({
        matched: false,
        targetStepId: step.config.gatewayDefaultStepId || "COMPLETED",
      });
      setOutput({
        matched: false,
        targetStepId: step.config.gatewayDefaultStepId || "COMPLETED",
        evaluatedAt: new Date().toISOString(),
      });
      handleCompleteStep("SUCCESS");
    } catch (error) {
      console.error("Gateway evaluation error:", error);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Gateway Router</p>
        <p className="text-xs text-blue-700">
          Evaluating conditions to determine the next step in the flow
        </p>
      </div>

      {step.config.gatewayConditions && step.config.gatewayConditions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Conditions:</p>
          <div className="space-y-2">
            {step.config.gatewayConditions.map((condition, idx) => {
              const variableValue = getContextValue(runContext, condition.variable);
              const isMatched = evaluationResult?.matched && evaluationResult?.condition === condition;
              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    isMatched
                      ? "border-green-300 bg-green-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isMatched && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    <span className="text-xs font-mono text-slate-700">
                      {condition.variable} {condition.operator} {String(condition.value)}
                    </span>
                    {variableValue !== undefined && (
                      <span className="text-xs text-slate-500">
                        (Current: {String(variableValue)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {evaluating && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-blue-900">Evaluating conditions...</p>
        </div>
      )}

      {evaluationResult && !evaluating && (
        <div
          className={`rounded-xl border p-4 ${
            evaluationResult.matched
              ? "border-green-200 bg-green-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {evaluationResult.matched ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-slate-600" />
            )}
            <p className="text-sm font-semibold text-slate-900">
              {evaluationResult.matched
                ? "Condition Matched"
                : "No Match - Using Default Route"}
            </p>
          </div>
          <p className="text-xs text-slate-600">
            Routing to: {evaluationResult.targetStepId || "Next Step"}
          </p>
        </div>
      )}

      {!evaluationResult && !evaluating && (
        <button
          onClick={handleEvaluate}
          disabled={submitting || !step.config.gatewayConditions?.length}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GitBranch className="mr-2 inline h-4 w-4" />
          Evaluate & Route
        </button>
      )}
    </div>
  );
}

