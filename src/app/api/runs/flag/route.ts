import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

interface FlagRunRequest {
  runId: string;
  errorDetail: string;
  stepId?: string;
  stepTitle?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: FlagRunRequest = await req.json();
    const { runId, errorDetail, stepId, stepTitle } = body;

    if (!runId || !errorDetail) {
      return NextResponse.json(
        { error: "Missing required fields: runId, errorDetail" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch the run document
    const runDoc = await db.collection("active_runs").doc(runId).get();

    if (!runDoc.exists) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    const runData = runDoc.data();

    // Update run status to FLAGGED
    const updateData: any = {
      status: "FLAGGED",
      errorDetail: errorDetail,
      updatedAt: Timestamp.now(),
    };

    // Add error log entry
    const logs = runData.logs || [];
    logs.push({
      stepId: stepId || `step_${runData.currentStepIndex || 0}`,
      stepTitle: stepTitle || "System Task",
      action: runData.steps?.[runData.currentStepIndex]?.action || "SYSTEM_ERROR",
      output: {
        error: errorDetail,
        timestamp: new Date().toISOString(),
      },
      timestamp: Timestamp.now(),
      outcome: "FLAGGED" as const,
    });
    updateData.logs = logs;

    // Save updates
    await runDoc.ref.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Run flagged successfully",
      runId,
      status: "FLAGGED",
    });
  } catch (error: any) {
    console.error("Error flagging run:", error);
    return NextResponse.json(
      { error: "Failed to flag run", details: error.message },
      { status: 500 }
    );
  }
}

