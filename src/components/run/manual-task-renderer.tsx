"use client";

import { useState } from "react";
import { AtomicStep, ActiveRun } from "@/types/schema";
import { CheckCircle2, Loader2, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import ReactMarkdown from "react-markdown";

interface ManualTaskRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
  runId?: string;
  run?: ActiveRun; // The full run object to check status
}

export function ManualTaskRenderer({
  step,
  output,
  setOutput,
  handleCompleteStep,
  submitting,
  runId,
  run,
}: ManualTaskRendererProps) {
  const router = useRouter();
  const { organizationId, userProfile } = useOrganization();
  const [completing, setCompleting] = useState(false);

  const stepConfig = step?.config || {};
  // Safely extract instructions, ensuring it's always a string
  const instructionsRaw = stepConfig?.instruction || stepConfig?.instructions || step?.description || "";
  const instructions = typeof instructionsRaw === "string" ? instructionsRaw : String(instructionsRaw || "");
  
  // Safely extract task title, ensuring it's always a string
  const taskTitleRaw = step?.title || stepConfig?.title || "Manual Task";
  const taskTitle = typeof taskTitleRaw === "string" ? taskTitleRaw : String(taskTitleRaw || "Manual Task");

  const handleMarkComplete = async () => {
    // If run is in WAITING_FOR_USER status, use resume API
    if (run?.status === "WAITING_FOR_USER" && runId && organizationId && userProfile?.uid) {
      setCompleting(true);
      try {
        // Safely prepare output - ensure it's an object
        const safeOutput = output && typeof output === "object" && !Array.isArray(output)
          ? output
          : { completed: true, completedAt: new Date().toISOString() };
        
        const resumeResponse = await fetch("/api/runs/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId,
            stepId: step?.id || "",
            outcome: "SUCCESS",
            output: safeOutput,
            orgId: organizationId,
            userId: userProfile.uid,
          }),
        });

        if (!resumeResponse.ok) {
          const errorData = await resumeResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to mark task as complete");
        }

        const result = await resumeResponse.json();
        console.log("[ManualTaskRenderer] Task marked complete and workflow resumed:", result);

        // Show success message
        alert("Task completed! Workflow is continuing...");

        // Redirect to inbox or refresh the page
        setTimeout(() => {
          router.push("/inbox");
        }, 1000);
      } catch (error: any) {
        console.error("[ManualTaskRenderer] Error marking task complete:", error);
        alert(`Failed to complete task: ${error.message || "Unknown error"}`);
        setCompleting(false);
      }
      return;
    }

    // Fallback to original handleCompleteStep for non-WAITING_FOR_USER scenarios
    // Safely merge output - ensure it's an object before spreading
    const safeOutput = output && typeof output === "object" && !Array.isArray(output)
      ? { ...output, completed: true, completedAt: new Date().toISOString() }
      : { completed: true, completedAt: new Date().toISOString() };
    setOutput(safeOutput);
    handleCompleteStep("SUCCESS");
  };

  const isSubmitting = submitting || completing;

  return (
    <div className="space-y-6">
      {/* Task Title */}
      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <ClipboardList className="h-6 w-6 text-blue-600" strokeWidth={2} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{taskTitle}</h3>
            {step?.description && typeof step.description === "string" && (
              <p className="text-sm text-slate-600 font-medium">{step.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Instructions/Description with Markdown */}
      {instructions && (
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-slate-600" />
            Instructions
          </h4>
          <div className="prose prose-sm max-w-none text-slate-700">
            <ReactMarkdown
              components={{
                // Custom styling for markdown elements
                h1: ({ node, ...props }) => (
                  <h1 className="text-xl font-bold text-slate-900 mb-3 mt-4 first:mt-0" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-lg font-bold text-slate-900 mb-2 mt-3 first:mt-0" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-base font-bold text-slate-900 mb-2 mt-3 first:mt-0" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-sm text-slate-700 mb-3 leading-relaxed" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1 text-sm text-slate-700" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1 text-sm text-slate-700" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-slate-700" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props} />
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <pre className="bg-slate-100 rounded-lg p-3 text-sm overflow-x-auto my-2">
                      <code className={`language-${match[1]}`} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-slate-100 rounded-md px-1 py-0.5 text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ node, ...props }) => (
                  <pre className="bg-slate-100 p-3 rounded-lg overflow-x-auto mb-3 text-xs font-mono text-slate-800" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-slate-900" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-slate-700" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-300 pl-4 italic text-slate-600 my-3" {...props} />
                ),
              }}
            >
              {instructions || ""}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Completion Button */}
      <div className="flex gap-4 pt-4 border-t border-slate-200">
        <motion.button
          onClick={handleMarkComplete}
          disabled={isSubmitting}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-5 text-base font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center justify-center gap-3">
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                <span>Completing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                <span>Mark as Complete</span>
              </>
            )}
          </div>
        </motion.button>
      </div>
    </div>
  );
}

