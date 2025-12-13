"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { FileText, Upload, Trash2, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentTemplate {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function TemplatesPage() {
  const { organizationId } = useOrganization();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchTemplates();
    }
  }, [organizationId]);

  const fetchTemplates = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/templates?orgId=${organizationId}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".docx")) {
        alert("Only .docx files are supported");
        return;
      }
      setSelectedFile(file);
      if (!templateName) {
        // Auto-fill name from filename (remove extension)
        setTemplateName(file.name.replace(/\.docx$/i, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !templateName.trim() || !organizationId) {
      alert("Please select a file and enter a template name");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", templateName.trim());
      formData.append("orgId", organizationId);

      const response = await fetch("/api/templates", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload template");
      }

      await fetchTemplates();
      setShowUploadModal(false);
      setTemplateName("");
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Error uploading template:", error);
      alert(error.message || "Failed to upload template");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    if (!organizationId) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/templates?id=${id}&orgId=${organizationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      await fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden font-sans p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                  Document Templates
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Upload and manage Word document templates for document generation
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowUploadModal(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Upload Template
            </motion.button>
          </div>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : templates.length === 0 ? (
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
                  <FileText className="h-10 w-10 text-slate-400" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Templates Yet</h3>
              <p className="text-slate-600 mb-8 font-medium">
                Upload your first Word document template to get started
              </p>
              <motion.button
                onClick={() => setShowUploadModal(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-xl"
              >
                <Upload className="h-5 w-5" />
                Upload Template
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Template Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {templates.map((template, index) => (
                  <motion.tr
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{template.fileName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{formatDate(template.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={deletingId === template.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === template.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => !uploading && setShowUploadModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/20 w-full max-w-md overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Upload Template
                  </h2>
                  <button
                    onClick={() => !uploading && setShowUploadModal(false)}
                    className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 text-slate-600 transition-all shadow-sm hover:shadow-md"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white/50 to-white/30">
                  <div>
                    <label className="block text-sm font-extrabold text-slate-900 mb-3 tracking-tight">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Contract Template, Invoice Template"
                      className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-900 mb-3 tracking-tight">
                      Word Document (.docx)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".docx"
                        onChange={handleFileSelect}
                        className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all"
                      />
                      {selectedFile && (
                        <p className="mt-2 text-xs text-slate-600">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Only .docx files are supported. Use placeholders like {"{{variable_name}}"} in your template.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/60 bg-white/50 backdrop-blur-sm">
                  <button
                    onClick={() => !uploading && setShowUploadModal(false)}
                    disabled={uploading}
                    className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-sm font-semibold text-slate-700 hover:bg-white/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile || !templateName.trim()}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 text-sm font-semibold text-slate-700 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload
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

