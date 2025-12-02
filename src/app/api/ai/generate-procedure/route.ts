import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";

const ATOMIC_ACTIONS = [
  "INPUT", "FETCH", "TRANSMIT", "STORE",
  "TRANSFORM", "ORGANISE", "CALCULATE", "COMPARE", "VALIDATE", "GATEWAY",
  "MOVE_OBJECT", "TRANSFORM_OBJECT", "INSPECT",
  "GENERATE", "NEGOTIATE", "AUTHORIZE"
];

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Business Process Management (BPM) expert. Your task is to convert a user's process description into a structured workflow using ONLY the following 15 Atomic Actions:

${ATOMIC_ACTIONS.map((action, idx) => `${idx + 1}. ${action}`).join("\n")}

Rules:
1. Use ONLY the actions listed above
2. Create a logical sequence of steps
3. Each step should have:
   - id: A unique identifier (e.g., "step_1", "step_2")
   - title: A clear, concise title
   - action: One of the 15 atomic actions
   - description: Brief description of what this step does
   - config: Appropriate configuration based on the action type

4. For INPUT actions, include: inputType, fieldLabel, placeholder, required
5. For IMPORT actions, include: buttonLabel, allowedExtensions
6. For COMPARE actions, include: targetA, targetB, comparisonType
7. For AUTHORIZE actions, include: instruction, requireSignature
8. For GENERATE actions, include: template, outputFormat

Return ONLY a valid JSON array of AtomicStep objects. No markdown, no explanations, just the JSON array.

Example format:
[
  {
    "id": "step_1",
    "title": "Enter Employee Name",
    "action": "INPUT",
    "description": "Collect the employee's full name",
    "config": {
      "inputType": "text",
      "fieldLabel": "Employee Name",
      "placeholder": "John Doe",
      "required": true
    }
  },
  {
    "id": "step_2",
    "title": "Upload Receipt",
    "action": "IMPORT",
    "description": "Upload expense receipt",
    "config": {
      "buttonLabel": "Upload Receipt",
      "allowedExtensions": ["pdf", "jpg", "png"]
    }
  }
]`;

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

