"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Building2, CheckCircle2, XCircle, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface Invitation {
  id: string;
  email: string;
  orgId: string;
  role: string;
  teamId?: string;
  token: string;
  status: string;
  expiresAt?: Date;
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [orgName, setOrgName] = useState<string>("");
  
  // Password creation state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch invitation by token
  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const invitationsQuery = query(
          collection(db, "invitations"),
          where("token", "==", token)
        );
        const snapshot = await getDocs(invitationsQuery);

        if (snapshot.empty) {
          setError("Invitation not found or has already been used.");
          setLoading(false);
          return;
        }

        const inviteDoc = snapshot.docs[0];
        const data = inviteDoc.data();

        // Check if invitation is expired
        if (data.expiresAt) {
          const expiresAt = data.expiresAt.toDate();
          if (expiresAt < new Date()) {
            setError("This invitation has expired. Please request a new one.");
            setLoading(false);
            return;
          }
        }

        // Check if invitation is already used
        if (data.status !== "pending") {
          setError("This invitation has already been used.");
          setLoading(false);
          return;
        }

        const invitationData: Invitation = {
          id: inviteDoc.id,
          email: data.email,
          orgId: data.orgId,
          role: data.role,
          teamId: data.teamId,
          token: data.token,
          status: data.status,
          expiresAt: data.expiresAt?.toDate(),
        };

        setInvitation(invitationData);

        // Fetch organization name
        const orgDoc = await getDoc(doc(db, "organizations", data.orgId));
        if (orgDoc.exists()) {
          setOrgName(orgDoc.data().name);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching invitation:", err);
        setError("Failed to load invitation. Please try again.");
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Auto-accept if user is already logged in and email matches
  useEffect(() => {
    if (user && invitation && invitation.email === user.email && !accepting) {
      handleAcceptInvitation(user);
    }
  }, [user, invitation, accepting]);

  const handleAcceptInvitation = async (authUser?: any) => {
    const currentUser = authUser || user;
    if (!invitation || !currentUser) return;

    setAccepting(true);

    try {
      // Update user profile with organization and role
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing user profile
        await updateDoc(userDocRef, {
          organizationId: invitation.orgId,
          orgId: invitation.orgId,
          role: invitation.role,
          teamIds: invitation.teamId ? [invitation.teamId] : [],
          updatedAt: new Date(),
        });
      } else {
        // Create new user profile if it doesn't exist
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          photoURL: currentUser.photoURL || null,
          role: invitation.role,
          organizationId: invitation.orgId,
          orgId: invitation.orgId,
          teamIds: invitation.teamId ? [invitation.teamId] : [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Mark invitation as accepted
      await updateDoc(doc(db, "invitations", invitation.id), {
        status: "accepted",
        acceptedAt: new Date(),
        acceptedBy: currentUser.uid,
      });

      // Set auth token cookie
      const idToken = await currentUser.getIdToken();
      document.cookie = `workos_token=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      setError("Failed to accept invitation. Please try again.");
      setAccepting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!invitation) return;

    setAccepting(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      // Add Google Calendar scope
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      // Add Google Sheets scope
      provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verify email matches invitation
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        await auth.signOut();
        setError(`This invitation is for ${invitation.email}. Please sign in with the correct Google account.`);
        setAccepting(false);
        return;
      }

      // Accept invitation
      await handleAcceptInvitation(user);
    } catch (err: any) {
      console.error("Error with Google sign in:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign in was cancelled. Please try again.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
      setAccepting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    // Validate passwords
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setCreatingAccount(true);
    setError(null);

    try {
      // Create account with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        password
      );
      const user = userCredential.user;

      // Accept invitation
      await handleAcceptInvitation(user);
    } catch (err: any) {
      console.error("Error creating account:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
        setShowPasswordForm(false);
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      setCreatingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center p-8">
        <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center max-w-md w-full">
          <div className="mb-6 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm font-semibold text-slate-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center p-8">
        <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center max-w-md w-full">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Invitation Error
          </h1>
          <p className="mb-8 text-sm text-slate-600">{error}</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // If user is logged in but email doesn't match
  if (user && user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center p-8">
        <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center max-w-md w-full">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100">
            <XCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Email Mismatch
          </h1>
          <p className="mb-4 text-sm text-slate-600">
            This invitation is for <strong className="text-slate-900">{invitation.email}</strong>, but you are signed in as{" "}
            <strong className="text-slate-900">{user.email}</strong>.
          </p>
          <p className="mb-8 text-sm text-slate-600">
            Please sign out and sign in with the correct email address.
          </p>
          <button
            onClick={() => auth.signOut()}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // If user is already logged in and email matches, show accepting state
  if (user && user.email?.toLowerCase() === invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center p-8">
        <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center max-w-md w-full">
          <div className="mb-6 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm font-semibold text-slate-600">
            Accepting invitation...
          </p>
        </div>
      </div>
    );
  }

  // User is not logged in - show invitation acceptance UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center p-8">
      <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900">
            You&apos;re Invited!
          </h1>
          <p className="mb-2 text-sm font-semibold text-slate-600">
            You have been invited to join
          </p>
          <p className="mb-6 text-lg font-extrabold text-slate-900">
            {orgName || "Organization"}
          </p>

          {/* Email Display */}
          <div className="mb-8 rounded-xl bg-slate-50/50 border border-slate-200/60 p-4">
            <div className="flex items-center gap-3 justify-center">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{invitation.email}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {!showPasswordForm ? (
          <div className="space-y-4">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={accepting}
              className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-white border-2 border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Toggle to Password Form */}
            <div className="text-center">
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Or create a password
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={creatingAccount || !password || !confirmPassword}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Create Account & Join
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="w-full text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Back to Google sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center p-8">
        <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center max-w-md w-full">
          <div className="mb-6 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm font-semibold text-slate-600">Loading invitation...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
