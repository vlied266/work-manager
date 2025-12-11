import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { Procedure, ActiveRun } from "@/types/schema";
import { isAutoStep } from "@/lib/constants";

/**
 * Webhook Endpoint for External Systems
 * 
 * Allows external systems (Forms, Stripe, IoT, CRM) to trigger workflows via HTTP POST.
 * 
 * Endpoint: POST /api/webhooks/[procedureId]
 * 
 * Security: Currently open (public). TODO: Add secret key validation.
 * 
 * Usage:
 *   curl -X POST https://your-domain.com/api/webhooks/PROCEDURE_ID \
 *     -H "Content-Type: application/json" \
 *     -d '{"field1": "value1", "field2": "value2"}'
 * 
 * Variables accessible in workflow:
 *   - {{trigger.body.field1}} → "value1"
 *   - {{trigger.body.field2}} → "value2"
 *   - {{trigger.headers.content-type}} → "application/json"
 *   - {{trigger.headers.user-agent}} → "curl/7.68.0"
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ procedureId: string }> }
) {
  try {
    const { procedureId } = await params;

    if (!procedureId) {
      return NextResponse.json(
        { error: "procedureId is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch the procedure
    const procedureDoc = await db.collection("procedures").doc(procedureId).get();
    
    if (!procedureDoc.exists) {
      return NextResponse.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    const procedure = procedureDoc.data() as Procedure;

    // Validate procedure is active
    if (!procedure.isActive) {
      return NextResponse.json(
        { error: "Procedure is not active" },
        { status: 400 }
      );
    }

    // Validate procedure has WEBHOOK trigger type
    if (procedure.trigger?.type !== "WEBHOOK") {
      return NextResponse.json(
        { 
          error: "Procedure does not have WEBHOOK trigger type",
          currentTriggerType: procedure.trigger?.type || "none"
        },
        { status: 400 }
      );
    }

    // TODO: Add secret key validation
    // const webhookSecret = procedure.trigger?.config?.webhookSecret;
    // const providedSecret = req.headers.get("x-webhook-secret");
    // if (webhookSecret && providedSecret !== webhookSecret) {
    //   return NextResponse.json(
    //     { error: "Invalid webhook secret" },
    //     { status: 401 }
    //   );
    // }

    // Parse request body (JSON)
    let requestBody: any = {};
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        requestBody = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        const formObj: any = {};
        formData.forEach((value, key) => {
          formObj[key] = value;
        });
        requestBody = formObj;
      } else {
        // Try to parse as text
        const text = await req.text();
        try {
          requestBody = JSON.parse(text);
        } catch {
          requestBody = { raw: text };
        }
      }
    } catch (error) {
      console.warn("[Webhook] Error parsing request body:", error);
      requestBody = {};
    }

    // Extract headers (convert to lowercase keys for consistency)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    console.log(`[Webhook] Received webhook for procedure: ${procedure.title} (${procedureId})`);
    console.log(`[Webhook] Request body:`, JSON.stringify(requestBody, null, 2));
    console.log(`[Webhook] Headers:`, JSON.stringify(headers, null, 2));

    // Get the first step and determine its assignee
    const steps = procedure.steps || [];
    
    if (steps.length === 0) {
      return NextResponse.json(
        { error: "Procedure has no steps" },
        { status: 400 }
      );
    }

    const firstStep = steps[0];
    
    // Default assignee logic
    let assigneeId: string | null = null;
    let assigneeType: "USER" | "TEAM" | null = null;

    if (firstStep.assigneeId && firstStep.assigneeType) {
      assigneeId = firstStep.assigneeId;
      assigneeType = firstStep.assigneeType === "TEAM" ? "TEAM" : "USER";
    } else if (procedure.defaultAssignee) {
      assigneeId = procedure.defaultAssignee.id;
      assigneeType = procedure.defaultAssignee.type;
    }

    // Get assignee email if it's a user
    let assigneeEmail: string | null = null;
    if (assigneeType === "USER" && assigneeId) {
      try {
        const userDoc = await db.collection("users").doc(assigneeId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          assigneeEmail = userData?.email || null;
        }
      } catch (error) {
        console.warn("[Webhook] Could not fetch assignee email:", error);
      }
    }

    // Create the run document
    const runData: Partial<ActiveRun> = {
      procedureId,
      procedureTitle: procedure.title || "Untitled Procedure",
      title: procedure.title || "Untitled Procedure",
      organizationId: procedure.organizationId,
      status: "IN_PROGRESS" as const,
      currentStepIndex: 0,
      currentStepId: firstStep.id,
      startedAt: Timestamp.now(),
      startedBy: "system", // System-triggered run
      triggeredBy: {
        type: "WEBHOOK",
        webhookUrl: req.url, // Store the webhook URL that was called
      },
      logs: [
        {
          stepId: firstStep.id,
          timestamp: Timestamp.now(),
          action: "TRIGGERED",
          message: `Workflow triggered by webhook: ${req.url}`,
        },
      ],
      // Current assignee (for the first step)
      currentAssigneeId: assigneeId,
      currentAssignee: assigneeEmail,
      assigneeType: assigneeType || "USER",
      // Legacy fields for backward compatibility
      assigneeId: assigneeId,
      // Store steps for reference
      steps: steps,
      // Store trigger context for variable resolution
      triggerContext: {
        body: requestBody, // Full request body accessible via {{trigger.body.field_name}}
        headers: headers, // Request headers accessible via {{trigger.headers.header_name}}
        method: "POST",
        url: req.url,
        timestamp: new Date().toISOString(),
      },
      // Also store in initialInput for backward compatibility
      initialInput: {
        body: requestBody,
        headers: headers,
      },
    };

    console.log(`[Webhook] Creating run document...`);
    
    const runRef = await db.collection("active_runs").add(runData);
    const runId = runRef.id;
    
    console.log(`[Webhook] ✅ Run created with ID: ${runId}`);

    // Auto-execute the first step if it's an automated step
    if (isAutoStep(firstStep.action)) {
      console.log(`[Webhook] Auto-executing first step: ${firstStep.action} (${firstStep.id})`);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const executeResponse = await fetch(`${baseUrl}/api/runs/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId,
            stepId: firstStep.id,
            orgId: procedure.organizationId,
            userId: "system", // System-triggered execution
            outcome: "SUCCESS", // Will be determined by execution logic
          }),
        });

        if (!executeResponse.ok) {
          const errorData = await executeResponse.json().catch(() => ({}));
          console.error(`[Webhook] ❌ Failed to auto-execute first step for run ${runId}:`, errorData);
        } else {
          const executeResult = await executeResponse.json().catch(() => ({}));
          console.log(`[Webhook] ✅ Auto-executed first step (${firstStep.action}) for run ${runId}:`, executeResult);
        }
      } catch (err: any) {
        console.error(`[Webhook] ❌ Error auto-executing first step for run ${runId}:`, err.message || err);
      }
    } else {
      console.log(`[Webhook] First step is not AUTO (${firstStep.action}), skipping auto-execution`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Webhook received and workflow started",
      runId,
      procedureTitle: procedure.title,
      status: "started",
    }, { status: 200 });

  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve webhook information
 * Useful for testing and verification
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ procedureId: string }> }
) {
  try {
    const { procedureId } = await params;

    if (!procedureId) {
      return NextResponse.json(
        { error: "procedureId is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch the procedure
    const procedureDoc = await db.collection("procedures").doc(procedureId).get();
    
    if (!procedureDoc.exists) {
      return NextResponse.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    const procedure = procedureDoc.data() as Procedure;

    // Check if it has WEBHOOK trigger
    if (procedure.trigger?.type !== "WEBHOOK") {
      return NextResponse.json(
        { 
          error: "Procedure does not have WEBHOOK trigger type",
          currentTriggerType: procedure.trigger?.type || "none"
        },
        { status: 400 }
      );
    }

    // Generate webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/${procedureId}`;

    return NextResponse.json({
      success: true,
      procedureId,
      procedureTitle: procedure.title,
      isActive: procedure.isActive || false,
      webhookUrl,
      triggerConfig: procedure.trigger?.config,
      // Don't expose secret in GET response
      hasSecret: !!procedure.trigger?.config?.webhookSecret,
    });
  } catch (error: any) {
    console.error("[Webhook] Error fetching webhook info:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch webhook information",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

