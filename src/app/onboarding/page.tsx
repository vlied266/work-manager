"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Building2 } from "lucide-react";
import { getPlanLimits } from "@/lib/billing/limits";

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.push("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organizationName.trim()) return;

    setSaving(true);
    try {
      // Create or update organization with default FREE plan
      const orgId = `org-${user.uid}`;
      await setDoc(doc(db, "organizations", orgId), {
        name: organizationName.trim(),
        plan: "FREE",
        subscriptionStatus: "active",
        limits: getPlanLimits("FREE"),
        createdAt: serverTimestamp(),
      });

      // Update user profile with organization ID
      await updateDoc(doc(db, "users", user.uid), {
        organizationId: orgId,
        updatedAt: serverTimestamp(),
      });

      // Redirect based on role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        if (role === "ADMIN" || role === "MANAGER") {
          router.push("/dashboard");
        } else {
          router.push("/inbox");
        }
      } else {
        router.push("/inbox");
      }
    } catch (error) {
      console.error("Error setting up organization:", error);
      alert("Failed to set up organization. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-slate-900">WorkOS</span>
          </Link>
        </div>

        {/* Onboarding Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome to WorkOS</h1>
            <p className="mt-2 text-sm text-slate-600">
              Let's set up your organization to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Organization Name
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                placeholder="Acme Inc."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                This will be your workspace name
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || !organizationName.trim()}
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

