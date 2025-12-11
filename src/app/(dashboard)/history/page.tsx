"use client";

import { useEffect, useState, useMemo } from "react";
import { onSnapshot, doc, getDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun, Procedure } from "@/types/schema";
import { FileText, Download, CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { exportToCSV, generateRunCertificate, exportRunToCSV } from "@/lib/exporter";
import { motion } from "framer-motion";
import { useOrgQuery, useOrgId } from "@/hooks/useOrgData";
import { fetchCollectionsStats, CollectionStats } from "@/lib/collections-stats";
import { Database } from "lucide-react";

// Prevent SSR/prerendering - this page requires client-side auth
export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  const [runs, setRuns] = useState<ActiveRun[]>([]);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [collectionsStats, setCollectionsStats] = useState<CollectionStats | null>(null);
  const orgId = useOrgId();

  // Use organization-scoped query hook with additional filters
  // Note: We filter by status but sort client-side to avoid requiring a composite index
  const runsQuery = useOrgQuery("active_runs", [
    where("status", "in", ["COMPLETED", "FLAGGED"])
  ]);

  useEffect(() => {
    if (!runsQuery) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      runsQuery,
      async (snapshot) => {
        const runsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            logs: (data.logs || []).map((log: any) => ({
              ...log,
              timestamp: log.timestamp?.toDate() || new Date(),
            })),
          } as ActiveRun;
        });
        
        // Sort by completedAt descending (most recent first)
        // For runs without completedAt, use startedAt as fallback
        runsData.sort((a, b) => {
          const aDate = a.completedAt || a.startedAt;
          const bDate = b.completedAt || b.startedAt;
          return bDate.getTime() - aDate.getTime(); // Descending order
        });
        
        setRuns(runsData);

        // Fetch procedures
        const procedureIds = [...new Set(runsData.map((r) => r.procedureId))];
        const proceduresData: Record<string, Procedure> = {};
        for (const procId of procedureIds) {
          try {
            const procDoc = await getDoc(doc(db, "procedures", procId));
            if (procDoc.exists()) {
              const procData = procDoc.data();
              proceduresData[procId] = {
                id: procDoc.id,
                ...procData,
                createdAt: procData.createdAt?.toDate() || new Date(),
                updatedAt: procData.updatedAt?.toDate() || new Date(),
                steps: procData.steps || [],
              } as Procedure;
            }
          } catch (error) {
            console.error(`Error fetching procedure ${procId}:`, error);
          }
        }
        setProcedures(proceduresData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching runs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [runsQuery]);

  // Fetch collections stats
  useEffect(() => {
    if (!orgId) return;
    fetchCollectionsStats(orgId).then(setCollectionsStats);
  }, [orgId]);

  const handleExportAll = () => {
    setExporting(true);
    try {
      exportToCSV(runs, procedures);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async (run: ActiveRun) => {
    const procedure = procedures[run.procedureId];
    if (!procedure) {
      alert("Procedure not found. Cannot generate certificate.");
      return;
    }

    try {
      await generateRunCertificate(run, procedure, "User", "Organization");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleExportRunCSV = (run: ActiveRun) => {
    const procedure = procedures[run.procedureId];
    if (!procedure) {
      alert("Procedure not found. Cannot export.");
      return;
    }

    try {
      exportRunToCSV(run, procedure);
    } catch (error) {
      console.error("Error exporting run:", error);
      alert("Failed to export. Please try again.");
    }
  };

  const getStatusIcon = (status: ActiveRun["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "FLAGGED":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDuration = (startedAt: Date, completedAt: Date | null) => {
    if (!completedAt) return "N/A";
    const diff = completedAt.getTime() - startedAt.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Run History</h1>
              <p className="mt-2 text-sm text-slate-600 font-medium">
                {runs.length === 0 && collectionsStats 
                  ? `View and manage ${collectionsStats.totalRecords} records across ${collectionsStats.totalCollections} collections`
                  : "View and export completed processes"}
              </p>
            </div>
            <button
              onClick={handleExportAll}
              disabled={exporting || runs.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export All to Excel"}
            </button>
          </div>

          {/* Runs Table - Airtable Style */}
          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
            {runs.length === 0 ? (
              <div className="p-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
                    <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                      {collectionsStats && collectionsStats.totalRecords > 0 ? (
                        <Database className="h-10 w-10 text-blue-500" />
                      ) : (
                        <Clock className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                  </div>
                  {collectionsStats && collectionsStats.totalRecords > 0 ? (
                    <>
                      <p className="text-lg font-extrabold text-slate-900 mb-2">
                        {collectionsStats.totalRecords} Records Available
                      </p>
                      <p className="text-sm text-slate-600 font-medium mb-4">
                        Across {collectionsStats.totalCollections} collections
                      </p>
                      <Link
                        href="/data/schema"
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                      >
                        <Database className="h-4 w-4" />
                        View Collections
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-extrabold text-slate-900 mb-2">No completed runs yet</p>
                      <p className="text-sm text-slate-600 font-medium">Completed processes will appear here</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/50">
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Process
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Started
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Completed
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Duration
                      </th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run, index) => (
                      <motion.tr
                        key={run.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`transition-colors ${index % 2 === 0 ? "bg-white/50" : "bg-white/30"} hover:bg-white/70`}
                      >
                        <td className="px-8 py-5">
                          <Link
                            href={`/run/${run.id}`}
                            className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {run.procedureTitle}
                          </Link>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {run.id.substring(0, 8)}...</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(run.status)}
                            <span className="text-sm font-semibold text-slate-700 capitalize">{run.status}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-700 font-medium">
                          {formatDate(run.startedAt)}
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-700 font-medium">
                          {formatDate(run.completedAt || null)}
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-700 font-medium">
                          {getDuration(run.startedAt, run.completedAt || null)}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleExportPDF(run)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-md"
                              title="Download PDF Certificate"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              PDF
                            </button>
                            <button
                              onClick={() => handleExportRunCSV(run)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-md"
                              title="Export to Excel"
                            >
                              <Download className="h-3.5 w-3.5" />
                              CSV
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

