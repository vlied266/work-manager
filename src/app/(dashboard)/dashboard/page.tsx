"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ListChecks, 
  Clock, 
  CheckCircle2, 
  Flag, 
  ArrowRight,
  TrendingUp,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useInboxRuns } from "@/hooks/use-inbox-runs";
import { useNotifications } from "@/hooks/use-notifications";
import { useRunHistory } from "@/hooks/use-run-history";

export default function UserDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const { myTasks, teamRuns } = useInboxRuns();
  const { notifications } = useNotifications();
  const { runs: historyRuns } = useRunHistory();

  const stats = useMemo(() => {
    if (!profile) {
      return {
        pendingTasks: 0,
        teamActive: 0,
        myCompleted: 0,
        myFlagged: 0,
      };
    }
    const myCompleted = historyRuns.filter(
      (run) => run.status === "COMPLETED" && run.logs?.some((log) => log.performedBy === profile?.uid)
    ).length;

    const myFlagged = historyRuns.filter(
      (run) => run.logs?.some((log) => log.performedBy === profile?.uid && log.outcome === "FLAGGED")
    ).length;

    const pendingTasks = myTasks.length;
    const teamActive = teamRuns.length;

    return {
      pendingTasks,
      teamActive,
      myCompleted,
      myFlagged,
    };
  }, [myTasks, teamRuns, historyRuns, profile?.uid]);

  const recentTasks = useMemo(() => {
    return myTasks.slice(0, 5);
  }, [myTasks]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read).slice(0, 3);
  }, [notifications]);

  const statCards = [
    {
      label: "Pending Tasks",
      value: stats.pendingTasks,
      icon: ListChecks,
      color: "amber",
      href: "/inbox",
      linkText: "View tasks",
    },
    {
      label: "Team Active",
      value: stats.teamActive,
      icon: Clock,
      color: "blue",
      href: "/inbox?tab=team",
      linkText: "View team",
    },
    {
      label: "Completed",
      value: stats.myCompleted,
      icon: CheckCircle2,
      color: "emerald",
      href: "/history",
      linkText: "View history",
    },
    {
      label: "Flagged",
      value: stats.myFlagged,
      icon: Flag,
      color: "rose",
      href: profile?.role === "ADMIN" || profile?.role === "LEAD" ? "/flags" : "/history",
      linkText: profile?.role === "ADMIN" || profile?.role === "LEAD" ? "Review flags" : "View history",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="mb-2 text-4xl font-semibold tracking-tight text-ink">
          Welcome back, {profile?.displayName || "Operator"}
        </h1>
        <p className="text-base text-ink-secondary">
          {profile?.role === "OPERATOR" 
            ? "Here are your assigned tasks and progress."
            : "Here's what needs your attention today."}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const bgColor = {
            amber: "bg-amber-100",
            blue: "bg-blue-100",
            emerald: "bg-emerald-100",
            rose: "bg-rose-100",
          }[stat.color];
          const iconColor = {
            amber: "text-amber-600",
            blue: "text-blue-600",
            emerald: "text-emerald-600",
            rose: "text-rose-600",
          }[stat.color];

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="apple-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">{stat.label}</p>
                  <p className="text-3xl font-semibold tracking-tight text-ink">{stat.value}</p>
                </div>
                <div className={`rounded-xl ${bgColor} p-3`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </div>
              <Link
                href={stat.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                {stat.linkText} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <section className="apple-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-ink">Recent Tasks</p>
            </div>
            <Link
              href="/inbox"
              className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              View all
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-light px-6 py-12 text-center">
              <ListChecks className="mx-auto h-10 w-10 text-muted-light" />
              <p className="mt-4 text-sm text-muted">No pending tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/run/${task.id}`}
                  className="block rounded-xl border border-muted-light bg-base p-4 transition-all hover:border-accent/30 hover:bg-accent-light/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink">{task.procedureName}</h3>
                      <p className="mt-1 text-sm text-ink-secondary">
                        {task.currentStep?.title || "No current step"}
                      </p>
                      {task.currentStepIndex !== undefined && (
                        <p className="mt-2 text-xs text-muted">
                          Step {task.currentStepIndex + 1} of {task.procedureSnapshot?.steps.length || 0}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.hasFlaggedLog && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                          <Flag className="h-3 w-3" />
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          task.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Notifications */}
        <section className="apple-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-ink">Notifications</p>
            </div>
            <Link
              href="/notifications"
              className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              View all
            </Link>
          </div>

          {unreadNotifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-light px-6 py-12 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-light" />
              <p className="mt-4 text-sm text-muted">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unreadNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-xl border border-muted-light bg-base p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-accent-light p-2">
                      <Bell className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{notif.title}</p>
                      <p className="mt-1 text-sm text-ink-secondary">{notif.body}</p>
                      {notif.actionLink && (
                        <Link
                          href={notif.actionLink}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <section className="apple-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-accent" />
          <p className="text-sm font-semibold text-ink">Quick Actions</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/inbox"
            className="rounded-xl border border-muted-light bg-base px-6 py-4 text-center transition-all hover:border-accent/30 hover:bg-accent-light/30"
          >
            <ListChecks className="mx-auto h-6 w-6 text-ink" />
            <p className="mt-2 text-sm font-medium text-ink">View Inbox</p>
          </Link>
          <Link
            href="/history"
            className="rounded-xl border border-muted-light bg-base px-6 py-4 text-center transition-all hover:border-accent/30 hover:bg-accent-light/30"
          >
            <CheckCircle2 className="mx-auto h-6 w-6 text-ink" />
            <p className="mt-2 text-sm font-medium text-ink">Audit History</p>
          </Link>
          {(profile?.role === "ADMIN" || profile?.role === "LEAD") ? (
            <Link
              href="/flags"
              className="rounded-xl border border-muted-light bg-base px-6 py-4 text-center transition-all hover:border-accent/30 hover:bg-accent-light/30"
            >
              <Flag className="mx-auto h-6 w-6 text-ink" />
              <p className="mt-2 text-sm font-medium text-ink">Flag Review</p>
            </Link>
          ) : (
            <Link
              href="/profile"
              className="rounded-xl border border-muted-light bg-base px-6 py-4 text-center transition-all hover:border-accent/30 hover:bg-accent-light/30"
            >
              <CheckCircle2 className="mx-auto h-6 w-6 text-ink" />
              <p className="mt-2 text-sm font-medium text-ink">My Profile</p>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
