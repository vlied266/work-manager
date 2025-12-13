/**
 * Process Step Execution Helper
 * 
 * Executes a single step in a ProcessRun (either a Procedure or a Delay)
 */

import { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { ProcessRun, ActiveRun, Procedure, ProcessGroup } from "@/types/schema";
import { ProcessStep as ProcessStepType, ProcedureStep, DelayStep } from "@/components/process/VariableSelector";

/**
 * Execute a step in a ProcessRun
 */
export async function executeStep(
  db: Firestore,
  processRunId: string,
  step: ProcessStepType,
  allSteps: ProcessStepType[],
  processGroup: ProcessGroup
): Promise<void> {
  const processRunDoc = await db.collection("process_runs").doc(processRunId).get();
  if (!processRunDoc.exists) {
    throw new Error("ProcessRun not found");
  }

  const processRun = processRunDoc.data() as ProcessRun;
  const contextData = processRun.contextData || {};

  if (step.type === "procedure") {
    // Execute Procedure Step
    await executeProcedureStep(db, processRunId, step, contextData, allSteps, processRun);
  } else if (step.type === "logic_delay") {
    // Execute Delay Step
    await executeDelayStep(db, processRunId, step, processRun);
  } else {
    throw new Error(`Unknown step type: ${(step as any).type}`);
  }
}

/**
 * Execute a Procedure Step
 */
async function executeProcedureStep(
  db: Firestore,
  processRunId: string,
  step: ProcedureStep,
  contextData: Record<string, any>,
  allSteps: ProcessStepType[],
  processRun: ProcessRun
): Promise<void> {
  console.log(`[Process Execute] Executing procedure step: ${step.procedureId}`);

  // Resolve input mappings using contextData
  const resolvedInputs: Record<string, any> = {};
  
  for (const [inputField, mappingValue] of Object.entries(step.inputMappings)) {
    if (mappingValue.startsWith("{{") && mappingValue.endsWith("}}")) {
      // Variable reference: {{step_1.output.email}}
      const variablePath = mappingValue.slice(2, -2).trim();
      resolvedInputs[inputField] = resolveVariableFromContext(variablePath, contextData, allSteps);
    } else {
      // Static value
      resolvedInputs[inputField] = mappingValue;
    }
  }

  console.log(`[Process Execute] Resolved inputs:`, resolvedInputs);

  // Create ActiveRun for this procedure
  const procedure = step.procedureData;
  const activeRunData: Omit<ActiveRun, "id"> = {
    procedureId: procedure.id,
    procedureTitle: procedure.title,
    organizationId: processRun.organizationId,
    status: "IN_PROGRESS",
    currentStepIndex: 0,
    startedAt: new Date(),
    logs: [],
    processRunId, // Link to parent ProcessRun
    initialInput: resolvedInputs, // Pass resolved inputs as initialInput
    startedBy: processRun.startedBy,
  };

  const activeRunRef = await db.collection("active_runs").add({
    ...activeRunData,
    startedAt: Timestamp.now(),
  });

  const activeRunId = activeRunRef.id;
  console.log(`[Process Execute] Created ActiveRun ${activeRunId} for procedure ${procedure.id}`);

  // Update ProcessRun step history
  const currentStepHistory = processRun.stepHistory || [];
  const stepHistory = [...currentStepHistory];
  stepHistory.push({
    stepInstanceId: step.instanceId,
    status: "RUNNING",
    executedAt: new Date(),
    activeRunId,
  });

  await db.collection("process_runs").doc(processRunId).update({
    stepHistory,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Execute a Delay Step
 */
async function executeDelayStep(
  db: Firestore,
  processRunId: string,
  step: DelayStep,
  processRun: ProcessRun
): Promise<void> {
  console.log(`[Process Execute] Executing delay step: ${step.config.duration} ${step.config.unit}`);

  // Calculate resume timestamp
  const now = new Date();
  let resumeAt: Date;

  switch (step.config.unit) {
    case "minutes":
      resumeAt = new Date(now.getTime() + step.config.duration * 60 * 1000);
      break;
    case "hours":
      resumeAt = new Date(now.getTime() + step.config.duration * 60 * 60 * 1000);
      break;
    case "days":
      resumeAt = new Date(now.getTime() + step.config.duration * 24 * 60 * 60 * 1000);
      break;
    default:
      throw new Error(`Unknown delay unit: ${step.config.unit}`);
  }

  // Update ProcessRun status to WAITING_DELAY
  const stepHistory = (await db.collection("process_runs").doc(processRunId).get()).data()?.stepHistory || [];
  stepHistory.push({
    stepInstanceId: step.instanceId,
    status: "WAITING_DELAY",
    executedAt: new Date(),
  });

  await db.collection("process_runs").doc(processRunId).update({
    status: "WAITING_DELAY",
    resumeAt: Timestamp.fromDate(resumeAt),
    stepHistory,
    updatedAt: Timestamp.now(),
  });

  console.log(`[Process Execute] ProcessRun ${processRunId} will resume at ${resumeAt.toISOString()}`);
  // TODO: Schedule a cron job or cloud function to resume execution at resumeAt
}

/**
 * Resume ProcessRun execution after a delay step completes
 * Uses the same continuation logic as continueProcessRun but for delay steps (no ActiveRun outputs to merge)
 */
export async function resumeProcessRunAfterDelay(
  db: Firestore,
  processRunId: string
): Promise<void> {
  console.log(`[Process Resume] Resuming ProcessRun ${processRunId} after delay`);

  // Fetch ProcessRun
  const processRunDoc = await db.collection("process_runs").doc(processRunId).get();
  if (!processRunDoc.exists) {
    throw new Error("ProcessRun not found");
  }

  const processRun = processRunDoc.data() as ProcessRun;

  if (processRun.status !== "WAITING_DELAY") {
    throw new Error(`ProcessRun ${processRunId} is not in WAITING_DELAY status`);
  }

  // Fetch ProcessGroup to get step definitions
  const processGroupDoc = await db.collection("process_groups").doc(processRun.processGroupId).get();
  if (!processGroupDoc.exists) {
    throw new Error("ProcessGroup not found");
  }

  const processGroup = processGroupDoc.data() as ProcessGroup;

  // Get processSteps
  let processSteps: ProcessStepType[] = [];
  if (processGroup.processSteps && Array.isArray(processGroup.processSteps)) {
    processSteps = processGroup.processSteps as ProcessStepType[];
  } else if (processGroup.procedureSequence && Array.isArray(processGroup.procedureSequence)) {
    // Migrate from old format
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
        };
      })
      .filter((s): s is ProcessStepType => s !== null);
  }

  // Find the current step index (should be the delay step)
  const currentStepIndex = processSteps.findIndex(
    (step) => step.instanceId === processRun.currentStepInstanceId
  );

  if (currentStepIndex === -1) {
    throw new Error(`Current step ${processRun.currentStepInstanceId} not found in processSteps`);
  }

  const currentStep = processSteps[currentStepIndex];

  // Verify it's a delay step
  if (currentStep.type !== "logic_delay") {
    throw new Error(`Current step is not a delay step: ${currentStep.type}`);
  }

  // Use the same continuation pattern as continueProcessRun
  // For delay steps, there's no ActiveRun output to merge, so contextData stays the same
  const contextData = { ...processRun.contextData };

  // Update step history - mark delay step as completed
  const stepHistory = processRun.stepHistory || [];
  const stepHistoryEntry = stepHistory.find(
    (entry) => entry.stepInstanceId === currentStep.instanceId
  );
  
  if (stepHistoryEntry) {
    stepHistoryEntry.status = "COMPLETED";
  }

  // Find next step
  const nextStepIndex = currentStepIndex + 1;
  
  if (nextStepIndex >= processSteps.length) {
    // ProcessRun is complete
    await db.collection("process_runs").doc(processRunId).update({
      status: "COMPLETED",
      contextData,
      stepHistory,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`[Process Resume] ProcessRun ${processRunId} completed`);
    return;
  }

  const nextStep = processSteps[nextStepIndex];

  // Update ProcessRun to point to next step and set status to RUNNING
  await db.collection("process_runs").doc(processRunId).update({
    currentStepInstanceId: nextStep.instanceId,
    contextData,
    stepHistory,
    status: "RUNNING",
    resumeAt: null, // Clear resumeAt
    updatedAt: Timestamp.now(),
  });

  // Execute next step (same as continueProcessRun)
  console.log(`[Process Resume] Executing next step after delay: ${nextStep.instanceId}`);
  await executeStep(db, processRunId, nextStep, processSteps, processGroup);
}

/**
 * Resolve a variable from contextData
 * Supports patterns like:
 * - step_1.output.email
 * - step_1.output
 * - step_1.email
 */
function resolveVariableFromContext(
  variablePath: string,
  contextData: Record<string, any>,
  allSteps: ProcessStepType[]
): any {
  // Try direct access first
  if (contextData[variablePath] !== undefined) {
    return contextData[variablePath];
  }

  // Parse step reference (e.g., "step_1.output.email")
  const stepMatch = variablePath.match(/^step_(\d+)(\.(.+))?$/);
  if (stepMatch) {
    const stepIndex = parseInt(stepMatch[1]) - 1;
    if (stepIndex >= 0 && stepIndex < allSteps.length) {
      const referencedStep = allSteps[stepIndex];
      
      // Build the context key for this step
      // For procedure steps, we need to get output from the ActiveRun
      // For now, we'll use a simplified approach: step_1_output format
      const contextKey = `step_${stepIndex + 1}_output`;
      const stepOutput = contextData[contextKey] || contextData[`step_${stepIndex + 1}`]?.output;
      
      if (stepOutput) {
        // If there's a property path (e.g., ".email"), navigate into the output
        const propertyPath = stepMatch[3];
        if (propertyPath) {
          return getNestedValue(stepOutput, propertyPath);
        }
        return stepOutput;
      }
    }
  }

  // Fallback: try to get nested value from contextData
  return getNestedValue(contextData, variablePath);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  return path.split('.').reduce((acc, part) => {
    return (acc && acc[part] !== undefined) ? acc[part] : undefined;
  }, obj);
}

/**
 * Continue ProcessRun execution after an ActiveRun completes
 * Merges outputs into contextData and executes the next step
 */
export async function continueProcessRun(
  db: Firestore,
  processRunId: string,
  completedActiveRunId: string,
  completedActiveRun: ActiveRun
): Promise<void> {
  console.log(`[Process Chain] Continuing ProcessRun ${processRunId} after ActiveRun ${completedActiveRunId} completed`);

  // Fetch ProcessRun
  const processRunDoc = await db.collection("process_runs").doc(processRunId).get();
  if (!processRunDoc.exists) {
    throw new Error("ProcessRun not found");
  }

  const processRun = processRunDoc.data() as ProcessRun;

  // Fetch ProcessGroup to get step definitions
  const processGroupDoc = await db.collection("process_groups").doc(processRun.processGroupId).get();
  if (!processGroupDoc.exists) {
    throw new Error("ProcessGroup not found");
  }

  const processGroup = processGroupDoc.data() as ProcessGroup;

  // Get processSteps
  let processSteps: ProcessStepType[] = [];
  if (processGroup.processSteps && Array.isArray(processGroup.processSteps)) {
    processSteps = processGroup.processSteps as ProcessStepType[];
  } else if (processGroup.procedureSequence && Array.isArray(processGroup.procedureSequence)) {
    // Migrate from old format
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
        };
      })
      .filter((s): s is ProcessStepType => s !== null);
  }

  // Find the current step index
  const currentStepIndex = processSteps.findIndex(
    (step) => step.instanceId === processRun.currentStepInstanceId
  );

  if (currentStepIndex === -1) {
    throw new Error(`Current step ${processRun.currentStepInstanceId} not found in processSteps`);
  }

  const currentStep = processSteps[currentStepIndex];

  // Merge outputs from completed ActiveRun into contextData
  const contextData = { ...processRun.contextData };
  
  // Extract outputs from ActiveRun logs
  if (completedActiveRun.logs && completedActiveRun.logs.length > 0) {
    // Get the last log (final output)
    const finalLog = completedActiveRun.logs[completedActiveRun.logs.length - 1];
    
    // Add to contextData with step reference
    const stepNumber = currentStepIndex + 1;
    contextData[`step_${stepNumber}_output`] = finalLog.output;
    contextData[`step_${stepNumber}`] = { output: finalLog.output };
    
    // Also add procedure title for reference
    contextData[`step_${stepNumber}_title`] = completedActiveRun.procedureTitle;
  }

  console.log(`[Process Chain] Merged outputs into contextData. Step ${currentStepIndex + 1} completed.`);

  // Update step history
  const stepHistory = processRun.stepHistory || [];
  const stepHistoryEntry = stepHistory.find(
    (entry) => entry.stepInstanceId === currentStep.instanceId
  );
  
  if (stepHistoryEntry) {
    stepHistoryEntry.status = "COMPLETED";
    stepHistoryEntry.activeRunId = completedActiveRunId;
  }

  // Find next step
  const nextStepIndex = currentStepIndex + 1;
  
  if (nextStepIndex >= processSteps.length) {
    // ProcessRun is complete
    await db.collection("process_runs").doc(processRunId).update({
      status: "COMPLETED",
      contextData,
      stepHistory,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`[Process Chain] ProcessRun ${processRunId} completed`);
    return;
  }

  const nextStep = processSteps[nextStepIndex];

  // Update ProcessRun to point to next step
  await db.collection("process_runs").doc(processRunId).update({
    currentStepInstanceId: nextStep.instanceId,
    contextData,
    stepHistory,
    status: "RUNNING",
    updatedAt: Timestamp.now(),
  });

  // Execute next step
  console.log(`[Process Chain] Executing next step: ${nextStep.instanceId}`);
  await executeStep(db, processRunId, nextStep, processSteps, processGroup);
}

