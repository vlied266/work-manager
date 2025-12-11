"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useOrganization } from "@/contexts/OrganizationContext";
import { MessageCircle, Send, Loader2, User, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  recordId: string;
  collectionId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  message: string;
  type: "USER_COMMENT" | "SYSTEM_LOG";
  createdAt: Date;
  organizationId: string;
}

interface RecordActivityProps {
  recordId: string;
  collectionId: string;
}

export function RecordActivity({ recordId, collectionId }: RecordActivityProps) {
  const { organizationId, userProfile } = useOrganization();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Subscribe to comments in real-time
  useEffect(() => {
    if (!recordId || !collectionId || !organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const commentsQuery = query(
      collection(db, "comments"),
      where("recordId", "==", recordId),
      where("collectionId", "==", collectionId),
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const commentsData: Comment[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Comment;
        });
        setComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [recordId, collectionId, organizationId]);

  const handleSendComment = async () => {
    if (!message.trim() || !userProfile || !organizationId || sending) return;

    try {
      setSending(true);

      await addDoc(collection(db, "comments"), {
        recordId,
        collectionId,
        userId: userProfile.uid,
        userName: userProfile.displayName || userProfile.email || "Unknown User",
        userEmail: userProfile.email || null,
        message: message.trim(),
        type: "USER_COMMENT",
        organizationId,
        createdAt: Timestamp.now(),
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending comment:", error);
      alert("Failed to send comment. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/50 to-white/30">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="relative mb-4 inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-2xl" />
              <div className="relative h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-lg">
                <MessageCircle className="h-8 w-8 text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">No activity yet</h3>
            <p className="text-sm text-slate-600 font-medium">
              Start a conversation about this record
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-3 ${
                  comment.type === "SYSTEM_LOG" ? "items-center" : "items-start"
                }`}
              >
                {comment.type === "USER_COMMENT" ? (
                  <>
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-extrabold shadow-lg">
                        {getInitials(comment.userName)}
                      </div>
                    </div>

                    {/* Message Bubble */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-extrabold text-slate-900">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 shadow-sm">
                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">
                          {comment.message}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* System Log */}
                    <div className="flex-1 flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {comment.message} • {formatTime(comment.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/60 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              placeholder="Add a comment..."
              rows={3}
              className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 shadow-sm focus:shadow-md transition-all resize-none"
            />
          </div>
          <button
            onClick={handleSendComment}
            disabled={!message.trim() || sending || !userProfile}
            className="flex-shrink-0 h-[calc(3rem+24px)] px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

