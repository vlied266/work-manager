import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminDb } from "@/lib/firebase-admin";
import { DEFAULT_ENGLISH_PROMPT } from "@/lib/ai/default-prompt";

const ATOMIC_ACTIONS: AtomicAction[] = [
  "INPUT", "FETCH", "TRANSMIT", "STORE", "GOOGLE_SHEET_APPEND",
  "TRANSFORM", "ORGANISE", "CALCULATE", "COMPARE", "VALIDATE", "GATEWAY",
  "MOVE_OBJECT", "TRANSFORM_OBJECT", "INSPECT",
  "GENERATE", "NEGOTIATE", "AUTHORIZE"
];

const GUARDRAIL_CLAUSE = `CRITICAL RULE: You are a strict Process Architect. If the user input is NOT a description of a business process, workflow, or task sequence (e.g., if it is a joke, a greeting, random characters, or code request), you must return a JSON array with a SINGLE step: { "id": "error", "title": "Invalid Request", "action": "INSPECT", "description": "I can only generate business workflows. Please describe a process." }. Do NOT attempt to interpret nonsense.`;

const GOOGLE_SHEET_INSTRUCTION = `
SPECIAL RULE FOR "GOOGLE_SHEET_APPEND":

If the user asks to save data to a spreadsheet/excel, use action "GOOGLE_SHEET_APPEND".

You MUST generate a "config" object:

{
  "sheetId": "",
  "mapping": {
    "A": "{{step_x.output}}", 
    "B": "Static Value"
  }
}

- Leave "sheetId" empty.
- Intelligently map previous steps' data to columns using mustache syntax.
- Use meaningful column mappings based on the data flow. For example:
  * If step 1 collects "Full Name", map it to column A: "{{step_1.output.fullName}}" or "{{step_1.output.name}}"
  * If step 2 collects "Email", map it to column B: "{{step_2.output.email}}"
  * If step 3 calculates "Total Amount", map it to column C: "{{step_3.output.total}}"
- You can also use static text combined with variables, e.g., "Applicant: {{step_1.output.name}}"
- Always include at least 2-3 column mappings (A, B, C) to make the template useful.
`;

const ASSIGNMENT_INSTRUCTION = `
SPECIAL RULE FOR ASSIGNMENTS (CONTEXT AWARE):

1. **Analyze Context:** The user may assign specific tasks to specific people in a single sentence.

   - Example Input: "Create onboarding. Assign IT setup to @Jack and Welcome Email to @Sara."
   - Example Input: "Create a hiring process. Assign resume review to @David and interview to @Sara."

2. **Mapping Logic:**

   - When generating steps, check if the user linked a specific person to that specific action.

   - If found, look up that person in the "Organization Staff List" and set the \`assignee\` field for THAT step only.

   - Each step should have its own \`assignee\` field based on what the user specified for that particular task.

3. **Global Fallback:**

   - If the user says "Assign the process to @Jack" (global assignment), then assign ALL human steps to Jack.

   - If the user specifies different people for different steps, prioritize the specific assignment over global.

4. **Staff Lookup:** Always use the exact Email or Name found in the staff list. Match names using partial matching (e.g., "@Jack" matches "Jack Smith", "David" matches "David Jones"). If no match is found, leave \`assignee\` empty.

5. **Role-Based Assignment:**

   - If the step is generic (e.g., "Manager Approval") and no specific name is mentioned, try to find a relevant role in the staff list.

   - When generating steps that require human intervention (like "Approval", "Review", "Manual Input", "AUTHORIZE", "GENERATE"), you MUST populate the \`assignee\` field if a person is mentioned. If no person is mentioned, choose the most appropriate person from the staff list based on their role.

Examples:
- User says: "Create onboarding. Assign IT setup to @Jack and Welcome Email to @Sara"
  → Step 1 (IT setup): assignee = "jack@test.com" or "Jack Smith"
  → Step 2 (Welcome Email): assignee = "sara@test.com" or "Sara Johnson"
  
- User says: "Create a hiring process. Assign resume review to @David and interview to @Sara"
  → Step 1 (Resume Review): assignee = "david@test.com" or "David Jones"
  → Step 2 (Interview): assignee = "sara@test.com" or "Sara Johnson"
  
- User says: "Assign the process to @Jack" (global)
  → All human steps: assignee = "jack@test.com" or "Jack Smith"
  
- User says: "Manager should review"
  → Find person with Role: "Manager" → Set assignee to their email/name
`;

