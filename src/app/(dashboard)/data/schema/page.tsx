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
  BarChart3,
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
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg">
                    <Database className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Atomic Data</h1>
                  <p className="text-sm text-slate-600 font-medium">
                    Create custom data structures and manage records
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleCreateCollection}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Create Collection
              </motion.button>
            </div>
          </div>

          {/* Collections Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
                <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              </div>
            </div>
          ) : collections.length === 0 ? (
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
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Collections Yet</h3>
                <p className="text-slate-600 mb-8 font-medium">
                  Create your first collection to start organizing data
                </p>
                <motion.button
                  onClick={handleCreateCollection}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  Create Collection
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-6 hover:shadow-xl hover:shadow-black/10 transition-all cursor-pointer group overflow-hidden"
                  onClick={() => router.push(`/data/${collection.id}`)}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:to-purple-50/30 transition-all duration-300" />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 group-hover:border-blue-200 transition-colors shadow-md">
                            <Database className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{collection.name}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {collection.fields.length} field{collection.fields.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/data/${collection.id}`);
                          }}
                          className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 hover:text-purple-600 transition-all shadow-sm hover:shadow-md"
                          title="View Dashboard"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCollection(collection);
                          }}
                          className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                          title="Edit Collection"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(collection.id);
                          }}
                          className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 hover:text-red-600 transition-all shadow-sm hover:shadow-md"
                          title="Delete Collection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {collection.fields.slice(0, 3).map((field) => (
                        <div key={field.key} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100/80 backdrop-blur-sm">
                            {getFieldTypeIcon(field.type)}
                          </div>
                          <span>{field.label}</span>
                          <span className="text-xs text-slate-400">({field.type})</span>
                        </div>
                      ))}
                      {collection.fields.length > 3 && (
                        <p className="text-xs text-slate-400 font-medium pt-1">
                          +{collection.fields.length - 3} more fields
                        </p>
                      )}
                    </div>
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
                className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={() => !saving && setShowCreateModal(false)}
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
                      {editingCollection ? "Edit Collection" : "Create Collection"}
                    </h2>
                    <button
                      onClick={() => !saving && setShowCreateModal(false)}
                      className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white/50 to-white/30">
                    {/* Collection Name */}
                    <div>
                      <label className="block text-sm font-extrabold text-slate-900 mb-3 tracking-tight">
                        Collection Name
                      </label>
                      <input
                        type="text"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        placeholder="e.g., Deals, Employees, Products"
                        className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
                      />
                    </div>

                    {/* Fields */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-extrabold text-slate-900 tracking-tight">Fields</label>
                        <button
                          onClick={handleAddField}
                          className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
                        >
                          <Plus className="h-4 w-4" />
                          Add Field
                        </button>
                      </div>
                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div
                            key={index}
                            className="relative rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 p-4 space-y-3 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-2 tracking-tight">
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
                                  className="w-full rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-2 tracking-tight">
                                  Field Type
                                </label>
                                <select
                                  value={field.type}
                                  onChange={(e) =>
                                    handleFieldChange(index, {
                                      type: e.target.value as CollectionField["type"],
                                    })
                                  }
                                  className="w-full rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm"
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
                              <label className="block text-xs font-extrabold text-slate-700 mb-2 tracking-tight">
                                Field Label
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => handleFieldChange(index, { label: e.target.value })}
                                placeholder="Display Name"
                                className="w-full rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm"
                              />
                            </div>
                            {field.type === "select" && (
                              <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-2 tracking-tight">
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
                                  className="w-full rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm"
                                />
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveField(index)}
                              className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove Field
                            </button>
                        </div>
                      ))}
                        {fields.length === 0 && (
                          <div className="text-center py-8 text-slate-500 text-sm font-medium">
                            No fields yet. Click "Add Field" to get started.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-white/60 bg-white/50 backdrop-blur-sm">
                    <button
                      onClick={() => !saving && setShowCreateModal(false)}
                      className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-sm font-semibold text-slate-700 hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
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
    </div>
  );
}

