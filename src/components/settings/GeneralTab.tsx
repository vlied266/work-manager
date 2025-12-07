"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Organization } from "@/types/schema";
import { useOrgId } from "@/hooks/useOrgData";
import { 
  Building2, 
  Upload, 
  Copy, 
  CheckCircle2
} from "lucide-react";
export function GeneralTab() {
  const organizationId = useOrgId();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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


  const handleSaveProfile = async () => {
    if (!organizationId || !displayName.trim()) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, "organizations", organizationId), {
        name: displayName.trim(),
        industry: industry || null,
        logoUrl: logoUrl || null,
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


    </div>
  );
}

