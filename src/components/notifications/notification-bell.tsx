"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notification } from "@/types/schema";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Query without orderBy to avoid needing a composite index
    // We'll sort client-side instead
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          };
        }) as Notification[];
        
        // Sort by createdAt descending (newest first) and limit to 20
        const sorted = notifs
          .sort((a, b) => {
            const aTime = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
            return bTime - aTime; // Descending
          })
          .slice(0, 20);
        
        setNotifications(sorted);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        // Don't show error to user, just log it
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await updateDoc(doc(db, "notifications", notification.id), {
        isRead: true,
      });
    }
    setIsOpen(false);
    router.push(notification.link);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "ASSIGNMENT":
        return "📋";
      case "COMMENT":
        return "💬";
      case "MENTION":
        return "🔔";
      case "FLAG":
        return "🚩";
      case "COMPLETION":
        return "✅";
      default:
        return "📬";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${
                          !notification.isRead ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Trigger User Avatar */}
                          <div className="flex-shrink-0">
                            {notification.triggerBy?.avatar ? (
                              <img
                                src={notification.triggerBy.avatar}
                                alt={notification.triggerBy.name}
                                className="h-8 w-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold border border-slate-200">
                                {notification.triggerBy?.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? "text-slate-900" : "text-slate-700"
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-slate-500">
                                {notification.triggerBy?.name && `by ${notification.triggerBy.name}`}
                              </p>
                              <span className="text-xs text-slate-400">•</span>
                              <p className="text-xs text-slate-400">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

