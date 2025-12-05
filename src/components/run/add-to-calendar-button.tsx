"use client";

import { useState } from "react";
import { Calendar, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { requestCalendarPermissions } from "@/lib/google-calendar";
import { auth } from "@/lib/firebase";

interface AddToCalendarButtonProps {
  title: string;
  description?: string;
  startTime?: Date;
  duration?: number; // in minutes
  className?: string;
}

export function AddToCalendarButton({
  title,
  description,
  startTime,
  duration = 60,
  className = "",
}: AddToCalendarButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddToCalendar = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to add events to your calendar.");
        setLoading(false);
        return;
      }

      // Check if user signed in with Google
      const providerData = user.providerData.find(
        (provider) => provider.providerId === "google.com"
      );

      if (!providerData) {
        // User needs to sign in with Google first
        setError("Please sign in with Google to use this feature.");
        setLoading(false);
        return;
      }

      // Request calendar permissions and get access token
      const accessToken = await requestCalendarPermissions();

      if (!accessToken) {
        setError("Failed to get Google Calendar access. Please try again.");
        setLoading(false);
        return;
      }

      // Prepare event data
      const eventStartTime = startTime || new Date();
      const eventData = {
        title,
        description: description || `Task: ${title}`,
        startTime: eventStartTime.toISOString(),
        duration,
        accessToken,
      };

      // Call API to create calendar event
      const response = await fetch("/api/integrations/google-calendar/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create calendar event");
      }

      // Success - show message and open calendar link
      setSuccess(true);
      
      // Open Google Calendar link in new tab
      if (data.htmlLink) {
        window.open(data.htmlLink, "_blank");
      }

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error adding to calendar:", err);
      setError(err.message || "Failed to add event to calendar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleAddToCalendar}
        disabled={loading || success}
        className="inline-flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add to Google Calendar"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Added!
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 z-50 rounded-lg bg-rose-50 border border-rose-200 p-3 shadow-lg max-w-xs">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
