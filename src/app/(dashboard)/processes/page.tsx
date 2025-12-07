"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessGroup, Procedure, Organization } from "@/types/schema";
import { 
  FolderOpen, Edit, Play, Users, User, Search, 
  BookOpen, FileText, CheckCircle2, Clock, X, Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { checkUsageLimit, getPlanLimits } from "@/lib/billing/limits";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function LibraryPage() {
  const router = useRouter();
  const { organizationId, userProfile } = useOrganization();
  const [activeTab, setActiveTab] = useState<"procedures" | "processes">("procedures");
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [processGroups, setProcessGroups] = useState<ProcessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startingRun, setStartingRun] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ type: "procedure" | "process"; id: string; title: string } | null>(null);
  const [assigneeType, setAssigneeType] = useState<"USER" | "TEAM">("USER");
  const [assigneeId, setAssigneeId] = useState("");
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    resource: "users" | "activeRuns" | "aiGenerations";
  }>({ isOpen: false, resource: "activeRuns" });

  // Fetch Procedures
  useEffect(() => {
    const q = query(
      collection(db, "procedures"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const procs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          steps: doc.data().steps || [],
        })) as Procedure[];
        procs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setProcedures(procs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching procedures:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  // Fetch Process Groups
  useEffect(() => {
    const q = query(
      collection(db, "process_groups"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          procedureSequence: doc.data().procedureSequence || [],
          isActive: doc.data().isActive !== undefined ? doc.data().isActive : true,
        })) as ProcessGroup[];
        groups.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setProcessGroups(groups);
      },
      (error) => {
        console.error("Error fetching process groups:", error);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  // Get procedure count for a process group
  const getProcedureCount = (groupId: string): number => {
    const group = processGroups.find(g => g.id === groupId);
    if (!group) return 0;
    
    // Count procedures in procedureSequence
    const count = group.procedureSequence?.length || 0;
    
    // Also check legacy processGroupId links
    const legacyCount = procedures.filter(p => p.processGroupId === groupId).length;
    
    return Math.max(count, legacyCount);
  };

  // Get procedures for a process group
  const getProceduresForGroup = (groupId: string): Procedure[] => {
    const group = processGroups.find(g => g.id === groupId);
    if (!group) return [];
    
    // Get procedures by IDs from procedureSequence
    const procsById = procedures.filter(p => 
      group.procedureSequence?.includes(p.id)
    );
    
    // Also include legacy procedures
    const legacyProcs = procedures.filter(p => p.processGroupId === groupId);
    
    // Combine and deduplicate
    const allProcs = [...procsById, ...legacyProcs.filter(p => !procsById.find(ep => ep.id === p.id))];
    
    return allProcs;
  };

  // Filter procedures/processes by search query
  const filteredProcedures = procedures.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProcessGroups = processGroups.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!assignModal || !assigneeId.trim()) {
      alert("Please select an assignee.");
      return;
    }

    try {
      if (assignModal.type === "procedure") {
        await updateDoc(doc(db, "procedures", assignModal.id), {
          defaultAssignee: {
            type: assigneeType,
            id: assigneeId,
          },
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, "process_groups", assignModal.id), {
          defaultAssignee: {
            type: assigneeType,
            id: assigneeId,
          },
          updatedAt: serverTimestamp(),
        });
      }
      
      alert("Assignment saved successfully!");
      setAssignModal(null);
      setAssigneeId("");
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Failed to save assignment. Please try again.");
    }
  };

  const handleStartProcedure = async (procedureId: string, procedureTitle: string) => {
    if (!organizationId || !userProfile?.uid) {
      alert("Please log in to start a procedure.");
      return;
    }

    try {
      setStartingRun(procedureId);

      // Check usage limit for active runs
      const { getDoc } = await import("firebase/firestore");
      const orgDoc = await getDoc(doc(db, "organizations", organizationId));
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        const organization = {
          id: orgDoc.id,
          name: orgData.name || "",
          plan: orgData.plan || "FREE",
          subscriptionStatus: orgData.subscriptionStatus || "active",
          limits: orgData.limits || getPlanLimits(orgData.plan || "FREE"),
          createdAt: orgData.createdAt?.toDate() || new Date(),
        } as Organization;
        
        const limitCheck = await checkUsageLimit(organization, "activeRuns");
        if (!limitCheck.allowed) {
          setUpgradeModal({ isOpen: true, resource: "activeRuns" });
          setStartingRun(null);
          return;
        }
      }

      // Call the new API
      const response = await fetch("/api/runs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId,
          orgId: organizationId,
          starterUserId: userProfile.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start procedure");
      }

      const result = await response.json();

      // Handle redirect based on action
      if (result.action === "REDIRECT_TO_RUN") {
        router.push(`/run/${result.runId}`);
      } else if (result.action === "REDIRECT_TO_MONITOR") {
        // Show notification
        alert(result.message || "Process started! Task assigned to another user.");
        router.push("/monitor");
      } else {
        // Fallback
        router.push(`/run/${result.runId}`);
      }
    } catch (error: any) {
      console.error("Error starting procedure:", error);
      alert(error.message || "Failed to start procedure. Please try again.");
    } finally {
      setStartingRun(null);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || FolderOpen;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Library</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your procedures and processes (Templates)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("procedures")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "procedures"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="inline h-4 w-4 mr-2" />
          Procedures ({procedures.length})
        </button>
        <button
          onClick={() => setActiveTab("processes")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "processes"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FolderOpen className="inline h-4 w-4 mr-2" />
          Processes ({processGroups.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search procedures or processes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {/* Procedures Tab */}
      {activeTab === "procedures" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProcedures.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-12 text-center shadow-sm">
              <FileText className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No Procedures Found</h3>
              <p className="mt-2 text-sm text-slate-600">
                {searchQuery ? "Try a different search term" : "Create your first procedure in Studio"}
              </p>
            </div>
          ) : (
            filteredProcedures.map((procedure) => (
              <motion.div
                key={procedure.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{procedure.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {procedure.description || "No description"}
                    </p>
                  </div>
                  <span
                    className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${
                      procedure.isPublished
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {procedure.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
                  <FileText className="h-4 w-4" />
                  <span>{procedure.steps.length} {procedure.steps.length === 1 ? "step" : "steps"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/studio/procedure/${procedure.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => setAssignModal({ type: "procedure", id: procedure.id, title: procedure.title })}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Assign
                  </button>
                  <button
                    onClick={() => handleStartProcedure(procedure.id, procedure.title)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-slate-800"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Run
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Processes Tab */}
      {activeTab === "processes" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProcessGroups.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-12 text-center shadow-sm">
              <FolderOpen className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No Processes Found</h3>
              <p className="mt-2 text-sm text-slate-600">
                {searchQuery ? "Try a different search term" : "Create your first process in Studio"}
              </p>
            </div>
          ) : (
            filteredProcessGroups.map((group) => {
              const procedureCount = getProcedureCount(group.id);
              const IconComponent = getIconComponent(group.icon);

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                        <IconComponent className="h-6 w-6 text-slate-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {group.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${
                        group.isActive
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {group.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
                    <FileText className="h-4 w-4" />
                    <span>{procedureCount} {procedureCount === 1 ? "procedure" : "procedures"} inside</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/studio/process/${group.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => setAssignModal({ type: "process", id: group.id, title: group.title })}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Assign
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Assign {assignModal.type === "procedure" ? "Procedure" : "Process"}</h3>
              <button
                onClick={() => {
                  setAssignModal(null);
                  setAssigneeId("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Assign <strong>{assignModal.title}</strong> to a user or team.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign to
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssigneeType("USER")}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      assigneeType === "USER"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <User className="inline h-4 w-4 mr-2" />
                    User
                  </button>
                  <button
                    onClick={() => setAssigneeType("TEAM")}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      assigneeType === "TEAM"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Users className="inline h-4 w-4 mr-2" />
                    Team
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {assigneeType === "USER" ? "User ID" : "Team ID"}
                </label>
                <input
                  type="text"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  placeholder={assigneeType === "USER" ? "Enter user ID" : "Enter team ID"}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">
                  TODO: Replace with dropdown selector
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setAssignModal(null);
                    setAssigneeId("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, resource: "activeRuns" })}
        resource={upgradeModal.resource}
        currentPlan="FREE" // TODO: Get from organization
      />
    </div>
  );
}

