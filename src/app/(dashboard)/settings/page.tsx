"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, UserPlus, Users, Building2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Team, UserProfile, Organization } from "@/types/schema";
import { useOrgQuery, useOrgId, useOrgDataCreator } from "@/hooks/useOrgData";
import { checkUsageLimit, getPlanLimits } from "@/lib/billing/limits";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { GeneralTab } from "@/components/settings/GeneralTab";
import { InviteUserForm } from "@/components/settings/InviteUserForm";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";

// Prevent SSR/prerendering - this page requires client-side auth
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "teams" | "users" | "integrations">("general");
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use organization-scoped hooks
  const organizationId = useOrgId();
  const orgDataCreator = useOrgDataCreator();
  const teamsQuery = useOrgQuery("teams");
  const usersQuery = useOrgQuery("users");

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
    if (!organizationId) {
      setLoading(false);
      setTeams([]);
      setUsers([]);
      return;
    }

    if (!teamsQuery || !usersQuery) {
      setLoading(true);
      return;
    }

    setLoading(true);
    let teamsLoaded = false;
    let usersLoaded = false;
    let initialLoadComplete = false;

    const finishInitialLoad = () => {
      if (!initialLoadComplete && teamsLoaded && usersLoaded) {
        initialLoadComplete = true;
        setLoading(false);
      }
    };

    // Fetch teams
    const unsubscribeTeams = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const teamsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Team[];
        setTeams(teamsData);
        teamsLoaded = true;
        finishInitialLoad();
      },
      (error) => {
        console.error("Error fetching teams:", error);
        setLoading(false);
      }
    );

    // Fetch users
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
        usersLoaded = true;
        finishInitialLoad();
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeTeams();
      unsubscribeUsers();
    };
  }, [organizationId, teamsQuery, usersQuery]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Organization Settings</h1>
            <p className="mt-2 text-sm text-slate-600 font-medium">Manage teams and users</p>
          </div>

          {/* macOS System Settings Style Layout */}
          <div className="grid grid-cols-[240px_1fr] gap-8">
            {/* Sidebar Navigation */}
            <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 h-fit">
              <nav className="space-y-1">
                {[
                  { id: "general", label: "General", icon: Building2 },
                  { id: "teams", label: "Teams", icon: Users },
                  { id: "users", label: "Users", icon: UserPlus },
                  { id: "integrations", label: "Integrations", icon: Zap },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                        activeTab === tab.id
                          ? "bg-white shadow-md text-slate-900"
                          : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8">

              {/* Tab Content */}
              {activeTab === "general" && <GeneralTab />}

              {activeTab === "integrations" && <IntegrationsTab />}

              {activeTab === "teams" && (
                <div className="space-y-8">
                  {/* Create Team */}
                  <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-6">
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mb-6">Create Team</h2>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Team name (e.g., Finance, HR)"
                        className="flex-1 rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        onClick={handleCreateTeam}
                        disabled={!teamName.trim() || creating}
                        className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        {creating ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </div>

                  {/* Teams List - Airtable Style */}
                  <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 overflow-hidden">
                    <div className="border-b border-slate-100 bg-white/50 p-6">
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Teams</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/50">
                            <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Name
                            </th>
                            <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Created
                            </th>
                            <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams.map((team, index) => (
                            <tr key={team.id} className={`transition-colors ${index % 2 === 0 ? "bg-white/50" : "bg-white/30"} hover:bg-white/70`}>
                              <td className="px-8 py-5">
                                <span className="text-sm font-bold text-slate-900">{team.name}</span>
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-sm text-slate-700 font-medium">
                                  {team.createdAt.toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <button
                                  onClick={() => handleDeleteTeam(team.id, team.name)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-50 hover:shadow-md"
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
                        <div className="p-12 text-center">
                          <div className="relative mb-4 inline-block">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
                            <div className="relative h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                              <Users className="h-8 w-8 text-slate-400" />
                            </div>
                          </div>
                          <p className="text-sm font-extrabold text-slate-900">No teams created yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-8">
                  {/* Invite User */}
                  <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-6">
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mb-6">Invite User</h2>
                    <InviteUserForm />
                  </div>

                  {/* Users List - Airtable Style */}
                  <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 overflow-hidden">
                    <div className="border-b border-slate-100 bg-white/50 p-6">
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/50">
                            <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              User
                            </th>
                            <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Role
                            </th>
                            <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Teams
                            </th>
                            <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user, index) => (
                            <tr key={user.id} className={`transition-colors ${index % 2 === 0 ? "bg-white/50" : "bg-white/30"} hover:bg-white/70`}>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  {user.photoURL ? (
                                    <img
                                      src={user.photoURL}
                                      alt={user.displayName}
                                      className="h-12 w-12 rounded-full object-cover border-2 border-white/60 shadow-sm"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white/60 shadow-sm ${
                                      user.role === "ADMIN"
                                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                        : user.role === "MANAGER"
                                        ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                        : "bg-gradient-to-br from-slate-500 to-slate-600"
                                    }`}
                                    style={{ display: user.photoURL ? "none" : "flex" }}
                                  >
                                    {getInitials(user.displayName)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">
                                      {user.displayName}
                                    </p>
                                    <p className="text-xs text-slate-600 font-medium">{user.email}</p>
                                    {user.jobTitle && (
                                      <p className="text-xs text-slate-500 font-medium">{user.jobTitle}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-wrap gap-2">
                                  {user.teamIds.length > 0 ? (
                                    user.teamIds.map((teamId) => {
                                      const team = teams.find((t) => t.id === teamId);
                                      return team ? (
                                        <span
                                          key={teamId}
                                          className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                                        >
                                          {team.name}
                                        </span>
                                      ) : null;
                                    })
                                  ) : (
                                    <span className="text-xs text-slate-400 font-medium">No teams</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.displayName)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-50 hover:shadow-md"
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
                        <div className="p-12 text-center">
                          <div className="relative mb-4 inline-block">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
                            <div className="relative h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                              <UserPlus className="h-8 w-8 text-slate-400" />
                            </div>
                          </div>
                          <p className="text-sm font-extrabold text-slate-900">No users invited yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
    </div>
  );
}

