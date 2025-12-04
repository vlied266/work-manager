"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Paperclip, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface EvidenceUploadProps {
  evidenceUrl: string | null;
  onEvidenceChange: (url: string | null, fileName: string | null) => void;
  organizationId: string;
  procedureId: string;
  taskId: string;
  disabled?: boolean;
}

export function EvidenceUpload({
  evidenceUrl,
  onEvidenceChange,
  organizationId,
  procedureId,
  taskId,
  disabled = false,
}: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || disabled) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setError(null);
      setFileName(file.name);

      try {
        // Create storage path: evidence/{orgId}/{procedureId}/{taskId}/{filename}
        const timestamp = Date.now();
        const fileExtension = file.name.split(".").pop();
        const sanitizedFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const storagePath = `evidence/${organizationId}/${procedureId}/${taskId}/${sanitizedFileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        onEvidenceChange(downloadURL, file.name);
      } catch (err: any) {
        console.error("Error uploading evidence:", err);
        setError(err.message || "Failed to upload file. Please try again.");
        setFileName(null);
        onEvidenceChange(null, null);
      } finally {
        setUploading(false);
      }
    },
    [organizationId, procedureId, taskId, onEvidenceChange, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB max
  });

  const handleRemove = () => {
    setFileName(null);
    onEvidenceChange(null, null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      {!evidenceUrl && (
        <div
          {...getRootProps()}
          className={`
            relative rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer
            ${
              isDragActive
                ? "border-blue-500 bg-blue-50/50"
                : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
            }
            ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-medium text-slate-700">Uploading...</p>
              </>
            ) : (
              <>
                <Paperclip className="h-8 w-8 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Drop evidence here to complete
                </p>
                <p className="text-xs text-slate-500">
                  PDF, Images, Docs (Max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* File Preview */}
      {evidenceUrl && fileName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-200 bg-green-50/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-slate-500">Evidence uploaded</p>
                </div>
              </div>
            </div>
            {!disabled && (
              <button
                onClick={handleRemove}
                className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Remove evidence"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

