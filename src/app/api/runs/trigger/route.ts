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
    const { filePath, orgId, fileUrl, fileId } = body;

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
    
    console.log(`[Trigger] POST request received: filePath="${filePath}", orgId="${orgId}", fileUrl="${fileUrl}", fileId="${fileId}"`);
    console.log(`[Trigger] Extracted folder path: "${folderPath}"`);

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

    console.log(`[Trigger] Found ${proceduresSnapshot.size} active procedures for org ${orgId}`);
    console.log(`[Trigger] File path: ${filePath}, Extracted folder path: ${folderPath}`);

    if (proceduresSnapshot.empty) {
      console.log(`[Trigger] ⚠️ No active procedures found`);
      return NextResponse.json({
        success: true,
        message: `No workflows found for folder: ${folderPath}`,
        runsCreated: 0,
      });
    }

    console.log(`[Trigger] Processing ${proceduresSnapshot.size} procedures...`);
    const runsCreated: string[] = [];

    // For each matching procedure, create a new run
    for (const procedureDoc of proceduresSnapshot.docs) {
      const procedureData = procedureDoc.data() as Procedure;
      const triggerConfig = procedureData.trigger?.config;
      const configFolderPath = triggerConfig?.folderPath;

      console.log(`[Trigger] Checking procedure: ${procedureData.title}`);
      console.log(`[Trigger] Config folderPath: ${configFolderPath}, File path: ${filePath}`);

      // Normalize folder paths for comparison
      const normalizePath = (path: string) => {
        // Remove leading/trailing slashes and normalize
        return path.replace(/^\/+|\/+$/g, '').toLowerCase();
      };

      // Extract folder from file path for comparison
      const extractFolderFromPath = (path: string): string => {
        const lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return '';
        return path.substring(0, lastSlash).replace(/^\/+|\/+$/g, '');
      };

      // Check if the folder path matches (flexible matching)
      const normalizedFilePath = normalizePath(filePath);
      const normalizedConfigPath = configFolderPath ? normalizePath(configFolderPath) : '';
      const fileFolder = normalizePath(extractFolderFromPath(filePath));
      
      console.log(`[Trigger] Comparing: fileFolder="${fileFolder}", configPath="${normalizedConfigPath}", filePath="${filePath}", configFolderPath="${configFolderPath}"`);
      
      // Use the same matching logic as test endpoint
      const doesMatch = configFolderPath && (
        // Folder extracted from file path matches config folder path (normalized) - MOST RELIABLE
        fileFolder === normalizedConfigPath ||
        // File path starts with folder path (normalized)
        normalizedFilePath.startsWith(normalizedConfigPath + '/') ||
        // File path starts with folder path (original, with slashes)
        filePath.startsWith(configFolderPath + '/') ||
        filePath.startsWith('/' + configFolderPath + '/') ||
        filePath.startsWith(configFolderPath) ||
        filePath.startsWith('/' + configFolderPath) ||
        // Folder path is a Google Drive folder ID and appears in file path
        (configFolderPath.match(/^[a-zA-Z0-9_-]+$/) && filePath.includes(configFolderPath))
      );

      console.log(`[Trigger] Match result: ${doesMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      console.log(`[Trigger] Match breakdown:`, {
        exactMatch: fileFolder === normalizedConfigPath,
        startsWithNormalized: normalizedFilePath.startsWith(normalizedConfigPath + '/'),
        startsWithOriginal: filePath.startsWith(configFolderPath + '/'),
        startsWithSlash: filePath.startsWith('/' + configFolderPath + '/'),
        startsWithNoSlash: filePath.startsWith(configFolderPath),
        startsWithSlashNoSlash: filePath.startsWith('/' + configFolderPath),
        driveIdMatch: configFolderPath ? (configFolderPath.match(/^[a-zA-Z0-9_-]+$/) && filePath.includes(configFolderPath)) : false,
      });

      if (doesMatch) {
        matchCount++;
        console.log(`[Trigger] ✅ Matching procedure #${matchCount}: ${procedureData.title}, folderPath: ${configFolderPath}, filePath: ${filePath}`);
        console.log(`[Trigger] Procedure details:`, {
          id: procedureDoc.id,
          title: procedureData.title,
          stepsCount: procedureData.steps?.length || 0,
          organizationId: procedureData.organizationId,
          isActive: procedureData.isActive,
          isPublished: procedureData.isPublished,
        });
        try {
          console.log(`[Trigger] 🚀 Starting createTriggeredRun for procedure: ${procedureData.title}...`);
          console.log(`[Trigger] Parameters:`, {
            procedureId: procedureDoc.id,
            filePath,
            fileUrl,
            fileId: fileId || undefined,
          });
          
          // Create a new run for this procedure
          const runId = await createTriggeredRun(
            db,
            procedureDoc.id,
            procedureData,
            filePath,
            fileUrl,
            fileId || undefined
          );
          
          console.log(`[Trigger] ✅ Run created successfully: ${runId}`);
          runsCreated.push(runId);
          console.log(`[Trigger] Total runs created so far: ${runsCreated.length}`);

          // Auto-execute the first step if it's an automated step
          const firstStep = procedureData.steps?.[0];
          if (firstStep && isAutoStep(firstStep.action)) {
            console.log(`[Trigger] Auto-executing first step: ${firstStep.action} (${firstStep.id})`);
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
                console.error(`[Trigger] ❌ Failed to auto-execute first step for run ${runId}:`, errorData);
              } else {
                const executeResult = await executeResponse.json().catch(() => ({}));
                console.log(`[Trigger] ✅ Auto-executed first step (${firstStep.action}) for run ${runId}:`, executeResult);
              }
            } catch (err: any) {
              console.error(`[Trigger] ❌ Error auto-executing first step for run ${runId}:`, err.message || err);
            }
          } else {
            console.log(`[Trigger] First step is not AUTO (${firstStep?.action || 'N/A'}), skipping auto-execution`);
          }
        } catch (error: any) {
          console.error(`[Trigger] ❌ Error creating run for procedure ${procedureDoc.id} (${procedureData.title}):`, error.message || error);
          console.error(`[Trigger] Error stack:`, error.stack);
          // Continue with other procedures even if one fails
        }
      } else {
        console.log(`[Trigger] ❌ No match for procedure: ${procedureData.title}, folderPath: ${configFolderPath}, filePath: ${filePath}`);
      }
    }

    console.log(`[Trigger] 📊 Summary: ${proceduresSnapshot.size} procedures checked, ${matchCount} matched, ${runsCreated.length} runs created, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Created ${runsCreated.length} workflow run(s) for file: ${filePath}`,
      runsCreated,
      folderPath,
      summary: {
        proceduresChecked: proceduresSnapshot.size,
        matchesFound: matchCount,
        runsCreated: runsCreated.length,
        errors: errorCount,
      },
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
  fileUrl?: string,
  fileId?: string
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

