"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./use-auth";

import { UserRole } from "@/types/workos";

export interface Invite {
  id: string;
  email: string;
  invitedBy: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: Date | null;
  teamId?: string;
  role?: UserRole;
  organizationId: string;
}

export function useInvites() {
  const { profile, firebaseUser } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.organizationId) {
      return;
    }
    const q = query(
      collection(db, "organizations", profile.organizationId, "invites"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setInvites(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              email: data.email,
              invitedBy: data.invitedBy,
              status: data.status || "PENDING",
              createdAt: data.createdAt?.toDate?.() ?? null,
              teamId: data.teamId,
              role: data.role || "OPERATOR",
              organizationId: profile.organizationId,
            } satisfies Invite;
          }),
        );
      },
      (err) => {
        console.error(err);
        setError(err.message);
      },
    );
    return () => unsubscribe();
  }, [profile?.organizationId]);

  const sendInvite = async (email: string, teamId?: string, role?: UserRole) => {
    if (!profile?.organizationId || !firebaseUser) return;
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, "organizations", profile.organizationId, "invites"), {
        email,
        invitedBy: firebaseUser.uid,
        status: "PENDING",
        createdAt: serverTimestamp(),
        teamId: teamId || null,
        role: role || "OPERATOR",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { invites, loading, error, sendInvite };
}

