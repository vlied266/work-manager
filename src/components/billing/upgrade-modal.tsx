"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: "users" | "activeRuns" | "aiGenerations";
  currentPlan: "FREE" | "PRO" | "ENTERPRISE";
}

export function UpgradeModal({ isOpen, onClose, resource, currentPlan }: UpgradeModalProps) {
  const resourceLabels = {
    users: "Users",
    activeRuns: "Active Runs",
    aiGenerations: "AI Generations",
  };

  const resourceDescriptions = {
    users: "You've reached the maximum number of users for your plan. Upgrade to add more team members.",
    activeRuns: "You've reached the maximum number of active runs for your plan. Upgrade to run more processes simultaneously.",
    aiGenerations: "You've reached your AI generation limit for this month. Upgrade to get more AI-powered features.",
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upgrade Required</h3>
                <p className="text-xs text-slate-500">Unlock more {resourceLabels[resource]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-sm text-slate-700 mb-6">
              {resourceDescriptions[resource]}
            </p>

            {/* Plan Comparison */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Current Plan</span>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {currentPlan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Upgrade To</span>
                <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                  PRO
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Unlimited {resourceLabels[resource]}
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                AI Copilot (1000 generations/month)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Priority support
              </li>
            </ul>

            {/* CTA */}
            <Link
              href="/billing"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:scale-105"
            >
              Upgrade to Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

