"use client";

import { useState, useEffect } from "react";
import { ArrowRight, FileText, Workflow, ArrowLeft, LayoutTemplate, Sparkles, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AtomicStep } from "@/types/schema";
import { useOrganization } from "@/contexts/OrganizationContext";
import { onSnapshot } from "firebase/firestore";
import { useOrgQuery, useOrgId } from "@/hooks/useOrgData";
import { MentionInput } from "@/components/ui/MentionInput";

export default function StudioHubPage() {
  const router = useRouter();
  const [magicDescription, setMagicDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { organizationId } = useOrganization();
  const [staff, setStaff] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [slackChannels, setSlackChannels] = useState<Array<{ id: string; name: string }>>([]);
  
  // Fetch organization users
  const orgId = useOrgId();
  
  // Check if AI is available for current plan (using orgId query)
  const orgQuery = useOrgQuery("organizations");
  const [isAiAvailable, setIsAiAvailable] = useState(true);
  
  useEffect(() => {
    if (!orgQuery) return;
    const unsubscribe = onSnapshot(orgQuery, (snapshot) => {
      if (!snapshot.empty) {
        const orgData = snapshot.docs[0].data();
        setIsAiAvailable(orgData.plan !== "FREE");
      }
    });
    return () => unsubscribe();
  }, [orgQuery]);
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

  // Fetch Slack channels from integrations
  useEffect(() => {
    if (!organizationId) return;

    const fetchSlackChannels = async () => {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        
        // Fetch Slack integrations for this organization
        const slackQuery = query(
          collection(db, "slack_integrations"),
          where("organizationId", "==", organizationId)
        );
        
        const snapshot = await getDocs(slackQuery);
        const channels: Array<{ id: string; name: string }> = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.channel_name) {
            channels.push({
              id: doc.id,
              name: data.channel_name,
            });
          }
        });
        
        setSlackChannels(channels);
      } catch (error) {
        console.error("Error fetching Slack channels:", error);
        // Don't show error to user, just use default channels
      }
    };

    fetchSlackChannels();
  }, [organizationId]);

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
        orgId: orgId || undefined,
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
        const errorData = await response.json().catch(() => ({}));
        
        // Handle plan limit errors
        if (errorData.error === "PLAN_LIMIT") {
          throw new Error(errorData.message || "AI Copilot is not available on your current plan. Please upgrade to Pro or Enterprise.");
        }
        
        throw new Error(errorData.message || "Failed to generate procedure");
      }

      const data = await response.json();
      const steps: AtomicStep[] = data.steps || [];
      const trigger = data.trigger || undefined;
      const title = data.title || magicDescription;
      const description = data.description || `AI-generated procedure: ${magicDescription}`;

      if (steps.length === 0) {
        throw new Error("No steps generated. Please try a different description.");
      }

      // Create a temporary procedure ID and navigate to the builder
      const tempId = `temp-${Date.now()}`;
      
      // Store the generated data in sessionStorage to pre-fill the builder
      sessionStorage.setItem(`procedure-${tempId}`, JSON.stringify({
        title: title,
        description: description,
        steps: steps,
        trigger: trigger, // FIX: Include trigger in stored data
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 relative overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Minimalist Header */}
      <header className="sticky top-0 z-50 border-b border-white/30 bg-white/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium hover:gap-2 transition-all"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                <span>Back</span>
              </Link>
            </div>
            <Link
              href="/processes"
              className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-xl border border-white/70 shadow-lg shadow-black/5 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-xl hover:scale-105"
            >
              <BarChart3 className="h-4 w-4" />
              View Library
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Launchpad */}
      <main className="relative mx-auto max-w-7xl px-6 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/50 border border-blue-200/50 mb-6"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">AI-Powered Workflow Builder</span>
          </motion.div>
          <h1 className="text-6xl font-extrabold tracking-tight text-slate-900 mb-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Design your workflow.
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
            Choose an action or let AI build it for you. Transform ideas into automated processes in seconds.
          </p>
        </motion.div>

        {/* AI Plan Warning for Free Plan */}
        {!isAiAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-amber-50/80 border border-amber-200/50 px-4 py-3 max-w-3xl mx-auto"
          >
            <p className="text-sm font-medium text-amber-800">
              <span className="font-semibold">AI Copilot is not available on the Free plan.</span>{" "}
              <Link href="/billing" className="underline hover:text-amber-900">
                Upgrade to Pro or Enterprise
              </Link>{" "}
              to use AI-powered workflow generation.
            </p>
          </motion.div>
        )}

        {/* Magic Bar - Enhanced macOS Spotlight Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-full max-w-4xl mx-auto mb-20 relative"
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-2xl opacity-50 animate-pulse" />
            
            {/* MentionInput with custom styling to match the rounded-full design */}
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
                >
                  <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
                </motion.div>
              </div>
              <div className="[&_textarea]:!h-20 [&_textarea]:!min-h-20 [&_textarea]:!rounded-full [&_textarea]:!bg-white/90 [&_textarea]:!backdrop-blur-2xl [&_textarea]:!border-2 [&_textarea]:!border-white/80 [&_textarea]:!shadow-2xl [&_textarea]:!shadow-blue-500/30 [&_textarea]:!pl-16 [&_textarea]:!pr-6 [&_textarea]:!text-base [&_textarea]:!font-medium [&_textarea]:!text-slate-800 [&_textarea]:!placeholder:text-slate-400 [&_textarea]:!focus:outline-none [&_textarea]:!focus:ring-4 [&_textarea]:!focus:ring-blue-500/20 [&_textarea]:!focus:border-blue-400/50 [&_textarea]:!transition-all [&_textarea]:!resize-none [&_textarea]:!py-5">
                <MentionInput
                  value={magicDescription}
                  onChange={(val) => {
                    setMagicDescription(val);
                    setError(null);
                  }}
                  onSend={handleMagicBuild}
                  users={staff}
                  slackChannels={slackChannels}
                  placeholder={isAiAvailable 
                    ? "Describe a process to build instantly... Type @ to mention team members, or mention Slack channels like #general"
                    : "AI Copilot requires Pro or Enterprise plan. Upgrade to unlock this feature."
                  }
                  disabled={isGenerating || !isAiAvailable}
                  className="w-full"
                />
              </div>
            </div>
            
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-xl rounded-full border-2 border-blue-200/50 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" strokeWidth={2.5} />
                  <span className="text-sm font-semibold text-slate-700">AI is building your workflow...</span>
                </div>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50/80 border border-orange-200/60 px-5 py-3.5 text-center shadow-lg"
              >
                <p className="text-sm font-semibold text-orange-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-xs text-center text-slate-500 font-medium flex items-center justify-center gap-4">
            <span className="flex items-center gap-2">
              Press <kbd className="px-2.5 py-1 rounded-lg bg-white/80 text-slate-700 font-mono text-xs font-bold border border-slate-200 shadow-sm">Enter</kbd> to generate
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 rounded-lg bg-white/80 text-slate-700 font-mono text-xs font-bold border border-slate-200 shadow-sm">↑/↓</kbd> to navigate mentions
            </span>
          </p>
        </motion.div>

        {/* Navigation Cards - Enhanced Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card A: Create Procedure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <Link href="/studio/procedure/new">
              <div className="group relative h-full rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border-2 border-white/70 p-10 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 hover:bg-white/90 hover:border-blue-200/50 cursor-pointer overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Large Squircle Icon - Blue */}
                <div className="mb-8 flex items-center justify-center relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/30"
                  >
                    <FileText className="h-14 w-14" strokeWidth={2} />
                  </motion.div>
                </div>

                {/* Typography */}
                <h2 className="text-2xl font-extrabold mt-8 mb-3 text-slate-900 text-center relative z-10">Create Procedure</h2>
                <p className="text-slate-600 leading-relaxed text-center mb-8 text-sm relative z-10">
                  Define a linear sequence of atomic tasks (e.g., Import → Compare → Validate).
                </p>

                {/* Arrow - Bottom Right */}
                <div className="flex justify-end relative z-10">
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700"
                  >
                    <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Get started</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card B: Compose Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <Link href="/studio/process/new">
              <div className="group relative h-full rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border-2 border-white/70 p-10 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20 hover:bg-white/90 hover:border-green-200/50 cursor-pointer overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Large Squircle Icon - Green/Teal */}
                <div className="mb-8 flex items-center justify-center relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white shadow-2xl shadow-green-500/30"
                  >
                    <Workflow className="h-14 w-14" strokeWidth={2} />
                  </motion.div>
                </div>

                {/* Typography */}
                <h2 className="text-2xl font-extrabold mt-8 mb-3 text-slate-900 text-center relative z-10">Compose Process</h2>
                <p className="text-slate-600 leading-relaxed text-center mb-8 text-sm relative z-10">
                  Chain existing Procedures into a larger workflow (e.g., Onboarding → Payroll → Benefits).
                </p>

                {/* Arrow - Bottom Right */}
                <div className="flex justify-end relative z-10">
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-2 text-green-600 group-hover:text-green-700"
                  >
                    <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Get started</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card C: Template Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <Link href="/studio/templates">
              <div className="group relative h-full rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border-2 border-white/70 p-10 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 hover:bg-white/90 hover:border-purple-200/50 cursor-pointer overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Large Squircle Icon - Purple */}
                <div className="mb-8 flex items-center justify-center relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/30"
                  >
                    <LayoutTemplate className="h-14 w-14" strokeWidth={2} />
                  </motion.div>
                </div>

                {/* Typography */}
                <h2 className="text-2xl font-extrabold mt-8 mb-3 text-slate-900 text-center relative z-10">Template Gallery</h2>
                <p className="text-slate-600 leading-relaxed text-center mb-8 text-sm relative z-10">
                  Browse and use pre-built workflows to get started instantly.
                </p>

                {/* Arrow - Bottom Right */}
                <div className="flex justify-end relative z-10">
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-2 text-purple-600 group-hover:text-purple-700"
                  >
                    <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Browse templates</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
