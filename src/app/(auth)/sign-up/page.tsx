"use client";

import { useState, Suspense } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Trim inputs to remove trailing spaces
      const trimmedEmail = email.trim();
      const trimmedDisplayName = displayName.trim();
      
      if (!trimmedEmail) {
        setError("Please enter your email address.");
        return;
      }

      if (!trimmedDisplayName) {
        setError("Please enter your full name.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      // Get the ID token and set it as a cookie for middleware authentication
      const idToken = await user.getIdToken();
      document.cookie = `workos_token=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Create user profile in Firestore
      const userProfile = {
        email: user.email,
        displayName: trimmedDisplayName || user.email?.split("@")[0] || "User",
        role: "OPERATOR" as const, // Default role for new users
        teamIds: [],
        organizationId: "", // Will be set during onboarding
        orgId: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), userProfile);

      // Check if there's a redirect parameter (e.g., from invitation)
      if (redirect) {
        window.location.href = redirect;
        return;
      }

      // Smart redirect based on role
      // New users without organization go to onboarding
      router.push("/onboarding");
    } catch (err: any) {
      console.error("Sign up error:", err);
      
      // Provide user-friendly error messages
      let errorMessage = "Failed to create account. Please try again.";
      
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address. Please check your email and try again.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password (at least 6 characters).";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <Logo size="small" />
            <div>
              <span className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors block">
                Atomic Work
              </span>
              <div className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Atomic Engine
              </div>
            </div>
          </Link>
        </div>

        {/* Sign Up Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="mt-2 text-sm text-slate-600">
              Get started with Atomic Work today
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <p className="text-sm font-medium text-rose-900">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={(e) => setDisplayName(e.target.value.trim())}
                required
                placeholder="John Doe"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                onBlur={(e) => setEmail(e.target.value.trim())}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <p className="mt-1 text-xs text-slate-500">Must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-slate-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Logo size="small" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}

