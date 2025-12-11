import { useEffect, useState, useMemo } from "react";
import { onSnapshot } from "firebase/firestore";
import { ActiveRun } from "@/types/schema";
import { useOrgQuery, useOrgId } from "@/hooks/useOrgData";
import { format } from "date-fns";
import { fetchCollectionsStats } from "@/lib/collections-stats";

export interface AnalyticsData {
  totalRuns: number;
  completed: number;
  successRate: number;
  activeNow: number;
  flagged: number;
  trendData: Array<{ date: string; count: number }>;
  bottleneckData: Array<{ name: string; avgTime: number; count: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
}

export function useAnalytics() {
  const [runs, setRuns] = useState<ActiveRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionsStats, setCollectionsStats] = useState<{ totalCollections: number; totalRecords: number } | null>(null);
  const orgId = useOrgId();

  const runsQuery = useOrgQuery("active_runs");

  // Fetch collections stats
  useEffect(() => {
    if (!orgId) return;
    fetchCollectionsStats(orgId).then((stats) => {
      setCollectionsStats(stats);
    });
  }, [orgId]);

  useEffect(() => {
    if (!runsQuery) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      runsQuery,
      (snapshot) => {
        const runsData = snapshot.docs.map((doc) => {
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
        setRuns(runsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching runs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [runsQuery]);

  const analytics = useMemo<AnalyticsData>(() => {
    // If no runs, use collections stats
    const useCollectionsStats = runs.length === 0 && collectionsStats && collectionsStats.totalRecords > 0;
    
    const totalRuns = useCollectionsStats ? collectionsStats!.totalRecords : runs.length;
    const completed = useCollectionsStats ? collectionsStats!.totalRecords : runs.filter((r) => r.status === "COMPLETED").length;
    const activeNow = useCollectionsStats ? 0 : runs.filter((r) => r.status === "IN_PROGRESS").length;
    const flagged = useCollectionsStats ? 0 : runs.filter((r) => r.status === "FLAGGED").length;
    const successRate = useCollectionsStats ? 100 : (totalRuns > 0 ? (completed / totalRuns) * 100 : 0);

    // Trend Data: Last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const trendData = last30Days.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = runs.filter((run) => {
        if (run.status !== "COMPLETED" || !run.completedAt) return false;
        const completedDate = run.completedAt;
        return completedDate >= date && completedDate < nextDay;
      }).length;

      return {
        date: format(date, "MM/dd"),
        count,
      };
    });

    // Bottleneck Data: Group by procedureTitle, calculate average duration
    const procedureStats: Record<
      string,
      { totalDuration: number; count: number; name: string }
    > = {};

    runs
      .filter((r) => r.status === "COMPLETED" && r.completedAt && r.startedAt)
      .forEach((run) => {
        const procedureName = run.procedureTitle || "Unknown Procedure";
        const duration =
          (run.completedAt!.getTime() - run.startedAt.getTime()) / (1000 * 60); // Duration in minutes

        if (!procedureStats[procedureName]) {
          procedureStats[procedureName] = {
            totalDuration: 0,
            count: 0,
            name: procedureName,
          };
        }

        procedureStats[procedureName].totalDuration += duration;
        procedureStats[procedureName].count += 1;
      });

    const bottleneckData = Object.values(procedureStats)
      .map((stat) => ({
        name: stat.name,
        avgTime: stat.count > 0 ? stat.totalDuration / stat.count : 0,
        count: stat.count,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10); // Top 10

    // Status Distribution
    const statusDistribution = [
      {
        name: "Completed",
        value: completed,
        color: "#10b981", // green
      },
      {
        name: "In Progress",
        value: activeNow,
        color: "#3b82f6", // blue
      },
      {
        name: "Flagged",
        value: flagged,
        color: "#ef4444", // red
      },
    ];

    return {
      totalRuns,
      completed,
      successRate,
      activeNow,
      flagged,
      trendData,
      bottleneckData,
      statusDistribution,
    };
  }, [runs, collectionsStats]);

  return { analytics, loading };
}

