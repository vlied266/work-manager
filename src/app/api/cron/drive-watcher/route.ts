import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * External Cron Job: Drive Watcher
 * 
 * This endpoint is called by an external cron service (e.g., cron-job.org) every 24 hours.
 * It checks for new files in watched folders and triggers active workflows.
 * 
 * Security: Only accessible by external cron service (via CRON_SECRET header)
 * 
 * NOTE: This is a placeholder implementation. For real Google Drive integration:
 * 1. Set up Google Drive API credentials
 * 2. Implement folder watching logic
 * 3. Use the /api/runs/trigger endpoint to create new runs
 */

export async function GET(request: NextRequest) {
  try {
    // Security: Verify request comes from external cron service
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    // In production, require valid CRON_SECRET
    if (process.env.NODE_ENV === "production") {
      if (!expectedSecret) {
        console.error("CRON_SECRET environment variable is not set");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${expectedSecret}`) {
        console.warn("Unauthorized cron job attempt", {
          hasHeader: !!authHeader,
          nodeEnv: process.env.NODE_ENV,
        });
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else {
      // In development, log but allow (for testing)
      if (authHeader !== `Bearer ${expectedSecret}`) {
        console.warn(
          "[DEV MODE] Cron job called without valid secret. Allowing for testing.",
          {
            hasHeader: !!authHeader,
            expectedFormat: "Bearer <CRON_SECRET>",
          }
        );
      }
    }

    const db = getAdminDb();

    // Fetch ONLY active procedures with ON_FILE_CREATED triggers
    // CRITICAL: Only procedures where isActive === true will be checked
    const activeProceduresSnapshot = await db
      .collection("procedures")
      .where("isPublished", "==", true)
      .where("isActive", "==", true) // ONLY active workflows
      .where("trigger.type", "==", "ON_FILE_CREATED")
      .get();

    if (activeProceduresSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No active file watcher workflows found",
        checkedProcedures: 0,
        runsCreated: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const procedures = activeProceduresSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Group procedures by folder path and organization
    const folderWatchers = new Map<string, any[]>();
    for (const proc of procedures) {
      const folderPath = proc.trigger?.config?.folderPath;
      if (folderPath) {
        const key = `${proc.organizationId}:${folderPath}`;
        if (!folderWatchers.has(key)) {
          folderWatchers.set(key, []);
        }
        folderWatchers.get(key)!.push(proc);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://theatomicwork.com";
    const runsCreated: string[] = [];
    const errors: string[] = [];

    // TODO: REAL IMPLEMENTATION
    // For each watched folder:
    // 1. Connect to Google Drive API (or other provider)
    // 2. List files in the folder
    // 3. Compare with a cache of previously seen files (Firestore: "file_watcher_cache")
    // 4. For each new file, call /api/runs/trigger with the file path
    //
    // Example implementation:
    // for (const [key, procs] of folderWatchers.entries()) {
    //   const [orgId, folderPath] = key.split(":");
    //   
    //   // Get cached files
    //   const cacheSnapshot = await db
    //     .collection("file_watcher_cache")
    //     .where("organizationId", "==", orgId)
    //     .where("folderPath", "==", folderPath)
    //     .get();
    //   
    //   const cachedFileIds = new Set(cacheSnapshot.docs.map(d => d.data().fileId));
    //   
    //   // List files from Google Drive
    //   const driveFiles = await listDriveFiles(folderPath, orgId);
    //   
    //   for (const file of driveFiles) {
    //     if (!cachedFileIds.has(file.id)) {
    //       // New file detected! Trigger workflows
    //       const triggerResponse = await fetch(`${baseUrl}/api/runs/trigger`, {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({
    //           filePath: file.path,
    //           orgId: orgId,
    //         }),
    //       });
    //       
    //       if (triggerResponse.ok) {
    //         const result = await triggerResponse.json();
    //         runsCreated.push(...(result.runsCreated || []));
    //         
    //         // Update cache
    //         await db.collection("file_watcher_cache").add({
    //           organizationId: orgId,
    //           folderPath,
    //           fileId: file.id,
    //           filePath: file.path,
    //           detectedAt: Timestamp.now(),
    //         });
    //       }
    //     }
    //   }
    // }

    // Placeholder: Log what would be checked
    for (const [key, procs] of folderWatchers.entries()) {
      const [orgId, folderPath] = key.split(":");
      console.log(
        `[Cron] Would check folder: ${folderPath} (${procs.length} active workflow(s) for org ${orgId})`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Drive watcher cron job completed",
      checkedProcedures: procedures.length,
      checkedFolders: folderWatchers.size,
      runsCreated: runsCreated.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      note: "This is a placeholder implementation. Connect to Google Drive API to enable real file watching. Use /api/runs/trigger endpoint to create new runs when files are detected.",
    });
  } catch (error: any) {
    console.error("Error in drive watcher cron job:", error);
    return NextResponse.json(
      {
        error: "Failed to execute drive watcher cron job",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}