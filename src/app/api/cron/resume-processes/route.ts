import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ProcessRun } from "@/types/schema";
import { resumeProcessRunAfterDelay } from "@/lib/process/execute-step";

/**
 * Cron Endpoint: Resume Processes After Delay
 * 
 * This endpoint should be called periodically (e.g., every minute) to resume
 * ProcessRuns that have completed their delay period.
 * 
 * Security: Protected by CRON_SECRET header to prevent unauthorized access
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Check for CRON_SECRET in headers
    const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    const now = Timestamp.now();

    // Query: Find all ProcessRuns where:
    // - status is WAITING_DELAY
    // - resumeAt is Less Than or Equal to Now (Past/Due)
    const dueProcessesQuery = db
      .collection("process_runs")
      .where("status", "==", "WAITING_DELAY")
      .where("resumeAt", "<=", now);

    const snapshot = await dueProcessesQuery.get();

    console.log(`[Cron] Found ${snapshot.size} ProcessRuns due for resumption`);

    let resumedCount = 0;
    const errors: Array<{ processRunId: string; error: string }> = [];

    // Loop through each matching run
    for (const doc of snapshot.docs) {
      const processRunId = doc.id;
      const processRun = doc.data() as ProcessRun;

      try {
        // Verify resumeAt is actually due (double-check)
        const resumeAt = processRun.resumeAt;
        if (!resumeAt) {
          console.warn(`[Cron] ProcessRun ${processRunId} has no resumeAt, skipping`);
          continue;
        }

        const resumeAtDate = resumeAt.toDate ? resumeAt.toDate() : new Date(resumeAt);
        const nowDate = now.toDate ? now.toDate() : new Date();

        if (resumeAtDate > nowDate) {
          console.log(`[Cron] ProcessRun ${processRunId} is not yet due (resumeAt: ${resumeAtDate.toISOString()})`);
          continue;
        }

        console.log(`[Cron] Resuming ProcessRun ${processRunId} (was due at ${resumeAtDate.toISOString()})`);

        // Resume the process
        await resumeProcessRunAfterDelay(db, processRunId);

        resumedCount++;
        console.log(`[Cron] ✅ Successfully resumed ProcessRun ${processRunId}`);
      } catch (error: any) {
        console.error(`[Cron] ❌ Error resuming ProcessRun ${processRunId}:`, error);
        errors.push({
          processRunId,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      resumedCount,
      totalFound: snapshot.size,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[Cron] Error in resume-processes endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to resume processes",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(req: NextRequest) {
  return GET(req);
}

