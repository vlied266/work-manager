"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profileSnap = await getDoc(doc(db, "users", credential.user.uid));
      const hasOrg = profileSnap.exists() && profileSnap.data().organizationId;
      const fallback = hasOrg ? "/design" : "/onboarding";
      const redirect = params.get("redirect");
      router.push(redirect && redirect !== "/" ? redirect : fallback);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-ink">Welcome back</h1>
        <p className="text-base text-ink-secondary">Sign in to continue designing atomic procedures.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="apple-button w-full px-6 py-3.5 text-base font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="text-center text-sm text-ink-secondary">
        Need an account?{" "}
        <Link href="/sign-up" className="font-medium text-accent transition-colors hover:text-accent-hover">
          Create workspace
        </Link>
      </div>
    </div>
  );
}

