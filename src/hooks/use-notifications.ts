"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NotificationItem } from "@/types/workos";
import { useAuth } from "./use-auth";

export function useNotifications() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setTimeout(() => {
        setNotifications([]);
        setLoading(false);
      }, 0);
      return;
    }
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setNotifications(
          snapshot.docs.map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...(docSnap.data() as NotificationItem),
              }) satisfies NotificationItem,
          ),
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [firebaseUser]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const markAllRead = async () => {
    await Promise.all(notifications.filter((n) => !n.read).map((n) => markAsRead(n.id)));
  };

  return { notifications, unreadCount, loading, error, markAsRead, markAllRead };
}

