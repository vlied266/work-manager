import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const ATOMIC_ACTIONS: AtomicAction[] = [
  "INPUT", "FETCH", "TRANSMIT", "STORE", "GOOGLE_SHEET_APPEND",
  "TRANSFORM", "ORGANISE", "CALCULATE", "COMPARE", "VALIDATE", "GATEWAY",
  "MOVE_OBJECT", "TRANSFORM_OBJECT", "INSPECT",
  "GENERATE", "NEGOTIATE", "AUTHORIZE"
];

const GOOGLE_SHEET_INSTRUCTION = `
SPECIAL RULE FOR "GOOGLE_SHEET_APPEND":

If the process involves saving data to a spreadsheet, Google Sheet, or Excel, use the action "GOOGLE_SHEET_APPEND".

For this action, you MUST generate a "config" object with the following structure:

{
  "sheetId": "",
  "mapping": {
    "A": "{{step_previous_id.output}}",
    "B": "Static Value or {{variable}}"
  }
}

- Leave "sheetId" as an empty string (the user will select it later).
- Intelligently map previous steps' data (like names, emails, dates) to columns A, B, C, etc. using mustache syntax {{step_id.output}}.
- Use meaningful column mappings based on the data flow. For example:
  * If step 1 collects "Full Name", map it to column A: "{{step_1.output.fullName}}" or "{{step_1.output.name}}"
  * If step 2 collects "Email", map it to column B: "{{step_2.output.email}}"
  * If step 3 calculates "Total Amount", map it to column C: "{{step_3.output.total}}"
- You can also use static text combined with variables, e.g., "Applicant: {{step_1.output.name}}"
- Always include at least 2-3 column mappings (A, B, C) to make the template useful.
`;

function formatStaffList(staff: Array<{ displayName?: string; role?: string; email?: string }>): string {
  if (!staff.length) {
    return "- No staff records available for this organization.";
  }

  return staff
    .map((member) => {
      const name = member.displayName || member.email || "Unknown";
      const role = member.role || "Unknown";
      const email = member.email || "Not provided";
      return `- Name: ${name}, Role: ${role}, Email: ${email}`;
    })
    .join("\n");
}

const SYSTEM_PROMPT = `You are an expert Workflow Editor JSON machine.

Your task: You will receive a JSON array of workflow steps and a user's modification request. You must MODIFY the JSON to satisfy the request.

CRITICAL RULES:
1. Return ONLY a valid JSON array of AtomicStep objects. No explanations, no markdown, just JSON.
2. Preserve existing step IDs if they are not deleted (only change IDs for new steps).
3. Ensure all "config" objects remain valid and properly structured.
4. When adding new steps, generate appropriate IDs like "step_N" where N is the step number.
5. Maintain logical step ordering and routing.
6. If removing steps, ensure route references (onSuccessStepId, onFailureStepId, etc.) are updated accordingly.
7. When reordering steps, update all step IDs to maintain sequential numbering (step_1, step_2, etc.) and update all route references.

VALID ACTIONS:
${ATOMIC_ACTIONS.join(", ")}

STEP STRUCTURE:
Each step must have:
- "id": string (e.g., "step_1")
- "title": string
- "action": one of the valid actions above
- "config": object (varies by action type)
- Optional: "routes", "assignee", "description"

${GOOGLE_SHEET_INSTRUCTION}

EXAMPLES OF MODIFICATIONS:
- "Remove step 2" → Delete step with id "step_2", renumber remaining steps, update route references
- "Add Google Sheet save at the end" → Add new GOOGLE_SHEET_APPEND step with proper config
- "Rename step 1 to 'Collect User Info'" → Update title of step_1
- "Add approval step after step 3" → Insert new AUTHORIZE step between step_3 and step_4
- "Swap step 2 and step 3" → Reorder steps and update IDs accordingly

Remember: Always return a complete, valid JSON array.`;

