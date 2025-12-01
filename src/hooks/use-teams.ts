"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team } from "@/types/workos";

export function useTeams(organizationId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizationId) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInternalLoading(true);
    const q = query(collection(db, "teams"), where("organizationId", "==", organizationId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTeams(
          snapshot.docs.map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...(docSnap.data() as Team),
              }) satisfies Team,
          ),
        );
        setInternalLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load teams", err);
        setError(err as Error);
        setInternalLoading(false);
      },
    );

    return () => unsubscribe();
  }, [organizationId]);

  return {
    teams,
    loading: organizationId ? internalLoading : false,
    error: organizationId ? error : null,
  };
}

