"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Building2, CheckCircle2, XCircle, Loader2, LogIn, UserPlus } from "lucide-react";
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

  // Auto-accept if user is logged in and email matches
  useEffect(() => {
    if (user && invitation && invitation.email === user.email && !accepting) {
      handleAcceptInvitation();
    }
  }, [user, invitation]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);

    try {
      // Update user profile with organization and role
      const userDocRef = doc(db, "users", user.uid);
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
        const { setDoc } = await import("firebase/firestore");
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          photoURL: user.photoURL || null,
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
        acceptedBy: user.uid,
      });

      // Delete invitation (optional - you might want to keep it for audit)
      // await deleteDoc(doc(db, "invitations", invitation.id));

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      setError("Failed to accept invitation. Please try again.");
      setAccepting(false);
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

  if (error) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center p-8">
      <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center max-w-md w-full">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>

        <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900">
          You&apos;re Invited!
        </h1>
        <p className="mb-2 text-sm font-semibold text-slate-600">
          You have been invited to join
        </p>
        <p className="mb-8 text-lg font-extrabold text-slate-900">
          {orgName || "Organization"}
        </p>

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Please sign in or create an account to accept this invitation.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/sign-in?redirect=/accept-invite?token=${token}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href={`/sign-up?redirect=/accept-invite?token=${token}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
              >
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </div>
          </div>
        ) : user.email !== invitation.email ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This invitation is for <strong>{invitation.email}</strong>, but you are signed in as{" "}
              <strong>{user.email}</strong>.
            </p>
            <p className="text-sm text-slate-600">
              Please sign out and sign in with the correct email address.
            </p>
            <button
              onClick={() => auth.signOut()}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {accepting ? (
              <>
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
                <p className="text-sm font-semibold text-slate-600">
                  Accepting invitation...
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Click the button below to accept this invitation and join the organization.
                </p>
                <button
                  onClick={handleAcceptInvitation}
                  className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept Invitation
                </button>
              </>
            )}
          </div>
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

