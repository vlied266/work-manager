"use client";

import { useState } from "react";
import { AtomicStep } from "@/types/schema";
import { Upload, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface TransmitRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function TransmitRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: TransmitRendererProps) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionStatus, setTransmissionStatus] = useState<"idle" | "success" | "error">(
    output?.status || "idle"
  );

  const handleTransmit = async () => {
    setIsTransmitting(true);
    setTransmissionStatus("idle");

    try {
      // Get source data from context if specified
      let dataToTransmit = null;
      if (step.config.sourceUrl || step.config.destinationUrl) {
        // In a real app, this would make an HTTP request
        // For now, we'll simulate it
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Simulate successful transmission
        setTransmissionStatus("success");
        setOutput({
          status: "success",
          destination: step.config.destinationUrl || "External System",
          method: step.config.method || "POST",
          transmittedAt: new Date().toISOString(),
          data: dataToTransmit,
        });
      } else {
        // Manual transmission - user confirms
        setTransmissionStatus("success");
        setOutput({
          status: "success",
          destination: step.config.destinationUrl || "External System",
          transmittedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      setTransmissionStatus("error");
      setOutput({
        status: "error",
        error: String(error),
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleComplete = () => {
    if (transmissionStatus !== "success") {
      alert("Please transmit data first.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Data Transmission</p>
        <p className="text-xs text-blue-700">
          {step.config.destinationUrl
            ? `Send data to: ${step.config.destinationUrl}`
            : "Transmit data to external destination"}
        </p>
      </div>

      {step.config.sourceUrl && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Source:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <p className="text-sm text-slate-900">{step.config.sourceUrl}</p>
          </div>
        </div>
      )}

      {step.config.destinationUrl && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Destination:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <p className="text-sm text-slate-900">{step.config.destinationUrl}</p>
            {step.config.method && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 mt-2">
                Method: {step.config.method}
              </span>
            )}
          </div>
        </div>
      )}

      {transmissionStatus === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Data transmitted successfully
            </p>
          </div>
          {output?.transmittedAt && (
            <p className="mt-1 text-xs text-green-700">
              {new Date(output.transmittedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {transmissionStatus === "error" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-900">Transmission failed</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {transmissionStatus !== "success" && (
          <button
            onClick={handleTransmit}
            disabled={isTransmitting || submitting}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransmitting ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Transmitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 inline h-4 w-4" />
                Transmit Data
              </>
            )}
          </button>
        )}
        {transmissionStatus === "success" && (
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

