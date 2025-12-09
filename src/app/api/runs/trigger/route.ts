import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { Procedure, AtomicStep } from "@/types/schema";
import { isAutoStep } from "@/lib/constants";

interface TriggerRunRequest {
  filePath: string; // e.g., "/uploads/contracts/invoice-123.pdf"
  orgId?: string; // Optional: filter by organization
  fileUrl?: string; // Optional: direct file URL for testing
  fileId?: string; // Optional: Google Drive file ID for API access
}

/**
 * Workflow Trigger API
 * Automatically starts workflows when a file is uploaded to a specific folder
 * 
 * This simulates a file watcher/webhook that would normally be triggered by
 * a file storage service (e.g., Google Drive, S3, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body: TriggerRunRequest = await req.json();
    const { filePath, orgId, fileUrl } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Extract folder path from file path
    // e.g., "/uploads/contracts/invoice-123.pdf" -> "/uploads/contracts"
    const folderPath = extractFolderPath(filePath);

    // Find all active Procedures with ON_FILE_CREATED trigger matching this folder
    // Only procedures that are both published AND active (isActive === true)
    let proceduresQuery = db
      .collection("procedures")
      .where("isPublished", "==", true)
      .where("isActive", "==", true) // Only active workflows respond to triggers
      .where("trigger.type", "==", "ON_FILE_CREATED");

    if (orgId) {
      proceduresQuery = proceduresQuery.where("organizationId", "==", orgId);
    }

    const proceduresSnapshot = await proceduresQuery.get();

    if (proceduresSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: `No workflows found for folder: ${folderPath}`,
        runsCreated: 0,
      });
    }

    const runsCreated: string[] = [];

    // For each matching procedure, create a new run
    for (const procedureDoc of proceduresSnapshot.docs) {
      const procedureData = procedureDoc.data() as Procedure;
      const triggerConfig = procedureData.trigger?.config;

      // Check if the folder path matches
      if (triggerConfig?.folderPath && filePath.startsWith(triggerConfig.folderPath)) {
        try {
          // Create a new run for this procedure
          const runId = await createTriggeredRun(
            db,
            procedureDoc.id,
            procedureData,
            filePath,
            fileUrl,
            fileId
          );
          runsCreated.push(runId);

          // Auto-execute the first step if it's an automated step
          const firstStep = procedureData.steps?.[0];
          if (firstStep && isAutoStep(firstStep.action)) {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://theatomicwork.com";
              const executeResponse = await fetch(`${baseUrl}/api/runs/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  runId,
                  stepId: firstStep.id,
                  orgId: procedureData.organizationId,
                  userId: "system", // System-triggered execution
                  outcome: "SUCCESS", // Will be determined by execution logic
                }),
              });

              if (!executeResponse.ok) {
                const errorData = await executeResponse.json().catch(() => ({}));
                console.error(`Failed to auto-execute first step for run ${runId}:`, errorData);
              } else {
                console.log(`[Trigger] Auto-executed first step (${firstStep.action}) for run ${runId}`);
              }
            } catch (err: any) {
              console.error(`Error auto-executing first step for run ${runId}:`, err);
            }
          }
        } catch (error: any) {
          console.error(`Error creating run for procedure ${procedureDoc.id}:`, error);
          // Continue with other procedures even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${runsCreated.length} workflow run(s) for file: ${filePath}`,
      runsCreated,
      folderPath,
    });
  } catch (error: any) {
    console.error("Error triggering workflows:", error);
    return NextResponse.json(
      {
        error: "Failed to trigger workflows",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Extract folder path from file path
 */
function extractFolderPath(filePath: string): string {
  const lastSlashIndex = filePath.lastIndexOf("/");
  if (lastSlashIndex === -1) {
    return "/";
  }
  return filePath.substring(0, lastSlashIndex);
}

/**
 * Create a new run for a triggered procedure
 */
async function createTriggeredRun(
  db: any,
  procedureId: string,
  procedure: Procedure,
  filePath: string,
  fileUrl?: string
): Promise<string> {
  const steps = procedure.steps || [];
  
  if (steps.length === 0) {
    throw new Error("Procedure has no steps");
  }

  // Get the first step and determine its assignee
  const firstStep = steps[0];
  
  // Default assignee logic (similar to runs/start route)
  let assigneeId: string | null = null;
  let assigneeType: "USER" | "TEAM" | null = null;

  if (firstStep.assigneeId && firstStep.assigneeType) {
    assigneeId = firstStep.assigneeId;
    assigneeType = firstStep.assigneeType === "TEAM" ? "TEAM" : "USER";
  } else if (procedure.defaultAssignee) {
    assigneeId = procedure.defaultAssignee.id;
    assigneeType = procedure.defaultAssignee.type;
  } else {
    // Default to organization admin (if available)
    // For now, we'll leave it unassigned and let the system handle it
    assigneeId = null;
    assigneeType = null;
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
      console.warn("Could not fetch assignee email:", error);
    }
  }

  // Create the run document
  const runData = {
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
      type: "FILE_UPLOAD",
      filePath: filePath,
    },
    logs: [
      {
        stepId: firstStep.id,
        timestamp: Timestamp.now(),
        action: "TRIGGERED",
        message: `Workflow triggered by file upload: ${filePath}`,
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
    // Inject file path as input for the first step (if it's an INPUT step)
    initialInput: {
      filePath: filePath,
      fileUrl: fileUrl || filePath, // Use provided fileUrl or fallback to filePath
      fileId: fileId, // Google Drive file ID if available
    },
    // Store trigger context for variable resolution (for TRIGGER_EVENT)
    triggerContext: {
      file: filePath,
      fileUrl: fileUrl || filePath, // Use provided fileUrl or fallback to filePath
      filePath: filePath,
      fileId: fileId, // Google Drive file ID if available
    },
  };

  const runRef = await db.collection("active_runs").add(runData);
  return runRef.id;
}

/**
 * GET endpoint to list all procedures with triggers
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    const db = getAdminDb();

    let proceduresQuery = db
      .collection("procedures")
      .where("isPublished", "==", true)
      .where("isActive", "==", true) // Only active workflows
      .where("trigger.type", "==", "ON_FILE_CREATED");

    if (orgId) {
      proceduresQuery = proceduresQuery.where("organizationId", "==", orgId);
    }

    const proceduresSnapshot = await proceduresQuery.get();

    const procedures = proceduresSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        organizationId: data.organizationId,
        trigger: data.trigger,
        isActive: data.isActive || false,
      };
    });

    return NextResponse.json({
      success: true,
      procedures,
      count: procedures.length,
    });
  } catch (error: any) {
    console.error("Error fetching triggered procedures:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch triggered procedures",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

