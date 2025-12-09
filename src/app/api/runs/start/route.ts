import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { Procedure, AtomicStep, Organization, ActiveRun } from "@/types/schema";
import { isAutoStep } from "@/lib/constants";

interface StartRunRequest {
  procedureId: string;
  orgId: string;
  starterUserId: string;
}

/**
 * Determine the assignee for a step based on assignment config
 */
function getStepAssignee(
  step: AtomicStep,
  starterUserId: string
): { assigneeId: string | null; assigneeType: "USER" | "TEAM" | null } {
  const assignment = step.assignment ||
    (step.assigneeType ? {
      type: step.assigneeType === "TEAM" ? "TEAM_QUEUE" : step.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
      assigneeId: step.assigneeId,
    } : null);

  if (!assignment) {
    return { assigneeId: starterUserId, assigneeType: "USER" }; // Default to starter
  }

  if (assignment.type === "STARTER") {
    return { assigneeId: starterUserId, assigneeType: "USER" };
  } else if (assignment.type === "SPECIFIC_USER" && assignment.assigneeId) {
    return { assigneeId: assignment.assigneeId, assigneeType: "USER" };
  } else if (assignment.type === "TEAM_QUEUE" && assignment.assigneeId) {
    return { assigneeId: assignment.assigneeId, assigneeType: "TEAM" };
  }

  // Fallback to starter
  return { assigneeId: starterUserId, assigneeType: "USER" };
}

