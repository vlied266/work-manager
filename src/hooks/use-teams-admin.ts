"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team } from "@/types/workos";
import { useAuth } from "./use-auth";

export function useTeamsAdmin() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.organizationId) {
      return;
    }
    const q = query(collection(db, "teams"), where("organizationId", "==", profile.organizationId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTeams(
          snapshot.docs.map(
            (snap) =>
              ({
                id: snap.id,
                ...(snap.data() as Team),
              }) satisfies Team,
          ),
        );
      },
      (err) => {
        console.error(err);
        setError(err.message);
      },
    );
    return () => unsubscribe();
  }, [profile?.organizationId]);

  const createTeam = async (name: string) => {
    if (!profile?.organizationId) return;
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, "teams"), {
        organizationId: profile.organizationId,
        name,
        members: [],
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "teams", teamId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { teams, loading, error, createTeam, deleteTeam };
}

