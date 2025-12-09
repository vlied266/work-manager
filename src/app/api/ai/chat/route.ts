import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getAdminDb } from "@/lib/firebase-admin";
import { hasAtomicInsight } from "@/lib/billing/limits";

// Determine persona based on current path
function getPersonaFromPath(currentPath: string): {
  role: string;
  systemPrompt: string;
} {
  // Explicitly check for app routes first
  const isAppRoute = 
    currentPath?.startsWith('/dashboard') || 
    currentPath?.startsWith('/monitor') || 
    currentPath?.startsWith('/analytics') || 
    currentPath?.startsWith('/studio') ||
    currentPath?.startsWith('/inbox') ||
    currentPath?.startsWith('/history') ||
    currentPath?.startsWith('/billing') ||
    currentPath?.startsWith('/settings') ||
    currentPath?.startsWith('/run/') ||
    currentPath?.startsWith('/focus');

  // Public paths (marketing/landing pages)
  const publicPaths = ["/", "/pricing", "/login", "/signup", "/mobile-app", "/features", "/about"];

  if (isAppRoute) {
    console.log("✅ SWITCHING TO ANALYST MODE - App Route Detected:", currentPath);
    return {
      role: "Senior Data Analyst & Co-pilot",
      systemPrompt: `You are Atomic Insight, a senior data analyst and co-pilot for Atomic Work. Your role is to:
- Analyze provided data and identify bottlenecks
- Suggest workflow improvements
- Help users build and optimize processes
- Provide actionable insights based on real-time data
- Answer questions about workflow execution, monitoring, and optimization

Be analytical, precise, and data-driven. Focus on actionable recommendations. When discussing workflows, be specific and reference actual data when available.`,
    };
  } else if (publicPaths.some((path) => currentPath?.startsWith(path))) {
    console.log("✅ SWITCHING TO SUPPORT MODE - Public Route Detected:", currentPath);
    return {
      role: "Customer Support & Sales Agent",
      systemPrompt: `You are the Atomic Work Guide, a friendly and knowledgeable customer support and sales agent. Your role is to help visitors understand:
- Product value and features
- Pricing plans and benefits
- How to get started
- Use cases and examples

Be conversational, helpful, and focus on converting visitors into users. Always be positive and encouraging.`,
    };
  } else {
    // Default to app mode for unknown routes (likely app routes)
    console.log("⚠️ Unknown route, defaulting to ANALYST MODE:", currentPath);
    return {
      role: "Senior Data Analyst & Co-pilot",
      systemPrompt: `You are Atomic Insight, a senior data analyst and co-pilot for Atomic Work. Your role is to:
- Analyze provided data and identify bottlenecks
- Suggest workflow improvements
- Help users build and optimize processes
- Provide actionable insights based on real-time data

Be analytical, precise, and data-driven. Focus on actionable recommendations.`,
    };
  }
}

