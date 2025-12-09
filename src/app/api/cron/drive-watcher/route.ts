import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Vercel Cron Job: Drive Watcher
 * 
 * This endpoint runs every 5 minutes to check for new files in watched folders
 * and trigger active workflows.
 * 
 * Security: Only accessible by Vercel Cron Jobs (via CRON_SECRET header)
 */

export async function GET(request: NextRequest) {
  try {
    // Security: Verify request comes from Vercel Cron
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

    // Find all active procedures with ON_FILE_CREATED triggers
    const activeProceduresSnapshot = await db
      .collection("procedures")
      .where("isPublished", "==", true)
      .where("isActive", "==", true)
      .where("trigger.type", "==", "ON_FILE_CREATED")
      .get();

    if (activeProceduresSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No active file watcher workflows found",
        checkedProcedures: 0,
        runsCreated: 0,
      });
    }

    const procedures = activeProceduresSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Group procedures by folder path
    const folderWatchers = new Map<string, any[]>();
    for (const proc of procedures) {
      const folderPath = proc.trigger?.config?.folderPath;
      if (folderPath) {
        if (!folderWatchers.has(folderPath)) {
          folderWatchers.set(folderPath, []);
        }
        folderWatchers.get(folderPath)!.push(proc);
      }
    }

    // TODO: In a real implementation, this would:
    // 1. Connect to Google Drive API (or other providers)
    // 2. List files in each watched folder
    // 3. Compare with a cache of previously seen files
    // 4. For new files, call /api/runs/trigger with the file path
    //
    // For now, this is a placeholder that simulates the check

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://theatomicwork.com";
    const runsCreated: string[] = [];
    const errors: string[] = [];

    // Simulate checking each folder
    for (const [folderPath, procs] of folderWatchers.entries()) {
      try {
        // In a real implementation, you would:
        // 1. List files from Google Drive API for this folder
        // 2. Compare with a cache (Firestore collection: "file_watcher_cache")
        // 3. For each new file, trigger the workflow

        // Placeholder: Log what would be checked
        console.log(`[Cron] Checking folder: ${folderPath} (${procs.length} active workflow(s))`);

        // Example: If you had a file cache, you would do:
        // const cacheSnapshot = await db
        //   .collection("file_watcher_cache")
        //   .where("folderPath", "==", folderPath)
        //   .get();
        //
        // const cachedFiles = new Set(cacheSnapshot.docs.map(d => d.data().fileId));
        //
        // const driveFiles = await listDriveFiles(folderPath);
        // for (const file of driveFiles) {
        //   if (!cachedFiles.has(file.id)) {
        //     // New file detected!
        //     const triggerResponse = await fetch(`${baseUrl}/api/runs/trigger`, {
        //       method: "POST",
        //       headers: { "Content-Type": "application/json" },
        //       body: JSON.stringify({
        //         filePath: file.path,
        //         orgId: proc.organizationId,
        //       }),
        //     });
        //     // Update cache
        //     await db.collection("file_watcher_cache").add({
        //       folderPath,
        //       fileId: file.id,
        //       filePath: file.path,
        //       detectedAt: Timestamp.now(),
        //     });
        //   }
        // }
      } catch (error: any) {
        console.error(`Error checking folder ${folderPath}:`, error);
        errors.push(`${folderPath}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Drive watcher cron job completed",
      checkedProcedures: procedures.length,
      checkedFolders: folderWatchers.size,
      runsCreated: runsCreated.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      note: "This is a placeholder implementation. Connect to Google Drive API to enable real file watching.",
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

