"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Procedure } from "@/types/workos";

export function useProcedures(organizationId?: string) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProcedures([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "procedures"),
      where("organizationId", "==", organizationId),
      orderBy("updatedAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setProcedures(
          snapshot.docs.map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...(docSnap.data() as Procedure),
              }) satisfies Procedure,
          ),
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load procedures", err);
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [organizationId]);

  return { procedures, loading, error };
}

