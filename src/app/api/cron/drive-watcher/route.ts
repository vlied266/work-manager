import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

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
    })) as any[];

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

    // REAL IMPLEMENTATION: Connect to Google Drive and check for new files
    for (const [key, procs] of folderWatchers.entries()) {
      const [orgId, folderPath] = key.split(":");
      console.log(
        `[Cron] Checking folder: ${folderPath} (${procs.length} active workflow(s) for org ${orgId})`
      );

      try {
        // Initialize Google Drive API using OAuth 2.0 credentials
        const { google } = await import("googleapis");
        
        // Use OAuth 2.0 credentials (Client ID, Secret, Refresh Token)
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'https://theatomicwork.com'
        );

        // Set the refresh token
        if (process.env.GOOGLE_REFRESH_TOKEN) {
          oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
          });
        } else {
          throw new Error("GOOGLE_REFRESH_TOKEN environment variable is not set");
        }

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Get cached files from Firestore
        const cacheSnapshot = await db
          .collection("file_watcher_cache")
          .where("organizationId", "==", orgId)
          .where("folderPath", "==", folderPath)
          .get();

        const cachedFileIds = new Set(cacheSnapshot.docs.map(d => d.data().fileId));

        // Resolve folder ID from folder path
        // If folderPath is already a folder ID (starts with alphanumeric), use it directly
        // Otherwise, search for folder by name
        let folderId: string | null = null;
        
        if (folderPath.match(/^[a-zA-Z0-9_-]+$/)) {
          // Looks like a folder ID
          folderId = folderPath;
        } else {
          // Search for folder by name
          const folderName = folderPath.startsWith('/') ? folderPath.slice(1) : folderPath;
          const folderSearch = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            pageSize: 1,
          });

          if (folderSearch.data.files && folderSearch.data.files.length > 0) {
            folderId = folderSearch.data.files[0].id!;
          } else {
            console.warn(`[Cron] Folder not found: ${folderPath}`);
            continue;
          }
        }

        // List files in the folder (created in the last 24 hours to avoid processing old files)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const filesResponse = await drive.files.list({
          q: `'${folderId}' in parents and createdTime > '${oneDayAgo}' and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
          fields: 'files(id, name, createdTime, webContentLink, webViewLink, mimeType)',
          orderBy: 'createdTime desc',
          pageSize: 50,
        });

        const files = filesResponse.data.files || [];
        console.log(`[Cron] Found ${files.length} files in folder ${folderPath}`);

        // Process new files
        for (const file of files) {
          if (!file.id) continue;

          // Skip if already cached
          if (cachedFileIds.has(file.id)) {
            console.log(`[Cron] File ${file.name} already processed, skipping`);
            continue;
          }

          // New file detected! Trigger workflows
          const filePath = `${folderPath}/${file.name}`;
          const fileUrl = file.webContentLink || file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

          console.log(`[Cron] New file detected: ${file.name}, triggering workflows...`);

          try {
            const triggerResponse = await fetch(`${baseUrl}/api/runs/trigger`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filePath: filePath,
                orgId: orgId,
                fileUrl: fileUrl,
              }),
            });

            if (triggerResponse.ok) {
              const result = await triggerResponse.json();
              runsCreated.push(...(result.runsCreated || []));
              console.log(`[Cron] Triggered ${result.runsCreated?.length || 0} workflow(s) for file: ${file.name}`);

              // Update cache
              await db.collection("file_watcher_cache").add({
                organizationId: orgId,
                folderPath: folderPath,
                fileId: file.id,
                fileName: file.name,
                filePath: filePath,
                fileUrl: fileUrl,
                detectedAt: Timestamp.now(),
                createdTime: file.createdTime,
              });
            } else {
              const errorData = await triggerResponse.json().catch(() => ({}));
              errors.push(`Failed to trigger workflow for ${file.name}: ${errorData.error || 'Unknown error'}`);
              console.error(`[Cron] Failed to trigger workflow for ${file.name}:`, errorData);
            }
          } catch (err: any) {
            errors.push(`Error processing file ${file.name}: ${err.message}`);
            console.error(`[Cron] Error processing file ${file.name}:`, err);
          }
        }

        // Update lastPolledAt for all procedures watching this folder
        for (const proc of procs) {
          try {
            await db.collection("procedures").doc(proc.id).update({
              lastPolledAt: Timestamp.now(),
            });
          } catch (err) {
            console.error(`Error updating lastPolledAt for procedure ${proc.id}:`, err);
          }
        }
      } catch (err: any) {
        console.error(`[Cron] Error processing folder ${folderPath}:`, err);
        errors.push(`Error processing folder ${folderPath}: ${err.message}`);
        
        // Still update lastPolledAt even if there was an error
        for (const proc of procs) {
          try {
            await db.collection("procedures").doc(proc.id).update({
              lastPolledAt: Timestamp.now(),
            });
          } catch (updateErr) {
            console.error(`Error updating lastPolledAt for procedure ${proc.id}:`, updateErr);
          }
        }
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
      note: "This is a placeholder implementation. To test manually, use POST /api/webhooks/simulation with { eventType: 'file_upload', filePath: '/Resumes/test.pdf', orgId: 'your-org-id' }",
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