"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles, CheckCircle2, Send, FileText } from "lucide-react";
import { AtomicStep } from "@/types/schema";
import { ATOMIC_ACTION_METADATA } from "@/types/schema";
import * as LucideIcons from "lucide-react";
import { onSnapshot } from "firebase/firestore";
import { useOrgQuery, useOrgId } from "@/hooks/useOrgData";
import { MentionInput } from "@/components/ui/MentionInput";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  steps: AtomicStep[];
}

interface TemplateCustomizerModalProps {
  template: Template;
  onClose: () => void;
  onConfirm: (finalSteps: AtomicStep[]) => void;
}

export function TemplateCustomizerModal({
  template,
  onClose,
  onConfirm,
}: TemplateCustomizerModalProps) {
  const [steps, setSteps] = useState<AtomicStep[]>(template.steps);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [slackChannels, setSlackChannels] = useState<Array<{ id: string; name: string }>>([]);
  
  // Fetch organization users
  const organizationId = useOrgId();
  const usersQuery = useOrgQuery("users");

  useEffect(() => {
    if (!usersQuery) return;

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.displayName || data.email?.split("@")[0] || "Unknown",
            email: data.email || "",
          };
        });
        setStaff(users);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );

    return () => unsubscribe();
  }, [usersQuery]);

  const handleUpdate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a modification request");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/modify-procedure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSteps: steps,
          userPrompt: prompt.trim(),
          orgId: organizationId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to modify workflow");
      }

      const data = await response.json();
      setSteps(data.steps || []);
      setPrompt(""); // Clear prompt after successful update
    } catch (err) {
      console.error("Error modifying workflow:", err);
      setError(err instanceof Error ? err.message : "Failed to modify workflow");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(steps);
  };

  const getActionIcon = (action: string) => {
    const metadata = ATOMIC_ACTION_METADATA[action as keyof typeof ATOMIC_ACTION_METADATA];
    if (!metadata || !metadata.icon) return FileText;
    
    const IconName = metadata.icon as keyof typeof LucideIcons;
    return LucideIcons[IconName] || LucideIcons.FileText;
  };

  const getActionColor = (action: string) => {
    const metadata = ATOMIC_ACTION_METADATA[action as keyof typeof ATOMIC_ACTION_METADATA];
    if (!metadata) return "slate";
    return metadata.color || "slate";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl h-[85vh] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Customize Template</h3>
                <p className="text-xs text-slate-500">{template.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Split View Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side: Preview */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-slate-50/50">
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">Workflow Preview</h4>
                  <p className="text-xs text-slate-600">
                    {steps.length} {steps.length === 1 ? "step" : "steps"}
                  </p>
                </div>

                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const IconComponent = getActionIcon(step.action);
                    const color = getActionColor(step.action);
                    const colorClasses = {
                      blue: "bg-blue-100 text-blue-600",
                      green: "bg-green-100 text-green-600",
                      orange: "bg-orange-100 text-orange-600",
                      purple: "bg-purple-100 text-purple-600",
                      indigo: "bg-indigo-100 text-indigo-600",
                      amber: "bg-amber-100 text-amber-600",
                      pink: "bg-pink-100 text-pink-600",
                      slate: "bg-slate-100 text-slate-600",
                    };

                    return (
                      <motion.div
                        key={step.id || `step-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        {/* Step Number */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Icon */}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.slate}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>

                        {/* Step Info */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-slate-900 truncate">
                            {step.title || `Step ${index + 1}`}
                          </h5>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {step.action.replace(/_/g, " ")}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {steps.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-slate-500">No steps in workflow</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Chat */}
            <div className="w-1/2 flex flex-col bg-white">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">AI Customization</h4>
                  <p className="text-xs text-slate-600">
                    Describe how you want to modify this workflow. For example:
                  </p>
                  <ul className="text-xs text-slate-500 mt-2 space-y-1 list-disc list-inside">
                    <li>"Remove step 2"</li>
                    <li>"Add Google Sheet save at the end"</li>
                    <li>"Rename step 1 to 'Collect User Info'"</li>
                    <li>"Add approval step after step 3 and assign to @Jack"</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    💡 Tip: Type @ to mention team members and assign tasks, or mention Slack channels like #general
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3"
                  >
                    <p className="text-sm text-rose-700">{error}</p>
                  </motion.div>
                )}

                {/* Chat Input Area */}
                <div className="space-y-3">
                  <MentionInput
                    value={prompt}
                    onChange={(val) => {
                      setPrompt(val);
                      setError(null);
                    }}
                    onSend={handleUpdate}
                    users={staff}
                    slackChannels={slackChannels}
                    placeholder="e.g., Remove step 2 and add Google Sheet save at the end. Type @ to mention someone, or mention Slack channels like #general..."
                    disabled={isLoading}
                    className="w-full"
                  />

                  <button
                    onClick={handleUpdate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Update Workflow
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-xs">Enter</kbd> to update, or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-xs">↑/↓</kbd> to navigate mentions
                  </p>
                </div>
              </div>

              {/* Footer with Create Button */}
              <div className="border-t border-slate-200 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
                <button
                  onClick={handleConfirm}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02]"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Create Workflow with {steps.length} {steps.length === 1 ? "Step" : "Steps"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

