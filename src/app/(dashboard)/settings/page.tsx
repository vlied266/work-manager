"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, UserPlus, UserMinus, Settings } from "lucide-react";
import { useTeamsAdmin } from "@/hooks/use-teams-admin";
import { useInvites } from "@/hooks/use-invites";
import { useOrganizationUsers } from "@/hooks/use-organization-users";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/workos";

export default function SettingsPage() {
  const { profile } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const { teams, loading: teamLoading, error: teamError, createTeam, deleteTeam } = useTeamsAdmin();
  const { invites, loading: inviteLoading, error: inviteError, sendInvite } = useInvites();
  const { users, loading: usersLoading, error: usersError, addUserToTeam, removeUserFromTeam } = useOrganizationUsers();

  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState<string | undefined>(undefined);
  const [inviteRole, setInviteRole] = useState<UserRole>("OPERATOR");
  const [activeTab, setActiveTab] = useState<"teams" | "invites" | "members" | "roles">("teams");
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  
  // Manual user creation
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualRole, setManualRole] = useState<UserRole>("OPERATOR");
  const [manualTeamIds, setManualTeamIds] = useState<string[]>([]);
  const [manualPassword, setManualPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const canManage = profile?.role === "ADMIN" || profile?.role === "LEAD";

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    await createTeam(teamName.trim());
    setTeamName("");
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    await sendInvite(inviteEmail.trim().toLowerCase(), inviteTeamId, inviteRole);
    setInviteEmail("");
    setInviteTeamId(undefined);
    setInviteRole("OPERATOR");
  };

  const teamCount = teams.length;
  const pendingInvites = invites.filter((invite) => invite.status === "PENDING").length;
  const memberCount = users.length;

  const stats = useMemo(
    () => [
      { label: "Teams", value: teamCount },
      { label: "Members", value: memberCount },
      { label: "Pending Invites", value: pendingInvites },
    ],
    [teamCount, memberCount, pendingInvites],
  );

  const handleAddToTeam = async (userId: string, teamId: string) => {
    setManagingUserId(userId);
    try {
      await addUserToTeam(userId, teamId);
    } finally {
      setManagingUserId(null);
    }
  };

  const handleRemoveFromTeam = async (userId: string, teamId: string) => {
    setManagingUserId(userId);
    try {
      await removeUserFromTeam(userId, teamId);
    } finally {
      setManagingUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="mb-2 text-4xl font-semibold tracking-tight text-ink">
          {orgLoading ? "Loading..." : organization?.name || "Workspace"}
        </h1>
        <p className="text-base text-ink-secondary">Manage teams, members, and invitations.</p>
        {organization && (
          <p className="mt-1 text-xs text-muted">Organization ID: {organization.id}</p>
        )}
        <div className="mt-6 flex gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="apple-card px-6 py-4 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">{stat.label}</p>
              <p className="text-2xl font-semibold tracking-tight text-ink">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 inline-flex gap-1 rounded-xl border border-muted-light bg-base p-1">
          <button
            onClick={() => setActiveTab("teams")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === "teams" ? "bg-[#1d1d1f] text-white" : "text-ink-secondary hover:text-ink"
            }`}
          >
            Teams
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === "members" ? "bg-[#1d1d1f] text-white" : "text-ink-secondary hover:text-ink"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === "invites" ? "bg-[#1d1d1f] text-white" : "text-ink-secondary hover:text-ink"
            }`}
          >
            Invitations
          </button>
          {canManage && (
            <button
              onClick={() => setActiveTab("roles")}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "roles" ? "bg-[#1d1d1f] text-white" : "text-ink-secondary hover:text-ink"
              }`}
            >
              Roles & Permissions
            </button>
          )}
        </div>
      </header>

      {activeTab === "teams" && (
        <section className="apple-card space-y-6 p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted">Create Team</label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name..."
                className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={!canManage}
              />
            </div>
            <button
              onClick={handleCreateTeam}
              disabled={!teamName.trim() || !canManage || teamLoading}
              className="apple-button w-full px-6 py-4 text-base font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {teamLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Creating...
                </span>
              ) : (
                "Create Team"
              )}
            </button>
          </div>
          {teamError && <p className="text-sm text-red-500">{teamError}</p>}

          {teams.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/10 px-6 py-10 text-center text-muted">
              No teams yet. Create your first team to group operators.
            </p>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <motion.div
                  key={team.id}
                  layout
                  className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-inner"
                >
                  <div>
                    <p className="text-lg font-semibold text-ink">{team.name}</p>
                    <p className="text-sm text-muted">{team.members?.length ?? 0} members</p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => deleteTeam(team.id)}
                      className="rounded-2xl border-2 border-ink/30 bg-white px-3 py-2 text-ink shadow-sm transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "members" && (
        <section className="apple-card space-y-6 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Team Management</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Organization Members</h2>
              <p className="text-sm text-muted">Manage team assignments for existing members</p>
            </div>
          </div>

          {/* Manual User Creation Section */}
          {canManage && (
            <div className="rounded-2xl border-2 border-[#007AFF]/30 bg-white/90 p-6 space-y-4 shadow-subtle">
              <div>
                <h3 className="text-lg font-semibold text-ink">Add User Manually</h3>
                <p className="text-sm text-muted">Create a user account directly without invitation</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-muted">Email</label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted">Display Name</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted">Role</label>
                  <select
                    value={manualRole}
                    onChange={(e) => setManualRole(e.target.value as UserRole)}
                    className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="OPERATOR">Operator</option>
                    <option value="LEAD">Lead</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted">Temporary Password</label>
                  <input
                    type="password"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="User will change on first login"
                    className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-muted mb-2">Assign to Teams</label>
                <div className="flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <label key={team.id} className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 py-2 cursor-pointer hover:border-accent">
                      <input
                        type="checkbox"
                        checked={manualTeamIds.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setManualTeamIds([...manualTeamIds, team.id]);
                          } else {
                            setManualTeamIds(manualTeamIds.filter((id) => id !== team.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-ink/20 text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-ink">{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button
                onClick={async () => {
                  if (!manualEmail.trim() || !manualName.trim() || !manualPassword.trim() || !profile?.organizationId) {
                    return;
                  }
                  setCreatingUser(true);
                  try {
                    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
                    const { doc, setDoc } = await import("firebase/firestore");
                    const { auth, db } = await import("@/lib/firebase");
                    
                    const credential = await createUserWithEmailAndPassword(auth, manualEmail.trim().toLowerCase(), manualPassword);
                    await updateProfile(credential.user, { displayName: manualName.trim() });
                    
                    await setDoc(doc(db, "users", credential.user.uid), {
                      uid: credential.user.uid,
                      email: credential.user.email,
                      displayName: manualName.trim(),
                      avatarUrl: "",
                      organizationId: profile.organizationId,
                      teamIds: manualTeamIds,
                      role: manualRole,
                    });
                    
                    setManualEmail("");
                    setManualName("");
                    setManualPassword("");
                    setManualTeamIds([]);
                    setManualRole("OPERATOR");
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setCreatingUser(false);
                  }
                }}
                disabled={!manualEmail.trim() || !manualName.trim() || !manualPassword.trim() || creatingUser}
                className="apple-button mt-4 w-full px-6 py-4 text-base font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingUser ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Creating User...
                  </span>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          )}

          {usersError && <p className="text-sm text-red-500">{usersError.message}</p>}

          {usersLoading ? (
            <div className="rounded-2xl border border-dashed border-ink/10 px-6 py-10 text-center text-muted">
              Loading members...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/10 px-6 py-10 text-center text-muted">
              No members in this organization yet.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const userTeams = teams.filter((team) => user.teamIds?.includes(team.id));
                const availableTeams = teams.filter((team) => !user.teamIds?.includes(team.id));

                return (
                  <motion.div
                    key={user.uid}
                    layout
                    className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-inner"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-ink">
                            {user.displayName || user.email}
                          </h3>
                          {canManage ? (
                            <select
                              value={user.role || "OPERATOR"}
                              onChange={async (e) => {
                                const newRole = e.target.value as UserRole;
                                try {
                                  const { doc, updateDoc } = await import("firebase/firestore");
                                  const { db } = await import("@/lib/firebase");
                                  await updateDoc(doc(db, "users", user.uid), { role: newRole });
                                } catch (err) {
                                  console.error("Failed to update user role", err);
                                }
                              }}
                              className="rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#007AFF] border border-[#007AFF]/20 outline-none focus:border-[#007AFF] cursor-pointer"
                            >
                              <option value="OPERATOR">OPERATOR</option>
                              <option value="LEAD">LEAD</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span className="rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#007AFF]">
                              {user.role || "OPERATOR"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted">{user.email}</p>

                        {userTeams.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                              Current Teams
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {userTeams.map((team) => (
                                <div
                                  key={team.id}
                                  className="flex items-center gap-2 rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 px-3 py-1.5"
                                >
                                  <span className="text-sm font-semibold text-ink">{team.name}</span>
                                  {canManage && (
                                    <button
                                      onClick={() => handleRemoveFromTeam(user.uid, team.id)}
                                      disabled={managingUserId === user.uid}
                                      className="rounded-full p-0.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                      title="Remove from team"
                                    >
                                      <UserMinus className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {canManage && availableTeams.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                              Add to Team
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {availableTeams.map((team) => (
                                <button
                                  key={team.id}
                                  onClick={() => handleAddToTeam(user.uid, team.id)}
                                  disabled={managingUserId === user.uid}
                                  className="inline-flex items-center gap-1.5 rounded-2xl border border-[#1D1D1F]/20 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-all hover:border-[#007AFF] hover:bg-[#007AFF]/10 disabled:opacity-50"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  {team.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {canManage && availableTeams.length === 0 && userTeams.length > 0 && (
                          <p className="mt-4 text-xs text-muted">User is in all available teams</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "invites" && (
        <section className="apple-card space-y-6 p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted">Invite by Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@company.com"
                className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={!canManage}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted">Assign to Team (optional)</label>
              <select
                value={inviteTeamId || ""}
                onChange={(e) => setInviteTeamId(e.target.value || undefined)}
                className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={!canManage}
              >
                <option value="">No specific team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="mt-2 w-full rounded-xl border border-muted-light bg-base px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={!canManage}
              >
                <option value="OPERATOR">Operator</option>
                <option value="LEAD">Lead</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              onClick={handleSendInvite}
              disabled={!inviteEmail.trim() || !canManage || inviteLoading}
              className="apple-button w-full px-6 py-3 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {inviteLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
          {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}

          {invites.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/10 px-6 py-10 text-center text-muted">
              No invites sent yet. Invite teammates to collaborate.
            </p>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => {
                const teamLabel = invite.teamId ? teams.find((t) => t.id === invite.teamId)?.name : null;
                return (
                <motion.div
                  key={invite.id}
                  layout
                  className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-inner"
                >
                  <div>
                    <p className="text-lg font-semibold text-ink">{invite.email}</p>
                    <p className="text-sm text-muted">
                        {teamLabel ? `Team: ${teamLabel} · ` : ""}
                        Role: {invite.role || "OPERATOR"} · {invite.status} · {invite.createdAt?.toLocaleString() ?? "Pending"}
                    </p>
                  </div>
                  {invite.status === "PENDING" && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "roles" && canManage && (
        <section className="apple-card space-y-6 p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Role Management</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Roles & Permissions</h2>
            <p className="text-sm text-muted">Manage role definitions and permissions</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-red-100 p-2">
                  <Settings className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Admin</h3>
                  <p className="text-sm text-muted">Full access to all features and settings</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted">
                <p>✓ Manage organization settings</p>
                <p>✓ Create and manage processes</p>
                <p>✓ Assign tasks to users</p>
                <p>✓ Review flags and resolve issues</p>
                <p>✓ Manage teams and members</p>
                <p>✓ View analytics and reports</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Lead</h3>
                  <p className="text-sm text-muted">Can manage processes and teams, but limited org settings</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted">
                <p>✓ Create and manage processes</p>
                <p>✓ Assign tasks to users</p>
                <p>✓ Review flags and resolve issues</p>
                <p>✓ Manage teams and members</p>
                <p>✓ View analytics and reports</p>
                <p>✗ Organization settings (billing, etc.)</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-green-100 p-2">
                  <Settings className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Operator</h3>
                  <p className="text-sm text-muted">Can only view and complete assigned tasks</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted">
                <p>✓ View assigned tasks</p>
                <p>✓ Complete assigned tasks</p>
                <p>✓ View own history and progress</p>
                <p>✗ Create or manage processes</p>
                <p>✗ Assign tasks to others</p>
                <p>✗ Access management features</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

