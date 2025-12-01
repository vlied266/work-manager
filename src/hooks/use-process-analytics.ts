"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun } from "@/types/workos";
import { useAuth } from "./use-auth";

export interface ProcessMetric {
  processName: string;
  runs: number;
  completed: number;
  flagged: number;
}

export function useProcessAnalytics() {
  const { profile } = useAuth();
  const [runs, setRuns] = useState<ActiveRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.organizationId) {
      setTimeout(() => {
        setRuns([]);
        setLoading(false);
      }, 0);
      return;
    }
    const q = query(collection(db, "active_runs"), where("organizationId", "==", profile.organizationId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRuns(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as ActiveRun) })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [profile?.organizationId]);

  const metrics = useMemo<ProcessMetric[]>(() => {
    const grouped = new Map<string, ProcessMetric>();
    runs.forEach((run) => {
      const key = run.processName || run.procedureName || "Ad-hoc";
      if (!grouped.has(key)) {
        grouped.set(key, { processName: key, runs: 0, completed: 0, flagged: 0 });
      }
      const bucket = grouped.get(key)!;
      bucket.runs += 1;
      if (run.status === "COMPLETED") bucket.completed += 1;
      if (run.logs?.some((log) => log.outcome === "FLAGGED")) bucket.flagged += 1;
    });
    return Array.from(grouped.values());
  }, [runs]);

  return { metrics, loading, error };
}

