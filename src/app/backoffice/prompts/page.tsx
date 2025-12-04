"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_ENGLISH_PROMPT } from "@/lib/ai/default-prompt";
import { 
  Brain, Loader2, AlertCircle, 
  Save, RotateCcw, ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OWNER_EMAIL = "atomicworkos@gmail.com";

export default function PromptsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  
  const [promptText, setPromptText] = useState<string>("");

  // Security check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setAuthorized(false);
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      if (currentUser.email !== OWNER_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch prompt
  useEffect(() => {
    if (!authorized) return;

    const fetchPrompt = async () => {
      setLoadingPrompt(true);
      try {
        const promptDoc = await getDoc(doc(db, "system_configs", "ai_prompts"));
        if (promptDoc.exists()) {
          const data = promptDoc.data();
          setPromptText(data.prompt_text || DEFAULT_ENGLISH_PROMPT);
        } else {
          // Use default if not exists
          setPromptText(DEFAULT_ENGLISH_PROMPT);
        }
      } catch (error) {
        console.error("Error fetching prompt:", error);
        setPromptText(DEFAULT_ENGLISH_PROMPT);
      } finally {
        setLoadingPrompt(false);
      }
    };

    fetchPrompt();
  }, [authorized]);

  const handleSave = async () => {
    if (!promptText.trim()) {
      alert("Prompt cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "system_configs", "ai_prompts"),
        {
          prompt_text: promptText.trim(),
          updatedAt: serverTimestamp(),
          updatedBy: user?.email || "admin",
        },
        { merge: true }
      );
      alert("Prompt saved successfully!");
    } catch (error) {
      console.error("Error saving prompt:", error);
      alert("Failed to save prompt. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to reset to the default English prompt? This will overwrite your current changes.")) {
      return;
    }
    setPromptText(DEFAULT_ENGLISH_PROMPT);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-100"></div>
          <p className="text-sm text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h1>
          <p className="text-slate-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link
                href="/backoffice"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Backoffice
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Brain className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                AI Prompt Manager
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage the AI system instructions dynamically
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-300 font-medium mb-1">Language Policy</p>
              <p className="text-xs text-blue-400/80">
                The AI must strictly generate content in <strong>English</strong>. Ensure your prompt enforces this rule.
              </p>
            </div>
          </div>
        </div>

        {/* Prompt Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">System Instructions</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loadingPrompt}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Prompt
                  </>
                )}
              </button>
            </div>
          </div>

          {loadingPrompt ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter system prompt..."
              rows={25}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm leading-relaxed"
            />
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Character count: {promptText.length}</span>
            <span>Line count: {promptText.split('\n').length}</span>
          </div>
        </motion.div>

        {/* Usage Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-3">How it works</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>The prompt is stored in Firestore at <code className="bg-slate-900/50 px-2 py-0.5 rounded text-blue-400">system_configs/ai_prompts</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>The API route <code className="bg-slate-900/50 px-2 py-0.5 rounded text-blue-400">/api/ai/generate-procedure</code> fetches this prompt dynamically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>If no custom prompt exists, it falls back to the default English prompt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Changes take effect immediately without code deployment</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

