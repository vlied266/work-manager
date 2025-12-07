import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ActiveRun, AtomicStep } from "@/types/schema";

interface ReassignRequest {
  runId: string;
  newAssigneeEmail: string;
  adminUserId?: string; // Optional: for logging who made the reassignment
}

export async function POST(req: NextRequest) {
  try {
    const body: ReassignRequest = await req.json();
    const { runId, newAssigneeEmail, adminUserId } = body;

    if (!runId || !newAssigneeEmail) {
      return NextResponse.json(
        { error: "Missing required fields: runId, newAssigneeEmail" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // 1. Fetch the run document
    const runDoc = await db.collection("active_runs").doc(runId).get();

    if (!runDoc.exists) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    const runData = runDoc.data() as ActiveRun & { steps?: AtomicStep[]; organizationId: string };

    // 2. Validate run is IN_PROGRESS
    if (runData.status !== "IN_PROGRESS" && runData.status !== "FLAGGED") {
      return NextResponse.json(
        { error: "Can only reassign IN_PROGRESS or FLAGGED runs" },
        { status: 400 }
      );
    }

    // 3. Find user by email
    const usersSnapshot = await db
      .collection("users")
      .where("email", "==", newAssigneeEmail)
      .where("organizationId", "==", runData.organizationId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: `User with email ${newAssigneeEmail} not found in organization` },
        { status: 404 }
      );
    }

    const newAssigneeDoc = usersSnapshot.docs[0];
    const newAssigneeData = newAssigneeDoc.data();
    const newAssigneeId = newAssigneeDoc.id;
    const newAssigneeName = newAssigneeData.displayName || newAssigneeData.email || newAssigneeEmail;

    // 4. Get current assignee info for logging
    let oldAssigneeName = "Unknown";
    if (runData.currentAssigneeId) {
      try {
        const oldAssigneeDoc = await db.collection("users").doc(runData.currentAssigneeId).get();
        if (oldAssigneeDoc.exists) {
          const oldData = oldAssigneeDoc.data();
          oldAssigneeName = oldData.displayName || oldData.email || "Unknown";
        }
      } catch (error) {
        console.warn("Could not fetch old assignee info:", error);
      }
    }

    // 5. Update the run document
    const updateData: any = {
      currentAssigneeId: newAssigneeId,
      currentAssignee: newAssigneeEmail,
      assigneeType: "USER",
      assigneeId: newAssigneeId, // Legacy field
      updatedAt: Timestamp.now(),
    };

    // 6. Update the specific step in the steps array (if steps are stored in run)
    if (runData.steps && Array.isArray(runData.steps) && runData.currentStepIndex !== undefined) {
      const steps = [...runData.steps];
      const currentStep = steps[runData.currentStepIndex];
      
      if (currentStep) {
        // Update the step's assignment
        currentStep.assigneeId = newAssigneeId;
        currentStep.assigneeType = "USER";
        if (!currentStep.assignment) {
          currentStep.assignment = {
            type: "SPECIFIC_USER",
            assigneeId: newAssigneeId,
          };
        } else {
          currentStep.assignment.type = "SPECIFIC_USER";
          currentStep.assignment.assigneeId = newAssigneeId;
        }
        
        steps[runData.currentStepIndex] = currentStep;
        updateData.steps = steps;
      }
    }

    // 7. Add a system log entry (optional)
    const logs = runData.logs || [];
    const adminName = adminUserId ? (await db.collection("users").doc(adminUserId).get()).data()?.displayName || "Admin" : "Admin";
    
    logs.push({
      stepId: runData.currentStepId || `step_${runData.currentStepIndex}`,
      stepTitle: "System Action",
      action: "AUTHORIZE" as any, // Using AUTHORIZE as a placeholder for system actions
      output: {
        action: "reassigned",
        from: oldAssigneeName,
        to: newAssigneeName,
        by: adminName,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      outcome: "SUCCESS" as const,
    });
    updateData.logs = logs;

    // 8. Save updates
    await runDoc.ref.update(updateData);

    return NextResponse.json({
      success: true,
      message: `Task reassigned from ${oldAssigneeName} to ${newAssigneeName}`,
      newAssigneeId,
      newAssigneeName,
      newAssigneeEmail,
    });
  } catch (error: any) {
    console.error("Error reassigning task:", error);
    return NextResponse.json(
      { error: "Failed to reassign task", details: error.message },
      { status: 500 }
    );
  }
}

