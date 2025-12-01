"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/workos";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("vlied266@gmail.com");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only allow ADMIN users
  if (profile?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
          <h1 className="text-2xl font-semibold text-ink">Access Denied</h1>
          <p className="mt-2 text-muted">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Check if user already exists in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      let userUid: string;

      if (querySnapshot.empty) {
        // Create new Firebase Auth user
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password
        );
        userUid = credential.user.uid;

        // Update profile if display name provided
        if (displayName.trim()) {
          await updateProfile(credential.user, { displayName: displayName.trim() });
        }

        // Create user document in Firestore
        await setDoc(doc(db, "users", userUid), {
          uid: userUid,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim() || email.trim().split("@")[0],
          avatarUrl: "",
          organizationId: profile.organizationId || "",
          teamIds: [],
          role: role,
        });

        setMessage(
          `✅ Successfully created user: ${displayName.trim() || email} with role ${role}`
        );
      } else {
        // User exists in Firestore but maybe not in Auth
        const userDoc = querySnapshot.docs[0];
        userUid = userDoc.id;
        const userData = userDoc.data();

        // Try to create Auth user (will fail if already exists)
        try {
          const credential = await createUserWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password
          );
          userUid = credential.user.uid;

          if (displayName.trim()) {
            await updateProfile(credential.user, { displayName: displayName.trim() });
          }
        } catch (authError: any) {
          if (authError.code === "auth/email-already-in-use") {
            // User exists in Auth, just update Firestore
            setMessage(
              `⚠️ User already exists in Firebase Auth. Updating Firestore document...`
            );
          } else {
            throw authError;
          }
        }

        // Update Firestore document
        await setDoc(
          doc(db, "users", userUid),
          {
            uid: userUid,
            email: email.trim().toLowerCase(),
            displayName: displayName.trim() || userData.displayName || email.trim().split("@")[0],
            avatarUrl: userData.avatarUrl || "",
            organizationId: profile.organizationId || userData.organizationId || "",
            teamIds: userData.teamIds || [],
            role: role,
          },
          { merge: true }
        );

        setMessage(
          `✅ Successfully updated user: ${userData.displayName || email} with role ${role}`
        );
      }

      // Clear form
      setPassword("");
    } catch (err: any) {
      console.error("Error creating/updating user:", err);
      if (err.code === "auth/email-already-in-use") {
        setError(
          "This email is already registered in Firebase Auth. Please use 'Reset Password' if you forgot your password."
        );
      } else {
        setError(err.message || "Failed to create/update user");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Admin Tools</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Create/Update User</h1>
        <p className="text-muted">Create a new user or update existing user in Firebase Auth</p>
      </header>

      <div className="rounded-3xl bg-white/90 p-8 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-muted mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted mb-2">
              Password (leave empty if user exists)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password for new user"
              className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted mb-2">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="User's display name"
              className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="OPERATOR">OPERATOR</option>
              <option value="LEAD">LEAD</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !email.trim()}
            className="w-full rounded-2xl bg-[#007AFF] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#007AFF]/30 transition hover:bg-[#0051D5] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Creating/Updating..." : "Create/Update User"}
          </button>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              ❌ {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 p-6 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold text-accent hover:underline"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

