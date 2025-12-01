"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";

export default function NotificationsPage() {
  const { firebaseUser } = useAuth();
  const { notifications, unreadCount, loading, error, markAsRead, markAllRead } = useNotifications();

  const createSampleReminder = async () => {
    if (!firebaseUser) return;
    await addDoc(collection(db, "notifications"), {
      userId: firebaseUser.uid,
      title: "Pending task reminder",
      body: "Follow up on the reconciliation flagged earlier today.",
      createdAt: serverTimestamp(),
      read: false,
      actionLink: "/inbox",
    });
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Notifications</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold text-ink">Reminders & Alerts</h1>
          <div className="flex gap-3">
            <button
              onClick={createSampleReminder}
              className="rounded-2xl border-2 border-ink/30 bg-white px-4 py-2 text-xs font-bold text-ink shadow-sm transition-all hover:border-accent hover:bg-accent/10 hover:shadow-md"
            >
              Generate sample reminder
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="rounded-2xl border-2 border-ink/30 bg-white px-4 py-2 text-xs font-bold text-ink shadow-sm transition-all hover:border-accent hover:bg-accent/10 hover:shadow-md"
              >
                Mark all as read ({unreadCount})
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          Loading notifications…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-subtle">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
          No notifications at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((note) => (
            <article
              key={note.id}
              className={`rounded-3xl border px-6 py-5 shadow-subtle ${
                note.read ? "border-white/70 bg-white/80" : "border-accent/30 bg-accent/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{note.title}</h2>
                  <p className="text-sm text-muted">{note.body}</p>
                </div>
                {!note.read && (
                  <button
                    onClick={() => markAsRead(note.id)}
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink"
                  >
                    Mark read
                  </button>
                )}
              </div>
              {note.actionLink && (
                <Link href={note.actionLink} className="mt-3 inline-flex text-sm font-semibold text-accent">
                  View task →
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

