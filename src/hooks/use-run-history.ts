"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun } from "@/types/workos";
import { useAuth } from "./use-auth";

export interface HistoryRun extends ActiveRun {
  id: string;
  startedAtCopy: string;
  latestLog?: {
    outcome: string;
    performedAt: string;
  };
}

const formatTs = (value?: Timestamp | Date) => {
  if (!value) return "—";
  const date = value instanceof Timestamp ? value.toDate() : value;
  return date.toLocaleString();
};

export function useRunHistory() {
  const { profile } = useAuth();
  const [runs, setRuns] = useState<HistoryRun[]>([]);
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

    const q = query(
      collection(db, "active_runs"),
      where("organizationId", "==", profile.organizationId),
      orderBy("startedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const decorated = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as ActiveRun;
          const latest = data.logs?.at(-1);
          return {
            id: docSnap.id,
            ...data,
            startedAtCopy: formatTs(data.startedAt as Timestamp),
            latestLog: latest
              ? {
                  outcome: latest.outcome,
                  performedAt: formatTs(latest.performedAt as Timestamp),
                }
              : undefined,
          } satisfies HistoryRun;
        });
        setRuns(decorated);
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

  const stats = useMemo(() => {
    const flagged = runs.filter((run) => run.logs?.some((log) => log.outcome === "FLAGGED")).length;
    const completed = runs.filter((run) => run.status === "COMPLETED").length;
    return { total: runs.length, flagged, completed };
  }, [runs]);

  return { runs, stats, loading, error };
}

