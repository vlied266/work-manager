import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";

const ATOMIC_ACTIONS: AtomicAction[] = [
  "INPUT",
  "FETCH",
  "TRANSMIT",
  "STORE",
  "TRANSFORM",
  "ORGANISE",
  "CALCULATE",
  "COMPARE",
  "VALIDATE",
  "GATEWAY",
  "MOVE_OBJECT",
  "TRANSFORM_OBJECT",
  "INSPECT",
  "GENERATE",
  "NEGOTIATE",
  "AUTHORIZE",
];

type StepSource = "openai" | "fallback";

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
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

    let steps: AtomicStep[] | null = null;
    let source: StepSource = "fallback";

    if (process.env.OPENAI_API_KEY) {
      steps = await generateStepsWithOpenAI(description, systemPrompt);
      if (steps) {
        source = "openai";
      }
    } else {
      console.warn(
        "OPENAI_API_KEY is not configured. Falling back to deterministic workflow generation.",
      );
    }

    if (!steps) {
      steps = generateFallbackSteps(description);
    }

    const validatedSteps = sanitizeSteps(steps);

    return NextResponse.json({ steps: validatedSteps, source });
  } catch (error) {
    console.error("Error generating procedure:", error);
    return NextResponse.json(
      { error: "Failed to generate procedure. Please try again." },
      { status: 500 },
    );
  }
}

async function generateStepsWithOpenAI(
  description: string,
  systemPrompt: string,
): Promise<AtomicStep[] | null> {
  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Convert this process description into a workflow:\n\n"${description}"\n\nReturn only the JSON array of steps.`,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return parseStepsFromResponse(result.text);
  } catch (error) {
    console.error("OpenAI generation failed:", error);
    return null;
  }
}

function parseStepsFromResponse(responseText: string): AtomicStep[] {
  if (!responseText) {
    throw new Error("AI response was empty");
  }

  let jsonString = responseText.trim();

  if (jsonString.startsWith("```")) {
    jsonString = jsonString.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not an array");
  }

  return parsed as AtomicStep[];
}

function sanitizeSteps(steps: AtomicStep[]): AtomicStep[] {
  return steps.map((step, index) => {
    const action = step.action && ATOMIC_ACTIONS.includes(step.action)
      ? step.action
      : ("INPUT" as AtomicAction);

    return {
      ...step,
      id: step.id || `step_${index + 1}`,
      title: step.title || `Step ${index + 1}`,
      description: step.description || "",
      action,
      config: step.config || {},
    };
  });
}

type TemplateContext = {
  description: string;
  normalized: string;
};

const FALLBACK_TEMPLATES: Array<{
  action: AtomicAction;
  keywords: string[];
  build: (ctx: TemplateContext) => Omit<AtomicStep, "id">;
}> = [
  {
    action: "FETCH",
    keywords: ["fetch", "pull", "import", "sync", "retrieve", "lookup"],
    build: () => ({
      title: "Fetch Reference Data",
      action: "FETCH",
      description: "Retrieve any external data sources mentioned in the request.",
      config: {
        sourceUrl: "https://api.internal/reference-data",
        method: "GET",
        outputVariableName: "reference_dataset",
      },
    }),
  },
  {
    action: "CALCULATE",
    keywords: [
      "calculate",
      "total",
      "sum",
      "budget",
      "forecast",
      "roi",
      "metric",
      "analysis",
      "compute",
      "estimate",
    ],
    build: () => ({
      title: "Calculate Key Metrics",
      action: "CALCULATE",
      description: "Compute totals or KPIs needed for the process.",
      config: {
        formula: "SUM(line_items)",
        variables: {
          input: "organized_payload",
        },
        outputVariableName: "calculation_result",
      },
    }),
  },
  {
    action: "COMPARE",
    keywords: [
      "compare",
      "match",
      "versus",
      "vs",
      "reconcile",
      "difference",
      "audit",
    ],
    build: (ctx) => {
      const numeric = hasKeyword(ctx.normalized, [
        "amount",
        "price",
        "cost",
        "total",
      ]);

      return {
        title: "Compare Against Reference Data",
        action: "COMPARE",
        description: "Cross-check captured values with trusted records.",
        config: {
          targetA: "organized_payload",
          targetB: "reference_dataset",
          comparisonType: numeric ? "numeric" : "exact",
          outputVariableName: "comparison_result",
        },
      };
    },
  },
  {
    action: "GENERATE",
    keywords: [
      "generate",
      "draft",
      "create",
      "write",
      "compose",
      "summarize",
      "report",
      "document",
    ],
    build: () => ({
      title: "Generate Required Output",
      action: "GENERATE",
      description: "Draft the document or summary requested in the process.",
      config: {
        template: "Summarize organized_payload into the requested format.",
        outputFormat: "text",
        outputVariableName: "generated_output",
      },
    }),
  },
  {
    action: "NEGOTIATE",
    keywords: [
      "negotiate",
      "discuss",
      "coordinate",
      "escalate",
      "vendor",
      "partner",
    ],
    build: () => ({
      title: "Coordinate With Stakeholders",
      action: "NEGOTIATE",
      description:
        "Engage with the relevant stakeholder or vendor to reach alignment.",
      config: {
        instruction: "Contact the stakeholder and capture the agreed outcome.",
        approverId: "stakeholder",
      },
    }),
  },
  {
    action: "AUTHORIZE",
    keywords: ["approve", "approval", "sign", "authorize", "signoff"],
    build: () => ({
      title: "Obtain Approval",
      action: "AUTHORIZE",
      description: "Route the compiled information for authorization.",
      config: {
        instruction: "Review the data and approve if it meets requirements.",
        requireSignature: true,
      },
    }),
  },
  {
    action: "VALIDATE",
    keywords: ["validate", "check", "verify", "compliance", "policy"],
    build: () => ({
      title: "Validate Policy Requirements",
      action: "VALIDATE",
      description: "Ensure the request satisfies policy and compliance rules.",
      config: {
        validationRule: "Policy compliance check",
        rule: "CONTAINS",
        target: "organized_payload",
        value: "policy_requirements",
        errorMessage: "Request does not meet policy requirements",
      },
    }),
  },
];

function hasKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function generateFallbackSteps(description: string): AtomicStep[] {
  const normalized = description.toLowerCase();
  const steps: AtomicStep[] = [];
  const actionsUsed = new Set<AtomicAction>();

  const pushStep = (step: Omit<AtomicStep, "id">) => {
    steps.push({ id: `step_${steps.length + 1}`, ...step });
    actionsUsed.add(step.action);
  };

  const trimmed = description.trim();
  const placeholder = trimmed
    ? trimmed.slice(0, 72)
    : "Describe the process details";

  pushStep({
    title: "Capture Request Details",
    action: "INPUT",
    description: "Collect the core information needed to start the process.",
    config: {
      inputType: "text",
      fieldLabel: "Process Description",
      placeholder,
      required: true,
      outputVariableName: "step_1_output",
    },
  });

  if (hasKeyword(normalized, ["file", "document", "attachment", "upload"])) {
    pushStep({
      title: "Upload Supporting Document",
      action: "INPUT",
      description: "Gather any files referenced in the description.",
      config: {
        inputType: "file",
        fieldLabel: "Supporting File",
        buttonLabel: "Upload File",
        allowedExtensions: ["pdf", "docx", "png", "jpg"],
        required: false,
        outputVariableName: "supporting_file",
      },
    });
  }

  pushStep({
    title: "Organize Submitted Data",
    action: "ORGANISE",
    description: "Normalize and categorize the captured inputs.",
    config: {
      sortBy: hasKeyword(normalized, ["priority", "urgent"]) ? "urgency" : "type",
      groupBy: hasKeyword(normalized, ["department", "team", "region"])
        ? "department"
        : "category",
      transformationRule: "Standardize field names",
      outputVariableName: "organized_payload",
    },
  });

  for (const template of FALLBACK_TEMPLATES) {
    if (
      hasKeyword(normalized, template.keywords) &&
      !actionsUsed.has(template.action)
    ) {
      pushStep(template.build({ description, normalized }));
    }
  }

  if (!actionsUsed.has("VALIDATE")) {
    pushStep({
      title: "Validate Inputs",
      action: "VALIDATE",
      description: "Ensure the submitted data meets required criteria.",
      config: {
        validationRule: "Check for mandatory fields",
        rule: "CONTAINS",
        target: "organized_payload",
        value: "required_fields",
        errorMessage: "Missing mandatory information",
      },
    });
  }

  const shouldNotify = hasKeyword(normalized, [
    "notify",
    "email",
    "send",
    "share",
    "inform",
  ]);

  if (shouldNotify && !actionsUsed.has("TRANSMIT")) {
    pushStep({
      title: "Notify Stakeholders",
      action: "TRANSMIT",
      description: "Send the outcome to the audience mentioned in the request.",
      config: {
        recipientEmail: "stakeholders@example.com",
        destinationUrl: "https://api.internal/notify",
        method: "POST",
      },
    });
  }

  if (!actionsUsed.has("AUTHORIZE")) {
    pushStep({
      title: "Review and Authorize",
      action: "AUTHORIZE",
      description: "Route the organized information for approval.",
      config: {
        instruction: "Review the compiled data and approve if it meets policy.",
        requireSignature: hasKeyword(normalized, [
          "signature",
          "sign",
          "contract",
          "agreement",
        ]),
      },
    });
  }

  if (!actionsUsed.has("STORE")) {
    pushStep({
      title: "Store Final Output",
      action: "STORE",
      description: "Archive the approved results for future reference.",
      config: {
        storageType: "database",
        storagePath: "/records/processed_requests",
        outputVariableName: "archived_record",
      },
    });
  }

  return steps;
}

