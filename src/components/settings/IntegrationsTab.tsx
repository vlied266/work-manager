"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc, collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useOrgId } from "@/hooks/useOrgData";
import { 
  MessageSquare,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  HardDrive
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function IntegrationsTab() {
  const organizationId = useOrgId();
  const searchParams = useSearchParams();
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [savingSlack, setSavingSlack] = useState(false);
  const [slackError, setSlackError] = useState<string | null>(null);
  const [slackConnected, setSlackConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  // Check if Slack is connected from URL params and Firestore
  useEffect(() => {
    // Check URL params first
    const slackStatus = searchParams?.get('slack');
    if (slackStatus === 'success' || slackStatus === 'message_sent' || slackStatus === 'debug_done') {
      setSlackConnected(true);
      // Clear the query param after showing success
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('slack');
        window.history.replaceState({}, '', url.toString());
      }
    }

    // Also check Firestore for existing Slack integration
    const checkSlackIntegration = async () => {
      try {
        const slackIntegrationsRef = collection(db, 'slack_integrations');
        const q = query(slackIntegrationsRef);
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setSlackConnected(true);
        }
      } catch (error) {
        console.error('Error checking Slack integration:', error);
      }
    };

    checkSlackIntegration();

    // Check Google connection from URL params
    const googleStatus = searchParams?.get('google');
    if (googleStatus === 'connected') {
      setGoogleConnected(true);
      // Clear the query param after showing success
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('google');
        window.history.replaceState({}, '', url.toString());
      }
    }

    // Also check Firestore for existing Google integration
    const checkGoogleIntegration = async () => {
      try {
        const integrationsRef = collection(db, 'integrations');
        const q = query(integrationsRef);
        const snapshot = await getDocs(q);
        const hasGoogleIntegration = snapshot.docs.some(doc => doc.id.startsWith('google_'));
        if (hasGoogleIntegration) {
          setGoogleConnected(true);
        }
      } catch (error) {
        console.error('Error checking Google integration:', error);
      }
    };

    checkGoogleIntegration();
  }, [searchParams]);

  return (
    <div className="space-y-8">
      {/* Integrations Card */}
      <div className="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Integrations
          </h2>
        </div>

        <div className="space-y-6">
          {/* Slack Integration */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Slack Notifications</h3>
                  <p className="text-sm text-slate-600">Get notified in Slack when new tasks are created</p>
                </div>
              </div>
              {slackConnected && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              )}
            </div>

            {!slackConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Connect your Slack workspace to receive notifications directly in your channels.
                </p>
                <Link
                  href="/api/integrations/slack/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
                >
                  <MessageSquare className="h-4 w-4" />
                  Connect Slack
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Slack integration is active! You'll receive notifications in your connected channel.
                  </p>
                </div>
                <Link
                  href="/api/integrations/slack/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
                >
                  Reconnect Slack
                </Link>
              </div>
            )}

            {/* Legacy Webhook URL Input (Optional - for manual setup) */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Manual Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  value={slackWebhookUrl}
                  onChange={(e) => {
                    setSlackWebhookUrl(e.target.value);
                    setSlackError(null);
                  }}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                {slackError && (
                  <p className="text-xs text-rose-600 font-medium">{slackError}</p>
                )}
                <p className="text-xs text-slate-500">
                  Alternatively, you can manually enter a webhook URL
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={async () => {
                    // Validate URL
                    if (slackWebhookUrl.trim() && !slackWebhookUrl.trim().startsWith("https://hooks.slack.com/")) {
                      setSlackError("Invalid Slack webhook URL. Must start with https://hooks.slack.com/");
                      return;
                    }

                    setSavingSlack(true);
                    setSlackError(null);
                    try {
                      await updateDoc(doc(db, "organizations", organizationId!), {
                        slackWebhookUrl: slackWebhookUrl.trim() || null,
                        updatedAt: new Date(),
                      });
                      alert("Slack integration saved successfully!");
                    } catch (error) {
                      console.error("Error saving Slack webhook:", error);
                      setSlackError("Failed to save Slack webhook. Please try again.");
                    } finally {
                      setSavingSlack(false);
                    }
                  }}
                  disabled={savingSlack || !organizationId}
                  className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg disabled:opacity-50"
                >
                  {savingSlack ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Webhook
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Google Sheets Integration */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Google Sheets</h3>
                  <p className="text-sm text-slate-600">Connect Google Sheets to export and sync data</p>
                </div>
              </div>
              {googleConnected && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              )}
            </div>

            {!googleConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Connect your Google account to access and manage Google Sheets from Atomic Work.
                </p>
                <Link
                  href="/api/integrations/google/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Connect Google Sheets
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Google Sheets integration is active! You can now access and manage your spreadsheets.
                  </p>
                </div>
                <Link
                  href="/api/integrations/google/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
                >
                  Reconnect Google Sheets
                </Link>
              </div>
            )}
          </div>

          {/* Google Drive Integration */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Google Drive</h3>
                  <p className="text-sm text-slate-600">Connect Google Drive to access and manage your files</p>
                </div>
              </div>
              {googleConnected && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              )}
            </div>

            {!googleConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Connect your Google account to access and manage files from Google Drive.
                </p>
                <Link
                  href="/api/integrations/google/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                  <HardDrive className="h-4 w-4" />
                  Connect Google Drive
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Google Drive integration is active! You can now access and manage your files.
                  </p>
                </div>
                <Link
                  href="/api/integrations/google/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md"
                >
                  Reconnect Google Drive
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

