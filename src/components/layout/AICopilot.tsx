"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, AlertTriangle, TrendingUp, Bot, Brain, Zap, Gem } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { hasProactiveNudges } from "@/lib/billing/limits";
import { collection, query, where, getDocs, onSnapshot, Timestamp, doc, getDoc } from "firebase/firestore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface NudgeData {
  message: string;
  prompt: string;
  details?: string;
  visible: boolean;
}

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationPlan, setOrganizationPlan] = useState<"FREE" | "PRO" | "ENTERPRISE" | null>(null);
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine context (public vs app)
  // Public paths are only specific marketing/public pages
  const publicPaths = ["/", "/pricing", "/login", "/signup", "/mobile-app", "/features", "/about"];
  const isPublicPath = pathname ? publicPaths.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  }) : false;
  // App paths are everything else (dashboard, monitor, studio, analytics, etc.)
  // Explicitly check for app routes to ensure they're detected correctly
  const appRoutes = ["/dashboard", "/monitor", "/studio", "/analytics", "/inbox", "/history", "/billing", "/settings", "/profile", "/run", "/focus"];
  const isAppPath = pathname ? (appRoutes.some(route => pathname.startsWith(route)) || !isPublicPath) : false;

  // Debug: Log pathname changes
  useEffect(() => {
    console.log("🔍 [AICopilot] Pathname changed:", pathname);
    console.log("🔍 [AICopilot] Is Public Path:", isPublicPath);
    console.log("🔍 [AICopilot] Is App Path:", isAppPath);
  }, [pathname, isPublicPath, isAppPath]);

  // Get current user and organization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserId(user?.uid || null);
      setUserEmail(user?.email || null);
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const orgId = userData.organizationId || null;
            setOrganizationId(orgId);
            // Also set email from user doc if available
            if (userData.email && !user?.email) {
              setUserEmail(userData.email);
            }
          }
        } catch (error) {
          console.error("Error fetching user organization:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch organization plan when organizationId changes
  useEffect(() => {
    if (!organizationId) {
      setOrganizationPlan(null);
      return;
    }

    const fetchOrganizationPlan = async () => {
      try {
        const orgDoc = await getDoc(doc(db, "organizations", organizationId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          // If plan doesn't exist, default to PRO for testing nudges
          // In production, this should default to "FREE"
          const plan = orgData.plan || "PRO";
          setOrganizationPlan(plan as "FREE" | "PRO" | "ENTERPRISE");
          console.log("✅ [AICopilot] Organization plan loaded:", plan, "(from org data:", orgData.plan || "not set, defaulting to PRO)");
        } else {
          console.warn("⚠️ [AICopilot] Organization not found:", organizationId);
          setOrganizationPlan("PRO"); // Default to PRO for testing if org doesn't exist
        }
      } catch (error) {
        console.error("Error fetching organization plan:", error);
        setOrganizationPlan("PRO"); // Default to PRO for testing on error
      }
    };

    fetchOrganizationPlan();
  }, [organizationId]);

  // Also use onSnapshot to listen for real-time plan changes
  useEffect(() => {
    if (!organizationId) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "organizations", organizationId),
      (orgDoc) => {
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const plan = orgData.plan || "PRO";
          setOrganizationPlan(plan as "FREE" | "PRO" | "ENTERPRISE");
          console.log("✅ [AICopilot] Organization plan updated (real-time):", plan);
        }
      },
      (error) => {
        console.error("Error listening to organization plan:", error);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  // Smart proactive nudge based on pathname and real data
  useEffect(() => {
    // Reset nudge state when pathname changes
    setNudge(null);
    setNudgeDismissed(false);
    
    // Clear any existing timeout
    if (nudgeTimeoutRef.current) {
      clearTimeout(nudgeTimeoutRef.current);
      nudgeTimeoutRef.current = null;
    }

    // Wait for organization plan to be loaded before checking
    if (organizationId && !organizationPlan) {
      console.log("🔍 [Nudge] Waiting for organization plan to load...");
      return;
    }

    // Check if organization has access to proactive nudges
    const canShowNudges = organizationPlan ? hasProactiveNudges(organizationPlan) : false;
    
    // Debug logs
    console.log("🔍 [Nudge] Pathname:", pathname);
    console.log("🔍 [Nudge] Is App Path:", isAppPath);
    console.log("🔍 [Nudge] Is Open:", isOpen);
    console.log("🔍 [Nudge] Organization ID:", organizationId);
    console.log("🔍 [Nudge] Organization Plan:", organizationPlan);
    console.log("🔍 [Nudge] Can Show Nudges:", canShowNudges);
    console.log("🔍 [Nudge] User ID:", userId);

    // Only show nudge for app paths when user is logged in and has access
    if (!isAppPath) {
      console.log("🔍 [Nudge] Skipping - not app path");
      return;
    }
    
    if (isOpen) {
      console.log("🔍 [Nudge] Skipping - chat is open");
      return;
    }
    
    if (!organizationId) {
      console.log("🔍 [Nudge] Skipping - no organization ID");
      return;
    }
    
    if (!userId) {
      console.log("🔍 [Nudge] Skipping - no user ID");
      return;
    }
    
    // Check if plan allows proactive nudges (only PRO/ENTERPRISE)
    if (!canShowNudges) {
      console.log("🔍 [Nudge] Skipping - no access to proactive nudges (plan:", organizationPlan || "null", ")");
      return;
    }

    console.log("🔍 [Nudge] Setting timeout for 4 seconds...");

    // Delay showing nudge (4 seconds) to not be annoying
    nudgeTimeoutRef.current = setTimeout(async () => {
      // Check if still valid (component might have unmounted or state changed)
      if (isOpen) {
        console.log("🔍 [Nudge] Skipping - chat is open");
        return;
      }

      console.log("🔍 [Nudge] Fetching data for pathname:", pathname);

      try {
        let nudgeData: NudgeData | null = null;

        if (pathname?.includes("/dashboard")) {
          // Check for flagged runs
          const flaggedQuery = query(
            collection(db, "active_runs"),
            where("organizationId", "==", organizationId),
            where("status", "==", "FLAGGED")
          );
          const flaggedSnapshot = await getDocs(flaggedQuery);
          const flaggedCount = flaggedSnapshot.size;

          if (flaggedCount > 0) {
            const flaggedRuns = flaggedSnapshot.docs.slice(0, 3).map(doc => ({
              id: doc.id,
              title: doc.data().title || "Untitled",
            }));

            nudgeData = {
              message: `🚩 You have ${flaggedCount} flagged run${flaggedCount > 1 ? 's' : ''}. Want to see what's wrong?`,
              prompt: `Tell me about the ${flaggedCount} flagged run${flaggedCount > 1 ? 's' : ''} and why they were flagged.`,
              details: flaggedRuns.map(r => r.title).join(", "),
              visible: true,
            };
          }
        } else if (pathname?.includes("/monitor")) {
          // Check for bottleneck runs (stuck for >24h)
          const monitorQuery = query(
            collection(db, "active_runs"),
            where("organizationId", "==", organizationId),
            where("status", "in", ["IN_PROGRESS", "FLAGGED"])
          );
          const monitorSnapshot = await getDocs(monitorQuery);
          const now = new Date();
          
          const bottlenecks = monitorSnapshot.docs
            .map(doc => {
              const data = doc.data();
              const startedAt = data.startedAt?.toDate?.() || new Date();
              const hoursSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
              return {
                id: doc.id,
                title: data.title || "Untitled",
                assignee: data.currentAssignee || "Unknown",
                hours: hoursSinceStart,
              };
            })
            .filter(r => r.hours > 24)
            .slice(0, 3);

          if (bottlenecks.length > 0) {
            const assigneeCounts: Record<string, number> = {};
            bottlenecks.forEach(b => {
              assigneeCounts[b.assignee] = (assigneeCounts[b.assignee] || 0) + 1;
            });
            const topAssignee = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

            nudgeData = {
              message: `⚠️ ${bottlenecks.length} task${bottlenecks.length > 1 ? 's' : ''} bottlenecked with ${topAssignee}. Want details?`,
              prompt: `Tell me about the tasks that are bottlenecked with ${topAssignee} and why they're stuck.`,
              details: bottlenecks.map(b => `${b.title} (${Math.round(b.hours)}h)`).join(", "),
              visible: true,
            };
          }
        } else if (pathname?.includes("/inbox")) {
          // Check for pending tasks
          const inboxQuery = query(
            collection(db, "active_runs"),
            where("organizationId", "==", organizationId),
            where("status", "in", ["IN_PROGRESS", "FLAGGED"])
          );
          const inboxSnapshot = await getDocs(inboxQuery);
          
          const userTasks = inboxSnapshot.docs.filter(doc => {
            const data = doc.data();
            // Check by email or userId
            return (
              (userEmail && data.currentAssignee === userEmail) ||
              (userId && data.currentAssigneeId === userId) ||
              (userId && data.assigneeId === userId)
            );
          });

          if (userTasks.length > 0) {
            nudgeData = {
              message: `📬 You have ${userTasks.length} task${userTasks.length > 1 ? 's' : ''}. Need help prioritizing?`,
              prompt: `Tell me about my ${userTasks.length} task${userTasks.length > 1 ? 's' : ''} and help me prioritize them.`,
              visible: true,
            };
          }
        } else if (pathname?.includes("/studio")) {
          // Suggest workflow creation - Always show
          nudgeData = {
            message: `✨ Want to build a new workflow? I can help.`,
            prompt: "Help me create a new workflow that makes my work easier.",
            visible: true,
          };
        } else if (pathname?.includes("/analytics")) {
          // Suggest insights - Always show
          nudgeData = {
            message: `📈 Want deeper insights?`,
            prompt: "Give me more insights about performance and analytics.",
            visible: true,
          };
        } else if (pathname?.includes("/history")) {
          // Suggest pattern analysis - Always show
          nudgeData = {
            message: `📊 Want to see patterns and trends?`,
            prompt: "Analyze my history and show me patterns and trends.",
            visible: true,
          };
        } else if (pathname?.includes("/dashboard")) {
          // Fallback for dashboard if no flagged runs
          nudgeData = {
            message: `💡 Want insights on workflow performance?`,
            prompt: "Give me insights about workflow performance and active processes.",
            visible: true,
          };
        }

        if (nudgeData) {
          console.log("🔍 [Nudge] Setting nudge data:", nudgeData);
          setNudge(nudgeData);
        } else {
          console.log("🔍 [Nudge] No nudge data found for this path");
        }
      } catch (error) {
        console.error("❌ [Nudge] Error fetching nudge data:", error);
      }
    }, 4000); // Delay 4 seconds

    return () => {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
        nudgeTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAppPath, isOpen, organizationId, organizationPlan, userId, userEmail]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle nudge click
  const handleNudgeClick = () => {
    if (!nudge) return;
    setNudgeDismissed(true);
    setIsOpen(true);
    setInput(nudge.prompt);
    // Auto-send the prompt after a short delay
    setTimeout(() => {
      handleFormSubmit(new Event("submit") as any);
    }, 300);
  };

  // Handle nudge dismiss
  const handleNudgeDismiss = () => {
    setNudgeDismissed(true);
    setNudge(null);
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Debug: Log current path
      console.log("🔍 [AICopilot] Current Path:", pathname);
      console.log("🔍 [AICopilot] Is Public Path:", isPublicPath);
      console.log("🔍 [AICopilot] User ID:", userId);
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ id, ...rest }) => rest),
          userId: userId,
          currentPath: pathname || "/", // Fallback to "/" if pathname is null/undefined
        }),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Failed to get response: ${response.status}`;
        try {
          const errorData = await response.text();
          console.error("API Error Response:", errorData);
          errorMessage = errorData || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // toTextStreamResponse returns plain text directly
          // We should append it as-is to preserve spaces and newlines
          // Check if it's data stream format (starts with "0:" or "d:") or plain text
          const trimmedChunk = chunk.trim();
          
          if (trimmedChunk.startsWith('0:') || trimmedChunk.startsWith('d:')) {
            // Data stream format (toDataStreamResponse)
            const lines = chunk.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;
              
              if (trimmedLine.startsWith('0:')) {
                // Text content (format: "0:text")
                const textContent = trimmedLine.substring(2);
                assistantMessage.content += textContent;
              } else if (trimmedLine.startsWith('d:')) {
                // Data content (format: "d:json")
                try {
                  const jsonStr = trimmedLine.substring(2);
                  const data = JSON.parse(jsonStr);
                  if (data.type === 'text-delta' && data.textDelta) {
                    assistantMessage.content += data.textDelta;
                  } else if (data.type === 'text' && data.text) {
                    assistantMessage.content += data.text;
                  }
                } catch (e) {
                  // If not valid JSON, skip this line
                  console.warn("Failed to parse data stream line:", trimmedLine);
                }
              } else if (trimmedLine.startsWith(':')) {
                // Comment line, skip
                continue;
              }
            }
          } else {
            // Plain text format (toTextStreamResponse) - append directly
            // This preserves all spaces, newlines, and formatting
            assistantMessage.content += chunk;
          }

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.id === assistantMessage.id) {
              updated[lastIndex] = { ...assistantMessage };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Error submitting message:", error);
      setMessages((prev) => {
        const updated = prev.slice(0, -1);
        updated.push({
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine theme based on context
  const theme = isPublicPath
    ? {
        gradient: "from-blue-500 via-cyan-500 to-blue-600",
        borderGradient: "from-blue-400 via-cyan-400 to-blue-500",
        IconComponent: MessageCircle,
        name: "Atomic Guide",
        subtitle: "Customer Support",
      }
    : {
        gradient: "from-purple-500 via-indigo-500 to-blue-600",
        borderGradient: "from-purple-400 via-indigo-400 to-blue-500",
        IconComponent: Bot,
        name: "Atomic Insight",
        subtitle: "Data Analyst",
      };

  return (
    <>
      {/* Proactive Nudge Bubble - Beautiful Glass Design */}
      <AnimatePresence>
        {nudge?.visible && !isOpen && !nudgeDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-32 right-6 z-[9998] pointer-events-auto"
            style={{ zIndex: 9998 }}
          >
            <div className="relative bg-gradient-to-br from-purple-50/95 via-indigo-50/95 to-blue-50/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-200/60 px-4 py-3 max-w-xs hover:shadow-3xl transition-all group">
              {/* Close button */}
              <button
                onClick={handleNudgeDismiss}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Close"
              >
                <X className="h-3 w-3 text-purple-600" />
              </button>
              
              {/* Message */}
              <p 
                onClick={handleNudgeClick}
                className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-purple-600 transition-colors pr-6"
              >
                {nudge.message}
              </p>
              
              {/* Details (if available) */}
              {nudge.details && (
                <p className="text-xs text-slate-600 mt-1.5 pr-6">
                  {nudge.details}
                </p>
              )}
              
              {/* Arrow pointing to chat button */}
              <div className="absolute -bottom-1 right-8 w-3 h-3 bg-gradient-to-br from-purple-50/95 to-indigo-50/95 backdrop-blur-xl border-r border-b border-purple-200/60 transform rotate-45"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button - Premium Glassmorphism Design */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-[9999] group"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
        }}
      >
        {/* The "Living" Pulsing Light Glow - Layer 1 (Outer) */}
        <motion.div
          className={`absolute -inset-4 rounded-[2.5rem] bg-gradient-to-r blur-3xl ${
            isAppPath
              ? 'from-purple-500/60 via-indigo-500/60 to-blue-600/60'
              : 'from-purple-400/60 via-blue-400/60 to-indigo-500/60'
          }`}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: 'center',
          }}
        />
        
        {/* The "Living" Pulsing Light Glow - Layer 2 (Middle) */}
        <motion.div
          className={`absolute -inset-3 rounded-[2.5rem] bg-gradient-to-r blur-2xl ${
            isAppPath
              ? 'from-purple-500/70 via-indigo-500/70 to-blue-600/70'
              : 'from-purple-400/70 via-blue-400/70 to-indigo-500/70'
          }`}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
          style={{
            transformOrigin: 'center',
          }}
        />
        
        {/* The "Living" Pulsing Light Glow - Layer 3 (Inner) */}
        <motion.div
          className={`absolute -inset-2 rounded-[2.5rem] bg-gradient-to-r blur-xl ${
            isAppPath
              ? 'from-purple-500/80 via-indigo-500/80 to-blue-600/80'
              : 'from-purple-400/80 via-blue-400/80 to-indigo-500/80'
          }`}
          animate={{
            opacity: [0.5, 0.9, 0.5],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
          style={{
            transformOrigin: 'center',
          }}
        />

        {/* The Main Glass Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex h-16 w-16 items-center justify-center rounded-[2rem] border border-purple-300/30 backdrop-blur-xl shadow-2xl transition-transform duration-300 hover:scale-105 active:scale-95 text-white ${
            isAppPath 
              ? 'bg-gradient-to-br from-purple-500/80 via-indigo-500/80 to-blue-600/80 shadow-purple-500/30' 
              : 'bg-gradient-to-br from-purple-500/80 via-blue-500/80 to-indigo-600/80 shadow-purple-500/30'
          }`}
          aria-label="Open AI Copilot"
        >
          {/* An extra subtle inner ring for premium feel */}
          <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10"></div>

          {/* The Icon (Dynamic based on mode) */}
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            {isOpen ? (
              <X className="h-7 w-7 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" strokeWidth={2.5} />
            ) : (
              <div className="relative">
                <theme.IconComponent
                  className={`h-8 w-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
                  strokeWidth={2}
                  fill="currentColor"
                  fillOpacity={0.2}
                />
                {/* Subtle sparkle for app mode */}
                {isAppPath && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-28 right-6 z-[9999] w-[90vw] max-w-md rounded-[2rem] bg-white/80 backdrop-blur-2xl border-2 shadow-2xl overflow-hidden ${
              isPublicPath
                ? "border-blue-200/50 shadow-blue-500/20"
                : "border-purple-200/50 shadow-purple-500/20"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-5 border-b ${
                isPublicPath ? "bg-gradient-to-r from-blue-50/80 to-cyan-50/80" : "bg-gradient-to-r from-purple-50/80 to-indigo-50/80"
              } border-slate-200/50`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} shadow-lg`}
                >
                  <theme.IconComponent 
                    className="h-6 w-6 text-white" 
                    strokeWidth={2}
                    fill="white"
                    fillOpacity={0.2}
                  />
                  {!isPublicPath && (
                    <Sparkles className="h-3 w-3 text-white absolute -top-0.5 -right-0.5" strokeWidth={2.5} fill="white" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{theme.name}</h3>
                  <p className="text-xs text-slate-600">{theme.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="h-[450px] overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white/90 to-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div
                    className={`relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${theme.gradient} mb-5 shadow-xl`}
                  >
                    <theme.IconComponent 
                      className="h-10 w-10 text-white" 
                      strokeWidth={2}
                      fill="white"
                      fillOpacity={0.2}
                    />
                    {!isPublicPath && (
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} fill="white" />
                      </motion.div>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {isPublicPath ? "Welcome to Atomic Work!" : "Your AI Co-pilot"}
                  </h4>
                  <p className="text-sm text-slate-600 max-w-xs">
                    {isPublicPath
                      ? "I can help you understand features, pricing, and how to get started."
                      : "I analyze your workflows, identify bottlenecks, and suggest improvements."}
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? `bg-gradient-to-br ${theme.gradient} text-white shadow-lg`
                            : "bg-white/90 backdrop-blur-sm border border-slate-200/50 text-slate-900 shadow-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-slate-400"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="p-5 border-t border-slate-200/50 bg-white/60 backdrop-blur-sm">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isPublicPath ? "Ask about features or pricing..." : "Ask about your workflows..."}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

