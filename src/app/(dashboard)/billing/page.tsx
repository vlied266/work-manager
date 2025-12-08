"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Organization } from "@/types/schema";
import { Check, X, Zap, Users, Activity, Sparkles, ArrowRight, Loader2, Calendar, FileText, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { getUsageStats, getPlanLimits, getUsagePercentage } from "@/lib/billing/limits";
import Link from "next/link";

interface UsageStats {
  currentUsers: number;
  currentActiveRuns: number;
  currentAiGenerations: number;
}

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeOrg: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // Get user profile to find organization
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const orgId = userData.organizationId;
            
            if (orgId) {
              // Listen to organization changes
              const orgDocRef = doc(db, "organizations", orgId);
              unsubscribeOrg = onSnapshot(
                orgDocRef,
                async (orgDoc) => {
                  if (orgDoc.exists()) {
                    const data = orgDoc.data();
                    const planValue = (data.plan || "FREE").toUpperCase() as "FREE" | "PRO" | "ENTERPRISE";
                    const org: Organization = {
                      id: orgDoc.id,
                      name: data.name || "",
                      plan: planValue,
                      subscriptionStatus: data.subscriptionStatus || "active",
                      limits: data.limits || getPlanLimits(planValue),
                      createdAt: data.createdAt?.toDate() || new Date(),
                    };
                    setOrganization(org);
                    
                    // Get usage stats
                    try {
                      const usageStats = await getUsageStats(org.id);
                      setUsage(usageStats);
                    } catch (error) {
                      console.error("Error fetching usage stats:", error);
                      // Set default usage stats on error
                      setUsage({
                        currentUsers: 0,
                        currentActiveRuns: 0,
                        currentAiGenerations: 0,
                      });
                    }
                    setLoading(false);
                  } else {
                    // Organization doesn't exist
                    console.warn("Organization not found:", orgId);
                    setLoading(false);
                  }
                },
                (error) => {
                  console.error("Error listening to organization:", error);
                  setLoading(false);
                }
              );
            } else {
              // No organization ID in user profile
              console.warn("User has no organizationId");
              setLoading(false);
            }
          } else {
            // User profile doesn't exist
            console.warn("User profile not found");
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        }
      } else {
        // No user logged in
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeOrg) {
        unsubscribeOrg();
      }
    };
  }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "For small teams getting started",
      features: [
        { text: "Up to 3 users", included: true },
        { text: "10 active runs per month", included: true },
        { text: "Basic process builder", included: true },
        { text: "Basic AI Support", included: true, detail: "Access to Atomic AI for general questions and documentation help." },
        { text: "AI Copilot", included: false },
        { text: "Atomic Insight™", included: false },
        { text: "Proactive Nudges", included: false },
        { text: "Priority support", included: false },
        { text: "SSO & Audit Logs", included: false },
      ],
      cta: organization?.plan === "FREE" ? "Current Plan" : "Downgrade to Free",
      ctaDisabled: organization?.plan === "FREE",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For growing businesses",
      features: [
        { text: "Unlimited users", included: true },
        { text: "Unlimited active runs", included: true },
        { text: "Advanced process builder", included: true },
        { text: "✨ Atomic Insight™ (Analyst)", included: true, detail: "Full access to Data Analyst Persona. Connects to live data to identify bottlenecks and trends." },
        { text: "✅ Proactive Nudges & Alerts", included: true },
        { text: "AI Copilot (1000 gen/month)", included: true },
        { text: "Priority support", included: true },
        { text: "SSO & Audit Logs", included: false },
      ],
      cta: organization?.plan === "PRO" ? "Current Plan" : "Upgrade to Pro",
      ctaDisabled: organization?.plan === "PRO",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        { text: "Unlimited everything", included: true },
        { text: "Unlimited AI generations", included: true },
        { text: "Advanced process builder", included: true },
        { text: "Custom AI Models", included: true, detail: "Train Atomic Insight on your specific company policies and historical data." },
        { text: "✨ Atomic Insight™ (Analyst)", included: true },
        { text: "✅ Proactive Nudges & Alerts", included: true },
        { text: "SSO & Audit Logs", included: true },
        { text: "Dedicated support", included: true },
        { text: "Custom integrations", included: true },
      ],
      cta: organization?.plan === "ENTERPRISE" ? "Current Plan" : "Contact Sales",
      ctaDisabled: organization?.plan === "ENTERPRISE",
      highlight: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <X className="h-6 w-6 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No Organization Found</h2>
          <p className="text-sm text-slate-600 mb-4">
            You need to be part of an organization to view billing information. Please contact your administrator or complete the onboarding process.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Go to Onboarding
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const limits = organization.limits || getPlanLimits(organization.plan);
  const userUsagePercent = getUsagePercentage(usage?.currentUsers || 0, limits.maxUsers);
  const runsUsagePercent = getUsagePercentage(usage?.currentActiveRuns || 0, limits.maxActiveRuns);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Billing & Subscription</h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            Manage your subscription and view usage limits
          </p>
        </div>

        {/* Current Plan Card - Glass Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all"
        >
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Current Plan</h2>
            <p className="text-sm text-slate-600 font-medium mt-1">
              {organization.plan === "FREE" && "Free tier - Upgrade to unlock more features"}
              {organization.plan === "PRO" && "Pro plan - Full access to all features"}
              {organization.plan === "ENTERPRISE" && "Enterprise plan - Custom solution"}
            </p>
          </div>
          <span className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider ${
            organization.plan === "FREE" 
              ? "bg-slate-100 text-slate-700"
              : organization.plan === "PRO"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          }`}>
            {organization.plan}
          </span>
        </div>

        {/* Usage Stats */}
        <div className="space-y-4">
          {/* Users Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Users</span>
              </div>
              <span className="text-sm text-slate-600">
                {usage?.currentUsers || 0} / {limits.maxUsers === Infinity ? "∞" : limits.maxUsers}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${userUsagePercent}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  userUsagePercent >= 90 
                    ? "from-rose-500 to-rose-600" 
                    : userUsagePercent >= 70 
                    ? "from-orange-500 to-orange-600" 
                    : "from-blue-500 to-blue-600"
                }`}
              />
            </div>
          </div>

          {/* Active Runs Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Active Runs</span>
              </div>
              <span className="text-sm text-slate-600">
                {usage?.currentActiveRuns || 0} / {limits.maxActiveRuns === Infinity ? "∞" : limits.maxActiveRuns}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${runsUsagePercent}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  runsUsagePercent >= 90 
                    ? "from-rose-500 to-rose-600" 
                    : runsUsagePercent >= 70 
                    ? "from-orange-500 to-orange-600" 
                    : "from-blue-500 to-blue-600"
                }`}
              />
            </div>
          </div>

          {/* AI Generations (if Pro/Enterprise) */}
          {(organization.plan === "PRO" || organization.plan === "ENTERPRISE") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">AI Generations</span>
                </div>
                <span className="text-sm text-slate-600">
                  {usage?.currentAiGenerations || 0} / {limits.aiGenerations === Infinity ? "∞" : limits.aiGenerations}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getUsagePercentage(usage?.currentAiGenerations || 0, limits.aiGenerations)}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Plan & Billing Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Plan & Billing
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Plan */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Current Plan
            </label>
            <div className="inline-flex rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-md"
              style={{
                background: organization.plan === "ENTERPRISE" 
                  ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                  : organization.plan === "PRO"
                  ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                  : "linear-gradient(135deg, #64748b 0%, #475569 100%)"
              }}
            >
              {organization.plan} PLAN
            </div>
            <p className="text-sm text-slate-600 font-medium">Billed Monthly</p>
          </div>

          {/* Next Payment */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Next Payment
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-900">
                {(() => {
                  const nextPaymentDate = new Date();
                  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
                  return nextPaymentDate.toLocaleDateString();
                })()}
              </p>
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {(() => {
                const nextPaymentDate = new Date();
                nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
                const daysRemaining = Math.ceil(
                  (nextPaymentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return `${daysRemaining} days remaining`;
              })()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 flex-wrap">
          <button
            onClick={() => {
              // Scroll to pricing plans section
              const plansSection = document.getElementById('pricing-plans');
              if (plansSection) {
                plansSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
          >
            <ArrowRight className="h-4 w-4" />
            Upgrade Plan
          </button>
          <button
            onClick={() => {
              // In a real app, this would open invoices
              alert("Invoices feature coming soon!");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
          >
            <FileText className="h-4 w-4" />
            Invoices
          </button>
          <button
            onClick={async () => {
              if (!organization?.id) {
                alert("Organization ID not found");
                return;
              }
              
              const confirmed = confirm(
                `This will generate 30 demo runs for analytics. Continue?`
              );
              
              if (!confirmed) return;
              
              try {
                const response = await fetch(
                  `/api/seed?secret=atomic_demo&orgId=${organization.id}`
                );
                const data = await response.json();
                
                if (response.ok) {
                  alert(`✅ Success! ${data.message}\n\nCreated:\n- ${data.details.statusDistribution.COMPLETED} Completed\n- ${data.details.statusDistribution.IN_PROGRESS} In Progress\n- ${data.details.statusDistribution.FLAGGED} Flagged\n\nRefresh the Analytics page to see the data.`);
                  // Optionally refresh the page or reload analytics
                  window.location.reload();
                } else {
                  alert(`❌ Error: ${data.error}\n${data.details || ''}`);
                }
              } catch (error: any) {
                alert(`❌ Failed to seed data: ${error.message}`);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
          >
            <Zap className="h-4 w-4" />
            Seed Demo Data
          </button>
        </div>
      </motion.div>

      {/* Resource Usage Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Resource Usage
          </h2>
        </div>

        <div className="space-y-6">
          {/* Users Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">Users</span>
              </div>
              <span className="text-sm font-semibold text-slate-600">
                {usage?.currentUsers || 0} / {limits.maxUsers === Infinity ? "∞" : limits.maxUsers}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  userUsagePercent >= 80
                    ? "bg-gradient-to-r from-rose-500 to-rose-600"
                    : userUsagePercent >= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${Math.min(userUsagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Active Runs Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">Active Runs</span>
              </div>
              <span className="text-sm font-semibold text-slate-600">
                {usage?.currentActiveRuns || 0} / {limits.maxActiveRuns === Infinity ? "∞" : limits.maxActiveRuns}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  runsUsagePercent >= 80
                    ? "bg-gradient-to-r from-rose-500 to-rose-600"
                    : runsUsagePercent >= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${Math.min(runsUsagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* AI Credits Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">AI Generations</span>
              </div>
              <span className="text-sm font-semibold text-slate-600">
                {usage?.currentAiGenerations || 0} / {limits.aiGenerations === Infinity ? "∞" : limits.aiGenerations}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  getUsagePercentage(usage?.currentAiGenerations || 0, limits.aiGenerations) >= 80
                    ? "bg-gradient-to-r from-rose-500 to-rose-600"
                    : getUsagePercentage(usage?.currentAiGenerations || 0, limits.aiGenerations) >= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-purple-500 to-purple-600"
                }`}
                style={{ width: `${Math.min(getUsagePercentage(usage?.currentAiGenerations || 0, limits.aiGenerations), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Plans - Apple One Style */}
      <div id="pricing-plans">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-8">Choose Your Plan</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border-2 p-8 shadow-xl shadow-black/5 hover:shadow-2xl transition-all ${
                plan.highlight
                  ? "border-blue-400/50 ring-2 ring-blue-400/50 scale-105"
                  : "border-white/60"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-slate-600 font-medium">/{plan.period}</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-600 font-medium">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => {
                  const isAIFeature = feature.text.includes("Atomic Insight") || feature.text.includes("AI Support") || feature.text.includes("Custom AI");
                  const isProactiveNudge = feature.text.includes("Proactive Nudges");
                  const isBasicAI = feature.text === "Basic AI Support";
                  
                  return (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        isBasicAI ? (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                          </div>
                        ) : (
                          <Check className={`h-5 w-5 flex-shrink-0 ${isAIFeature || isProactiveNudge ? "text-purple-600" : "text-green-600"}`} />
                        )
                      ) : (
                        <X className="h-5 w-5 flex-shrink-0 text-slate-300" />
                      )}
                      <div className="flex-1">
                        <span
                          className={`text-sm ${
                            feature.included 
                              ? isAIFeature 
                                ? "font-semibold text-slate-900" 
                                : isBasicAI 
                                ? "text-slate-500" 
                                : "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {feature.text}
                        </span>
                        {feature.detail && (
                          <span className="block text-xs text-slate-500 mt-1 italic">
                            {feature.detail}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <button
                disabled={plan.ctaDisabled}
                onClick={() => {
                  if (plan.name === "Pro" && organization.plan !== "PRO") {
                    // In a real app, this would redirect to Stripe Checkout
                    alert("Redirecting to Stripe Checkout... (This is a demo)");
                  } else if (plan.name === "Enterprise") {
                    alert("Please contact sales@workos.com for Enterprise pricing");
                  }
                }}
                className={`w-full rounded-full px-6 py-3.5 text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-[#007AFF] text-white hover:bg-[#0071E3] hover:shadow-lg"
                    : plan.ctaDisabled
                    ? "bg-slate-100/50 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
                }`}
              >
                {plan.ctaDisabled ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    {plan.cta}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </motion.div>
          ))}
        </div>

      {/* Subscription Status */}
      {organization.subscriptionStatus !== "active" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-orange-200/50 bg-orange-50/60 backdrop-blur-sm p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
              <X className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-900">
                Subscription Status: {organization.subscriptionStatus}
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                {organization.subscriptionStatus === "canceled"
                  ? "Your subscription has been canceled. You can continue using the service until the end of your billing period."
                  : "Your subscription payment is past due. Please update your payment method."}
              </p>
            </div>
          </div>
        </motion.div>
      )}
      </div>
      </div>
    </div>
  );
}

