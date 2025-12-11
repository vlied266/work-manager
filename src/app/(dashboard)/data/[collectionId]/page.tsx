"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Database,
  Download,
  Search,
} from "lucide-react";
import Papa from "papaparse";
import { useMemo } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Collection, CollectionField } from "@/app/api/data/collections/route";
import { Record } from "@/app/api/data/records/route";
import { DynamicDashboard } from "@/components/dashboard/DynamicDashboard";
import { DashboardLayout } from "@/types/dashboard";

interface CollectionPageProps {
  params: Promise<{ collectionId: string }>;
}

export default function CollectionPage({ params: paramsPromise }: CollectionPageProps) {
  const router = useRouter();
  const { organizationId } = useOrganization();
  const { collectionId } = use(paramsPromise);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!collectionId || !organizationId) return;
    fetchCollection();
  }, [collectionId, organizationId]);

  useEffect(() => {
    if (collection && collectionId) {
      fetchRecords();
    }
  }, [collection, collectionId]);

  const fetchCollection = async () => {
    if (!collectionId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/data/collections/${collectionId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch collection:", response.status, errorData);
        setCollection(null);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setCollection(data);
    } catch (error) {
      console.error("Error fetching collection:", error);
      setCollection(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!collectionId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/data/records?collectionId=${collectionId}`);
      if (!response.ok) throw new Error("Failed to fetch records");
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    const initialData: Record<string, any> = {};
    collection?.fields.forEach((field) => {
      switch (field.type) {
        case "number":
          initialData[field.key] = 0;
          break;
        case "boolean":
          initialData[field.key] = false;
          break;
        case "date":
          initialData[field.key] = "";
          break;
        default:
          initialData[field.key] = "";
      }
    });
    setFormData(initialData);
    setEditingRecord(null);
    setShowAddModal(true);
  };

  const handleEditRecord = (record: Record) => {
    setFormData({ ...record.data });
    setEditingRecord(record);
    setShowAddModal(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) {
      return;
    }
    try {
      const response = await fetch(`/api/data/records/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete record");
      await fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    }
  };

  const handleSaveRecord = async () => {
    // Validate required fields
    if (!collection) return;
    for (const field of collection.fields) {
      if (formData[field.key] === undefined || formData[field.key] === "") {
        // Allow empty values for now, but could add required validation later
      }
    }

    try {
      setSaving(true);
      const url = editingRecord
        ? `/api/data/records/${editingRecord.id}`
        : "/api/data/records";
      const method = editingRecord ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: collectionId,
          data: formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save record");
      await fetchRecords();
      setShowAddModal(false);
      setEditingRecord(null);
      setFormData({});
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (field: CollectionField) => {
    const value = formData[field.key] ?? "";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={`Enter ${field.label}`}
            className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
          />
        );
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: parseFloat(e.target.value) || 0 })
            }
            placeholder={`Enter ${field.label}`}
            className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
          />
        );
      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
              className="w-5 h-5 rounded border-white/60 text-blue-600 focus:ring-2 focus:ring-blue-500/50 bg-white/80 backdrop-blur-sm"
            />
            <span className="text-sm font-semibold text-slate-700">
              {value ? "Yes" : "No"}
            </span>
          </label>
        );
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={`Enter ${field.label}`}
            className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
          />
        );
    }
  };

  const renderCellValue = (field: CollectionField, record: Record) => {
    const value = record.data[field.key];
    if (value === undefined || value === null) return <span className="text-slate-400">—</span>;

    switch (field.type) {
      case "boolean":
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              value
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {value ? "Yes" : "No"}
          </span>
        );
      case "date":
        return <span>{new Date(value).toLocaleDateString()}</span>;
      case "number":
        return <span className="font-mono">{value.toLocaleString()}</span>;
      default:
        return <span>{String(value)}</span>;
    }
  };

  // System fields to exclude from CSV export
  const systemFields = ["_id", "userId", "file_url", "dashboardLayout", "id", "createdAt", "updatedAt"];

  // Filter records based on search query
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();
    return records.filter((record) => {
      // Search across all text fields in the record data
      return Object.values(record.data).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [records, searchQuery]);

  // Export to CSV function
  const handleExportCSV = () => {
    if (!collection || filteredRecords.length === 0) {
      alert("No data to export");
      return;
    }

    // Get business fields only (exclude system fields)
    const businessFields = collection.fields.filter(
      (field) => !systemFields.includes(field.key)
    );

    // Prepare data for CSV
    const csvData = filteredRecords.map((record) => {
      const row: Record<string, any> = {};
      businessFields.forEach((field) => {
        const value = record.data[field.key];
        // Format values for CSV
        if (value === null || value === undefined) {
          row[field.label] = "";
        } else if (field.type === "boolean") {
          row[field.label] = value ? "Yes" : "No";
        } else if (field.type === "date") {
          row[field.label] = new Date(value).toLocaleDateString();
        } else if (field.type === "number") {
          row[field.label] = value;
        } else {
          row[field.label] = String(value);
        }
      });
      return row;
    });

    // Convert to CSV
    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ",",
    });

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    // Generate filename with collection name and date
    const date = new Date().toISOString().split("T")[0];
    const filename = `${collection.name.replace(/\s+/g, "_")}_export_${date}.csv`;
    link.setAttribute("download", filename);
    
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Database className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Collection Not Found</h3>
          <button
            onClick={() => router.push("/data/schema")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go back to Schema Builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-100/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-100/20 blur-3xl" />
      </div>

      <div className="relative p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/data/schema")}
                  className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg">
                      <Database className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">{collection.name}</h1>
                    <p className="text-sm text-slate-600 font-medium">
                      {records.length} record{records.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
              <motion.button
                onClick={handleAddRecord}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Add Record
              </motion.button>
            </div>
          </div>

        {/* Dashboard */}
        {collection.dashboardLayout && (
          <DynamicDashboard layout={collection.dashboardLayout as DashboardLayout} data={records} />
        )}

          {/* Search and Export Controls */}
          {records.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl blur-xl opacity-50" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 z-10" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
                  />
                </div>
              </div>

              {/* Export Button */}
              <motion.button
                onClick={handleExportCSV}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white/90 transition-all shadow-lg shadow-black/5 hover:shadow-xl"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </motion.button>
            </div>
          )}

          {/* Table */}
          {records.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-50" />
              <div className="relative">
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
                  <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg mx-auto">
                    <Database className="h-10 w-10 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Records Yet</h3>
                <p className="text-slate-600 mb-8 font-medium">Add your first record to get started</p>
                <motion.button
                  onClick={handleAddRecord}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  Add Record
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/50 backdrop-blur-sm border-b border-white/60">
                    <tr>
                      {collection.fields.map((field) => (
                        <th
                          key={field.key}
                          className="px-6 py-4 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider"
                        >
                          {field.label}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={collection.fields.length + 1}
                          className="px-6 py-12 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-2xl blur-xl" />
                              <div className="relative h-16 w-16 rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg mx-auto">
                                <Search className="h-8 w-8 text-slate-400" />
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-slate-600">
                              No records match your search
                            </p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                              Try adjusting your search query
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-white/50 transition-colors">
                          {collection.fields.map((field) => (
                            <td key={field.key} className="px-6 py-4 text-sm text-slate-900 font-medium">
                              {renderCellValue(field, record)}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => router.push(`/data/${collectionId}/${record.id}`)}
                                className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                                title="Edit Record"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 hover:text-red-600 transition-all shadow-sm hover:shadow-md"
                                title="Delete Record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add/Edit Modal */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={() => !saving && setShowAddModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/20 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                      {editingRecord ? "Edit Record" : "Add Record"}
                    </h2>
                    <button
                      onClick={() => !saving && setShowAddModal(false)}
                      className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/50 to-white/30">
                    {collection.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-extrabold text-slate-900 mb-3 tracking-tight">
                          {field.label}
                        </label>
                        {renderFieldInput(field)}
                      </div>
                    ))}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-white/60 bg-white/50 backdrop-blur-sm">
                    <button
                      onClick={() => !saving && setShowAddModal(false)}
                      className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-sm font-semibold text-slate-700 hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRecord}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 text-sm font-semibold text-slate-700 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Record
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

