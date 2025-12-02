"use client";

import { useState } from "react";
import { AtomicStep } from "@/types/schema";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";

interface NegotiateRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function NegotiateRenderer({
  step,
  output,
  setOutput,
  handleCompleteStep,
  submitting,
}: NegotiateRendererProps) {
  const [negotiationStatus, setNegotiationStatus] = useState<"pending" | "agreed" | "rejected">(
    output?.status || "pending"
  );
  const [notes, setNotes] = useState(output?.notes || "");

  const handleAgree = () => {
    setNegotiationStatus("agreed");
    setOutput({
      status: "agreed",
      notes,
      agreedAt: new Date().toISOString(),
    });
    handleCompleteStep("SUCCESS");
  };

  const handleReject = () => {
    setNegotiationStatus("rejected");
    setOutput({
      status: "rejected",
      notes,
      rejectedAt: new Date().toISOString(),
    });
    handleCompleteStep("FLAGGED");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Human Negotiation</p>
        <p className="text-xs text-blue-700">
          Review and negotiate terms or conditions
        </p>
      </div>

      {step.config.instructions && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Instructions:</p>
          <p className="text-sm text-slate-900 whitespace-pre-wrap">{step.config.instructions}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Negotiation Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setOutput({ ...output, notes: e.target.value });
          }}
          placeholder="Add notes about the negotiation..."
          rows={4}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {negotiationStatus === "agreed" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">Negotiation agreed</p>
          </div>
        </div>
      )}

      {negotiationStatus === "rejected" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-900">Negotiation rejected</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAgree}
          disabled={submitting || negotiationStatus === "agreed"}
          className="flex-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Agree & Continue
        </button>
        <button
          onClick={handleReject}
          disabled={submitting || negotiationStatus === "rejected"}
          className="flex-1 rounded-xl border border-rose-300 bg-rose-50 px-6 py-3 text-sm font-medium text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
        >
          <XCircle className="mr-2 inline h-4 w-4" />
          Reject
        </button>
      </div>
    </div>
  );
}

