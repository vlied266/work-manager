"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, setDoc, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Building2 } from "lucide-react";

const INDUSTRY_OPTIONS = ["Tech", "Marketing", "Logistics", "Other"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState("");
  const [industry, setIndustry] = useState<(typeof INDUSTRY_OPTIONS)[number]>("Tech");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.replace("/sign-in");
        return;
      }

      setUser(currentUser);

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const existingOrgId = userDoc.data()?.orgId || userDoc.data()?.organizationId;
        if (existingOrgId) {
          router.replace("/");
          return;
        }
      } catch (err) {
        console.error("Failed to check user profile", err);
        setError("Something went wrong while preparing your workspace. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organizationName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const orgRef = await addDoc(collection(db, "organizations"), {
        name: organizationName.trim(),
        industry,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          role: "ADMIN",
          orgId: orgRef.id,
          organizationId: orgRef.id,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.replace("/");
    } catch (err) {
      console.error("Error creating organization", err);
      setError("Could not create your organization. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-white/70">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm tracking-wide">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)]" />
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center text-white">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-white/70">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Atomic Work
            </Link>
            <h1 className="mt-6 text-4xl font-semibold">Welcome to Atomic Work</h1>
            <p className="mt-2 text-base text-white/70">Let&apos;s set up your workspace.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-3xl">
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/60 to-cyan-400/70 text-white shadow-lg shadow-blue-500/30">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Workspace Setup</p>
                <p className="text-lg font-semibold">Create your first Organization</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="organizationName" className="mb-2 block text-sm font-medium text-white/80">
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  placeholder="e.g. Aurora Logistics"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <p className="mt-2 text-xs text-white/50">This becomes the name everyone sees across your workspace.</p>
              </div>

              <div>
                <label htmlFor="industry" className="mb-2 block text-sm font-medium text-white/80">
                  Industry
                </label>
                <div className="relative">
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value as (typeof INDUSTRY_OPTIONS)[number])}
                    className="w-full appearance-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    {INDUSTRY_OPTIONS.map((option) => (
                      <option key={option} value={option} className="text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/60">⌄</span>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !organizationName.trim()}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create Workspace &amp; Start
                    <Sparkles className="h-4 w-4 text-white/80 transition group-hover:rotate-12" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

