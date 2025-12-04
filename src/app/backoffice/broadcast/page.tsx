"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { 
  Megaphone, Loader2, AlertCircle, 
  Send, X, Info, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OWNER_EMAIL = "atomicworkos@gmail.com";

interface Announcement {
  message: string;
  type: "info" | "warning" | "success" | "error";
  isActive: boolean;
  link?: string;
  linkText?: string;
}

export default function BroadcastPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [announcement, setAnnouncement] = useState<Announcement>({
    message: "",
    type: "info",
    isActive: false,
    link: "",
    linkText: "",
  });
  
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);

  // Security check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setAuthorized(false);
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      if (currentUser.email !== OWNER_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch current announcement
  useEffect(() => {
    if (!authorized) return;

    const fetchAnnouncement = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "system", "settings"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.announcement) {
            setCurrentAnnouncement(data.announcement as Announcement);
            if (data.announcement.isActive) {
              setAnnouncement(data.announcement as Announcement);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
      }
    };

    fetchAnnouncement();
  }, [authorized]);

  const handlePublish = async () => {
    if (!announcement.message.trim()) {
      alert("Please enter a message");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "system", "settings"),
        {
          announcement: {
            ...announcement,
            isActive: true,
            createdAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setCurrentAnnouncement({ ...announcement, isActive: true });
      alert("Announcement published successfully!");
    } catch (error) {
      console.error("Error publishing announcement:", error);
      alert("Failed to publish announcement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear the current announcement?")) {
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "system", "settings"),
        {
          announcement: {
            message: "",
            type: "info",
            isActive: false,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setCurrentAnnouncement(null);
      setAnnouncement({
        message: "",
        type: "info",
        isActive: false,
        link: "",
        linkText: "",
      });
      alert("Announcement cleared successfully!");
    } catch (error) {
      console.error("Error clearing announcement:", error);
      alert("Failed to clear announcement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-100"></div>
          <p className="text-sm text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h1>
          <p className="text-slate-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link
                href="/backoffice"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Backoffice
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Megaphone className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Global Broadcast
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Send announcements to all users
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Announcement Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-xl font-bold text-white mb-6">Create Announcement</h2>

            <div className="space-y-6">
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  placeholder="Enter your announcement message..."
                  rows={4}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["info", "success", "warning", "error"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setAnnouncement({ ...announcement, type })}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        announcement.type === type
                          ? "border-blue-500 bg-blue-500/20 text-blue-400"
                          : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {type === "info" && <Info className="h-4 w-4" />}
                        {type === "success" && <CheckCircle className="h-4 w-4" />}
                        {type === "warning" && <AlertTriangle className="h-4 w-4" />}
                        {type === "error" && <AlertCircleIcon className="h-4 w-4" />}
                        <span className="text-xs font-medium capitalize">{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  value={announcement.link || ""}
                  onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Link Text */}
              {announcement.link && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Link Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={announcement.linkText || ""}
                    onChange={(e) => setAnnouncement({ ...announcement, linkText: e.target.value })}
                    placeholder="Learn more"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handlePublish}
                  disabled={saving || !announcement.message.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publish Announcement
                    </>
                  )}
                </button>
                {currentAnnouncement?.isActive && (
                  <button
                    onClick={handleClear}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Current Announcement Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-xl font-bold text-white mb-6">Preview</h2>

            {currentAnnouncement?.isActive ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${
                    currentAnnouncement.type === "success"
                      ? "bg-green-500/10 border-green-500/20"
                      : currentAnnouncement.type === "warning"
                      ? "bg-yellow-500/10 border-yellow-500/20"
                      : currentAnnouncement.type === "error"
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-blue-500/10 border-blue-500/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {currentAnnouncement.type === "success" && (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {currentAnnouncement.type === "warning" && (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    {currentAnnouncement.type === "error" && (
                      <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    {currentAnnouncement.type === "info" && (
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {currentAnnouncement.message}
                      </p>
                      {currentAnnouncement.link && (
                        <a
                          href={currentAnnouncement.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline mt-2 inline-block"
                        >
                          {currentAnnouncement.linkText || "Learn more"} →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-2">Status:</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                    Active
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No active announcement</p>
                <p className="text-slate-500 text-sm mt-1">
                  Create one to broadcast to all users
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

