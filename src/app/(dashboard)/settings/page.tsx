"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, UserPlus, Users, Building2, CheckCircle2, XCircle } from "lucide-react";
import { Team, UserProfile, Organization } from "@/types/schema";
import { checkUsageLimit, getPlanLimits } from "@/lib/billing/limits";
import { UpgradeModal } from "@/components/billing/upgrade-modal";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"teams" | "users" | "roles">("teams");
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context

  // Form states
  const [teamName, setTeamName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userRole, setUserRole] = useState<"ADMIN" | "OPERATOR">("OPERATOR");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    resource: "users" | "activeRuns" | "aiGenerations";
  }>({ isOpen: false, resource: "users" });

  useEffect(() => {
    // Fetch teams
    const teamsQuery = query(
      collection(db, "teams"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribeTeams = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const teamsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Team[];
        setTeams(teamsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching teams:", error);
        setLoading(false);
      }
    );

    // Fetch users
    const usersQuery = query(
      collection(db, "users"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            teamIds: data.teamIds || [],
          };
        }) as UserProfile[];
        setUsers(usersData);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );

    return () => {
      unsubscribeTeams();
      unsubscribeUsers();
    };
  }, [organizationId]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const { addDoc, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "teams"), {
        name: teamName.trim(),
        organizationId,
        createdAt: serverTimestamp(),
      });
      setTeamName("");
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"?`)) return;
    try {
      await deleteDoc(doc(db, "teams", teamId));
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Failed to delete team");
    }
  };

  const handleInviteUser = async () => {
    if (!userEmail.trim() || !userDisplayName.trim()) return;
    
    // Check usage limit
    if (organization) {
      const limitCheck = await checkUsageLimit(organization, "users");
      if (!limitCheck.allowed) {
        setUpgradeModal({ isOpen: true, resource: "users" });
        return;
      }
    }
    
    setCreating(true);
    try {
      const { addDoc, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "users"), {
        email: userEmail.trim(),
        displayName: userDisplayName.trim(),
        role: userRole,
        teamIds: selectedTeamIds,
        organizationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setUserEmail("");
      setUserDisplayName("");
      setUserRole("OPERATOR");
      setSelectedTeamIds([]);
    } catch (error) {
      console.error("Error inviting user:", error);
      alert("Failed to invite user");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Organization Settings</h1>
          <p className="mt-1 text-sm text-slate-600">Manage teams and users</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "general", label: "General", icon: Building2 },
              { id: "teams", label: "Teams", icon: Users },
              { id: "users", label: "Users", icon: UserPlus },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            {/* Create Team */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Team</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team name (e.g., Finance, HR)"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  onClick={handleCreateTeam}
                  disabled={!teamName.trim() || creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-slate-800 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>

            {/* Teams List */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900">Teams</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Name
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Created
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {teams.map((team) => (
                      <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">{team.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {team.createdAt.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {teams.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No teams created yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Invite User */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Invite User</h2>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={userDisplayName}
                      onChange={(e) => setUserDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="OPERATOR">Operator (Can only Run)</option>
                      <option value="ADMIN">Admin (Can Design)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Teams (optional)
                    </label>
                    <select
                      multiple
                      value={selectedTeamIds}
                      onChange={(e) =>
                        setSelectedTeamIds(
                          Array.from(e.target.selectedOptions, (option) => option.value)
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleInviteUser}
                  disabled={!userEmail.trim() || !userDisplayName.trim() || creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-slate-800 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  {creating ? "Inviting..." : "Invite User"}
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900">Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        User
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Role
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Teams
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt={user.displayName}
                                className="h-10 w-10 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-white border border-slate-200 ${
                                user.role === "ADMIN"
                                  ? "bg-blue-500"
                                  : user.role === "MANAGER"
                                  ? "bg-purple-500"
                                  : "bg-slate-500"
                              }`}
                              style={{ display: user.photoURL ? "none" : "flex" }}
                            >
                              {getInitials(user.displayName)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {user.displayName}
                              </p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                              {user.jobTitle && (
                                <p className="text-xs text-slate-400">{user.jobTitle}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.teamIds.length > 0 ? (
                              user.teamIds.map((teamId) => {
                                const team = teams.find((t) => t.id === teamId);
                                return team ? (
                                  <span
                                    key={teamId}
                                    className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                                  >
                                    {team.name}
                                  </span>
                                ) : null;
                              })
                            ) : (
                              <span className="text-xs text-slate-400">No teams</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.displayName)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No users invited yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {organization && (
        <UpgradeModal
          isOpen={upgradeModal.isOpen}
          onClose={() => setUpgradeModal({ isOpen: false, resource: "users" })}
          resource={upgradeModal.resource}
          currentPlan={organization.plan}
        />
      )}
    </div>
  );
}

