"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Procedure } from "@/types/schema";

interface TriggerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: Procedure | null;
  onSave: (trigger: Procedure["trigger"]) => void;
}

export function TriggerConfigModal({
  isOpen,
  onClose,
  procedure,
  onSave,
}: TriggerConfigModalProps) {
  const [triggerType, setTriggerType] = useState<"MANUAL" | "ON_FILE_CREATED" | "WEBHOOK">("MANUAL");
  const [folderPath, setFolderPath] = useState("");
  const [provider, setProvider] = useState<"google_drive" | "dropbox" | "local">("google_drive");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialize from procedure
  useEffect(() => {
    if (procedure?.trigger) {
      setTriggerType(procedure.trigger.type);
      if (procedure.trigger.config) {
        setFolderPath(procedure.trigger.config.folderPath || "");
        setProvider(procedure.trigger.config.provider || "google_drive");
        setWebhookUrl(procedure.trigger.config.webhookUrl || "");
        setWebhookSecret(procedure.trigger.config.webhookSecret || "");
      }
    } else {
      setTriggerType("MANUAL");
      setFolderPath("");
      setProvider("google_drive");
      setWebhookUrl("");
      setWebhookSecret("");
    }
  }, [procedure, isOpen]);

  // Generate webhook URL when procedure ID is available
  useEffect(() => {
    if (triggerType === "WEBHOOK" && procedure?.id && !procedure.id.startsWith("temp-")) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const generatedUrl = `${baseUrl}/api/runs/trigger?procedureId=${procedure.id}`;
      setWebhookUrl(generatedUrl);
      
      // Generate a random secret if not already set
      if (!webhookSecret) {
        const randomSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setWebhookSecret(randomSecret);
      }
    }
  }, [triggerType, procedure?.id]);

  const handleSave = () => {
    let triggerConfig: Procedure["trigger"] = undefined;

    if (triggerType === "MANUAL") {
      triggerConfig = undefined; // No trigger for manual
    } else if (triggerType === "ON_FILE_CREATED") {
      triggerConfig = {
        type: "ON_FILE_CREATED",
        config: {
          folderPath: folderPath.trim() || undefined,
          provider: provider,
        },
      };
    } else if (triggerType === "WEBHOOK") {
      triggerConfig = {
        type: "WEBHOOK",
        config: {
          webhookUrl: webhookUrl || undefined,
          webhookSecret: webhookSecret || undefined,
        },
      };
    }

    onSave(triggerConfig);
    onClose();
  };

  const handleCopyWebhookUrl = async () => {
    if (webhookUrl) {
      try {
        await navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  const handleCopySecret = async () => {
    if (webhookSecret) {
      try {
        await navigator.clipboard.writeText(webhookSecret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Trigger Settings</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-6">
            {/* Trigger Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as typeof triggerType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              >
                <option value="MANUAL">Manual (User starts workflow)</option>
                <option value="ON_FILE_CREATED">File Watcher (Auto-start on file creation)</option>
                <option value="WEBHOOK">Webhook (External system triggers)</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                {triggerType === "MANUAL" && "Workflow starts when user clicks 'Start Procedure'"}
                {triggerType === "ON_FILE_CREATED" && "Workflow automatically starts when a file is created in the watched folder"}
                {triggerType === "WEBHOOK" && "Workflow starts when an external system sends a POST request to the webhook URL"}
              </p>
            </div>

            {/* File Watcher Configuration */}
            {triggerType === "ON_FILE_CREATED" && (
              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as typeof provider)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    <option value="google_drive">Google Drive</option>
                    <option value="dropbox">Dropbox</option>
                    <option value="local">Local Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Path
                  </label>
                  <input
                    type="text"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="/invoices or /uploads/contracts"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    The folder path to watch for new files (e.g., "/invoices", "/uploads/contracts")
                  </p>
                </div>
              </div>
            )}

            {/* Webhook Configuration */}
            {triggerType === "WEBHOOK" && (
              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                {procedure?.id && !procedure.id.startsWith("temp-") ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={webhookUrl}
                          readOnly
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                        <button
                          onClick={handleCopyWebhookUrl}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-xs">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span className="text-xs">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        Send a POST request to this URL to trigger the workflow
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Secret (Optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                          placeholder="Auto-generated secret"
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors font-mono text-xs"
                        />
                        <button
                          onClick={handleCopySecret}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-xs">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span className="text-xs">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        Include this secret in the Authorization header for webhook verification
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      Please save the procedure first to generate a webhook URL.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Save Trigger Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

