"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  message: string;
  type: "info" | "warning" | "success" | "error";
  isActive: boolean;
  link?: string;
  linkText?: string;
  id?: string;
  createdAt?: Date;
}

export function GlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for dismissed announcement
    const dismissedId = localStorage.getItem("hide_announcement_id");
    
    // Listen to system settings document
    const unsubscribe = onSnapshot(
      doc(db, "system", "settings"),
      (snapshot) => {
        setLoading(false);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const announcementData = data.announcement as Announcement | undefined;
          
          if (announcementData && announcementData.isActive) {
            // Check if this announcement was dismissed
            const announcementId = snapshot.id + (announcementData.createdAt?.getTime() || Date.now());
            if (dismissedId === announcementId) {
              setIsDismissed(true);
              setAnnouncement(null);
            } else {
              setIsDismissed(false);
              setAnnouncement({
                ...announcementData,
                id: announcementId,
              });
            }
          } else {
            setAnnouncement(null);
            setIsDismissed(false);
          }
        } else {
          setAnnouncement(null);
          setIsDismissed(false);
        }
      },
      (error) => {
        console.error("Error listening to announcement:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDismiss = () => {
    if (announcement?.id) {
      localStorage.setItem("hide_announcement_id", announcement.id);
      setIsDismissed(true);
      setAnnouncement(null);
    }
  };

  if (loading || !announcement || isDismissed) {
    return null;
  }

  const getIcon = () => {
    switch (announcement.type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColors = () => {
    switch (announcement.type) {
      case "success":
        return {
          bg: "bg-green-500/10 border-green-500/20",
          text: "text-green-700",
          icon: "text-green-600",
          button: "hover:bg-green-500/20",
        };
      case "warning":
        return {
          bg: "bg-yellow-500/10 border-yellow-500/20",
          text: "text-yellow-700",
          icon: "text-yellow-600",
          button: "hover:bg-yellow-500/20",
        };
      case "error":
        return {
          bg: "bg-red-500/10 border-red-500/20",
          text: "text-red-700",
          icon: "text-red-600",
          button: "hover:bg-red-500/20",
        };
      default:
        return {
          bg: "bg-blue-500/10 border-blue-500/20",
          text: "text-blue-700",
          icon: "text-blue-600",
          button: "hover:bg-blue-500/20",
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`sticky top-0 z-[100] w-full border-b ${colors.bg} ${colors.text}`}
      >
        <div className="mx-auto max-w-[1800px] px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={colors.icon}>{getIcon()}</div>
              <p className="text-sm font-medium flex-1">{announcement.message}</p>
              {announcement.link && (
                <a
                  href={announcement.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold underline hover:no-underline"
                >
                  {announcement.linkText || "Learn more"}
                </a>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className={`p-1.5 rounded-lg transition-colors ${colors.button}`}
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

