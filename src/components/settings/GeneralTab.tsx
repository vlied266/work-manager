"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Organization } from "@/types/schema";
import { useOrgId, useOrgQuery } from "@/hooks/useOrgData";
import { 
  Building2, 
  Upload, 
  Copy, 
  CheckCircle2, 
  CreditCard, 
  FileText,
  Users,
  Workflow,
  Sparkles,
  Calendar,
  ArrowUpRight,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

export function GeneralTab() {
  const organizationId = useOrgId();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [savingSlack, setSavingSlack] = useState(false);
  const [slackError, setSlackError] = useState<string | null>(null);

  // Fetch organization data
  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const orgDocRef = doc(db, "organizations", organizationId);
    const unsubscribe = onSnapshot(
      orgDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const org: Organization = {
            id: docSnapshot.id,
            name: data.name || "",
            plan: data.plan || "FREE",
            subscriptionStatus: data.subscriptionStatus || "active",
            limits: data.limits || {
              maxUsers: 5,
              maxActiveRuns: 10,
              aiGenerations: 50,
            },
            createdAt: data.createdAt?.toDate() || new Date(),
          };
          setOrganization(org);
          setDisplayName(org.name);
          setIndustry(data.industry || "");
          setLogoUrl(data.logoUrl || null);
          setSlackWebhookUrl(data.slackWebhookUrl || "");
          setLoading(false);
        } else {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching organization:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  // Get usage stats
  const usersQuery = useOrgQuery("users");
  const runsQuery = useOrgQuery("active_runs");
  const [userCount, setUserCount] = useState(0);
  const [activeRunCount, setActiveRunCount] = useState(0);

  useEffect(() => {
    if (!usersQuery || !runsQuery) return;

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUserCount(snapshot.size);
    });

    const unsubscribeRuns = onSnapshot(
      runsQuery,
      (snapshot) => {
        const activeRuns = snapshot.docs.filter(
          (doc) => doc.data().status === "IN_PROGRESS"
        );
        setActiveRunCount(activeRuns.length);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeRuns();
    };
  }, [usersQuery, runsQuery]);

  const handleSaveProfile = async () => {
    if (!organizationId || !displayName.trim()) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, "organizations", organizationId), {
        name: displayName.trim(),
        industry: industry || null,
        logoUrl: logoUrl || null,
        slackWebhookUrl: slackWebhookUrl.trim() || null,
        updatedAt: new Date(),
      });
      // Show success feedback
      alert("Organization profile updated successfully!");
    } catch (error) {
      console.error("Error updating organization:", error);
      alert("Failed to update organization profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyOrgId = () => {
    if (organizationId) {
      navigator.clipboard.writeText(organizationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogoUpload = () => {
    // Placeholder for logo upload functionality
    // In production, this would use Firebase Storage
    alert("Logo upload functionality coming soon!");
  };

  // Calculate next payment date (mock: 30 days from now)
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
  const daysRemaining = Math.ceil(
    (nextPaymentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate usage percentages
  const userUsagePercent = organization
    ? Math.round((userCount / organization.limits.maxUsers) * 100)
    : 0;
  const runUsagePercent = organization
    ? Math.round((activeRunCount / organization.limits.maxActiveRuns) * 100)
    : 0;
  const aiUsagePercent = organization
    ? Math.round((80 / organization.limits.aiGenerations) * 100) // Mock AI usage: 80
    : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-12 text-center">
        <p className="text-sm text-slate-600">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Organization Profile Card */}
      <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Organization Profile
          </h2>
        </div>

        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white/60 flex items-center justify-center overflow-hidden shadow-lg">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Organization logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <button
                onClick={handleLogoUpload}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
              >
                <Upload className="h-4 w-4" />
                Upload Logo
              </button>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">Select industry</option>
              <option value="tech">Technology</option>
              <option value="finance">Finance</option>
              <option value="retail">Retail</option>
              <option value="healthcare">Healthcare</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="education">Education</option>
              <option value="consulting">Consulting</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Organization ID */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Organization ID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={organizationId || ""}
                readOnly
                className="flex-1 rounded-xl border-0 bg-slate-50/50 shadow-inner px-4 py-3 text-sm font-mono text-slate-600"
              />
              <button
                onClick={handleCopyOrgId}
                className="inline-flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveProfile}
              disabled={!displayName.trim() || saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Subscription & Billing Card */}
      <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-8">
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
                {nextPaymentDate.toLocaleDateString()}
              </p>
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {daysRemaining} days remaining
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push("/billing")}
            className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
          >
            <ArrowUpRight className="h-4 w-4" />
            Upgrade Plan
          </button>
          <button
            onClick={() => router.push("/billing")}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
          >
            <FileText className="h-4 w-4" />
            Invoices
          </button>
        </div>
      </div>

      {/* Usage Limits Card */}
      <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-8">
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
                {userCount} / {organization.limits.maxUsers}
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
                {activeRunCount} / {organization.limits.maxActiveRuns}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  runUsagePercent >= 80
                    ? "bg-gradient-to-r from-rose-500 to-rose-600"
                    : runUsagePercent >= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${Math.min(runUsagePercent, 100)}%` }}
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
                80 / {organization.limits.aiGenerations}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  aiUsagePercent >= 80
                    ? "bg-gradient-to-r from-rose-500 to-rose-600"
                    : aiUsagePercent >= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${Math.min(aiUsagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Card */}
      <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Integrations
          </h2>
        </div>

        <div className="space-y-6">
          {/* Slack Integration */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Slack Notifications</h3>
                <p className="text-sm text-slate-600">Get notified in Slack when new tasks are created</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Slack Webhook URL
              </label>
              <input
                type="url"
                value={slackWebhookUrl}
                onChange={(e) => {
                  setSlackWebhookUrl(e.target.value);
                  setSlackError(null);
                }}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              {slackError && (
                <p className="text-xs text-rose-600 font-medium">{slackError}</p>
              )}
              <p className="text-xs text-slate-500">
                Create a webhook in your Slack workspace to receive notifications
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={async () => {
                  // Validate URL
                  if (slackWebhookUrl.trim() && !slackWebhookUrl.trim().startsWith("https://hooks.slack.com/")) {
                    setSlackError("Invalid Slack webhook URL. Must start with https://hooks.slack.com/");
                    return;
                  }

                  setSavingSlack(true);
                  setSlackError(null);
                  try {
                    await updateDoc(doc(db, "organizations", organizationId), {
                      slackWebhookUrl: slackWebhookUrl.trim() || null,
                      updatedAt: new Date(),
                    });
                    alert("Slack integration saved successfully!");
                  } catch (error) {
                    console.error("Error saving Slack webhook:", error);
                    setSlackError("Failed to save Slack webhook. Please try again.");
                  } finally {
                    setSavingSlack(false);
                  }
                }}
                disabled={savingSlack}
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg disabled:opacity-50"
              >
                {savingSlack ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

