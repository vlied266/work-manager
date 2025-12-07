import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs"; // Changed from edge to use Firebase Admin SDK

const APP_DOCUMENTATION = `
ATOMIC WORK KNOWLEDGE BASE:

NAVIGATION GUIDE:

1. **Studio** (/studio):
   - Where workflows are built and edited.
   - Three ways to create:
     a) AI Builder: Describe what you want, AI builds the workflow automatically.
     b) From Scratch: Use drag-and-drop editor to build manually.
     c) Templates: Pick from pre-built workflow templates (HR, Finance, Sales, etc.).
   - Access: Sidebar → "Studio"

2. **Inbox** (/inbox):
   - Where users see tasks assigned to them.
   - Click on a task card to open and complete it.
   - Access: Sidebar → "My Tasks" or "Inbox"

3. **Monitor** (/monitor):
   - Admin dashboard to track all active processes.
   - Shows stalled processes, bottlenecks, and allows reassignment.
   - Access: Sidebar → "Monitor" (Admin only)

4. **Templates Gallery** (/explore-templates or /studio/templates):
   - Pre-built workflows for common business processes.
   - Categories: HR, Finance, Sales, Operations, etc.
   - Access: Sidebar → "Explore Templates" or Studio → "Templates"

5. **Settings** (/settings):
   - Manage organization profile, integrations (Google Sheets, Slack).
   - Access: Sidebar → "Settings"

6. **Billing** (/billing):
   - View current plan, upgrade, manage subscription.
   - Access: Sidebar → "Billing" (Admin only)

PLANS & LIMITS:

- **Free Plan**: 3 active processes, basic features.
- **Pro Plan**: Unlimited processes, Google Sheet integration, advanced features.
- **Enterprise Plan**: 24/7 Support, Dedicated Manager, custom integrations.

HOW TO CREATE A PROCESS:

1. Go to "Studio" from the sidebar.
2. Click "Create Procedure" or use the AI Builder.
3. Choose one of three options:
   - AI Builder: Type your process description, AI builds it automatically.
   - From Scratch: Use the visual editor to build manually.
   - Templates: Select a pre-made template and customize it.

HOW TO EXECUTE TASKS:

1. Go to "Inbox" (My Tasks).
2. You'll see all tasks assigned to you.
3. Click on a task card to open it.
4. Complete the required form or action.
5. Submit to move to the next step.

TROUBLESHOOTING:

- If a process is stuck: Ask an Admin to check the "Monitor" page and use "Reassign" or "Nudge" buttons.
- If you can't find a feature: Check your plan limits in Settings → Billing.
- For help with workflow creation: Use the AI Builder in Studio or browse Templates.

FEATURES:

- **AI-Powered Workflow Generation**: Describe your process, AI builds it.
- **Google Sheets Integration**: Automatically save data to spreadsheets.
- **Task Assignment**: Assign steps to specific team members or roles.
- **Process Monitoring**: Track active processes and identify bottlenecks.
- **Template Library**: Pre-built workflows for common business processes.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Build base system prompt
    let systemPrompt = `You are the AI assistant for Atomic Work, a B2B SaaS platform that helps teams break down complex processes into atomic, executable workflows.

Your role is to:
- Help users understand how Atomic Work can transform their business processes
- Explain features like workflow automation, task management, and process execution
- Provide guidance on breaking down complex tasks into atomic units
- Answer questions about the platform's capabilities
- Guide users to the right features using the navigation paths provided
- Be professional, concise, and helpful

Keep responses clear and actionable. If asked about something outside Atomic Work's scope, politely redirect to relevant features or suggest how Atomic Work could help.`;

    // Add product knowledge
    systemPrompt += `\n\n${APP_DOCUMENTATION}`;

    // Add user context if logged in
    if (userId && typeof userId === "string") {
      try {
        const db = getAdminDb();
        
        // Fetch user document
        const userDoc = await db.collection("users").doc(userId).get();
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userName = userData.displayName || userData.email?.split("@")[0] || "User";
          const userRole = userData.role || "OPERATOR";
          const organizationId = userData.organizationId || userData.orgId;

          // Fetch organization document for plan info
          let plan = "Free";
          if (organizationId) {
            try {
              const orgDoc = await db.collection("organizations").doc(organizationId).get();
              if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                plan = orgData.plan || orgData.subscriptionPlan || "Free";
              }
            } catch (orgError) {
              console.warn("Could not fetch organization data:", orgError);
            }
          }

          // Add user context to system prompt
          systemPrompt += `\n\nCURRENT USER CONTEXT:
- Name: ${userName}
- Role: ${userRole}
- Plan: ${plan}

INSTRUCTIONS:
- If the user asks about features, guide them using the navigation paths in the documentation above.
- If they ask about their plan or limits, refer to the "PLANS & LIMITS" section and their current plan (${plan}).
- Personalize responses when appropriate (e.g., "You can find this in your Studio" instead of "Users can find this in Studio").
- If they're an Admin, mention admin-specific features like Monitor when relevant.`;
        }
      } catch (contextError) {
        console.warn("Could not fetch user context for chat:", contextError);
        // Continue without user context
      }
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Use toTextStreamResponse which is available in ai@5.0.108
    // This returns a text stream that we can parse on the client
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

