"use client";

import { useState } from "react";
import { ArrowRight, FileText, Workflow, ArrowLeft, LayoutTemplate, Sparkles, Zap, Layers, Wand2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AtomicStep } from "@/types/schema";

export default function StudioHubPage() {
  const router = useRouter();
  const [magicDescription, setMagicDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicBuild = async () => {
    if (!magicDescription.trim()) {
      setError("Please describe a process");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-procedure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: magicDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate procedure");
      }

      const data = await response.json();
      const steps: AtomicStep[] = data.steps || [];

      if (steps.length === 0) {
        throw new Error("No steps generated. Please try a different description.");
      }

      // Create a temporary procedure ID and navigate to the builder
      const tempId = `temp-${Date.now()}`;
      
      // Store the generated steps in sessionStorage to pre-fill the builder
      sessionStorage.setItem(`procedure-${tempId}`, JSON.stringify({
        title: magicDescription,
        description: `AI-generated procedure: ${magicDescription}`,
        steps: steps,
      }));

      router.push(`/studio/procedure/${tempId}`);
    } catch (err) {
      console.error("Error generating procedure:", err);
      setError(err instanceof Error ? err.message : "Failed to generate procedure. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header with Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-[1800px] px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/20"
              >
                <Sparkles className="h-7 w-7" strokeWidth={1.5} />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-1.5">
                  Studio
                </h1>
                <p className="text-sm font-medium text-slate-500 tracking-wide">
                  Build workflows, processes, and procedures
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to Dashboard
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1800px] px-8 py-16">
        {/* Hero Section - Apple Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            What would you like to build?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Choose your starting point. Build from scratch or start with a template.
          </p>
        </motion.div>

        {/* Magic Builder - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-20 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-purple-50/30 to-white p-10 shadow-xl shadow-purple-500/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30"
            >
              <Wand2 className="h-8 w-8" strokeWidth={1.5} />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">✨ Magic Builder</h3>
              <p className="text-sm font-medium text-slate-600">Describe your process and AI will build it for you</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="relative">
              <textarea
                value={magicDescription}
                onChange={(e) => {
                  setMagicDescription(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleMagicBuild();
                  }
                }}
                placeholder="Describe a process you want to build... (e.g., 'Employee Expense Reimbursement', 'Invoice Approval Workflow', 'Customer Onboarding Process')"
                rows={4}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none shadow-sm"
                disabled={isGenerating}
              />
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" strokeWidth={2} />
                    <span className="text-base font-semibold text-slate-700">AI is building your workflow...</span>
                  </div>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-rose-200 bg-rose-50/80 backdrop-blur-sm px-5 py-4"
                >
                  <p className="text-sm font-medium text-rose-700">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleMagicBuild}
              disabled={isGenerating || !magicDescription.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center gap-3">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" strokeWidth={2.5} />
                    <span>Generate Workflow with AI</span>
                  </>
                )}
              </div>
            </motion.button>

            <p className="text-xs text-center text-slate-500 font-medium">
              Press <kbd className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">⌘ + Enter</kbd> to generate
            </p>
          </div>
        </motion.div>

        {/* Cards Grid - Premium Design */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20">
          {/* Card A: Create Procedure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Link href="/studio/procedure/new">
              <div className="group relative h-full rounded-3xl border border-slate-200/80 bg-white p-10 shadow-lg shadow-slate-900/5 transition-all hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/0 group-hover:from-blue-50/40 group-hover:via-blue-50/20 group-hover:to-blue-50/10 transition-all duration-700" />
                
                <div className="relative">
                  <div className="flex items-start gap-5 mb-8">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="flex-shrink-0"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all">
                        <FileText className="h-10 w-10" strokeWidth={1.5} />
                      </div>
                    </motion.div>
                    <div className="flex-1 pt-1">
                      <h2 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">Create Procedure</h2>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Define a linear sequence of atomic tasks (e.g., Import → Compare → Validate).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-blue-600 font-bold text-base mb-8 group-hover:gap-4 transition-all">
                    <span>Start Building</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
                  </div>
                  
                  <div className="pt-8 border-t border-slate-200/80">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">What you'll build</p>
                    <ul className="space-y-3 text-sm text-slate-600 font-medium">
                      <li className="flex items-start gap-3">
                        <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>Sequence of atomic actions (INPUT, COMPARE, etc.)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Layers className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>Configure each step's behavior</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>Define data flow between steps</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card B: Compose Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Link href="/studio/process/new">
              <div className="group relative h-full rounded-3xl border border-slate-200/80 bg-white p-10 shadow-lg shadow-slate-900/5 transition-all hover:border-green-300 hover:shadow-2xl hover:shadow-green-500/10 cursor-pointer overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-green-50/0 to-green-50/0 group-hover:from-green-50/40 group-hover:via-green-50/20 group-hover:to-green-50/10 transition-all duration-700" />
                
                <div className="relative">
                  <div className="flex items-start gap-5 mb-8">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="flex-shrink-0"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 via-green-500 to-green-600 text-white shadow-xl shadow-green-500/30 group-hover:shadow-2xl group-hover:shadow-green-500/40 transition-all">
                        <Workflow className="h-10 w-10" strokeWidth={1.5} />
                      </div>
                    </motion.div>
                    <div className="flex-1 pt-1">
                      <h2 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">Compose Process</h2>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Chain existing Procedures into a larger workflow (e.g., Onboarding → Payroll → Benefits).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-green-600 font-bold text-base mb-8 group-hover:gap-4 transition-all">
                    <span>Start Composing</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
                  </div>
                  
                  <div className="pt-8 border-t border-slate-200/80">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">What you'll build</p>
                    <ul className="space-y-3 text-sm text-slate-600 font-medium">
                      <li className="flex items-start gap-3">
                        <Workflow className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>Chain multiple Procedures together</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ArrowRight className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>Define execution order</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Layers className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>Create complete business workflows</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card C: Template Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Link href="/studio/templates">
              <div className="group relative h-full rounded-3xl border border-slate-200/80 bg-white p-10 shadow-lg shadow-slate-900/5 transition-all hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 group-hover:from-purple-50/40 group-hover:via-purple-50/20 group-hover:to-purple-50/10 transition-all duration-700" />
                
                <div className="relative">
                  <div className="flex items-start gap-5 mb-8">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="flex-shrink-0"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/30 group-hover:shadow-2xl group-hover:shadow-purple-500/40 transition-all">
                        <LayoutTemplate className="h-10 w-10" strokeWidth={1.5} />
                      </div>
                    </motion.div>
                    <div className="flex-1 pt-1">
                      <h2 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">Template Gallery</h2>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Browse and use pre-built workflows to get started instantly.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-purple-600 font-bold text-base mb-8 group-hover:gap-4 transition-all">
                    <span>Explore Templates</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
                  </div>
                  
                  <div className="pt-8 border-t border-slate-200/80">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">What you'll find</p>
                    <ul className="space-y-3 text-sm text-slate-600 font-medium">
                      <li className="flex items-start gap-3">
                        <LayoutTemplate className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>HR, Finance, Operations workflows</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>Best-practice examples</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Zap className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span>One-click setup</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Info Section - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-12 shadow-lg shadow-slate-900/5"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-10 tracking-tight">Understanding the Hierarchy</h3>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50/50 via-white to-white p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm">
                  <FileText className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-bold text-slate-900">Procedure Builder</p>
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-medium">
                Builds <strong className="text-slate-900 font-bold">Level 2</strong> (Procedure) from <strong className="text-slate-900 font-bold">Level 1</strong> (Atomic Tasks).
                You work with indivisible units like INPUT, COMPARE, VALIDATE.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-green-50/50 via-white to-white p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600 shadow-sm">
                  <Workflow className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-bold text-slate-900">Process Composer</p>
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-medium">
                Builds <strong className="text-slate-900 font-bold">Level 3</strong> (Process Group) from <strong className="text-slate-900 font-bold">Level 2</strong> (Procedures).
                You work with complete Procedures that you've already built.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
