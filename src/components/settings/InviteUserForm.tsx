"use client";

import { useState } from "react";
import { UserPlus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

interface InviteUserFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function InviteUserForm({ onSuccess, onError }: InviteUserFormProps) {
  const { userProfile } = useOrganization();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "OPERATOR">("OPERATOR");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!userProfile?.organizationId) {
      setError("Organization ID not found");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
          orgId: userProfile.organizationId,
          inviterName: userProfile.displayName || userProfile.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccess(true);
      setEmail("");
      setRole("OPERATOR");
      
      if (onSuccess) {
        onSuccess();
      }

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to send invitation";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
          className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
        >
          <option value="OPERATOR">Operator (Can only Run)</option>
          <option value="MANAGER">Manager (Can Design & Run)</option>
          <option value="ADMIN">Admin (Full Access)</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Error</p>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">Invitation Sent!</p>
            <p className="text-sm text-green-700">
              An invitation email has been sent to {email}
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!email.trim() || loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Send Invitation
          </>
        )}
      </button>
    </form>
  );
}

