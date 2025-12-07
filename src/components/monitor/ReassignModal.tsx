"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/schema";
import { X, Loader2, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgQuery } from "@/hooks/useOrgData";
import { onSnapshot } from "firebase/firestore";
// Using alert for now - can be replaced with toast library if needed

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  runId: string;
  currentAssignee?: string; // Email of current assignee
  onReassigned?: () => void; // Callback after successful reassignment
}

export function ReassignModal({
  isOpen,
  onClose,
  runId,
  currentAssignee,
  onReassigned,
}: ReassignModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reassigning, setReassigning] = useState(false);

  // Fetch organization users
  const usersQuery = useOrgQuery("users");

  useEffect(() => {
    if (!usersQuery) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
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
          } as UserProfile;
        });
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [usersQuery]);

  const handleReassign = async () => {
    if (!selectedEmail) {
      alert("Please select a user to reassign to");
      return;
    }

    if (selectedEmail === currentAssignee) {
      alert("Selected user is already the assignee");
      return;
    }

    setReassigning(true);
    try {
      const response = await fetch("/api/runs/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          newAssigneeEmail: selectedEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reassign task");
      }

      const result = await response.json();
      alert(result.message || "Task reassigned successfully");
      
      // Reset form
      setSelectedEmail("");
      
      // Call callback to refresh data
      if (onReassigned) {
        onReassigned();
      }
      
      // Close modal
      onClose();
    } catch (error: any) {
      console.error("Error reassigning task:", error);
      alert(error.message || "Failed to reassign task. Please try again.");
    } finally {
      setReassigning(false);
    }
  };

  // Filter out current assignee from the list
  const availableUsers = users.filter(
    (user) => user.email !== currentAssignee
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Reassign Task</h2>
                    <p className="text-xs text-slate-600">Transfer this task to another team member</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-600">Loading users...</span>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600">No other users available to assign</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Select New Assignee
                      </label>
                      <select
                        value={selectedEmail}
                        onChange={(e) => setSelectedEmail(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      >
                        <option value="">Choose a user...</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.email}>
                            {user.displayName} ({user.email})
                            {user.jobTitle ? ` - ${user.jobTitle}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentAssignee && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Current Assignee</p>
                        <p className="text-sm text-slate-700">{currentAssignee}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={onClose}
                  disabled={reassigning}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassign}
                  disabled={!selectedEmail || reassigning || loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reassigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reassigning...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Confirm Reassign
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

