"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProcessDefinition } from "@/types/workos";
import { useAuth } from "./use-auth";

export function useProcesses() {
  const { profile } = useAuth();
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.organizationId) {
      setTimeout(() => {
        setProcesses([]);
        setLoading(false);
      }, 0);
      return;
    }
    const q = query(
      collection(db, "processes"),
      where("organizationId", "==", profile.organizationId),
      orderBy("updatedAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setProcesses(
          snapshot.docs.map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...(docSnap.data() as ProcessDefinition),
              }) satisfies ProcessDefinition,
          ),
        );
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

  return { processes, loading, error };
}

