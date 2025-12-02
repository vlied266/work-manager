"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun, Procedure } from "@/types/schema";
import { FileText, Download, CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { exportToCSV, generateRunCertificate, exportRunToCSV } from "@/lib/exporter";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const [runs, setRuns] = useState<ActiveRun[]>([]);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [userId] = useState("user-1"); // TODO: Get from auth context

  useEffect(() => {
    const q = query(
      collection(db, "active_runs"),
      where("organizationId", "==", organizationId),
      where("status", "in", ["COMPLETED", "FLAGGED"]),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
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
  }, [organizationId]);

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
    <div className="h-full bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Run History</h1>
            <p className="mt-1 text-sm text-slate-600">View and export completed processes</p>
          </div>
          <button
            onClick={handleExportAll}
            disabled={exporting || runs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export All to Excel"}
          </button>
        </div>

        {/* Runs Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {runs.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600">No completed runs yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Process
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runs.map((run) => (
                    <motion.tr
                      key={run.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/run/${run.id}`}
                          className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {run.procedureTitle}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">ID: {run.id.substring(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <span className="text-sm text-slate-700 capitalize">{run.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(run.startedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(run.completedAt || null)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getDuration(run.startedAt, run.completedAt || null)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExportPDF(run)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            title="Download PDF Certificate"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            PDF
                          </button>
                          <button
                            onClick={() => handleExportRunCSV(run)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
  );
}

