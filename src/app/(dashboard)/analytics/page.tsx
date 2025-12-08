"use client";

import { TrendingUp, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CompletionTrend } from "@/components/analytics/CompletionTrend";
import { BottleneckChart } from "@/components/analytics/BottleneckChart";
import { StatusPieChart } from "@/components/analytics/StatusPieChart";

// Prevent SSR/prerendering - this page requires client-side auth
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const { analytics, loading } = useAnalytics();

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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Analytics & Insights
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            Productivity metrics and performance data
          </p>
        </div>

        {/* Summary Cards (Top Row) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Total Runs */}
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Runs
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {analytics.totalRuns}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg">
                <TrendingUp className="h-7 w-7" />
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Success Rate
                </p>
                <p className="mt-2 text-3xl font-extrabold text-green-900">
                  {analytics.successRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  {analytics.completed} completed
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </div>
          </div>

          {/* Active Now */}
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Now
                </p>
                <p className="mt-2 text-3xl font-extrabold text-blue-900">
                  {analytics.activeNow}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <Clock className="h-7 w-7" />
              </div>
            </div>
          </div>

          {/* Flagged */}
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Flagged
                </p>
                <p className="mt-2 text-3xl font-extrabold text-rose-900">
                  {analytics.flagged}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
                <AlertTriangle className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left (Large): CompletionTrend */}
          <div className="lg:col-span-1 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                Productivity over time
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Completed tasks per day (last 30 days)
              </p>
            </div>
            <CompletionTrend data={analytics.trendData} />
          </div>

          {/* Right (Small): StatusPieChart */}
          <div className="lg:col-span-1 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                Current Load
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Status distribution
              </p>
            </div>
            <StatusPieChart data={analytics.statusDistribution} />
          </div>
        </div>

        {/* Bottom Row: BottleneckChart */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 hover:shadow-2xl transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Where are we slow?
            </h2>
            <p className="mt-1 text-sm text-slate-600 font-medium">
              Average completion time by procedure
            </p>
          </div>
          <BottleneckChart data={analytics.bottleneckData} />
        </div>
      </div>
    </div>
  );
}
