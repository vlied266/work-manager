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
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Collection, CollectionField } from "@/app/api/data/collections/route";
import { Record } from "@/app/api/data/records/route";

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
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">
              {value ? "Yes" : "No"}
            </span>
          </label>
        );
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/data/schema")}
                className="p-2 rounded-lg hover:bg-white/80 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{collection.name}</h1>
                  <p className="text-sm text-slate-600 mt-1">
                    {records.length} record{records.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
            <motion.button
              onClick={handleAddRecord}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Record
            </motion.button>
          </div>
        </div>

        {/* Table */}
        {records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200 p-12 text-center"
          >
            <Database className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Records Yet</h3>
            <p className="text-slate-600 mb-6">Add your first record to get started</p>
            <motion.button
              onClick={handleAddRecord}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add Record
            </motion.button>
          </motion.div>
        ) : (
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {collection.fields.map((field) => (
                      <th
                        key={field.key}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        {field.label}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      {collection.fields.map((field) => (
                        <td key={field.key} className="px-6 py-4 text-sm text-slate-900">
                          {renderCellValue(field, record)}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !saving && setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingRecord ? "Edit Record" : "Add Record"}
                  </h2>
                  <button
                    onClick={() => !saving && setShowAddModal(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {collection.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        {field.label}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                  <button
                    onClick={() => !saving && setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  );
}

