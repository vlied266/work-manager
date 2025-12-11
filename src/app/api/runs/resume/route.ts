import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ActiveRun, Procedure } from "@/types/schema";
import { getStepExecutionType } from "@/lib/constants";

interface ResumeRunRequest {
  runId: string;
  stepId: string; // The step that was just completed
  outcome: "SUCCESS" | "FAILURE" | "FLAGGED";
  output?: any; // Optional: output data from the human step
  orgId: string;
  userId: string;
}

/**
 * Workflow Resume API
 * 
 * Resumes a workflow that was paused at a HUMAN step (WAITING_FOR_USER).
 * 
 * Flow:
 * 1. Find and update user_task to COMPLETED
 * 2. Update run status from WAITING_FOR_USER to IN_PROGRESS
 * 3. Add/update log entry for the completed human step
 * 4. Execute the next step automatically (if AUTO) or pause again (if HUMAN)
 */
export async function POST(req: NextRequest) {
  try {
    const body: ResumeRunRequest = await req.json();
    const { runId, stepId, outcome, output, orgId, userId } = body;

    // CRITICAL: Log the incoming payload to debug output structure
    console.log(`[Resume] 📥 Incoming payload:`, {
      runId,
      stepId,
      outcome,
      output,
      outputType: typeof output,
      outputIsObject: output && typeof output === 'object',
      outputKeys: output && typeof output === 'object' ? Object.keys(output) : [],
      outputStringified: JSON.stringify(output),
      orgId,
      userId,
    });

    if (!runId || !stepId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: runId, stepId, orgId, userId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch the run
    const runDoc = await db.collection("active_runs").doc(runId).get();
    if (!runDoc.exists) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    const run = runDoc.data() as ActiveRun;
    
    // Verify organization match
    if (run.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Run does not belong to this organization" },
        { status: 403 }
      );
    }

    // Verify run is in WAITING_FOR_USER status
    if (run.status !== "WAITING_FOR_USER") {
      return NextResponse.json(
        { error: `Run is not waiting for user. Current status: ${run.status}` },
        { status: 400 }
      );
    }

    // Fetch the procedure
    const procedureDoc = await db.collection("procedures").doc(run.procedureId).get();
    if (!procedureDoc.exists) {
      return NextResponse.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    const procedure = procedureDoc.data() as Procedure;
    const completedStep = procedure.steps.find((s) => s.id === stepId);

    if (!completedStep) {
      return NextResponse.json(
        { error: "Step not found in procedure" },
        { status: 404 }
      );
    }

    // Find and update user_task
    const taskId = `task-${runId}-${stepId}`;
    const taskRef = db.collection("user_tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (taskDoc.exists) {
      await taskRef.update({
        status: "COMPLETED",
        completedAt: Timestamp.now(),
        completedBy: userId,
        outcome,
        output: output || {},
        updatedAt: Timestamp.now(),
      });
      console.log(`[Resume] Updated user_task ${taskId} to COMPLETED`);
    } else {
      console.warn(`[Resume] user_task ${taskId} not found, but continuing anyway`);
    }

    // Update log entry for the completed human step
    // Find the log entry for this step and update it with the outcome and output
    let updatedLogs = [...(run.logs || [])];
    const existingLogIndex = updatedLogs.findIndex((log) => log.stepId === stepId);
    
    console.log(`[Resume] 🔍 Finding log entry for step ${stepId}:`, {
      totalLogs: updatedLogs.length,
      existingLogIndex,
      existingLog: existingLogIndex >= 0 ? updatedLogs[existingLogIndex] : null,
      existingOutput: existingLogIndex >= 0 ? updatedLogs[existingLogIndex].output : null,
    });
    
    // CRITICAL: If output is explicitly provided (not null/undefined), REPLACE the existing output
    // Otherwise, keep the existing output if available
    // IMPORTANT: output can be an empty object {}, so we check for null/undefined specifically
    const finalOutput = output !== null && output !== undefined 
      ? output 
      : (existingLogIndex >= 0 ? updatedLogs[existingLogIndex].output : {});
    
    console.log(`[Resume] 📝 Preparing to update log for step ${stepId}:`, {
      hasProvidedOutput: output !== null && output !== undefined,
      providedOutput: output,
      providedOutputType: typeof output,
      providedOutputIsObject: output && typeof output === 'object',
      providedOutputKeys: output && typeof output === 'object' ? Object.keys(output) : [],
      finalOutput,
      finalOutputType: typeof finalOutput,
      finalOutputIsObject: finalOutput && typeof finalOutput === 'object',
      finalOutputKeys: finalOutput && typeof finalOutput === 'object' ? Object.keys(finalOutput) : [],
      existingOutput: existingLogIndex >= 0 ? updatedLogs[existingLogIndex].output : null,
    });
    
    if (existingLogIndex >= 0) {
      // Update existing log entry - REPLACE output if provided, otherwise keep existing
      updatedLogs[existingLogIndex] = {
        ...updatedLogs[existingLogIndex],
        output: finalOutput, // Replace with new output if provided, otherwise keep existing
        outcome,
        executedBy: userId,
        executionType: "HUMAN",
        completedAt: Timestamp.now(),
      };
      
      console.log(`[Resume] ✅ Updated existing log entry. Final output:`, finalOutput);
    } else {
      // Create new log entry if it doesn't exist (shouldn't happen, but handle gracefully)
      console.warn(`[Resume] Log entry for step ${stepId} not found, creating new one`);
      updatedLogs.push({
        stepId,
        stepTitle: completedStep.title,
        action: completedStep.action,
        output: finalOutput,
        timestamp: Timestamp.now(),
        outcome,
        executedBy: userId,
        executionType: "HUMAN",
        completedAt: Timestamp.now(),
      });
      
      console.log(`[Resume] ✅ Created new log entry with output:`, finalOutput);
    }

    // Get the next step (currentStepIndex should already point to the next step)
    const nextStepIndex = run.currentStepIndex;
    const nextStep = procedure.steps[nextStepIndex];

    if (!nextStep) {
      // No more steps - workflow is complete
      await db.collection("active_runs").doc(runId).update({
        status: "COMPLETED",
        logs: updatedLogs,
        completedAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: "Workflow completed",
        status: "COMPLETED",
        nextStepIndex: null,
        requiresUserAction: false,
      });
    }

    // Determine next step type
    const nextStepType = getStepExecutionType(nextStep.action);

    // Update run status to IN_PROGRESS
    const updateData: any = {
      status: "IN_PROGRESS" as ActiveRun["status"],
      logs: updatedLogs,
      currentStepId: nextStep.id,
    };

    // If next step is HUMAN, set assignee and status
    if (nextStepType === "HUMAN") {
      const nextAssignment = nextStep.assignment || 
        (nextStep.assigneeType ? {
          type: nextStep.assigneeType === "TEAM" ? "TEAM_QUEUE" : 
                nextStep.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
          assigneeId: nextStep.assigneeId,
        } : null);

      if (nextAssignment) {
        let assigneeId: string | null = null;
        let assigneeType: "USER" | "TEAM" | null = null;

        if (nextAssignment.type === "STARTER") {
          assigneeId = run.startedBy || userId;
          assigneeType = "USER";
        } else if (nextAssignment.type === "SPECIFIC_USER" && nextAssignment.assigneeId) {
          assigneeId = nextAssignment.assigneeId;
          assigneeType = "USER";
        } else if (nextAssignment.type === "TEAM_QUEUE" && nextAssignment.assigneeId) {
          assigneeId = nextAssignment.assigneeId;
          assigneeType = "TEAM";
        }

        if (assigneeId) {
          updateData.currentAssigneeId = assigneeId;
          updateData.assigneeType = assigneeType;

          // Get assignee email
          if (assigneeType === "USER") {
            const userDoc = await db.collection("users").doc(assigneeId).get();
            if (userDoc.exists) {
              updateData.currentAssignee = userDoc.data()?.email || null;
            }
          }
        }
      }
    }

    // CRITICAL: Update Firestore with the new logs BEFORE executing next step
    console.log(`[Resume] 💾 Updating Firestore with logs:`, {
      runId,
      logsCount: updatedLogs.length,
      logForStep: updatedLogs.find(l => l.stepId === stepId),
      updateDataKeys: Object.keys(updateData),
    });
    
    await db.collection("active_runs").doc(runId).update(updateData);
    
    // Verify the update was successful by reloading the run
    const verifyDoc = await db.collection("active_runs").doc(runId).get();
    if (verifyDoc.exists()) {
      const verifyData = verifyDoc.data() as ActiveRun;
      const verifyLog = verifyData.logs?.find(l => l.stepId === stepId);
      console.log(`[Resume] ✅ Verified Firestore update:`, {
        stepId,
        logExists: !!verifyLog,
        logOutput: verifyLog?.output,
        logOutputKeys: verifyLog?.output && typeof verifyLog.output === 'object' ? Object.keys(verifyLog.output) : [],
      });
    }

    // If next step is AUTO, execute it immediately
    if (nextStepType === "AUTO") {
      console.log(`[Resume] Next step is AUTO (${nextStep.action}), executing immediately...`);
      
      try {
        // Call execute API recursively for the next AUTO step
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const executeResponse = await fetch(`${baseUrl}/api/runs/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId,
            stepId: nextStep.id,
            output: {},
            outcome: "SUCCESS",
            orgId,
            userId: "system", // System-triggered execution
          }),
        });

        if (executeResponse.ok) {
          const executeResult = await executeResponse.json();
          console.log(`[Resume] Successfully executed next AUTO step:`, executeResult);
          
          return NextResponse.json({
            success: true,
            message: "Workflow resumed and next step executed",
            status: executeResult.status || "IN_PROGRESS",
            nextStepIndex: executeResult.nextStepIndex || nextStepIndex,
            requiresUserAction: executeResult.requiresUserAction || false,
            shouldContinue: executeResult.shouldContinue || false,
            nextStepId: executeResult.nextStepId || nextStep.id,
          });
        } else {
          const errorData = await executeResponse.json().catch(() => ({}));
          console.error(`[Resume] Failed to execute next AUTO step:`, errorData);
          
          // Return success but indicate the next step failed
          return NextResponse.json({
            success: true,
            message: "Workflow resumed, but next step execution failed",
            status: "FLAGGED",
            nextStepIndex,
            requiresUserAction: false,
            error: errorData.error || "Failed to execute next step",
          });
        }
      } catch (executeError: any) {
        console.error(`[Resume] Error executing next AUTO step:`, executeError);
        
        // Return success but indicate error
        return NextResponse.json({
          success: true,
          message: "Workflow resumed, but next step execution failed",
          status: "FLAGGED",
          nextStepIndex,
          requiresUserAction: false,
          error: executeError.message || "Failed to execute next step",
        });
      }
    } else {
      // Next step is HUMAN - workflow will pause again
      console.log(`[Resume] Next step is HUMAN (${nextStep.action}), workflow will pause for user action`);
      
      // Create user_task for the next HUMAN step
      const nextTaskId = `task-${runId}-${nextStep.id}`;
      const nextTaskRef = db.collection("user_tasks").doc(nextTaskId);
      const nextTaskDoc = await nextTaskRef.get();

      if (!nextTaskDoc.exists) {
        const nextAssignment = nextStep.assignment || 
          (nextStep.assigneeType ? {
            type: nextStep.assigneeType === "TEAM" ? "TEAM_QUEUE" : 
                  nextStep.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
            assigneeId: nextStep.assigneeId,
          } : null);

        let assigneeId: string | null = null;
        let assigneeType: "USER" | "TEAM" | null = null;

        if (nextAssignment) {
          if (nextAssignment.type === "STARTER") {
            assigneeId = run.startedBy || userId;
            assigneeType = "USER";
          } else if (nextAssignment.type === "SPECIFIC_USER" && nextAssignment.assigneeId) {
            assigneeId = nextAssignment.assigneeId;
            assigneeType = "USER";
          } else if (nextAssignment.type === "TEAM_QUEUE" && nextAssignment.assigneeId) {
            assigneeId = nextAssignment.assigneeId;
            assigneeType = "TEAM";
          }
        }

        let assigneeEmail: string | null = null;
        if (assigneeType === "USER" && assigneeId) {
          const userDoc = await db.collection("users").doc(assigneeId).get();
          if (userDoc.exists) {
            assigneeEmail = userDoc.data()?.email || null;
          }
        }

        await nextTaskRef.set({
          runId,
          stepId: nextStep.id,
          procedureId: run.procedureId,
          organizationId: orgId,
          assigneeId,
          assigneeEmail,
          assigneeType: assigneeType || "USER",
          status: "PENDING",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Send notification to assignee
        if (assigneeId && assigneeType === "USER") {
          await db.collection("notifications").add({
            recipientId: assigneeId,
            triggerBy: {
              userId: userId,
              name: "System",
            },
            type: "ASSIGNMENT",
            title: `New task: ${nextStep.title}`,
            message: `You have been assigned a task in "${run.title || run.procedureTitle}"`,
            link: `/run/${runId}`,
            isRead: false,
            createdAt: Timestamp.now(),
            runId,
            stepId: nextStep.id,
          });
        }
      }

      // Update run status to WAITING_FOR_USER for the next HUMAN step
      await db.collection("active_runs").doc(runId).update({
        status: "WAITING_FOR_USER",
      });

      return NextResponse.json({
        success: true,
        message: "Workflow resumed. Next step requires user action.",
        status: "WAITING_FOR_USER",
        nextStepIndex,
        requiresUserAction: true,
        nextStepId: nextStep.id,
      });
    }
  } catch (error: any) {
    console.error("Error resuming workflow:", error);
    return NextResponse.json(
      {
        error: "Failed to resume workflow",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

