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

type CombinedNotification = SchemaNotification | (AlertNotification & { id: string; recipientId?: string; isRead?: boolean; type?: string; title?: string; triggerBy?: any });

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<CombinedNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { organizationId } = useOrganization();

  useEffect(() => {
    if (!userId) return;

    let schemaNotifications: CombinedNotification[] = [];
    let alertNotifications: CombinedNotification[] = [];

    const processSchemaNotification = (doc: any) => {
      const data = doc.data();
      let createdAt: Date;
      
      if (data.createdAt) {
        if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else if (typeof data.createdAt === 'number') {
          createdAt = new Date(data.createdAt);
        } else if (data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date();
        }
      } else {
        createdAt = new Date();
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      } as SchemaNotification;
    };

    const processAlertNotification = (doc: any) => {
      const data = doc.data();
      let createdAt: Date;
      
      if (data.createdAt) {
        if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else if (typeof data.createdAt === 'number') {
          createdAt = new Date(data.createdAt);
        } else if (data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date();
        }
      } else {
        createdAt = new Date();
      }
      
      return {
        id: doc.id,
        collectionName: data.collectionName,
        recordId: data.recordId,
        message: data.message,
        action: data.action,
        organizationId: data.organizationId,
        createdAt,
        read: data.read || false,
        // Add fields for display compatibility
        type: "ALERT",
        title: data.message || "Alert",
        isRead: data.read || false,
      } as CombinedNotification;
    };

    const updateNotifications = () => {
      const combined: CombinedNotification[] = [...schemaNotifications, ...alertNotifications];
      
      // Sort by createdAt descending (newest first) and limit to 20
      const sorted = combined
        .sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return bTime - aTime; // Descending
        })
        .slice(0, 20);
      
      setNotifications(sorted);
    };

    // Set up real-time listener for schema notifications
    const schemaUnsubscribe = onSnapshot(
      query(collection(db, "notifications"), where("recipientId", "==", userId)),
      (snapshot) => {
        schemaNotifications = snapshot.docs.map(processSchemaNotification);
        updateNotifications();
      },
      (error) => console.error("Error in schema notifications listener:", error)
    );

    // Set up real-time listener for alert notifications
    const alertUnsubscribe = organizationId
      ? onSnapshot(
          query(
            collection(db, "_notifications"),
            where("organizationId", "==", organizationId),
            where("read", "==", false)
          ),
          (snapshot) => {
            alertNotifications = snapshot.docs.map(processAlertNotification);
            updateNotifications();
          },
          (error) => console.error("Error in alert notifications listener:", error)
        )
      : () => {};

    return () => {
      schemaUnsubscribe();
      alertUnsubscribe();
    };
  }, [userId, organizationId]);

  const unreadCount = notifications.filter((n) => {
    // Check both isRead (schema) and read (alert) fields
    return !(n.isRead || (n as any).read);
  }).length;

  const handleNotificationClick = async (notification: CombinedNotification) => {
    setIsOpen(false);

    // Check if it's an alert notification (has collectionName and recordId)
    if ('collectionName' in notification && 'recordId' in notification && notification.collectionName && notification.recordId) {
      // Mark as read
      if (!notification.read) {
        try {
          await updateDoc(doc(db, "_notifications", notification.id), {
            read: true,
          });
        } catch (error) {
          console.error("Error marking alert notification as read:", error);
        }
      }

      // Navigate to record detail page
      // First, we need to get the collectionId from collectionName
      try {
        if (organizationId) {
          const collectionsQuery = query(
            collection(db, "collections"),
            where("orgId", "==", organizationId),
            where("name", "==", notification.collectionName)
          );
          const collectionsSnapshot = await getDocs(collectionsQuery);
          
          if (!collectionsSnapshot.empty) {
            const collectionId = collectionsSnapshot.docs[0].id;
            router.push(`/data/${collectionId}/${notification.recordId}`);
          } else {
            console.error(`Collection "${notification.collectionName}" not found`);
            // Fallback: try to navigate to schema page
            router.push(`/data/schema`);
          }
        } else {
          console.error("Organization ID not available");
        }
      } catch (error) {
        console.error("Error navigating to record:", error);
      }
    } else {
      // Handle schema notifications (workflow notifications)
      const schemaNotif = notification as SchemaNotification;
      if (!schemaNotif.isRead) {
        try {
          await updateDoc(doc(db, "notifications", schemaNotif.id), {
            isRead: true,
          });
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }
      
      // Navigate using the link field if available
      if (schemaNotif.link) {
        router.push(schemaNotif.link);
      }
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    
    let date: Date;
    // Handle different timestamp formats
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
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

  const getNotificationIcon = (notification: CombinedNotification) => {
    // Check if it's an alert notification
    if ('collectionName' in notification && notification.collectionName) {
      return "🚨"; // Alert icon
    }
    
    // Schema notification types
    const type = (notification as SchemaNotification).type;
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
    <div className="relative z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors z-[9999]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white z-[10000]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible backdrop to close on outside click - doesn't affect visual appearance */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
              style={{ pointerEvents: 'auto' }}
            />
            {/* Dropdown - Highest z-index to appear above everything */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed right-4 top-20 w-96 rounded-xl border border-slate-200 bg-white shadow-2xl"
              style={{ 
                maxHeight: 'calc(100vh - 6rem)',
                zIndex: 9999,
                position: 'fixed'
              }}
              onClick={(e) => e.stopPropagation()}
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
                    {notifications.map((notification) => {
                      const isRead = notification.isRead || (notification as any).read || false;
                      const isAlert = 'collectionName' in notification && notification.collectionName;
                      const title = isAlert 
                        ? (notification as any).message || "Alert" 
                        : (notification as SchemaNotification).title;
                      const message = isAlert 
                        ? undefined 
                        : (notification as SchemaNotification).message;
                      
                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 transition-all cursor-pointer hover:bg-slate-100 active:bg-slate-200 ${
                            !isRead ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon or Avatar */}
                            <div className="flex-shrink-0">
                              {isAlert ? (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white text-sm font-semibold border border-slate-200">
                                  {getNotificationIcon(notification)}
                                </div>
                              ) : (
                                <>
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
                                </>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-sm font-medium ${
                                  !isRead ? "text-slate-900" : "text-slate-700"
                                }`}>
                                  {title}
                                </p>
                                {!isRead && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              {message && (
                                <p className="text-xs text-slate-600 line-clamp-2">
                                  {message}
                                </p>
                              )}
                              {isAlert && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {notification.collectionName} • Record #{notification.recordId?.slice(0, 8)}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {!isAlert && notification.triggerBy?.name && (
                                  <>
                                    <p className="text-xs text-slate-500">
                                      by {notification.triggerBy.name}
                                    </p>
                                    <span className="text-xs text-slate-400">•</span>
                                  </>
                                )}
                                <p className="text-xs text-slate-400">
                                  {formatTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
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

