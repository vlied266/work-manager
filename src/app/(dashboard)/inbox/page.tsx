"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, CircleDot, ListChecks, UsersRound, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useInboxRuns } from "@/hooks/use-inbox-runs";
import { useNotifications } from "@/hooks/use-notifications";

const tabs = [
  { id: "mine", label: "My Tasks", icon: ListChecks },
  { id: "team", label: "Team Active Runs", icon: UsersRound },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function InboxPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"mine" | "team" | "completed">("mine");
  const { myTasks, teamRuns, completedTasks, loading } = useInboxRuns();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const reminder = notifications.find((note) => !note.read);

  const runs = activeTab === "mine" ? myTasks : activeTab === "team" ? teamRuns : completedTasks;

  const emptyState = useMemo(() => {
    if (loading) return "Loading tasks…";
    if (!runs.length) {
      if (activeTab === "mine") return "You have no tasks assigned right now.";
      if (activeTab === "team") return "Your team has no active runs.";
      if (activeTab === "completed") return "You have no completed tasks yet.";
    }
    return null;
  }, [activeTab, loading, runs.length]);

  return (
    <div className="space-y-6">
      {reminder && (
        <div className="apple-card flex items-center justify-between p-4">
          <div>
            <p className="font-semibold text-ink">{reminder.title}</p>
            <p className="text-sm text-ink-secondary">{reminder.body}</p>
          </div>
          <div className="flex gap-2">
            {reminder.actionLink && (
              <Link 
                href={reminder.actionLink} 
                className="rounded-xl border border-muted-light bg-base px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-base-secondary"
              >
                View
              </Link>
            )}
            <button
              onClick={() => markAsRead(reminder.id)}
              className="rounded-xl border border-muted-light bg-base px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-base-secondary"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <header>
        <h1 className="mb-2 text-4xl font-semibold tracking-tight text-ink">Tasks waiting on you</h1>
        <p className="text-base text-ink-secondary">
          {profile?.displayName
            ? `${profile.displayName}, stay focused on what needs your judgment.`
            : "Stay focused on what needs your judgment."}
        </p>
        {unreadCount > 0 && (
          <p className="mt-2 text-sm font-medium text-accent">{unreadCount} reminder(s) pending.</p>
        )}
        <div className="mt-6 inline-flex gap-1 rounded-xl border border-muted-light bg-base p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selected 
                    ? "bg-[#1d1d1f] text-white" 
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {emptyState ? (
        <div className="apple-card p-12 text-center">
          <p className="text-base text-muted">{emptyState}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {runs.map((run) => (
            <motion.article
              key={run.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="apple-card p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="mb-1 text-lg font-semibold text-ink">{run.procedureName}</h2>
                  <p className="text-sm text-ink-secondary">
                    {run.status === "COMPLETED" || run.isProcedureCompleted
                      ? "Completed"
                      : `Current Step · ${run.currentStep?.title || "N/A"}`}
                  </p>
                  {run.procedureAssignmentName && (
                    <p className="mt-1 text-xs text-muted">
                      Part of: {run.procedureAssignmentName}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      run.status === "IN_PROGRESS"
                        ? "bg-amber-100 text-amber-700"
                        : run.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <CircleDot className="h-3 w-3" />
                    {run.status.replace(/_/g, " ")}
                  </span>
                  {run.logs?.some((log) => log.outcome === "FLAGGED") && (
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                      Flagged
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-muted-light bg-base-secondary p-4">
                <p className="mb-1 text-xs font-medium text-muted">Assignment</p>
                <p className="text-sm text-ink-secondary">
                  {run.assignmentCopy}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">
                  Started {run.startedAtCopy}
                  <br />
                  Last activity {run.updatedAtCopy}
                </div>
                <Link
                  href={`/run/${run.runId}`}
                  className="apple-button inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white"
                >
                  {activeTab === "completed" ? "View Details" : "Open Runner"}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}

