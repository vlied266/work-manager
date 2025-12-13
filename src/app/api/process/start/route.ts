import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ProcessGroup, ProcessRun, ProcessStep, ProcedureStep, DelayStep } from "@/types/schema";
import { ProcessStep as ProcessStepType } from "@/components/process/VariableSelector";
import { executeStep } from "@/lib/process/execute-step";

interface StartProcessRequest {
  processGroupId: string;
  organizationId: string;
  userId: string;
  initialInput?: Record<string, any>;
}

/**
 * Start Process API
 * Creates a ProcessRun and begins execution of the first step
 */
export async function POST(req: NextRequest) {
  try {
    const body: StartProcessRequest = await req.json();
    const { processGroupId, organizationId, userId, initialInput = {} } = body;

    if (!processGroupId || !organizationId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: processGroupId, organizationId, userId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch the ProcessGroup definition
    const processGroupDoc = await db.collection("process_groups").doc(processGroupId).get();
    if (!processGroupDoc.exists) {
      return NextResponse.json(
        { error: "Process group not found" },
        { status: 404 }
      );
    }

    const processGroup = processGroupDoc.data() as ProcessGroup;
    
    // Verify organization match
    if (processGroup.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Process group does not belong to this organization" },
        { status: 403 }
      );
    }

    // Get processSteps from the process group (new format) or migrate from procedureSequence (old format)
    let processSteps: ProcessStepType[] = [];
    
    if (processGroup.processSteps && Array.isArray(processGroup.processSteps)) {
      // New format: processSteps array
      processSteps = processGroup.processSteps as ProcessStepType[];
    } else if (processGroup.procedureSequence && Array.isArray(processGroup.procedureSequence)) {
      // Old format: migrate from procedureSequence
      // Fetch procedures to build ProcessSteps
      const procedureDocs = await Promise.all(
        processGroup.procedureSequence.map((procId: string) =>
          db.collection("procedures").doc(procId).get()
        )
      );

      processSteps = procedureDocs
        .map((doc, index) => {
          if (!doc.exists) return null;
          const procData = doc.data();
          return {
            type: 'procedure' as const,
            instanceId: `step-${index + 1}-${doc.id}`,
            procedureId: doc.id,
            procedureData: {
              id: doc.id,
              ...procData,
              createdAt: procData.createdAt?.toDate() || new Date(),
              updatedAt: procData.updatedAt?.toDate() || new Date(),
              steps: procData.steps || [],
            },
            inputMappings: {},
          } as ProcedureStep;
        })
        .filter((s): s is ProcedureStep => s !== null);
    }

    if (processSteps.length === 0) {
      return NextResponse.json(
        { error: "Process group has no steps" },
        { status: 400 }
      );
    }

    // Initialize ProcessRun
    const firstStep = processSteps[0];
    const processRunData: Omit<ProcessRun, "id"> = {
      processGroupId,
      organizationId,
      status: "RUNNING",
      currentStepInstanceId: firstStep.instanceId,
      contextData: { ...initialInput }, // Start with initial input
      stepHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      startedBy: userId,
    };

    const processRunRef = await db.collection("process_runs").add({
      ...processRunData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const processRunId = processRunRef.id;

    console.log(`[Process Start] Created ProcessRun ${processRunId} with ${processSteps.length} steps`);

    // Execute the first step
    try {
      await executeStep(db, processRunId, firstStep, processSteps, processGroup);
    } catch (stepError: any) {
      console.error(`[Process Start] Error executing first step:`, stepError);
      // Update ProcessRun status to FAILED
      await db.collection("process_runs").doc(processRunId).update({
        status: "FAILED",
        updatedAt: Timestamp.now(),
      });
      
      return NextResponse.json(
        {
          error: "Failed to start process",
          details: stepError.message || "Error executing first step",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processRunId,
      message: "Process started successfully",
    });
  } catch (error: any) {
    console.error("Error starting process:", error);
    return NextResponse.json(
      {
        error: "Failed to start process",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

