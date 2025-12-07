"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";

interface GoogleFile {
  id: string;
  name: string;
  webViewLink: string;
  mimeType?: string;
}

interface GoogleSheetConfigProps {
  sheetId?: string;
  fileName?: string;
  mapping?: Record<string, string>;
  onUpdate: (data: { sheetId?: string; fileName?: string; mapping?: Record<string, string> }) => void;
}

export function GoogleSheetConfig({ sheetId, fileName, mapping, onUpdate }: GoogleSheetConfigProps) {
  const [files, setFiles] = useState<GoogleFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentMapping = mapping || { A: "", B: "", C: "" };

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/integrations/google/list-files?type=spreadsheets');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Google Sheets');
        }

        const data = await response.json();
        setFiles(data.files || []);
      } catch (err: any) {
        console.error('Error fetching Google Sheets:', err);
        setError(err.message || 'Failed to load Google Sheets. Please make sure you have connected your Google account.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleFileSelect = (fileId: string, fileName: string) => {
    onUpdate({
      sheetId: fileId,
      fileName: fileName,
      mapping: currentMapping, // Preserve existing mapping
    });
  };

  const handleMappingChange = (column: string, value: string) => {
    onUpdate({
      sheetId,
      fileName,
      mapping: {
        ...currentMapping,
        [column]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Google Sheet Configuration</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select which Google Sheet to write data to
            </p>
          </div>
        </div>
      </div>

      {/* File Selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Select Google Sheet <span className="text-rose-500">*</span>
        </label>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-6 rounded-xl border-2 border-slate-200 bg-slate-50">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <span className="text-sm text-slate-600">Loading Google Sheets...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900 mb-1">Unable to Load Sheets</p>
                <p className="text-xs text-orange-700">{error}</p>
                <p className="text-xs text-orange-600 mt-2">
                  Make sure you have connected your Google account in Settings → Integrations.
                </p>
              </div>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-600 mb-1">No Google Sheets found</p>
            <p className="text-xs text-slate-500">
              Create a Google Sheet in your Drive to get started
            </p>
          </div>
        ) : (
          <select
            value={sheetId || ""}
            onChange={(e) => {
              const selectedFile = files.find(f => f.id === e.target.value);
              if (selectedFile) {
                handleFileSelect(selectedFile.id, selectedFile.name);
              }
            }}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          >
            <option value="">Select a Google Sheet...</option>
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
              </option>
            ))}
          </select>
        )}

        {sheetId && fileName && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs font-semibold text-green-900">Selected Sheet</p>
                <p className="text-xs text-green-700">{fileName}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Column Mapping */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-900">
            Column Mapping
          </label>
          <p className="text-xs text-slate-600">
            Define what data gets written to each column in the sheet
          </p>
        </div>

        <div className="space-y-3">
          {/* Column A */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Column A
            </label>
            <input
              type="text"
              value={currentMapping.A || ""}
              onChange={(e) => handleMappingChange("A", e.target.value)}
              placeholder="e.g., Customer Name, {{step1.name}}"
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            />
          </div>

          {/* Column B */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Column B
            </label>
            <input
              type="text"
              value={currentMapping.B || ""}
              onChange={(e) => handleMappingChange("B", e.target.value)}
              placeholder="e.g., Amount, {{step2.total}}"
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            />
          </div>

          {/* Column C */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Column C
            </label>
            <input
              type="text"
              value={currentMapping.C || ""}
              onChange={(e) => handleMappingChange("C", e.target.value)}
              placeholder="e.g., Date, {{step3.date}}"
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            />
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> You can type static text or use variables like <code className="bg-blue-100 px-1 rounded">{"{{step1.output}}"}</code> to reference data from previous steps.
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> The selected sheet will receive data when this step executes. 
          Make sure the sheet has the appropriate columns for your data.
        </p>
      </div>
    </div>
  );
}