export async function POST(req: NextRequest) {
  try {
    const body: StartRunRequest = await req.json();
    const { procedureId, orgId, starterUserId } = body;

    if (!procedureId || !orgId || !starterUserId) {
      return NextResponse.json(
        { error: "Missing required fields: procedureId, orgId, starterUserId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // 0. Usage Limit Check: Fetch organization and check monthly run limit
    const orgDoc = await db.collection("organizations").doc(orgId).get();
    let subscriptionPlan: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
    
    if (orgDoc.exists) {
      const orgData = orgDoc.data() as Organization;
      subscriptionPlan = orgData.plan || "FREE";
    }

    // Count runs created in current month for this organization
    // Note: Fetching all runs for org and filtering client-side to avoid index requirement
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

    const monthlyRunsQuery = await db
      .collection("active_runs")
      .where("organizationId", "==", orgId)
      .get();

    // Filter client-side by startedAt to avoid needing composite index
    const monthlyRunCount = monthlyRunsQuery.docs.filter(doc => {
      const startedAt = doc.data().startedAt;
      if (!startedAt) return false;
      return startedAt.toMillis() >= startOfMonthTimestamp.toMillis();
    }).length;

    // Check monthly run limit for FREE plan
    if (subscriptionPlan === "FREE" && monthlyRunCount >= 50) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: "You have reached the free limit of 50 runs per month. Please upgrade.",
          limit: 50,
          currentUsage: monthlyRunCount,
          resource: "monthlyRuns",
        },
        { status: 403 }
      );
    }

    // Check active runs limit (for FREE plan: max 10 active runs)
    if (subscriptionPlan === "FREE") {
      const activeRunsQuery = await db
        .collection("active_runs")
        .where("organizationId", "==", orgId)
        .where("status", "in", ["IN_PROGRESS", "FLAGGED"])
        .get();

      const activeRunsCount = activeRunsQuery.size;

      if (activeRunsCount >= 10) {
        return NextResponse.json(
          {
            error: "LIMIT_REACHED",
            message: "You have reached the free limit of 10 active runs. Please complete or cancel existing runs, or upgrade to Pro.",
            limit: 10,
            currentUsage: activeRunsCount,
            resource: "activeRuns",
          },
          { status: 403 }
        );
      }
    }

    // 1. Fetch the Procedure template
    const procedureDoc = await db.collection("procedures").doc(procedureId).get();

    if (!procedureDoc.exists) {
      return NextResponse.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    const procedureData = procedureDoc.data() as Procedure;
    const steps = procedureData.steps || [];

    if (steps.length === 0) {
      return NextResponse.json(
        { error: "Procedure has no steps" },
        { status: 400 }
      );
    }

    // 2. Get the first step and determine its assignee
    const firstStep = steps[0];
    const { assigneeId, assigneeType } = getStepAssignee(firstStep, starterUserId);

    if (!assigneeId) {
      return NextResponse.json(
        { error: "Could not determine assignee for first step" },
        { status: 400 }
      );
    }

    // 3. Get assignee email for currentAssignee field
    let assigneeEmail: string | null = null;
    if (assigneeType === "USER" && assigneeId) {
      try {
        const userDoc = await db.collection("users").doc(assigneeId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          assigneeEmail = userData?.email || null;
        }
      } catch (error) {
        console.warn("Could not fetch assignee email:", error);
      }
    }

    // 4. Create the Run document
    const runData = {
      procedureId,
      procedureTitle: procedureData.title || "Untitled Procedure",
      title: procedureData.title || "Untitled Procedure", // Alias for compatibility
      organizationId: orgId,
      status: "IN_PROGRESS" as const,
      currentStepIndex: 0,
      currentStepId: firstStep.id,
      startedAt: Timestamp.now(),
      startedBy: starterUserId,
      logs: [],
      // Current assignee (for the first step)
      currentAssigneeId: assigneeId,
      currentAssignee: assigneeEmail, // Email-based field for easier querying
      assigneeType: assigneeType || "USER",
      // Legacy fields for backward compatibility
      assigneeId: assigneeId,
      // Store steps for reference
      steps: steps,
    };

    const runRef = await db.collection("active_runs").add(runData);
    const runId = runRef.id;

    // 4. Check if first step is AUTO - if so, execute it automatically using execution engine
    const firstStepIsAuto = isAutoStep(firstStep.action);
    let autoExecuted = false;

    if (firstStepIsAuto) {
      try {
        // Use the execution engine to properly execute the AUTO step
        // This ensures AI_PARSE, DB_INSERT, etc. are actually executed
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const executeResponse = await fetch(`${baseUrl}/api/runs/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: runRef.id,
            stepId: firstStep.id,
            output: {},
            outcome: "SUCCESS",
            orgId,
            userId: starterUserId,
          }),
        });

        if (executeResponse.ok) {
          const result = await executeResponse.json();
          autoExecuted = true;
          
          // If should continue (next step is also AUTO), recursively execute
          if (result.shouldContinue && result.nextStepId) {
            // The execution engine will handle the next step automatically
            // We just need to wait a bit and check again
            console.log("First AUTO step executed, next step will be auto-executed");
          }
        } else {
          const errorData = await executeResponse.json().catch(() => ({}));
          console.error("Error executing first AUTO step:", errorData);
          // Continue anyway - the step will be executed when user views the run
        }
      } catch (autoExecError) {
        console.error("Error auto-executing first step:", autoExecError);
        // Continue anyway - the step will be executed when user views the run
      }
    }

    // 5. Determine redirect action
    const isAssignedToStarter = assigneeId === starterUserId && assigneeType === "USER";
    const action = isAssignedToStarter ? "REDIRECT_TO_RUN" : "REDIRECT_TO_MONITOR";

    // 6. Get assignee name for notification (if available)
    let assigneeName: string | null = null;
    if (assigneeType === "USER" && assigneeId) {
      try {
        const userDoc = await db.collection("users").doc(assigneeId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          assigneeName = userData?.displayName || userData?.email || null;
        }
      } catch (error) {
        console.warn("Could not fetch assignee name:", error);
      }
    }

    return NextResponse.json({
      runId,
      action,
      assigneeName,
      message: isAssignedToStarter
        ? "Process started! You can now work on the first step."
        : assigneeName
        ? `Process started! Task assigned to ${assigneeName}.`
        : "Process started! Task assigned to another user.",
    });
  } catch (error: any) {
    console.error("Error starting run:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to start run";
    let statusCode = 500;
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    // Handle specific Firebase errors
    if (error.code === "permission-denied") {
      errorMessage = "Permission denied. Please check your authentication.";
      statusCode = 403;
    } else if (error.code === "not-found") {
      errorMessage = "Resource not found. Please refresh and try again.";
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message || "An unexpected error occurred",
        code: error.code || "UNKNOWN_ERROR"
      },
      { status: statusCode }
    );
  }
}

