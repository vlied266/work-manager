"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where, collection, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Procedure } from "@/types/schema";
import { formatDistanceToNow } from "date-fns";
import { Cloud, Folder, Power, PowerOff, Clock, ExternalLink, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useOrganization } from "@/contexts/OrganizationContext";
import Link from "next/link";

interface ActiveWatcher extends Procedure {
  lastPolledAt?: Date | string;
}

export default function ActiveWatchersList() {
  const { organizationId } = useOrganization();
  const [watchers, setWatchers] = useState<ActiveWatcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    // Query: isActive == true AND trigger.type == 'ON_FILE_CREATED'
    const watchersQuery = query(
      collection(db, "procedures"),
      where("organizationId", "==", organizationId),
      where("isActive", "==", true),
      where("trigger.type", "==", "ON_FILE_CREATED")
    );

    const unsubscribe = onSnapshot(
      watchersQuery,
      (snapshot) => {
        const activeWatchers = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastPolledAt: data.lastPolledAt 
              ? (typeof data.lastPolledAt === "string" 
                  ? new Date(data.lastPolledAt) 
                  : data.lastPolledAt.toDate?.() || data.lastPolledAt)
              : undefined,
          } as ActiveWatcher;
        });
        setWatchers(activeWatchers);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching active watchers:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  const handleDeactivate = async (procedureId: string) => {
    if (!confirm("Are you sure you want to deactivate this watcher? It will stop monitoring for new files.")) {
      return;
    }

    setDeactivating(procedureId);
    try {
      await updateDoc(doc(db, "procedures", procedureId), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error("Error deactivating watcher:", error);
      alert("Failed to deactivate watcher. Please try again.");
    } finally {
      setDeactivating(null);
    }
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case "google_drive":
        return <Cloud className="h-5 w-5 text-blue-600" />;
      case "dropbox":
        return <Cloud className="h-5 w-5 text-blue-500" />;
      default:
        return <Folder className="h-5 w-5 text-slate-500" />;
    }
  };

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case "google_drive":
        return "Google Drive";
      case "dropbox":
        return "Dropbox";
      default:
        return "Local Storage";
    }
  };

  const formatLastPolled = (lastPolledAt?: Date | string): string => {
    if (!lastPolledAt) {
      return "Never checked";
    }
    try {
      const date = typeof lastPolledAt === "string" ? new Date(lastPolledAt) : lastPolledAt;
      if (isNaN(date.getTime())) {
        return "Never checked";
      }
      return `Checked ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch {
      return "Never checked";
    }
  };

  if (loading) {
    return (
      <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
            <p className="text-sm text-slate-600">Loading active watchers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
      {/* Header */}
      <div className="bg-white/50 px-8 py-6 border-b border-white/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Active Automations</h2>
            <p className="mt-1 text-sm text-slate-600 font-medium">
              Background processes monitoring your folders
            </p>
          </div>
          {watchers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md animate-pulse" />
                <div className="relative h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm font-semibold text-green-700">
                {watchers.length} Active
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {watchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
              <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                <Power className="h-10 w-10 text-slate-400" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Active Watchers</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-md text-center">
              No active watchers. Activate a workflow to start monitoring.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {watchers.map((watcher, index) => (
              <motion.div
                key={watcher.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-6 hover:bg-white/70 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Status, Name, Provider */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Indicator - Pulsing Green Dot */}
                    <div className="relative mt-1">
                      <div className="absolute inset-0 bg-green-500/30 rounded-full blur-md animate-pulse" />
                      <div className="relative h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {watcher.title || "Untitled Workflow"}
                        </h3>
                      </div>

                      {/* Provider & Folder Path */}
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        {getProviderIcon(watcher.trigger?.config?.provider)}
                        <span className="font-medium">
                          {getProviderName(watcher.trigger?.config?.provider)}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="truncate font-mono text-xs">
                          {watcher.trigger?.config?.folderPath || "/unknown"}
                        </span>
                      </div>

                      {/* Last Polled */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatLastPolled(watcher.lastPolledAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Edit/View Button */}
                    <Link
                      href={`/studio/procedure/${watcher.id}`}
                      className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:border-slate-300 hover:shadow-md"
                    >
                      <Pencil className="h-4 w-4" />
                      <span>Edit</span>
                    </Link>

                    {/* Deactivate Button */}
                    <button
                      onClick={() => handleDeactivate(watcher.id)}
                      disabled={deactivating === watcher.id}
                      className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:border-slate-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deactivating === watcher.id ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                          <span>Deactivating...</span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-4 w-4" />
                          <span>Deactivate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

