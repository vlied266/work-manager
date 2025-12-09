import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Debug endpoint to inspect a specific run's logs and execution details
 * 
 * Usage: GET /api/debug/run/[runId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    
    if (!runId) {
      return NextResponse.json(
        { error: "runId is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const runDoc = await db.collection("active_runs").doc(runId).get();
    
    if (!runDoc.exists) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    const run = runDoc.data();
    
    // Fetch procedure to get step details
    let procedure = null;
    if (run?.procedureId) {
      const procedureDoc = await db.collection("procedures").doc(run.procedureId).get();
      if (procedureDoc.exists) {
        procedure = procedureDoc.data();
      }
    }

    // Format logs with step details
    const formattedLogs = (run?.logs || []).map((log: any, index: number) => {
      const step = procedure?.steps?.[index];
      
      // Try multiple ways to find extracted data
      let extractedData = null;
      if (log.output?.extractedData) {
        extractedData = log.output.extractedData;
      } else if (log.executionResult?.extractedData) {
        extractedData = log.executionResult.extractedData;
      } else if (log.output && typeof log.output === 'object' && 'extractedData' in log.output) {
        extractedData = log.output.extractedData;
      } else if (log.output && step?.action === 'AI_PARSE') {
        // If output is the extracted data itself
        extractedData = log.output;
      }
      
      // Try multiple ways to find inserted data
      let insertedData = null;
      if (log.output?.data) {
        insertedData = log.output.data;
      } else if (log.executionResult?.data) {
        insertedData = log.executionResult.data;
      } else if (log.output && typeof log.output === 'object' && 'data' in log.output) {
        insertedData = log.output.data;
      } else if (log.output && step?.action === 'DB_INSERT') {
        // If output is the inserted data itself
        insertedData = log.output;
      }
      
      return {
        index,
        stepId: log.stepId,
        stepTitle: step?.title || "Unknown Step",
        stepAction: step?.action || "Unknown",
        timestamp: log.timestamp?.toDate?.() || log.timestamp,
        action: log.action,
        message: log.message,
        output: log.output,
        outcome: log.outcome,
        executionResult: log.executionResult,
        // Show extracted data if it's AI_PARSE
        extractedData: extractedData,
        // Show resolved data if it's DB_INSERT
        insertedData: insertedData,
        // Raw output for debugging
        rawOutput: log.output,
        rawExecutionResult: log.executionResult,
      };
    });

    return NextResponse.json({
      success: true,
      runId,
      run: {
        id: runId,
        title: run?.title || run?.procedureTitle,
        status: run?.status,
        currentStepIndex: run?.currentStepIndex,
        procedureId: run?.procedureId,
        procedureTitle: run?.procedureTitle,
        organizationId: run?.organizationId,
        startedAt: run?.startedAt?.toDate?.() || run?.startedAt,
        completedAt: run?.completedAt?.toDate?.() || run?.completedAt,
        triggerContext: run?.triggerContext,
        initialInput: run?.initialInput,
      },
      procedure: procedure ? {
        id: procedure.id || run?.procedureId,
        title: procedure.title,
        steps: procedure.steps?.map((step: any, index: number) => ({
          index,
          id: step.id,
          title: step.title,
          action: step.action,
          config: step.config,
        })) || [],
      } : null,
      logs: formattedLogs,
      summary: {
        totalLogs: formattedLogs.length,
        completedSteps: formattedLogs.filter((log: any) => log.outcome === "SUCCESS").length,
        failedSteps: formattedLogs.filter((log: any) => log.outcome === "FAILURE").length,
        hasExtractedData: formattedLogs.some((log: any) => log.extractedData),
        hasInsertedData: formattedLogs.some((log: any) => log.insertedData),
      },
    });
  } catch (error: any) {
    console.error("Error fetching run debug info:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch run debug info",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

