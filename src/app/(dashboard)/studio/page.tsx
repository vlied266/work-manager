"use client";

import { useState } from "react";
import { ArrowRight, FileText, Workflow, ArrowLeft, LayoutTemplate, Sparkles, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AtomicStep } from "@/types/schema";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function StudioHubPage() {
  const router = useRouter();
  const [magicDescription, setMagicDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { organizationId } = useOrganization();

  const handleMagicBuild = async () => {
    if (!magicDescription.trim()) {
      setError("Please describe a process");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload: { description: string; orgId?: string } = {
        description: magicDescription,
      };

      if (organizationId) {
        payload.orgId = organizationId;
      }

      const response = await fetch("/api/ai/generate-procedure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden font-sans">
      {/* Minimalist Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/30">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                <span>Back</span>
              </Link>
            </div>
            <Link
              href="/processes"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
            >
              <BarChart3 className="h-4 w-4" />
              View Library
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Launchpad */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Design your workflow.
          </h1>
          <p className="text-xl text-slate-500 font-medium">
            Choose an action or let AI build it for you.
          </p>
        </motion.div>

        {/* Magic Bar - macOS Spotlight Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-full max-w-3xl mx-auto mb-16 relative"
        >
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="flex h-8 w-8 items-center justify-center"
              >
                <Sparkles className="h-6 w-6 text-blue-500" strokeWidth={2} />
              </motion.div>
            </div>
            <input
              type="text"
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
              placeholder="Describe a process to build instantly..."
              className="w-full h-16 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-blue-500/20 pl-14 pr-6 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              disabled={isGenerating}
            />
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" strokeWidth={2} />
                  <span className="text-sm font-semibold text-slate-700">AI is building your workflow...</span>
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
                className="mt-4 rounded-xl bg-orange-50/80 border border-orange-200/50 px-4 py-3 text-center"
              >
                <p className="text-sm font-medium text-orange-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 text-xs text-center text-slate-500 font-medium">
            Press <kbd className="px-2 py-1 rounded bg-white/50 text-slate-700 font-mono text-xs font-semibold border border-white/50 shadow-sm">⌘ + Enter</kbd> to generate
          </p>
        </motion.div>

        {/* Navigation Cards - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card A: Create Procedure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/studio/procedure/new">
              <div className="group relative h-full rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-white/60 p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:bg-white/80 cursor-pointer">
                {/* Large Squircle Icon - Blue */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
                    <FileText className="h-12 w-12" strokeWidth={2} />
                  </div>
                </div>

                {/* Typography */}
                <h2 className="text-2xl font-bold mt-6 mb-2 text-slate-800 text-center">Create Procedure</h2>
                <p className="text-slate-500 leading-relaxed text-center mb-6">
                  Define a linear sequence of atomic tasks (e.g., Import → Compare → Validate).
                </p>

                {/* Arrow - Bottom Right */}
                <div className="flex justify-end">
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-2 group-hover:text-blue-600" strokeWidth={2} />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card B: Compose Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Link href="/studio/process/new">
              <div className="group relative h-full rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-white/60 p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:bg-white/80 cursor-pointer">
                {/* Large Squircle Icon - Green/Teal */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-xl">
                    <Workflow className="h-12 w-12" strokeWidth={2} />
                  </div>
                </div>

                {/* Typography */}
                <h2 className="text-2xl font-bold mt-6 mb-2 text-slate-800 text-center">Compose Process</h2>
                <p className="text-slate-500 leading-relaxed text-center mb-6">
                  Chain existing Procedures into a larger workflow (e.g., Onboarding → Payroll → Benefits).
                </p>

                {/* Arrow - Bottom Right */}
                <div className="flex justify-end">
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-2 group-hover:text-green-600" strokeWidth={2} />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card C: Template Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link href="/studio/templates">
              <div className="group relative h-full rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-white/60 p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:bg-white/80 cursor-pointer">
                {/* Large Squircle Icon - Purple */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
                    <LayoutTemplate className="h-12 w-12" strokeWidth={2} />
                  </div>
                </div>

                {/* Typography */}
                <h2 className="text-2xl font-bold mt-6 mb-2 text-slate-800 text-center">Template Gallery</h2>
                <p className="text-slate-500 leading-relaxed text-center mb-6">
                  Browse and use pre-built workflows to get started instantly.
                </p>

                {/* Arrow - Bottom Right */}
                <div className="flex justify-end">
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-2 group-hover:text-purple-600" strokeWidth={2} />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
