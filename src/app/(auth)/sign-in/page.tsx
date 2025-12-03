"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    // 1. Stop reload - MUST be first
    e.preventDefault();
    
    setLoading(true);
    setError(""); // Reset previous errors

    try {
      // 2. Remove spaces from email
      const cleanEmail = email.trim();
      
      console.log("Attempting login with:", cleanEmail);
      
      if (!cleanEmail) {
        setError("Please enter your email address.");
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      console.log("Success! Redirecting...", user.uid);

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        // Smart redirect based on role
        if (role === "ADMIN" || role === "MANAGER") {
          router.push("/dashboard");
        } else if (role === "OPERATOR") {
          router.push("/inbox");
        } else {
          // No role assigned, redirect to onboarding
          router.push("/onboarding");
        }
      } else {
        // User document doesn't exist, redirect to onboarding
        router.push("/onboarding");
      }
    } catch (err: any) {
      // 3. Log to console for debugging
      console.error("Login Error Full Object:", err);
      console.error("Error Code:", err.code);
      console.error("Error Message:", err.message);
      
      // 4. Show friendly error - FORCE error display
      let errorMessage = "Login failed. Please try again.";
      
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        errorMessage = "Email or password is incorrect.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "Email or password is incorrect.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address. Please check your email and try again.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // FORCE error display
      setError(errorMessage);
      console.log("Error message set to:", errorMessage);
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
                WorkOS
              </span>
              <div className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Atomic Engine
              </div>
            </div>
          </Link>
        </div>

        {/* Sign In Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter your credentials to access your account
            </p>
          </div>

          {error && error.length > 0 && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                <p className="text-sm font-medium text-rose-900">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In with Email"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/sign-up" className="font-medium text-slate-900 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

