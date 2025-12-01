"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { Check } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { db } from "@/lib/firebase";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    description: "Great for pilots and internal demos.",
    features: ["Unlimited procedures", "1 active process at a time", "Basic audit log"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$29 / seat",
    description: "For teams running multiple mission-critical workflows.",
    features: ["Unlimited processes", "Flag workspace", "Audit exports", "Priority reminders"],
  },
];

export default function BillingPage() {
  const { organization, loading, error } = useOrganization();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSwitchPlan = async (planId: "FREE" | "PRO") => {
    if (!organization) return;
    setSaving(true);
    setStatus(null);
    try {
      const orgRef = doc(db, "organizations", organization.id);
      await updateDoc(orgRef, { plan: planId });
      setStatus(`Plan updated to ${planId}.`);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Billing & Plan</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-ink">{organization?.name || "Workspace"}</h1>
            <p className="text-muted">
              {loading
                ? "Loading plan..."
                : organization
                  ? `Current plan: ${organization.plan}`
                  : "No organization detected"}
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-subtle">
          {error}
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const isActive = organization?.plan === plan.id;
            return (
              <article
                key={plan.id}
                className={`rounded-3xl border p-6 shadow-subtle ${
                  isActive ? "border-ink bg-white" : "border-white/80 bg-white/70"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.4em] text-muted">{plan.name}</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">{plan.price}</h2>
                <p className="text-sm text-muted">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSwitchPlan(plan.id as "FREE" | "PRO")}
                  disabled={saving || isActive}
                  className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
                    isActive ? "bg-ink/50" : "bg-ink hover:bg-black"
                  }`}
                >
                  {isActive ? "Current plan" : saving ? "Updating..." : "Switch to this plan"}
                </button>
              </article>
            );
          })}
        </section>
      )}

      {status && (
        <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-muted">{status}</div>
      )}
    </div>
  );
}

