"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bootstrapOrganization } from "@/lib/organization";
import { useAuth } from "@/hooks/use-auth";
import { PlanTier } from "@/types/workos";

const plans: PlanTier[] = ["FREE", "PRO"];

const sanitizeInvites = (value: string) =>
  value
    .split(/[\n,]/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, profile, loading, refreshProfile } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");
  const [teamName, setTeamName] = useState("Core Operations");
  const [plan, setPlan] = useState<PlanTier>("PRO");
  const [inviteBlock, setInviteBlock] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/sign-in");
    }
  }, [firebaseUser, loading, router]);

  useEffect(() => {
    if (!loading && profile?.organizationId) {
      router.replace("/design");
    }
  }, [loading, profile, router]);

  const inviteCount = useMemo(() => sanitizeInvites(inviteBlock).length, [inviteBlock]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firebaseUser || !firebaseUser.email) {
      setError("Authentication error. Please sign in again.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await bootstrapOrganization({
        name: orgName,
        domain,
        plan,
        ownerUid: firebaseUser.uid,
        ownerEmail: firebaseUser.email,
        ownerName: firebaseUser.displayName || profile?.displayName || "",
        defaultTeamName: teamName,
        inviteEmails: sanitizeInvites(inviteBlock),
      });
      await refreshProfile();
      router.push("/design");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <p className="text-muted">Preparing your workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl bg-white/90 p-10 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">Organization Setup</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Name your operating system</h1>
          <p className="text-muted">
            This information defines your company in WorkOS. You can invite more teammates later.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-muted">Organization Name</span>
              <input
                type="text"
                required
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-base/80 px-4 py-3 text-base outline-none focus:border-accent"
                placeholder="Tesla"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-muted">Primary Domain</span>
              <input
                type="text"
                required
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-base/80 px-4 py-3 text-base outline-none focus:border-accent"
                placeholder="tesla.com"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm">
                <span className="font-medium text-muted">Default Team Name</span>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-base/80 px-4 py-3 text-base outline-none focus:border-accent"
                  placeholder="Core Operations"
                />
              </label>

              <div className="space-y-2 text-sm">
                <span className="font-medium text-muted">Plan</span>
                <div className="grid grid-cols-2 gap-3">
                  {plans.map((tier) => (
                    <button
                      type="button"
                      key={tier}
                      onClick={() => setPlan(tier)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        plan === tier
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-ink/10 text-muted hover:border-ink/30"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-muted">
                Invite teammates ({inviteCount} ready)
              </span>
              <textarea
                rows={4}
                value={inviteBlock}
                onChange={(event) => setInviteBlock(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-base/80 px-4 py-3 text-sm outline-none focus:border-accent"
                placeholder="ops@company.com, lead@company.com"
              />
              <span className="text-xs text-muted">
                Separate emails with commas or new lines. Invitations will stay pending until accepted.
              </span>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-ink px-4 py-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-black disabled:opacity-60"
            >
              {saving ? "Creating workspace..." : "Create Organization"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

