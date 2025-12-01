"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName) {
        await updateProfile(credential.user, { displayName: fullName });
      }
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: fullName,
        avatarUrl: "",
        organizationId: "",
        teamIds: [],
        role: "ADMIN",
      });
      router.push("/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-ink">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-muted">WorkOS Access</p>
        <h1 className="mt-2 text-3xl font-semibold">Create your workspace</h1>
        <p className="text-sm text-muted">Start by creating your admin account.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-muted">Full Name</span>
          <input
            type="text"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="Ada Lovelace"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="you@company.com"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-muted">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-subtle transition hover:bg-black disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Continue"}
        </button>
      </form>
      <div className="text-sm text-muted">
        Already have access?{" "}
        <Link href="/sign-in" className="font-semibold text-accent">
          Sign in →
        </Link>
      </div>
    </div>
  );
}