// Fetch real-time data for app context
async function fetchAppContext(userId: string, organizationId?: string) {
  try {
    const db = getAdminDb();
    const context: any = {
      activeRuns: [],
      statistics: {
        totalRuns: 0,
        inProgress: 0,
        completed: 0,
        flagged: 0,
        bottlenecks: [],
      },
    };

    if (!organizationId) {
      // Try to get organizationId from user
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        organizationId = userData?.organizationId;
      }
    }

    if (!organizationId) {
      return context;
    }

    // Fetch active runs
    const runsSnapshot = await db
      .collection("active_runs")
      .where("organizationId", "==", organizationId)
      .get();

    const runs: any[] = [];
    runsSnapshot.forEach((doc) => {
      const data = doc.data();
      runs.push({
        id: doc.id,
        status: data.status,
        title: data.title,
        currentStepIndex: data.currentStepIndex,
        currentAssignee: data.currentAssignee,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || null,
      });
    });

    context.activeRuns = runs;

    // Calculate statistics
    context.statistics.totalRuns = runs.length;
    context.statistics.inProgress = runs.filter((r) => r.status === "IN_PROGRESS").length;
    context.statistics.completed = runs.filter((r) => r.status === "COMPLETED").length;
    context.statistics.flagged = runs.filter((r) => r.status === "FLAGGED").length;

    // Identify bottlenecks (runs stuck in progress for >24h)
    const now = new Date();
    const bottlenecks = runs
      .filter((r) => {
        if (r.status !== "IN_PROGRESS") return false;
        if (!r.startedAt) return false;
        const hoursSinceStart = (now.getTime() - new Date(r.startedAt).getTime()) / (1000 * 60 * 60);
        return hoursSinceStart > 24;
      })
      .map((r) => ({
        id: r.id,
        title: r.title,
        currentAssignee: r.currentAssignee,
        currentStepIndex: r.currentStepIndex,
      }));

    context.statistics.bottlenecks = bottlenecks;

    return context;
  } catch (error) {
    console.error("Error fetching app context:", error);
    return {
      activeRuns: [],
      statistics: {
        totalRuns: 0,
        inProgress: 0,
        completed: 0,
        flagged: 0,
        bottlenecks: [],
      },
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userId, currentPath } = body;

    // Debug: Log received data
    console.log("🔍 [API] ========== CHAT REQUEST ==========");
    console.log("🔍 [API] Received currentPath:", currentPath);
    console.log("🔍 [API] Received userId:", userId);
    console.log("🔍 [API] Messages count:", messages?.length);
    console.log("🔍 [API] Chat Request from Path:", currentPath);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Determine persona based on path
    const pathToUse = currentPath || "/";
    console.log("🔍 [API] Using path for persona determination:", pathToUse);
    
    // Explicitly check for app routes
    const isAppRoute = 
      pathToUse?.startsWith('/dashboard') || 
      pathToUse?.startsWith('/monitor') || 
      pathToUse?.startsWith('/analytics') || 
      pathToUse?.startsWith('/studio') ||
      pathToUse?.startsWith('/inbox') ||
      pathToUse?.startsWith('/history') ||
      pathToUse?.startsWith('/billing') ||
      pathToUse?.startsWith('/settings') ||
      pathToUse?.startsWith('/run/') ||
      pathToUse?.startsWith('/focus');

    console.log("🔍 [API] Is App Route:", isAppRoute);

    const basePersona = getPersonaFromPath(pathToUse);
    console.log("🔍 [API] Selected persona role:", basePersona.role);
    console.log("🔍 [API] ==================================");

    // Check plan access for Atomic Insight (Data Analyst Persona)
    let hasAccessToAtomicInsight = false;
    let organizationPlan: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
    let finalPersona = basePersona;
    
    if (isAppRoute && userId) {
      try {
        const db = getAdminDb();
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const orgId = userData?.organizationId;
          
          if (orgId) {
            const orgDoc = await db.collection("organizations").doc(orgId).get();
            if (orgDoc.exists) {
              const orgData = orgDoc.data();
              organizationPlan = (orgData?.plan || "FREE").toUpperCase() as "FREE" | "PRO" | "ENTERPRISE";
              hasAccessToAtomicInsight = hasAtomicInsight(organizationPlan);
              
              console.log("🔍 [API] Organization plan:", organizationPlan);
              console.log("🔍 [API] Has Atomic Insight access:", hasAccessToAtomicInsight);
              
              // If FREE plan and trying to use Atomic Insight, restrict to Basic AI
              if (!hasAccessToAtomicInsight) {
                console.log("⚠️ [API] FREE plan detected - restricting to Basic AI Support");
                // Override persona for FREE plan users
                finalPersona = {
                  role: "Customer Support & Sales Agent",
                  systemPrompt: `You are the Atomic Work Guide, a friendly and knowledgeable customer support agent. You can help with:
- General questions about workflows
- Documentation and how-to guides
- Basic troubleshooting

Note: Advanced data analysis and Atomic Insight features are available on Pro and Enterprise plans. For real-time data analysis, bottleneck detection, and proactive insights, please upgrade your plan.`,
                };
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking organization plan:", error);
        // Continue with default behavior if check fails
      }
    }

    // Fetch app context if in app mode and has access
    let appContext = null;
    
    if (isAppRoute && hasAccessToAtomicInsight) {
      if (userId) {
        console.log("🔍 [API] Fetching app context for userId:", userId);
        appContext = await fetchAppContext(userId);
        console.log("🔍 [API] App context fetched:", {
          totalRuns: appContext.statistics.totalRuns,
          bottlenecks: appContext.statistics.bottlenecks.length,
        });
      } else {
        console.log("🔍 [API] No userId provided, skipping app context");
      }
    } else if (isAppRoute && !hasAccessToAtomicInsight) {
      console.log("🔍 [API] No Atomic Insight access - using Basic AI Support");
    } else {
      console.log("🔍 [API] Public route - skipping app context fetch");
    }

    // Build system prompt
    let systemPrompt = finalPersona.systemPrompt;

    if (appContext) {
      systemPrompt += `\n\nCURRENT SYSTEM DATA (JSON):
${JSON.stringify(appContext.statistics, null, 2)}

ACTIVE RUNS (Sample):
${JSON.stringify(appContext.activeRuns.slice(0, 10), null, 2)}

Use this data to provide insights, identify bottlenecks, and suggest improvements.`;
    }

    // Call OpenAI
    const result = await streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

