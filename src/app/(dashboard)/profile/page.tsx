"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useTeams } from "@/hooks/use-teams";
import { usePendingInvitations } from "@/hooks/use-pending-invitations";
import { db } from "@/lib/firebase";

const ROLE_OPTIONS = ["ADMIN", "LEAD", "OPERATOR"] as const;

export default function ProfilePage() {
  const { profile, firebaseUser } = useAuth();
  const { organization } = useOrganization();
  const { teams } = useTeams(profile?.organizationId);
  const { invites, loading: inviteLoading, acceptInvite } = usePendingInvitations();
  const [roleStatus, setRoleStatus] = useState<string | null>(null);

  const userTeams = teams.filter((team) => profile?.teamIds.includes(team.id));

  const handleRoleChange = async (role: (typeof ROLE_OPTIONS)[number]) => {
    if (!profile || !firebaseUser) return;
    setRoleStatus("Updating role…");
    await updateDoc(doc(db, "users", firebaseUser.uid), { role });
    setRoleStatus("Role updated");
    setTimeout(() => setRoleStatus(null), 2000);
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Your Profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{profile?.displayName || firebaseUser?.email}</h1>
        <p className="text-muted">{firebaseUser?.email}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/90 p-6 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">Organization</p>
          <h2 className="text-2xl font-semibold text-ink mt-2">
            {organization?.name || profile?.organizationId || "Not assigned"}
          </h2>
          {organization && (
            <p className="text-xs text-muted mt-1">ID: {organization.id}</p>
          )}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 px-4 py-3">
              <div>
                <p className="text-sm text-muted">Role</p>
                <p className="text-lg font-semibold text-ink">{profile?.role || "OPERATOR"}</p>
              </div>
              {profile?.role === "ADMIN" && (
                <select
                  onChange={(e) => handleRoleChange(e.target.value as (typeof ROLE_OPTIONS)[number])}
                  defaultValue={profile.role}
                  className="rounded-2xl border border-ink/10 px-3 py-2 text-sm"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {roleStatus && <p className="text-xs text-muted">{roleStatus}</p>}
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">Teams</p>
          {userTeams.length === 0 ? (
            <p className="mt-4 text-sm text-muted">You are not assigned to any team yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {userTeams.map((team) => (
                <div key={team.id} className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-inner">
                  <p className="text-lg font-semibold text-ink">{team.name}</p>
                  <p className="text-sm text-muted">{team.members?.length ?? 0} members</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-6 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Invitations</p>
            <h2 className="text-2xl font-semibold text-ink mt-2">Pending invites</h2>
          </div>
        </div>
        {inviteLoading ? (
          <p className="mt-6 text-sm text-muted">Loading invites…</p>
        ) : invites.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No pending invitations for this account.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {invites.map((invite) => (
              <motion.div
                key={invite.id}
                layout
                className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-inner"
              >
                <div>
                  <p className="text-lg font-semibold text-ink">{invite.organizationId}</p>
                  <p className="text-sm text-muted">
                    {invite.teamId ? `Team: ${invite.teamId}` : "Organization access"}
                  </p>
                </div>
                <button
                  onClick={() => acceptInvite(invite)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#007AFF] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#007AFF]/25 transition-all hover:bg-[#0051D5] hover:shadow-lg hover:shadow-[#007AFF]/35"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

