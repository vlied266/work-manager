"use client";

import { useState, useEffect } from "react";
import { AtomicStep, ActiveRun } from "@/types/schema";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AITaskRendererProps {
  step: AtomicStep;
  run: ActiveRun;
  runContext: any;
  onComplete: (output: any) => void;
}

export function AITaskRenderer({
  step,
  run,
  runContext,
  onComplete,
}: AITaskRendererProps) {
  const [processing, setProcessing] = useState(true);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Stop if run is already FLAGGED
    if (run.status === "FLAGGED") {
      setProcessing(false);
      setError((run as any)?.errorDetail || "Process has been flagged due to an error");
      return;
    }

    const executeAITask = async () => {
      try {
        setProcessing(true);
        setError(null);

        // Get previous step outputs
        const previousOutputs: Record<string, any> = {};
        if (run.logs) {
          run.logs.forEach((log, index) => {
            const varName = `step_${index + 1}_output`;
            previousOutputs[varName] = log.output;
          });
        }

        const response = await fetch("/api/ai/execute-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step,
            context: runContext,
            previousOutputs,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to execute AI task");
        }

        const data = await response.json();
        setOutput(data.output);
        
        // Auto-complete after a short delay to show the result
        setTimeout(() => {
          onComplete(data.output);
        }, 1500);
      } catch (err) {
        console.error("Error executing AI task:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to execute AI task";
        setError(errorMessage);
        setProcessing(false);

        // Flag the run in the database
        try {
          const flagResponse = await fetch("/api/runs/flag", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runId: run.id,
              errorDetail: `AI Task Execution Error: ${errorMessage}`,
              stepId: step.id,
              stepTitle: step.title,
            }),
          });

          if (!flagResponse.ok) {
            console.error("Failed to flag run:", await flagResponse.text());
          } else {
            console.log("✅ Run flagged successfully due to AI task error");
          }
        } catch (flagError) {
          console.error("Error flagging run:", flagError);
          // Don't throw - we've already shown the error to the user
        }
      }
    };

    executeAITask();
  }, [step, run, runContext, onComplete]);

  return (
    <div className="space-y-6">
      {/* Processing State */}
      {processing && !output && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-12 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-xl mb-6"
          >
            <Sparkles className="h-10 w-10" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            AI is working on this task...
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            {step.description || "Processing your request with AI"}
          </p>

          {/* Pulsing Gradient Skeleton */}
          <div className="space-y-3 max-w-md mx-auto">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="h-4 rounded-lg bg-gradient-to-r from-purple-200 via-blue-200 to-purple-200"
                style={{ width: `${80 + i * 10}%` }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Task Completed</h3>
              <p className="text-sm text-slate-600">The AI has successfully processed this step</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold text-slate-700 mb-2">Output:</p>
            <div className="rounded-lg bg-slate-50 p-4">
              <pre className="text-sm text-slate-900 whitespace-pre-wrap break-words">
                {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
              </pre>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-rose-600" />
            <h3 className="text-sm font-semibold text-rose-900">AI Task Failed</h3>
          </div>
          <p className="text-sm text-rose-700">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

