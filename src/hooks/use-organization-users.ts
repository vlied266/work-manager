"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/workos";
import { useAuth } from "./use-auth";

export function useOrganizationUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!profile?.organizationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "users"),
      where("organizationId", "==", profile.organizationId),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUsers(
          snapshot.docs.map(
            (docSnap) =>
              ({
                uid: docSnap.id,
                ...(docSnap.data() as UserProfile),
              }) satisfies UserProfile,
          ),
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load organization users", err);
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [profile?.organizationId]);

  const addUserToTeam = async (userId: string, teamId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await userRef.get();
      const currentTeamIds = (userDoc.data() as UserProfile)?.teamIds || [];
      
      if (!currentTeamIds.includes(teamId)) {
        await updateDoc(userRef, {
          teamIds: arrayUnion(teamId),
        });

        const teamRef = doc(db, "teams", teamId);
        await updateDoc(teamRef, {
          members: arrayUnion(userId),
        });
      }
      setError(null);
    } catch (err) {
      console.error("Failed to add user to team", err);
      setError(err as Error);
    }
  };

  const removeUserFromTeam = async (userId: string, teamId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        teamIds: arrayRemove(teamId),
      });

      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, {
        members: arrayRemove(userId),
      });
      setError(null);
    } catch (err) {
      console.error("Failed to remove user from team", err);
      setError(err as Error);
    }
  };

  return { users, loading, error, addUserToTeam, removeUserFromTeam };
}

