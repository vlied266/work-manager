import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Test Endpoint for Drive Watcher
 * 
 * This endpoint allows manual testing of the drive watcher functionality
 * without waiting for the cron job.
 * 
 * Usage:
 * GET /api/test/drive-watcher?orgId=YOUR_ORG_ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId query parameter is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://theatomicwork.com";

    // Step 1: Find ALL procedures for debugging
    const allProceduresSnapshot = await db
      .collection("procedures")
      .where("organizationId", "==", orgId)
      .get();

    const allProcedures = allProceduresSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Step 2: Find active procedures with triggers
    const activeProceduresSnapshot = await db
      .collection("procedures")
      .where("organizationId", "==", orgId)
      .where("isPublished", "==", true)
      .where("isActive", "==", true)
      .where("trigger.type", "==", "ON_FILE_CREATED")
      .get();

    if (activeProceduresSnapshot.empty) {
      // Return detailed debugging info
      const proceduresWithTriggers = allProcedures.filter(p => p.trigger?.type === "ON_FILE_CREATED");
      const activeProcedures = allProcedures.filter(p => p.isActive === true);
      const publishedProcedures = allProcedures.filter(p => p.isPublished === true);

      return NextResponse.json({
        success: false,
        message: "No active file watcher workflows found",
        checkedProcedures: 0,
        debug: {
          totalProcedures: allProcedures.length,
          proceduresWithTriggers: proceduresWithTriggers.length,
          activeProcedures: activeProcedures.length,
          publishedProcedures: publishedProcedures.length,
          proceduresWithTriggersDetails: proceduresWithTriggers.map(p => ({
            id: p.id,
            title: p.title,
            isActive: p.isActive,
            isPublished: p.isPublished,
            triggerType: p.trigger?.type,
            folderPath: p.trigger?.config?.folderPath,
          })),
          allProceduresDetails: allProcedures.map(p => ({
            id: p.id,
            title: p.title,
            isActive: p.isActive,
            isPublished: p.isPublished,
            triggerType: p.trigger?.type,
            folderPath: p.trigger?.config?.folderPath,
          })),
        },
      });
    }

    const procedures = activeProceduresSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const results: any[] = [];

    // Step 2: Test each procedure
    for (const proc of procedures) {
      const folderPath = proc.trigger?.config?.folderPath;
      if (!folderPath) continue;

      const result: any = {
        procedureId: proc.id,
        procedureTitle: proc.title,
        folderPath,
        status: "testing",
        errors: [],
        logs: [],
      };

      try {
        // Step 3: Call the trigger endpoint with a test file
        const testFilePath = `${folderPath}/test-file.pdf`;
        const testFileUrl = "https://example.com/test-resume.pdf"; // Placeholder URL

        result.logs.push(`Testing trigger with file: ${testFilePath}`);

        const triggerResponse = await fetch(`${baseUrl}/api/runs/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: testFilePath,
            orgId: orgId,
            fileUrl: testFileUrl,
          }),
        });

        if (triggerResponse.ok) {
          const triggerResult = await triggerResponse.json();
          result.runsCreated = triggerResult.runsCreated || [];
          result.logs.push(`Created ${result.runsCreated.length} run(s)`);

          // Step 4: Check if runs were created and if they executed
          if (result.runsCreated.length > 0) {
            for (const runId of result.runsCreated) {
              // Wait a bit for execution
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const runDoc = await db.collection("active_runs").doc(runId).get();
              if (runDoc && runDoc.exists && typeof runDoc.exists === 'function' ? runDoc.exists() : runDoc.exists) {
                const runData = runDoc.data();
                result.runStatus = runData?.status;
                result.currentStepIndex = runData?.currentStepIndex;
                result.logsCount = runData?.logs?.length || 0;
                result.logs.push(
                  `Run ${runId}: Status=${runData?.status}, Step=${runData?.currentStepIndex}, Logs=${runData?.logs?.length || 0}`
                );
              } else {
                result.logs.push(`Run ${runId}: Not found or not accessible`);
              }
            }
          }
        } else {
          const errorData = await triggerResponse.json().catch(() => ({}));
          result.errors.push(`Trigger failed: ${errorData.error || errorData.details || "Unknown error"}`);
          result.status = "failed";
        }
      } catch (err: any) {
        result.errors.push(`Error: ${err.message}`);
        result.status = "error";
      }

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      message: "Drive watcher test completed",
      orgId,
      proceduresTested: procedures.length,
      results,
    });
  } catch (error: any) {
    console.error("Error in drive watcher test:", error);
    return NextResponse.json(
      {
        error: "Failed to test drive watcher",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