const METADATA_INSTRUCTION = `
STRUCTURE INSTRUCTION:

You must return a JSON Object (NOT just an array) with this exact structure:

{
  "title": "A short, professional title derived from the request (e.g., 'Employee Onboarding')",
  "description": "A professional summary of what this workflow does (e.g., 'Standard process for new hires, including IT setup and welcome email.')",
  "steps": [ ... array of steps ... ]
}

- Do NOT copy the user's prompt verbatim. Summarize the intent professionally.
- The "title" should be concise (3-8 words), clear, and professional.
- The "description" should be a brief summary (1-2 sentences) explaining what the workflow accomplishes.
- The "steps" array must follow the atomic step schema as defined before.
`;

function formatStaffList(staff: Array<{ displayName?: string; role?: string; email?: string }>): string {
  if (!staff.length) {
    return "- No staff records available for this organization.";
  }

  return staff
    .map((member) => {
      const name = member.displayName || member.email?.split("@")[0] || "Unknown";
      const role = member.role || "Unknown";
      const email = member.email || "Not provided";
      return `- Name: ${name}, Email: ${email}`;
    })
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { description, orgId } = await req.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Fetch dynamic prompt from Firestore, fallback to default
    let systemPrompt = DEFAULT_ENGLISH_PROMPT;
    try {
      const promptDoc = await getDoc(doc(db, "system_configs", "ai_prompts"));
      if (promptDoc.exists()) {
        const data = promptDoc.data();
        if (data.prompt_text && typeof data.prompt_text === "string") {
          systemPrompt = data.prompt_text;
        }
      }
    } catch (error) {
      console.error("Error fetching dynamic prompt, using default:", error);
      // Continue with default prompt
    }

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

    const staffContextSection = `Organization Staff List:\n${
      staffListText || "- No staff records available for this organization."
    }`;

    // Construct the final system prompt with all instructions
    systemPrompt = [
      systemPrompt, // Base prompt (from Firestore or default)
      GUARDRAIL_CLAUSE,
      staffContextSection, // The list of users
      ASSIGNMENT_INSTRUCTION, // Smart Mentions logic
      GOOGLE_SHEET_INSTRUCTION, // Smart Sheet Mapping logic
      METADATA_INSTRUCTION // Professional Title & Description generation
    ].join("\n\n");

    const result = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Convert this process description into a workflow:\n\n"${description}"\n\nReturn a JSON object with "title", "description", and "steps" fields.`,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Get the full response
    const fullText = result.text;
    
    // Try to extract JSON from the response
    let jsonString = fullText.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }
    
    // Parse the JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text (support both array and object)
      const jsonMatch = jsonString.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (nestedError) {
          console.error("Failed to parse extracted AI JSON:", nestedError);
          return NextResponse.json(
            { error: "Invalid AI response format. Please describe the process again." },
            { status: 400 }
          );
        }
      } else {
        console.error("AI response missing JSON:", parseError);
        return NextResponse.json(
          { error: "Could not find workflow data in the AI response." },
          { status: 400 }
        );
      }
    }

    // Handle both old format (array) and new format (object with title, description, steps)
    let steps: unknown[];
    let title: string;
    let procedureDescription: string;

    if (Array.isArray(parsed)) {
      // Old format: just an array of steps
      steps = parsed;
      title = "Generated Process";
      procedureDescription = description; // Use the original user description as fallback
    } else if (parsed && typeof parsed === "object" && "steps" in parsed) {
      // New format: object with title, description, and steps
      const parsedObj = parsed as { title?: string; description?: string; steps?: unknown[] };
      steps = Array.isArray(parsedObj.steps) ? parsedObj.steps : [];
      title = typeof parsedObj.title === "string" && parsedObj.title.trim()
        ? parsedObj.title.trim()
        : "Generated Process";
      procedureDescription = typeof parsedObj.description === "string" && parsedObj.description.trim()
        ? parsedObj.description.trim()
        : description; // Fallback to user's original description
    } else {
      return NextResponse.json(
        { error: "AI response must be either an array of steps or an object with 'title', 'description', and 'steps' fields." },
        { status: 400 }
      );
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "AI response must contain a non-empty array of steps." },
        { status: 400 }
      );
    }

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
        description: typeof stepRecord.description === "string" ? stepRecord.description : "",
      };

      sanitizedSteps.push(sanitizedStep);
    }

    return NextResponse.json({ 
      title,
      description: procedureDescription,
      steps: sanitizedSteps 
    });
  } catch (error) {
    console.error("Error generating procedure:", error);
    return NextResponse.json(
      { error: "Failed to generate procedure. Please try again." },
      { status: 500 }
    );
  }
}

