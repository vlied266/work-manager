"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Organization } from "@/types/schema";
import { Check, X, Zap, Users, Activity, Sparkles, ArrowRight, Loader2 } from "lucide-react";
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
                    const org: Organization = {
                      id: orgDoc.id,
                      name: data.name || "",
                      plan: data.plan || "FREE",
                      subscriptionStatus: data.subscriptionStatus || "active",
                      limits: data.limits || getPlanLimits(data.plan || "FREE"),
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
        { text: "AI Copilot", included: false },
        { text: "Priority support", included: false },
        { text: "SSO & Audit Logs", included: false },
      ],
      cta: "Current Plan",
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
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your subscription and view usage limits
        </p>
      </div>

      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
            <p className="text-sm text-slate-600 mt-1">
              {organization.plan === "FREE" && "Free tier - Upgrade to unlock more features"}
              {organization.plan === "PRO" && "Pro plan - Full access to all features"}
              {organization.plan === "ENTERPRISE" && "Enterprise plan - Custom solution"}
            </p>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
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
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${userUsagePercent}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  userUsagePercent >= 90 ? "bg-rose-500" : userUsagePercent >= 70 ? "bg-orange-500" : "bg-blue-500"
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
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${runsUsagePercent}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  runsUsagePercent >= 90 ? "bg-rose-500" : runsUsagePercent >= 70 ? "bg-orange-500" : "bg-blue-500"
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
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getUsagePercentage(usage?.currentAiGenerations || 0, limits.aiGenerations)}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Choose Your Plan</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl border-2 p-6 ${
                plan.highlight
                  ? "border-blue-500 bg-blue-50/30 shadow-lg"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-slate-600">/{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 flex-shrink-0 text-slate-300" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
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
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                    : plan.ctaDisabled
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105"
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
      </div>

      {/* Subscription Status */}
      {organization.subscriptionStatus !== "active" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-orange-200 bg-orange-50 p-4"
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
  );
}

