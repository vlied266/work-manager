"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Organization } from "@/types/workos";
import { useAuth } from "./use-auth";

export function useOrganization() {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.organizationId) {
      setTimeout(() => {
        setOrganization(null);
        setLoading(false);
      }, 0);
      return;
    }

    const ref = doc(db, "organizations", profile.organizationId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setOrganization({ id: snapshot.id, ...(snapshot.data() as Organization) });
        } else {
          setOrganization(null);
        }
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

  return { organization, loading, error };
}

