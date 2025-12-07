import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { Procedure, AtomicStep } from "@/types/schema";

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

    // 4. Determine redirect action
    const isAssignedToStarter = assigneeId === starterUserId && assigneeType === "USER";
    const action = isAssignedToStarter ? "REDIRECT_TO_RUN" : "REDIRECT_TO_MONITOR";

    // 5. Get assignee name for notification (if available)
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
    return NextResponse.json(
      { error: "Failed to start run", details: error.message },
      { status: 500 }
    );
  }
}

