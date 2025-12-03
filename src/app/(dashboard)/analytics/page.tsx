"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun } from "@/types/schema";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const COLORS = {
  completed: "#10b981", // green
  flagged: "#ef4444", // rose
  inProgress: "#3b82f6", // blue
};

export default function AnalyticsPage() {
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context

  useEffect(() => {
    const q = query(
      collection(db, "active_runs"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const runs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            logs: (data.logs || []).map((log: any) => ({
              ...log,
              timestamp: log.timestamp?.toDate() || new Date(),
            })),
          } as ActiveRun;
        });
        setActiveRuns(runs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching runs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  // Calculate tasks completed per day (last 7 days)
  const tasksPerDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last7Days.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const completed = activeRuns.filter((run) => {
        if (run.status !== "COMPLETED" || !run.completedAt) return false;
        const completedDate = run.completedAt;
        return completedDate >= date && completedDate < nextDay;
      }).length;

      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        completed,
      };
    });
  }, [activeRuns]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    const completed = activeRuns.filter((r) => r.status === "COMPLETED").length;
    const flagged = activeRuns.filter((r) => r.status === "FLAGGED").length;
    const inProgress = activeRuns.filter((r) => r.status === "IN_PROGRESS").length;

    return [
      { name: "Completed", value: completed, color: COLORS.completed },
      { name: "In Progress", value: inProgress, color: COLORS.inProgress },
      { name: "Flagged", value: flagged, color: COLORS.flagged },
    ];
  }, [activeRuns]);

  // Calculate top performers (users with most completed steps)
  const topPerformers = useMemo(() => {
    const userStats: Record<string, { name: string; completed: number; total: number }> = {};

    activeRuns.forEach((run) => {
      if (run.logs && Array.isArray(run.logs)) {
        run.logs.forEach((log) => {
          // For now, we'll use a placeholder user ID
          // In a real app, you'd get the actual user ID from the log
          const userId = "user-1"; // TODO: Get actual user ID from log
          if (!userStats[userId]) {
            userStats[userId] = { name: "User " + userId, completed: 0, total: 0 };
          }
          if (log.outcome === "SUCCESS") {
            userStats[userId].completed++;
          }
          userStats[userId].total++;
        });
      }
    });

    return Object.values(userStats)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5)
      .map((stat) => ({
        name: stat.name,
        completed: stat.completed,
        total: stat.total,
        percentage: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
      }));
  }, [activeRuns]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const total = activeRuns.length;
    const completed = activeRuns.filter((r) => r.status === "COMPLETED").length;
    const flagged = activeRuns.filter((r) => r.status === "FLAGGED").length;
    const inProgress = activeRuns.filter((r) => r.status === "IN_PROGRESS").length;

    return {
      total,
      completed,
      flagged,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [activeRuns]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Analytics & Insights</h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">Productivity metrics and performance data</p>
        </div>

        {/* Summary Metrics - Glass Widgets */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Runs</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{metrics.total}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg">
                <TrendingUp className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</p>
                <p className="mt-2 text-3xl font-extrabold text-green-900">{metrics.completed}</p>
                <p className="mt-1 text-xs text-slate-500 font-medium">{metrics.completionRate}% completion rate</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</p>
                <p className="mt-2 text-3xl font-extrabold text-blue-900">{metrics.inProgress}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <Clock className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flagged</p>
                <p className="mt-2 text-3xl font-extrabold text-rose-900">{metrics.flagged}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
                <AlertTriangle className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid - Glass Cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Bar Chart: Tasks Completed per Day */}
          <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Tasks Completed per Day</h2>
            <p className="mt-1 text-sm text-slate-600 font-medium">Last 7 days</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasksPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#1e293b", fontWeight: 600 }}
              />
              <Bar
                dataKey="completed"
                fill={COLORS.completed}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Status Distribution */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Status Distribution</h2>
            <p className="mt-1 text-sm text-slate-600 font-medium">Current run status breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-600">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Top Performers</h2>
            <p className="mt-1 text-sm text-slate-600 font-medium">Users with most completed steps</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {topPerformers.length === 0 ? (
          <div className="py-12 text-center">
            <div className="relative mb-4 inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-200/50 rounded-3xl blur-2xl" />
              <div className="relative h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
            </div>
            <p className="mt-4 text-sm font-extrabold text-slate-900">No data available</p>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Complete some tasks to see performance metrics
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div
                key={index}
                className={`flex items-center justify-between rounded-2xl p-5 transition-all ${
                  index % 2 === 0 ? "bg-white/50" : "bg-white/30"
                } hover:bg-white/70`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{performer.name}</p>
                    <p className="text-xs text-slate-600 font-medium">
                      {performer.completed} of {performer.total} completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-slate-900">{performer.percentage}%</p>
                  <p className="text-xs text-slate-500 font-medium">Success rate</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

