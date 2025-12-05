"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, CheckCircle2, XCircle, ExternalLink, Download } from "lucide-react";
import { requestSheetsPermissions, extractSpreadsheetId, getStoredSheetsToken } from "@/lib/google-sheets";
import { auth } from "@/lib/firebase";

interface GoogleSheetPickerProps {
  onDataImported?: (data: any[]) => void;
  className?: string;
}

export function GoogleSheetPicker({ onDataImported, className = "" }: GoogleSheetPickerProps) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [range, setRange] = useState("A1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fetchedData, setFetchedData] = useState<any[] | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setFetchedData(null);
    setPreviewVisible(false);

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to import data from Google Sheets.");
        setLoading(false);
        return;
      }

      // Check if user signed in with Google
      const providerData = user.providerData.find(
        (provider) => provider.providerId === "google.com"
      );

      if (!providerData) {
        setError("Please sign in with Google to use this feature.");
        setLoading(false);
        return;
      }

      // Extract spreadsheet ID from URL
      const spreadsheetId = extractSpreadsheetId(sheetUrl);
      if (!spreadsheetId) {
        setError("Invalid Google Sheets URL. Please paste a valid Google Sheets URL.");
        setLoading(false);
        return;
      }

      // Get access token (request permissions if needed)
      let accessToken = getStoredSheetsToken();
      
      if (!accessToken) {
        // Request permissions and get token
        accessToken = await requestSheetsPermissions();
        
        if (!accessToken) {
          setError("Failed to get Google Sheets access. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Call API to fetch data
      const response = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetId,
          range,
          accessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data from Google Sheets");
      }

      // Success - show preview
      setFetchedData(data.data);
      setPreviewVisible(true);
      setSuccess(true);

      // Call callback if provided
      if (onDataImported) {
        onDataImported(data.data);
      }

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error importing from Google Sheets:", err);
      setError(err.message || "Failed to import data from Google Sheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (fetchedData && onDataImported) {
      onDataImported(fetchedData);
      setPreviewVisible(false);
      setSheetUrl("");
      setRange("A1");
      setFetchedData(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Import from Google Sheets</h3>
            <p className="text-sm text-slate-600">Paste your Google Sheets URL to import data</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Sheet URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Google Sheets URL
            </label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit"
              className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              Make sure the sheet is shared with your Google account
            </p>
          </div>

          {/* Range Input (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Range (Optional)
            </label>
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="A1 or Sheet1!A1:Z100"
              className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave as "A1" to test connection, or specify a range like "A1:Z100"
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-900">Error</p>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && !previewVisible && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Success!</p>
                <p className="text-sm text-green-700">Data fetched successfully. Preview below.</p>
              </div>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!sheetUrl.trim() || loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching Data...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import from Google Sheets
              </>
            )}
          </button>
        </div>
      </div>

      {/* Data Preview */}
      {previewVisible && fetchedData && (
        <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Preview Data</h3>
            <button
              onClick={() => setPreviewVisible(false)}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {Object.keys(fetchedData[0] || {}).map((key, index) => (
                    <th
                      key={index}
                      className="text-left py-2 px-3 font-semibold text-slate-700 bg-slate-50"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fetchedData.slice(0, 10).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    {Object.values(row).map((cell: any, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-3 text-slate-700">
                        {String(cell || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {fetchedData.length > 10 && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Showing first 10 rows of {fetchedData.length} total rows
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleConfirmImport}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Import
            </button>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              Open Sheet
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

