"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Loader2,
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Collection, CollectionField } from "@/app/api/data/collections/route";

export default function SchemaBuilderPage() {
  const router = useRouter();
  const { organizationId } = useOrganization();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionName, setCollectionName] = useState("");
  const [fields, setFields] = useState<CollectionField[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    fetchCollections();
  }, [organizationId]);

  const fetchCollections = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/data/collections?orgId=${organizationId}`);
      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = () => {
    setCollectionName("");
    setFields([]);
    setEditingCollection(null);
    setShowCreateModal(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setCollectionName(collection.name);
    setFields(collection.fields);
    setEditingCollection(collection);
    setShowCreateModal(true);
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection? All records will be deleted.")) {
      return;
    }
    try {
      const response = await fetch(`/api/data/collections/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete collection");
      await fetchCollections();
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Failed to delete collection");
    }
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        key: `field_${fields.length + 1}`,
        label: "",
        type: "text",
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, updates: Partial<CollectionField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const handleSave = async () => {
    if (!collectionName.trim()) {
      alert("Please enter a collection name");
      return;
    }
    if (fields.length === 0) {
      alert("Please add at least one field");
      return;
    }
    for (const field of fields) {
      if (!field.key.trim() || !field.label.trim()) {
        alert("All fields must have a key and label");
        return;
      }
    }

    try {
      setSaving(true);
      const url = editingCollection
        ? `/api/data/collections/${editingCollection.id}`
        : "/api/data/collections";
      const method = editingCollection ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: organizationId,
          name: collectionName,
          fields,
        }),
      });

      if (!response.ok) throw new Error("Failed to save collection");
      await fetchCollections();
      setShowCreateModal(false);
      setEditingCollection(null);
      setCollectionName("");
      setFields([]);
    } catch (error) {
      console.error("Error saving collection:", error);
      alert("Failed to save collection");
    } finally {
      setSaving(false);
    }
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />;
      case "number":
        return <Hash className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "boolean":
        return <ToggleLeft className="h-4 w-4" />;
      case "select":
        return <List className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Atomic Data</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Create custom data structures and manage records
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleCreateCollection}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Create Collection
            </motion.button>
          </div>
        </div>

        {/* Collections Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : collections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200 p-12 text-center"
          >
            <Database className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Collections Yet</h3>
            <p className="text-slate-600 mb-6">
              Create your first collection to start organizing data
            </p>
            <motion.button
              onClick={handleCreateCollection}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold"
            >
              <Plus className="h-5 w-5" />
              Create Collection
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => router.push(`/data/${collection.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{collection.name}</h3>
                      <p className="text-xs text-slate-500">
                        {collection.fields.length} field{collection.fields.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCollection(collection);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {collection.fields.slice(0, 3).map((field) => (
                    <div key={field.key} className="flex items-center gap-2 text-sm text-slate-600">
                      {getFieldTypeIcon(field.type)}
                      <span className="font-medium">{field.label}</span>
                      <span className="text-xs text-slate-400">({field.type})</span>
                    </div>
                  ))}
                  {collection.fields.length > 3 && (
                    <p className="text-xs text-slate-400">
                      +{collection.fields.length - 3} more fields
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !saving && setShowCreateModal(false)}
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
                    {editingCollection ? "Edit Collection" : "Create Collection"}
                  </h2>
                  <button
                    onClick={() => !saving && setShowCreateModal(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Collection Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder="e.g., Deals, Employees, Products"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-slate-900">Fields</label>
                      <button
                        onClick={handleAddField}
                        className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Field
                      </button>
                    </div>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Field Key
                              </label>
                              <input
                                type="text"
                                value={field.key}
                                onChange={(e) =>
                                  handleFieldChange(index, {
                                    key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                                  })
                                }
                                placeholder="field_key"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Field Type
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) =>
                                  handleFieldChange(index, {
                                    type: e.target.value as CollectionField["type"],
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="boolean">Boolean</option>
                                <option value="select">Select</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Field Label
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleFieldChange(index, { label: e.target.value })}
                              placeholder="Display Name"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {field.type === "select" && (
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Options (comma-separated)
                              </label>
                              <input
                                type="text"
                                value={field.options?.join(", ") || ""}
                                onChange={(e) =>
                                  handleFieldChange(index, {
                                    options: e.target.value.split(",").map((s) => s.trim()),
                                  })
                                }
                                placeholder="Option 1, Option 2, Option 3"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveField(index)}
                            className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove Field
                          </button>
                        </div>
                      ))}
                      {fields.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          No fields yet. Click "Add Field" to get started.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                  <button
                    onClick={() => !saving && setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
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
                        Save Collection
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

