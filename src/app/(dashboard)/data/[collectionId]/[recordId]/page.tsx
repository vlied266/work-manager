"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Collection, CollectionField } from "@/app/api/data/collections/route";
import { Record } from "@/app/api/data/records/route";
import { DocumentViewer } from "@/components/records/DocumentViewer";

interface RecordEditPageProps {
  params: Promise<{ collectionId: string; recordId: string }>;
}

type VerificationStatus = "pending" | "needs_review" | "approved" | "rejected";

export default function RecordEditPage({ params: paramsPromise }: RecordEditPageProps) {
  const router = useRouter();
  const { organizationId } = useOrganization();
  const { collectionId, recordId } = use(paramsPromise);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("pending");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!collectionId || !recordId || !organizationId) return;
    fetchData();
  }, [collectionId, recordId, organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch collection
      const collectionResponse = await fetch(`/api/data/collections/${collectionId}`);
      if (!collectionResponse.ok) throw new Error("Failed to fetch collection");
      const collectionData = await collectionResponse.json();
      setCollection(collectionData);

      // Fetch record
      const recordResponse = await fetch(`/api/data/records/${recordId}`);
      if (!recordResponse.ok) throw new Error("Failed to fetch record");
      const recordData = await recordResponse.json();
      setRecord(recordData);
      
      // Initialize form data
      setFormData(recordData.data || {});
      
      // Get verification status (if exists in record metadata)
      const status = (recordData as any).verificationStatus || "pending";
      setVerificationStatus(status);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load record. Redirecting...");
      router.push(`/data/${collectionId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (markAsApproved: boolean = false) => {
    if (!collection || !record) return;

    try {
      setSaving(true);
      
      const updateData: any = {
        data: formData,
        updatedAt: new Date().toISOString(),
      };

      if (markAsApproved) {
        updateData.verificationStatus = "approved";
        setVerificationStatus("approved");
      }

      const response = await fetch(`/api/data/records/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to save record");
      
      // Update local state
      setRecord({ ...record, data: formData });
      
      if (markAsApproved) {
        alert("Record verified and saved successfully!");
      } else {
        alert("Record saved successfully!");
      }
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

  const getStatusBadge = (status: VerificationStatus) => {
    const styles = {
      pending: "bg-slate-100 text-slate-700 border-slate-300",
      needs_review: "bg-yellow-100 text-yellow-700 border-yellow-300",
      approved: "bg-green-100 text-green-700 border-green-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "needs_review":
        return <AlertCircle className="h-4 w-4" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Extract fileUrl from record data (could be in various fields)
  const getFileUrl = (): string | null => {
    if (!record?.data) return null;
    
    // Check common field names for file URL
    const possibleFields = [
      "fileUrl",
      "file_url",
      "sourceUrl",
      "source_url",
      "documentUrl",
      "document_url",
      "file",
      "url",
    ];
    
    for (const field of possibleFields) {
      if (record.data[field] && typeof record.data[field] === "string") {
        return record.data[field];
      }
    }
    
    return null;
  };

  const fileUrl = getFileUrl();
  const fileName = record?.data?.fileName || record?.data?.file_name || "Document";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
          <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!collection || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 flex items-center justify-center">
        <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
            <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg mx-auto">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Record Not Found</h3>
          <button
            onClick={() => router.push(`/data/${collectionId}`)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 shadow-lg hover:shadow-xl"
          >
            Go back to Collection
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
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/data/${collectionId}`)}
                  className="p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Edit Record</h1>
                  <p className="text-sm text-slate-600 font-medium">{collection.name}</p>
                </div>
              </div>
              
              {/* Verification Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold border backdrop-blur-sm shadow-sm ${getStatusBadge(
                    verificationStatus
                  )}`}
                >
                  {getStatusIcon(verificationStatus)}
                  <span className="capitalize">{verificationStatus.replace("_", " ")}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Split Screen Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
            {/* Left Column: Document Viewer */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <DocumentViewer fileUrl={fileUrl} fileName={fileName} />
            </motion.div>

            {/* Right Column: Edit Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full overflow-hidden flex flex-col rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5"
            >
              {/* Form Header */}
              <div className="p-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Record Data</h2>
                <p className="text-sm text-slate-600 font-medium mt-1">
                  Verify and edit the extracted information
                </p>
              </div>

              {/* Scrollable Form Content */}
              <div className="overflow-y-auto h-full p-6 space-y-6 bg-gradient-to-b from-white/50 to-white/30">
                {collection.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-extrabold text-slate-900 mb-3 tracking-tight">
                      {field.label}
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>

              {/* Form Footer - Fixed at bottom */}
              <div className="p-6 border-t border-white/60 bg-white/50 backdrop-blur-sm flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  onClick={() => router.push(`/data/${collectionId}`)}
                  className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-sm font-semibold text-slate-700 hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSave(false)}
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
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving || verificationStatus === "approved"}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 text-sm font-semibold text-slate-700 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {verificationStatus === "approved" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verified
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verify & Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

