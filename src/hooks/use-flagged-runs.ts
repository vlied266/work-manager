"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun } from "@/types/workos";
import { useAuth } from "./use-auth";

export interface FlaggedRun extends ActiveRun {
  id: string;
  flaggedLogIndex: number;
}

export function useFlaggedRuns() {
  const { profile } = useAuth();
  const [runs, setRuns] = useState<FlaggedRun[]>([]);
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
        const flagged = snapshot.docs
          .map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...(docSnap.data() as ActiveRun),
              }) satisfies FlaggedRun,
          )
          .map((run) => ({
            ...run,
            flaggedLogIndex: run.logs?.findIndex((log) => log.outcome === "FLAGGED") ?? -1,
          }))
          .filter((run) => run.flaggedLogIndex >= 0);
        setRuns(flagged);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [profile?.organizationId]);

  const stats = useMemo(() => ({ total: runs.length }), [runs]);

  return { runs, stats, loading, error };
}

