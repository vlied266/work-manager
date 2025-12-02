"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Comment } from "@/types/schema";
import { MessageSquare, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

interface TaskChatProps {
  runId: string;
  currentStepId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
}

export function TaskChat({
  runId,
  currentStepId,
  userId,
  userName,
  userAvatar,
  userEmail,
}: TaskChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !runId) return;

    const q = query(
      collection(db, "active_runs", runId, "comments"),
      where("stepId", "==", currentStepId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [isOpen, runId, currentStepId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [comments, isOpen]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !runId || !currentStepId) return;

    setSending(true);
    try {
      await addDoc(collection(db, "active_runs", runId, "comments"), {
        stepId: currentStepId,
        userId,
        userName,
        userAvatar: userAvatar || undefined,
        userEmail,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      // Create notification for other participants
      // Get the run to find other participants
      try {
        const runDoc = await getDoc(doc(db, "active_runs", runId));
        if (runDoc.exists()) {
          const runData = runDoc.data();
          // Get unique user IDs from comments (excluding current user)
          const commentsSnapshot = await query(
            collection(db, "active_runs", runId, "comments"),
            where("userId", "!=", userId)
          );
          
          // For simplicity, notify the run starter or assignee
          // In a real implementation, you'd notify all participants
          const notificationUserId = runData.startedBy || userId; // TODO: Get actual assignee
          
          if (notificationUserId !== userId) {
            await addDoc(collection(db, "notifications"), {
              recipientId: notificationUserId,
              triggerBy: {
                userId: userId,
                name: userName,
                avatar: userAvatar || undefined,
              },
              type: "COMMENT",
              title: `New Comment on: ${runData.procedureTitle || "Task"}`,
              message: `${userName} commented: "${newComment.trim().substring(0, 50)}${newComment.trim().length > 50 ? "..." : ""}"`,
              link: `/run/${runId}`,
              isRead: false,
              createdAt: serverTimestamp(),
              runId: runId,
              stepId: currentStepId,
            });
          }
        }
      } catch (notifError) {
        console.error("Error creating comment notification:", notifError);
        // Don't block comment creation if notification fails
      }

      setNewComment("");
    } catch (error) {
      console.error("Error sending comment:", error);
      alert("Failed to send comment. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Discuss</span>
      </button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20"
              onClick={() => setIsOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Task Discussion</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">No comments yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Start the conversation by adding a comment
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isOwn = comment.userId === userId;
                    return (
                      <div
                        key={comment.id}
                        className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {comment.userAvatar ? (
                            <img
                              src={comment.userAvatar}
                              alt={comment.userName}
                              className="h-8 w-8 rounded-full object-cover border-2 border-slate-200"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold border-2 border-slate-200">
                              {comment.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* Message */}
                        <div className={`flex-1 max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                          {!isOwn && (
                            <p className="text-xs font-semibold text-slate-600 mb-1">
                              {comment.userName}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isOwn
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {comment.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-blue-100" : "text-slate-500"
                              }`}
                            >
                              {formatTime(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    placeholder="Type your message..."
                    rows={2}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!newComment.trim() || sending}
                    className="flex-shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

