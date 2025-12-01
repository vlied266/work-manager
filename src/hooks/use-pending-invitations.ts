"use client";

import { useEffect, useState } from "react";
import {
  arrayUnion,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./use-auth";

import { UserRole } from "@/types/workos";

interface PendingInvite {
  id: string;
  path: string;
  organizationId: string;
  teamId?: string;
  role?: UserRole;
  createdAt: Date | null;
}

export function usePendingInvitations() {
  const { firebaseUser } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser?.email) {
      setTimeout(() => {
        setInvites([]);
        setLoading(false);
      }, 0);
      return;
    }

    const q = collectionGroup(db, "invites");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matching = snapshot.docs
          .filter((docSnap) => docSnap.data().email === firebaseUser.email && docSnap.data().status === "PENDING")
          .map((docSnap) => {
            const data = docSnap.data();
            const segments = docSnap.ref.path.split("/");
            const orgIndex = segments.indexOf("organizations");
            const organizationId = orgIndex >= 0 ? segments[orgIndex + 1] : "";
            return {
              id: docSnap.id,
              path: docSnap.ref.path,
              organizationId,
              teamId: data.teamId || undefined,
              role: data.role || "OPERATOR",
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
            } satisfies PendingInvite;
          });
        setInvites(matching);
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
  }, [firebaseUser?.email]);

  const acceptInvite = async (invite: PendingInvite) => {
    if (!firebaseUser) return;

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    const currentTeams = new Set<string>(userData.teamIds || []);
    if (invite.teamId) {
      currentTeams.add(invite.teamId);
      const teamRef = doc(db, "teams", invite.teamId);
      await updateDoc(teamRef, {
        members: arrayUnion(firebaseUser.uid),
      });
    }

    await updateDoc(userRef, {
      organizationId: invite.organizationId,
      teamIds: Array.from(currentTeams),
      role: invite.role || userData.role || "OPERATOR",
    });

    await updateDoc(doc(db, invite.path), {
      status: "ACCEPTED",
      acceptedBy: firebaseUser.uid,
      acceptedAt: Timestamp.now(),
    });
  };

  return { invites, loading, error, acceptInvite };
}

