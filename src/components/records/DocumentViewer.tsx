"use client";

import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface DocumentViewerProps {
  fileUrl?: string | null;
  fileName?: string;
}

export function DocumentViewer({ fileUrl, fileName }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fileUrl) {
      setLoading(true);
      setError(null);
    }
  }, [fileUrl]);

  if (!fileUrl) {
    return (
      <div className="h-full flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-xl border-2 border-dashed border-white/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30" />
        <div className="relative text-center p-8">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
            <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg mx-auto">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-slate-600 mb-1">No document attached</p>
          <p className="text-xs text-slate-400 font-medium">Upload a file to view it here</p>
        </div>
      </div>
    );
  }

  // Detect file type
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl) || fileUrl.includes("image");
  const isPdf = /\.pdf$/i.test(fileUrl) || fileUrl.includes("pdf") || fileUrl.includes("application/pdf");
  
  // Handle Google Drive links - convert to preview mode
  const getDisplayUrl = (url: string): string => {
    // Check if it's a Google Drive link
    if (url.includes("drive.google.com")) {
      // Extract file ID from various Google Drive URL formats
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        // Use Google Docs viewer for PDFs
        if (isPdf) {
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        // For images, use direct download link
        if (isImage) {
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
        // Default: use preview mode
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    // For non-Google Drive PDFs, use Google Docs viewer as fallback for better compatibility
    if (isPdf && !url.includes("drive.google.com") && !url.startsWith("data:")) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  const displayUrl = fileUrl ? getDisplayUrl(fileUrl) : null;

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError("Failed to load document");
  };

  return (
    <div className="h-full flex flex-col rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/60 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm border border-white/60">
            {isImage ? (
              <ImageIcon className="h-4 w-4 text-blue-600" />
            ) : (
              <FileText className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <span className="text-sm font-extrabold tracking-tight text-slate-900">
            {fileName || "Document"}
          </span>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 relative overflow-auto bg-gradient-to-br from-slate-50/50 to-white/30">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-3xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-2xl blur-xl" />
              <div className="relative rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 p-6">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="relative text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
              <div className="relative">
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
                  <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg mx-auto">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                </div>
                <p className="text-sm font-extrabold text-slate-600 mb-1">{error}</p>
                <p className="text-xs text-slate-400 font-medium">Unable to load the document</p>
              </div>
            </div>
          </div>
        ) : isImage ? (
          <div className="h-full flex items-center justify-center p-4">
            <img
              src={displayUrl || fileUrl}
              alt={fileName || "Document"}
              onLoad={handleLoad}
              onError={handleError}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-xl border border-white/60"
            />
          </div>
        ) : isPdf ? (
          <iframe
            src={displayUrl || fileUrl}
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-full min-h-[600px] border-0 rounded-2xl"
            title={fileName || "PDF Document"}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="relative text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
              <div className="relative">
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
                  <div className="relative h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg mx-auto">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                </div>
                <p className="text-sm font-extrabold text-slate-600 mb-1">Unsupported file type</p>
                <p className="text-xs text-slate-400 font-medium mb-4">Please download the file to view it</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 shadow-sm hover:shadow-md"
                >
                  Open in new tab →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

