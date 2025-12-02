"use client";

import { useState, useEffect } from "react";
import { AtomicStep } from "@/types/schema";
import { CheckCircle2, FileText, Image, Sparkles, Loader2 } from "lucide-react";
import { getContextValue } from "@/lib/engine";

interface GenerateRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  runContext: any;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
}

export function GenerateRenderer({
  step,
  output,
  setOutput,
  runContext,
  handleCompleteStep,
  submitting,
}: GenerateRendererProps) {
  const [generatedContent, setGeneratedContent] = useState<string | null>(output?.content || null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate content when step loads if template is provided
  useEffect(() => {
    if (step.config.template && !generatedContent) {
      generateContent();
    }
  }, [step.config.template]);

  const generateContent = () => {
    if (!step.config.template) return;

    setIsGenerating(true);

    // Simulate generation delay (in real app, this would call an API)
    setTimeout(() => {
      let content = step.config.template || "";

      // Replace template variables with context values
      // Support {{variable}} syntax
      const variableRegex = /\{\{([^}]+)\}\}/g;
      content = content.replace(variableRegex, (match, variableName) => {
        const value = getContextValue(runContext, variableName.trim());
        return value !== undefined ? String(value) : match;
      });

      setGeneratedContent(content);
      setOutput({
        content,
        format: step.config.outputFormat || "text",
        generatedAt: new Date().toISOString(),
      });
      setIsGenerating(false);
    }, 1000);
  };

  const handleComplete = () => {
    if (!generatedContent) {
      alert("Please generate content first.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  const getFormatIcon = () => {
    switch (step.config.outputFormat) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "image":
        return <Image className="h-5 w-5 text-purple-600" />;
      default:
        return <Sparkles className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Content Generation</p>
        <p className="text-xs text-blue-700">
          {step.config.template
            ? "Content will be generated from the template below."
            : "Generate content based on the configured template."}
        </p>
      </div>

      {step.config.template && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Template:</p>
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
              {step.config.template}
            </pre>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-blue-900">Generating content...</p>
        </div>
      )}

      {generatedContent && !isGenerating && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            {getFormatIcon()}
            <p className="text-sm font-semibold text-green-900">
              Generated {step.config.outputFormat || "text"}
            </p>
          </div>
          <div className="rounded-lg border border-green-300 bg-white px-4 py-3">
            {step.config.outputFormat === "text" || !step.config.outputFormat ? (
              <p className="text-sm text-slate-900 whitespace-pre-wrap">{generatedContent}</p>
            ) : step.config.outputFormat === "document" ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 text-slate-400" />
                <p className="text-xs text-slate-600">Document content generated</p>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-2 rounded">
                  {generatedContent}
                </pre>
              </div>
            ) : (
              <div className="space-y-2">
                <Image className="h-8 w-8 text-slate-400" />
                <p className="text-xs text-slate-600">Image generation placeholder</p>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>Content generated at {new Date(output?.generatedAt || Date.now()).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!generatedContent && !isGenerating && (
          <button
            onClick={generateContent}
            disabled={!step.config.template}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="mr-2 inline h-4 w-4" />
            Generate Content
          </button>
        )}
        {generatedContent && (
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

