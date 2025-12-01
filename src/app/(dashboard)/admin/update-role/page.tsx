"use client";

import { useState } from "react";
import { doc, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/workos";
import { useRouter } from "next/navigation";

export default function UpdateRolePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("vlied266@gmail.com");
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

  const handleUpdate = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Query users by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(`No user found with email: ${email}`);
        setLoading(false);
        return;
      }

      if (querySnapshot.size > 1) {
        setError(`Multiple users found with email: ${email}. This should not happen.`);
        setLoading(false);
        return;
      }

      // Update the user's role
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      await updateDoc(doc(db, "users", userDoc.id), {
        role: role,
      });

      setMessage(
        `✅ Successfully updated role for ${userData.displayName || userData.email} (${userData.email}) to ${role}`
      );
      setEmail("");
    } catch (err) {
      console.error("Error updating user role:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Admin Tools</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Update User Role</h1>
        <p className="text-muted">Change a user's role by email address</p>
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
            <label className="block text-sm font-semibold text-muted mb-2">New Role</label>
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
            onClick={handleUpdate}
            disabled={loading || !email.trim()}
            className="w-full rounded-2xl bg-[#007AFF] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#007AFF]/30 transition hover:bg-[#0051D5] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Role"}
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