export async function POST(req: NextRequest) {
  try {
    const { currentSteps, userPrompt, orgId } = await req.json();

    if (!currentSteps || !Array.isArray(currentSteps)) {
      return NextResponse.json(
        { error: "currentSteps must be a valid array of steps" },
        { status: 400 }
      );
    }

    if (!userPrompt || typeof userPrompt !== "string") {
      return NextResponse.json(
        { error: "userPrompt is required" },
        { status: 400 }
      );
    }

    // Check AI plan limit
    if (orgId) {
      try {
        const adminDb = getAdminDb();
        const orgDoc = await adminDb.collection("organizations").doc(orgId).get();
        
        if (orgDoc.exists) {
          const orgData = orgDoc.data();
          const plan = (orgData?.plan || "FREE").toUpperCase() as "FREE" | "PRO" | "ENTERPRISE";
          
          // FREE plan has no AI access
          if (plan === "FREE") {
            return NextResponse.json(
              {
                error: "PLAN_LIMIT",
                message: "AI Copilot is not available on the Free plan. Please upgrade to Pro or Enterprise to use AI features.",
                resource: "aiGenerations",
              },
              { status: 403 }
            );
          }

          // PRO plan: Check monthly AI generation limit (1000 per month)
          if (plan === "PRO") {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

            const monthlyAiGenerationsQuery = await adminDb
              .collection("ai_usage_logs")
              .where("organizationId", "==", orgId)
              .where("timestamp", ">=", startOfMonthTimestamp)
              .get();

            const monthlyAiCount = monthlyAiGenerationsQuery.size;

            if (monthlyAiCount >= 1000) {
              return NextResponse.json(
                {
                  error: "LIMIT_REACHED",
                  message: "You have reached the Pro plan limit of 1000 AI generations per month. Please upgrade to Enterprise for unlimited AI.",
                  limit: 1000,
                  currentUsage: monthlyAiCount,
                  resource: "aiGenerations",
                },
                { status: 403 }
              );
            }
          }

          // ENTERPRISE plan: Unlimited (no check needed)
        }
      } catch (orgError) {
        console.error("Error checking organization plan:", orgError);
        // Continue execution if org check fails (fail open for now)
      }
    }

    // Fetch staff list if orgId is provided
    let staffListText = "";
    const trimmedOrgId = typeof orgId === "string" ? orgId.trim() : "";
    if (trimmedOrgId) {
      try {
        const adminDb = getAdminDb();
        const usersRef = adminDb.collection("users");
        let staffSnapshot = await usersRef.where("organizationId", "==", trimmedOrgId).get();

        if (staffSnapshot.empty) {
          staffSnapshot = await usersRef.where("orgId", "==", trimmedOrgId).get();
        }

        const staffMembers = staffSnapshot.docs.map((doc) => doc.data() as { displayName?: string; role?: string; email?: string });
        staffListText = formatStaffList(staffMembers);
      } catch (staffError) {
        console.error(`Error fetching staff for org ${trimmedOrgId}:`, staffError);
        staffListText = "- Unable to load staff records due to an internal error.";
      }
    }

    // Build assignment instruction
    const assignmentInstruction = `INSTRUCTION FOR TASK ASSIGNMENT:

When the user mentions a person's name (e.g., '@Jack', 'assign to David', 'give this to Sarah'), you MUST:
1. Look up the closest match in the "Organization Staff List" below.
2. Match names using partial matching (e.g., "@Jack" matches "Jack Smith", "David" matches "David Jones").
3. Set the \`assignee\` field of that step to the person's Email (preferred) or Name from the staff list.
4. If no match is found, leave \`assignee\` empty.

Examples:
- User says: "Assign step 2 to @Jack" → Find "Jack Smith" in staff list → Set assignee: "jack@test.com" or "Jack Smith"
- User says: "Change assignee of step 3 to David" → Find "David Jones" in staff list → Set assignee: "david@test.com" or "David Jones"
- User says: "Manager should review step 1" → Find person with Role: "Manager" → Set assignee to their email/name

When modifying steps that require human intervention (like "Approval", "Review", "Manual Input", "AUTHORIZE", "GENERATE"), if a person is mentioned, you MUST populate the \`assignee\` field. If no person is mentioned, choose the most appropriate person from the staff list based on their role. If no match is found, leave \`assignee\` empty.`;

    const staffContextSection = `Organization Staff List:\n${
      staffListText || "- No staff records available for this organization."
    }`;

    // Build system prompt with staff context
    const systemPromptWithStaff = [
      SYSTEM_PROMPT,
      staffContextSection,
      assignmentInstruction,
    ].join("\n\n");

    // Prepare the current workflow JSON string
    const currentWorkflowJson = JSON.stringify(currentSteps, null, 2);

    // Build the user prompt
    const prompt = `CURRENT WORKFLOW JSON:
${currentWorkflowJson}

USER CHANGE REQUEST: "${userPrompt}"

Modify the workflow JSON according to the user's request. Return ONLY the modified JSON array of steps.`;

    const result = await generateText({
      model: openai("gpt-4o"),
      system: systemPromptWithStaff,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 3000,
    });

    // Get the full response
    const fullText = result.text.trim();
    
    // Try to extract JSON from the response
    let jsonString = fullText;
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }
    
    // Parse the JSON
    let steps: unknown;
    try {
      steps = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          steps = JSON.parse(jsonMatch[0]);
        } catch (nestedError) {
          console.error("Failed to parse extracted AI JSON:", nestedError);
          console.error("AI Response:", fullText);
          return NextResponse.json(
            { error: "Invalid AI response format. Please try a different modification request." },
            { status: 400 }
          );
        }
      } else {
        console.error("AI response missing JSON array:", parseError);
        console.error("AI Response:", fullText);
        return NextResponse.json(
          { error: "Could not find workflow steps in the AI response." },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "AI response must be a non-empty array of steps." },
        { status: 400 }
      );
    }

    // Sanitize and validate steps
    const sanitizedSteps: AtomicStep[] = [];

    for (const [index, rawStep] of steps.entries()) {
      if (!rawStep || typeof rawStep !== "object" || Array.isArray(rawStep)) {
        return NextResponse.json(
          { error: `Step ${index + 1} is malformed.` },
          { status: 400 }
        );
      }

      const stepRecord = rawStep as Record<string, unknown>;
      const normalizedAction =
        typeof stepRecord.action === "string"
          ? stepRecord.action.trim().toUpperCase()
          : "";

      const actionValue: AtomicAction = ATOMIC_ACTIONS.includes(normalizedAction as AtomicAction)
        ? (normalizedAction as AtomicAction)
        : "INPUT";

      const sanitizedConfig =
        stepRecord.config && typeof stepRecord.config === "object" && !Array.isArray(stepRecord.config)
          ? (stepRecord.config as AtomicStep["config"])
          : ({} as AtomicStep["config"]);

      // Preserve routes if they exist
      const sanitizedRoutes = stepRecord.routes && typeof stepRecord.routes === "object" && !Array.isArray(stepRecord.routes)
        ? (stepRecord.routes as AtomicStep["routes"])
        : undefined;

      const sanitizedStep: AtomicStep = {
        id:
          typeof stepRecord.id === "string" && stepRecord.id.trim()
            ? stepRecord.id.trim()
            : `step_${index + 1}`,
        title:
          typeof stepRecord.title === "string" && stepRecord.title.trim()
            ? stepRecord.title.trim()
            : `Step ${index + 1}`,
        action: actionValue,
        assignee: typeof stepRecord.assignee === "string" ? stepRecord.assignee : undefined,
        config: sanitizedConfig,
        routes: sanitizedRoutes,
        description: typeof stepRecord.description === "string" ? stepRecord.description : "",
      };

      sanitizedSteps.push(sanitizedStep);
    }

    // Log AI usage (after successful modification)
    if (orgId) {
      try {
        const adminDb = getAdminDb();
        await adminDb.collection("ai_usage_logs").add({
          organizationId: orgId,
          type: "modify-procedure",
          timestamp: Timestamp.now(),
          tokensUsed: result.usage?.totalTokens || 0,
        });
      } catch (logError) {
        console.error("Error logging AI usage:", logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({ steps: sanitizedSteps });
  } catch (error) {
    console.error("Error modifying procedure:", error);
    return NextResponse.json(
      { error: "Failed to modify procedure. Please try again." },
      { status: 500 }
    );
  }
}

