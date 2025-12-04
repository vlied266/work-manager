import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminDb } from "@/lib/firebase-admin";
import { DEFAULT_ENGLISH_PROMPT } from "@/lib/ai/default-prompt";

const ATOMIC_ACTIONS = [
  "INPUT", "FETCH", "TRANSMIT", "STORE",
  "TRANSFORM", "ORGANISE", "CALCULATE", "COMPARE", "VALIDATE", "GATEWAY",
  "MOVE_OBJECT", "TRANSFORM_OBJECT", "INSPECT",
  "GENERATE", "NEGOTIATE", "AUTHORIZE"
];

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

    const assignmentInstruction =
      'Instruction: When generating steps that require human intervention (like "Approval", "Review", "Manual Input"), you MUST populate the `assignee` field in the JSON step object. Choose the most appropriate person from the provided staff list based on their role. If no match is found, leave `assignee` empty.';

    systemPrompt = `${systemPrompt}\n\nOrganization Staff Context:\n${
      staffListText || "- No staff context provided."
    }\n\n${assignmentInstruction}`;

    const result = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Convert this process description into a workflow:\n\n"${description}"\n\nReturn only the JSON array of steps.`,
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
    let steps: AtomicStep[];
    try {
      steps = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        steps = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Validate steps
    if (!Array.isArray(steps)) {
      return NextResponse.json(
        { error: "AI response is not an array" },
        { status: 500 }
      );
    }

    // Validate each step has required fields
    const validatedSteps = steps.map((step, index) => {
      if (!step.id) step.id = `step_${index + 1}`;
      if (!step.title) step.title = `Step ${index + 1}`;
      if (!step.action || !ATOMIC_ACTIONS.includes(step.action)) {
        step.action = "INPUT" as AtomicAction;
      }
      if (!step.config) step.config = {};
      if (!step.description) step.description = "";
      if (step.assignee && typeof step.assignee !== "string") {
        delete (step as Partial<AtomicStep>).assignee;
      }
      return step as AtomicStep;
    });

    return NextResponse.json({ steps: validatedSteps });
  } catch (error) {
    console.error("Error generating procedure:", error);
    return NextResponse.json(
      { error: "Failed to generate procedure. Please try again." },
      { status: 500 }
    );
  }
}

