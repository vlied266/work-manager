"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRun } from "@/types/schema";
import { Clock, CheckCircle2, AlertTriangle, XCircle, Download, FileText } from "lucide-react";
import Link from "next/link";
import { exportToCSV, generateRunCertificate, exportRunToCSV } from "@/lib/exporter";
import { Procedure } from "@/types/schema";
import { doc, getDoc } from "firebase/firestore";

export default function MonitorPage() {
  const [runs, setRuns] = useState<ActiveRun[]>([]);
  const [procedures, setProcedures] = useState<Record<string, Procedure>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "flagged" | "completed">("all");
  const [organizationId] = useState("default-org"); // TODO: Get from auth context

  useEffect(() => {
    const q = query(
      collection(db, "active_runs"),
      where("organizationId", "==", organizationId)
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

  const filteredRuns = runs.filter((run) => {
    if (filter === "all") return true;
    if (filter === "active") return run.status === "IN_PROGRESS";
    if (filter === "flagged") return run.status === "FLAGGED";
    if (filter === "completed") return run.status === "COMPLETED";
    return true;
  });

  const getStatusIcon = (status: ActiveRun["status"]) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "FLAGGED":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case "BLOCKED":
        return <XCircle className="h-4 w-4 text-slate-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: ActiveRun["status"]) => {
    const baseClasses = "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold";
    switch (status) {
      case "IN_PROGRESS":
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case "COMPLETED":
        return `${baseClasses} bg-green-100 text-green-700`;
      case "FLAGGED":
        return `${baseClasses} bg-rose-100 text-rose-700`;
      case "BLOCKED":
        return `${baseClasses} bg-slate-100 text-slate-700`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700`;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading processes...</p>
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
            <h1 className="text-3xl font-semibold text-slate-900">Process Monitor</h1>
            <p className="mt-1 text-sm text-slate-600">Monitor all active and completed processes</p>
          </div>
          {filteredRuns.filter((r) => r.status === "COMPLETED").length > 0 && (
            <button
              onClick={() => {
                setExporting(true);
                try {
                  const completedRuns = filteredRuns.filter((r) => r.status === "COMPLETED");
                  exportToCSV(completedRuns, procedures);
                } catch (error) {
                  console.error("Error exporting:", error);
                  alert("Failed to export. Please try again.");
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export Completed"}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "flagged", label: "Flagged" },
            { id: "completed", label: "Completed" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                filter === f.id
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Runs Table */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Process
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Started
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                      No processes found
                    </td>
                  </tr>
                ) : (
                  filteredRuns.map((run) => {
                    const progress = run.logs?.length || 0;
                    return (
                      <tr
                        key={run.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          run.status === "FLAGGED" ? "bg-rose-50/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(run.status)}
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {run.procedureTitle}
                              </p>
                              <p className="text-xs text-slate-500">
                                {run.logs?.length || 0} steps completed
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadge(run.status)}>{run.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-32 rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-blue-600 transition-all"
                                style={{
                                  width: `${(progress / 10) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">{progress} steps</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {run.startedAt.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/run/${run.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                            >
                              View
                            </Link>
                            {run.status === "COMPLETED" && (
                              <>
                                <button
                                  onClick={async () => {
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
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                                  title="Download PDF Certificate"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const procedure = procedures[run.procedureId];
                                    if (!procedure) {
                                      alert("Procedure not found. Cannot export.");
                                      return;
                                    }
                                    try {
                                      exportRunToCSV(run, procedure);
                                    } catch (error) {
                                      console.error("Error exporting:", error);
                                      alert("Failed to export. Please try again.");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                                  title="Export to Excel"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

