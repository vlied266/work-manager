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
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <div className="text-center p-8">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-500">No document attached</p>
          <p className="text-xs text-slate-400 mt-1">Upload a file to view it here</p>
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
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          {isImage ? (
            <ImageIcon className="h-5 w-5 text-blue-600" />
          ) : (
            <FileText className="h-5 w-5 text-blue-600" />
          )}
          <span className="text-sm font-semibold text-slate-900">
            {fileName || "Document"}
          </span>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 relative overflow-auto bg-slate-100">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        
        {error ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-600">{error}</p>
              <p className="text-xs text-slate-400 mt-1">Unable to load the document</p>
            </div>
          </div>
        ) : isImage ? (
          <div className="h-full flex items-center justify-center p-4">
            <img
              src={displayUrl || fileUrl}
              alt={fileName || "Document"}
              onLoad={handleLoad}
              onError={handleError}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        ) : isPdf ? (
          <iframe
            src={displayUrl || fileUrl}
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-full min-h-[600px] border-0 rounded-lg"
            title={fileName || "PDF Document"}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-600">Unsupported file type</p>
              <p className="text-xs text-slate-400 mt-1">Please download the file to view it</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Open in new tab →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

