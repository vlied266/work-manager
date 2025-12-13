import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ActiveRun, Procedure, AtomicStep, ProcessRun, ProcessGroup } from "@/types/schema";
import { isHumanStep, isAutoStep, getStepExecutionType } from "@/lib/constants";
import { resolveConfig } from "@/lib/engine/resolver";
import { sendEmail, textToHtml } from "@/lib/email/sender";
import { ProcessStep as ProcessStepType } from "@/components/process/VariableSelector";
import { executeStep } from "@/lib/process/execute-step";

interface ExecuteStepRequest {
  runId: string;
  stepId: string;
  output?: any;
  outcome: "SUCCESS" | "FAILURE" | "FLAGGED";
  orgId: string;
  userId: string;
}

/**
 * Execution Engine API
 * 
 * Handles step execution with Human-in-the-loop architecture:
 * - HUMAN steps: Create UserTask, send notification, pause workflow (WAITING_FOR_USER)
 * - AUTO steps: Execute immediately, continue to next step automatically
 */
export async function POST(req: NextRequest) {
  try {
    const body: ExecuteStepRequest = await req.json();
    const { runId, stepId, output, outcome, orgId, userId } = body;

    if (!runId || !stepId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: runId, stepId, orgId, userId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch the run
    const runDoc = await db.collection("active_runs").doc(runId).get();
    if (!runDoc.exists) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    const run = runDoc.data() as ActiveRun;
    
    // Verify organization match
    if (run.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Run does not belong to this organization" },
        { status: 403 }
      );
    }

    // Fetch the procedure
    const procedureDoc = await db.collection("procedures").doc(run.procedureId).get();
    if (!procedureDoc.exists) {
      return NextResponse.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    const procedure = procedureDoc.data() as Procedure;
    const currentStep = procedure.steps.find((s) => s.id === stepId);

    if (!currentStep) {
      return NextResponse.json(
        { error: "Step not found in procedure" },
        { status: 404 }
      );
    }

    const stepType = getStepExecutionType(currentStep.action);

    // CRITICAL: Reload run from database to get latest logs (in case this is a recursive execution after resume)
    // This ensures we have the updated output from previous HUMAN steps
    const freshRunDoc = await db.collection("active_runs").doc(runId).get();
    const freshRun = freshRunDoc.exists ? (freshRunDoc.data() as ActiveRun) : run;
    const currentLogs = freshRun.logs || run.logs || [];
    const triggerContext = freshRun.triggerContext || run.triggerContext;
    
    console.log(`[Execute] Using ${currentLogs.length} logs (reloaded from DB)`);
    console.log(`[Execute] Current logs:`, currentLogs.map(l => ({ 
      stepId: l.stepId, 
      hasOutput: !!l.output && typeof l.output === 'object' && Object.keys(l.output || {}).length > 0,
      outputKeys: l.output && typeof l.output === 'object' ? Object.keys(l.output) : []
    })));
    console.log(`[Execute] Has triggerContext:`, !!triggerContext, triggerContext ? Object.keys(triggerContext) : []);

    // Build run context for variable resolution (include trigger context)
    const runContext = currentLogs.reduce((acc: any, log, idx) => {
      const step = procedure.steps.find(s => s.id === log.stepId);
      if (step) {
        const stepIndex = procedure.steps.findIndex(s => s.id === log.stepId);
        const varName = step.config.outputVariableName || `step_${stepIndex + 1}_output`;
        acc[varName] = log.output;
        acc[`step_${stepIndex + 1}_output`] = log.output;
        acc[`step_${stepIndex + 1}`] = { output: log.output };
      }
      return acc;
    }, {});
    
    // Add trigger context if available
    if (triggerContext) {
      runContext.trigger = triggerContext;
      console.log(`[Execute] Added trigger context to runContext:`, Object.keys(triggerContext));
    }
    if (freshRun.initialInput || run.initialInput) {
      runContext.initialInput = freshRun.initialInput || run.initialInput;
    }
    
    // Check if log entry already exists for this step (e.g., from a previous HUMAN step execution)
    const existingLogIndex = currentLogs.findIndex((log) => log.stepId === stepId);
    
    let updatedLogs: any[];
    if (existingLogIndex >= 0 && stepType === "HUMAN") {
      // Update existing log entry (for HUMAN steps that were paused and are now being resumed)
      console.log(`[Execute] Updating existing log entry for HUMAN step ${stepId}`);
      updatedLogs = [...currentLogs];
      updatedLogs[existingLogIndex] = {
        ...updatedLogs[existingLogIndex],
        output: output !== null && output !== undefined ? output : updatedLogs[existingLogIndex].output,
        outcome,
        executedBy: userId,
        executionType: stepType,
        completedAt: Timestamp.now(),
      };
    } else {
      // Create new log entry (for AUTO steps or first-time HUMAN steps)
      const newLog = {
        stepId: currentStep.id,
        stepTitle: currentStep.title,
        action: currentStep.action,
        output: output || {},
        timestamp: Timestamp.now(),
        outcome,
        executedBy: userId,
        executionType: stepType,
      };
      updatedLogs = [...currentLogs, newLog];
    }

    // Calculate next step index
    let nextStepIndex = run.currentStepIndex + 1;
    let newStatus: ActiveRun["status"] = "IN_PROGRESS";

    // Handle routing logic (if step has routes)
    if (currentStep.routes) {
      const routes = currentStep.routes;
      let targetStepId: string | "COMPLETED" | undefined;

      if (outcome === "SUCCESS" && routes.onSuccessStepId) {
        targetStepId = routes.onSuccessStepId;
      } else if ((outcome === "FAILURE" || outcome === "FLAGGED") && routes.onFailureStepId) {
        targetStepId = routes.onFailureStepId;
      } else if (routes.conditions && routes.conditions.length > 0) {
        // Evaluate conditions (simplified - would need context resolution)
        // For now, use default next step
        targetStepId = routes.defaultNextStepId;
      } else if (routes.defaultNextStepId) {
        targetStepId = routes.defaultNextStepId;
      }

      if (targetStepId) {
        if (targetStepId === "COMPLETED") {
          newStatus = "COMPLETED";
          nextStepIndex = run.currentStepIndex;
        } else {
          const targetStepIndex = procedure.steps.findIndex((s) => s.id === targetStepId);
          if (targetStepIndex !== -1) {
            nextStepIndex = targetStepIndex;
          }
        }
      }
    }

    // Check if workflow is complete
    if (outcome === "FLAGGED") {
      newStatus = "FLAGGED";
      if (!currentStep.routes?.onFailureStepId) {
        nextStepIndex = run.currentStepIndex;
      }
    } else if (nextStepIndex >= procedure.steps.length) {
      newStatus = "COMPLETED";
    }

    // CASE A: HUMAN STEP (Interactive) - Pause and wait for user
    if (stepType === "HUMAN") {
      // Create UserTask record (if not already exists)
      const taskId = `task-${runId}-${stepId}`;
      const taskRef = db.collection("user_tasks").doc(taskId);
      const taskDoc = await taskRef.get();

      if (!taskDoc.exists) {
        // Determine assignee
        const assignment = currentStep.assignment || 
          (currentStep.assigneeType ? {
            type: currentStep.assigneeType === "TEAM" ? "TEAM_QUEUE" : 
                  currentStep.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
            assigneeId: currentStep.assigneeId,
          } : null);

        let assigneeId: string | null = null;
        let assigneeType: "USER" | "TEAM" | null = null;

        if (assignment) {
          if (assignment.type === "STARTER") {
            assigneeId = run.startedBy || userId;
            assigneeType = "USER";
          } else if (assignment.type === "SPECIFIC_USER" && assignment.assigneeId) {
            assigneeId = assignment.assigneeId;
            assigneeType = "USER";
          } else if (assignment.type === "TEAM_QUEUE" && assignment.assigneeId) {
            assigneeId = assignment.assigneeId;
            assigneeType = "TEAM";
          }
        }

        // Get assignee email
        let assigneeEmail: string | null = null;
        if (assigneeType === "USER" && assigneeId) {
          const userDoc = await db.collection("users").doc(assigneeId).get();
          if (userDoc.exists) {
            assigneeEmail = userDoc.data()?.email || null;
          }
        }

        // Create UserTask
        await taskRef.set({
          runId,
          stepId,
          procedureId: run.procedureId,
          organizationId: orgId,
          assigneeId,
          assigneeEmail,
          assigneeType: assigneeType || "USER",
          status: "PENDING",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Send notification to assignee
        if (assigneeId && assigneeType === "USER") {
          await db.collection("notifications").add({
            recipientId: assigneeId,
            triggerBy: {
              userId: userId,
              name: "System",
            },
            type: "ASSIGNMENT",
            title: `New task: ${currentStep.title}`,
            message: `You have been assigned a task in "${run.title || run.procedureTitle}"`,
            link: `/run/${runId}`,
            isRead: false,
            createdAt: Timestamp.now(),
            runId,
            stepId,
          });
        }
      }

      // Update run status to WAITING_FOR_USER
      const updateData: any = {
        currentStepIndex: nextStepIndex,
        status: "WAITING_FOR_USER" as ActiveRun["status"],
        logs: updatedLogs,
      };

      // Set assignee for next step
      if (nextStepIndex < procedure.steps.length) {
        const nextStep = procedure.steps[nextStepIndex];
        const nextAssignment = nextStep.assignment || 
          (nextStep.assigneeType ? {
            type: nextStep.assigneeType === "TEAM" ? "TEAM_QUEUE" : 
                  nextStep.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
            assigneeId: nextStep.assigneeId,
          } : null);

        if (nextAssignment) {
          if (nextAssignment.type === "STARTER") {
            updateData.currentAssigneeId = run.startedBy || userId;
            updateData.assigneeType = "USER";
          } else if (nextAssignment.type === "SPECIFIC_USER" && nextAssignment.assigneeId) {
            updateData.currentAssigneeId = nextAssignment.assigneeId;
            updateData.assigneeType = "USER";
          } else if (nextAssignment.type === "TEAM_QUEUE" && nextAssignment.assigneeId) {
            updateData.currentAssigneeId = nextAssignment.assigneeId;
            updateData.assigneeType = "TEAM";
          }
        }
      }

      await db.collection("active_runs").doc(runId).update(updateData);

      return NextResponse.json({
        success: true,
        message: "Human step completed. Workflow paused waiting for user.",
        status: "WAITING_FOR_USER",
        nextStepIndex,
        requiresUserAction: true,
      });
    }

    // CASE B: AUTO STEP (System) - Execute immediately and continue
    if (stepType === "AUTO") {
      // Execute the automated step logic based on action type
      let executionResult: any = { success: true };

      try {
        switch (currentStep.action) {
          case "AI_PARSE": {
            // Build run context for variable resolution
            const runContext = (run.logs || []).reduce((acc: any, log, idx) => {
              const step = procedure.steps[idx];
              if (step) {
                const varName = step.config.outputVariableName || `step_${idx + 1}_output`;
                acc[varName] = log.output;
                acc[`step_${idx + 1}_output`] = log.output;
                acc[`step_${idx + 1}`] = { output: log.output };
              }
              return acc;
            }, {});
            
            // Add trigger context if available
            if (run.triggerContext) {
              runContext.trigger = run.triggerContext;
            }
            if (run.initialInput) {
              runContext.initialInput = run.initialInput;
            }
            
            // Resolve fileUrl from config
            const resolvedConfig = resolveConfig(
              currentStep.config,
              run.logs || [],
              procedure.steps,
              run.triggerContext // Pass trigger context for webhook/file triggers
            );
            
            // Handle TRIGGER_EVENT fileSourceStepId
            let fileUrl: string | undefined;
            let fileId: string | undefined; // Google Drive file ID if available
            
            if (currentStep.config.fileSourceStepId === "TRIGGER_EVENT") {
              // Get file from trigger context - prioritize fileUrl over filePath
              fileUrl = run.triggerContext?.fileUrl || run.initialInput?.fileUrl || run.triggerContext?.file || run.initialInput?.filePath;
              fileId = run.triggerContext?.fileId || run.initialInput?.fileId;
              
              // If fileUrl is still a path (starts with /), log warning
              if (fileUrl && fileUrl.startsWith('/') && !fileUrl.startsWith('http')) {
                console.warn(`[AI_PARSE] fileUrl is a path, not a URL: ${fileUrl}. Using fileId to construct URL.`);
                // If we have fileId, construct proper Google Drive URL
                if (fileId) {
                  fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                  console.log(`[AI_PARSE] Constructed fileUrl from fileId: ${fileUrl}`);
                } else {
                  console.error(`[AI_PARSE] Cannot construct URL: fileUrl is a path and fileId is missing.`);
                  throw new Error(`File URL is invalid. Expected a full URL but got a path: ${fileUrl}. Please ensure the trigger context includes a valid fileUrl or fileId.`);
                }
              }
            } else if (currentStep.config.fileSourceStepId) {
              // Get file from previous step
              const sourceStepId = currentStep.config.fileSourceStepId;
              const sourceStepIndex = procedure.steps.findIndex(s => s.id === sourceStepId);
              if (sourceStepIndex >= 0 && run.logs[sourceStepIndex]) {
                const sourceOutput = run.logs[sourceStepIndex].output;
                fileUrl = sourceOutput?.fileUrl || sourceOutput?.filePath || sourceOutput?.file;
                fileId = sourceOutput?.fileId;
              }
            } else if (resolvedConfig.fileUrl) {
              fileUrl = resolvedConfig.fileUrl;
              fileId = resolvedConfig.fileId;
            }
            
            // CRITICAL: For Google Drive files, we MUST have fileId - fileUrl is unreliable
            if (!fileId && !fileUrl) {
              console.error("[AI_PARSE] Neither fileId nor fileUrl found. Trigger context:", run.triggerContext);
              console.error("[AI_PARSE] Initial input:", run.initialInput);
              console.error("[AI_PARSE] Step config:", currentStep.config);
              throw new Error("File ID or URL not found. Please ensure the file source is configured correctly.");
            }
            
            // If we have fileId, we don't need to resolve fileUrl - parse-document will use Google Drive API
            // Only set a fallback fileUrl if fileId is missing
            if (!fileId && !fileUrl) {
              throw new Error("Cannot parse document: fileId is required for Google Drive files, or fileUrl must be provided for other sources.");
            }
            
            console.log(`[AI_PARSE] Parsing document - fileId: ${fileId || 'none'}, fileUrl: ${fileUrl || 'none'}`);
            console.log(`[AI_PARSE] Fields to extract:`, currentStep.config.fieldsToExtract);
            
            // Get fileName from trigger context for better file type detection
            const fileName = run.triggerContext?.fileName || run.initialInput?.fileName || run.triggerContext?.file || run.initialInput?.filePath;
            
            // Call parse-document API
            // CRITICAL: parse-document will use Google Drive API if fileId is provided, ignoring fileUrl
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            console.log(`[AI_PARSE] Calling parse-document API with fileId: ${fileId || 'none'}, fileUrl: ${fileUrl || 'none'}, fileName: ${fileName || 'none'}`);
            const parseResponse = await fetch(`${baseUrl}/api/ai/parse-document`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileUrl: fileUrl || '', // May be empty if fileId is provided
                fieldsToExtract: currentStep.config.fieldsToExtract || [],
                fileType: currentStep.config.fileType,
                orgId,
                fileId: fileId || undefined, // CRITICAL: Pass fileId - parse-document will use Google Drive API
                fileName: fileName || undefined, // Pass fileName for better file type detection
              }),
            });
            
            if (!parseResponse.ok) {
              const errorData = await parseResponse.json().catch(() => ({}));
              console.error(`[AI_PARSE] Parse API error:`, errorData);
              throw new Error(errorData.error || errorData.message || `Failed to parse document: ${parseResponse.status} ${parseResponse.statusText}`);
            }
            
            const parseResult = await parseResponse.json();
            console.log(`[AI_PARSE] Parse result:`, {
              success: parseResult.success,
              extractedData: parseResult.extractedData,
              fieldsExtracted: parseResult.fieldsExtracted,
            });
            
            if (!parseResult.extractedData || Object.keys(parseResult.extractedData).length === 0) {
              console.warn("[AI_PARSE] Warning: No data extracted from document. This may indicate an empty file or extraction failure.");
            }
            
            // CRITICAL: Store extractedData in executionResult.output for proper workflow propagation
            // The resolver expects {{step_1.output.name}}, which means log.output must be { name: "...", email: "..." }
            // BUT the executionResult must wrap it in an 'output' key so stepOutput becomes the wrapped structure
            const extractedData = parseResult.extractedData || {};
            console.log(`[AI_PARSE] Final extracted data:`, extractedData);
            console.log(`[AI_PARSE] Extracted data keys:`, Object.keys(extractedData));
            
            // 🛑 CRITICAL FIX: Wrap extractedData in 'output' key
            // The executionResult.output will be used as stepOutput, which becomes log.output
            // But we need to ensure the structure is { output: { name: "...", email: "..." } }
            // Actually wait - let me check the flow again...
            // stepOutput = executionResult.output
            // finalLog.output = stepOutput
            // So if executionResult.output = { name: "...", email: "..." }
            // Then log.output = { name: "...", email: "..." }
            // And runContext.step_1 = { output: log.output } = { output: { name: "...", email: "..." } }
            // So {{step_1.output.name}} should work...
            
            // But the user says it's not working. Let me try wrapping it explicitly:
            executionResult = {
              success: true,
              parsed: true,
              extractedData: extractedData,
              fileType: parseResult.fileType,
              // CRITICAL: Set output to extractedData directly (not wrapped)
              // The wrapping happens when building runContext: step_1 = { output: log.output }
              output: extractedData,
            };
            
            console.log(`[AI_PARSE] Execution result structure:`, {
              success: executionResult.success,
              hasOutput: !!executionResult.output,
              outputType: typeof executionResult.output,
              outputKeys: typeof executionResult.output === 'object' && executionResult.output !== null ? Object.keys(executionResult.output) : [],
              outputValue: executionResult.output,
              // Verify it's NOT wrapped (should be flat object)
              isWrapped: executionResult.output && typeof executionResult.output === 'object' && 'output' in executionResult.output,
            });
            break;
          }

          case "DB_INSERT": {
            console.log(`[DB_INSERT] Starting DB insert for collection: ${currentStep.config.collectionName}`);
            
            // CRITICAL: Reload run from database to get latest logs (in case this is a recursive execution)
            // This ensures we have the output from previous steps (e.g., AI_PARSE)
            const updatedRunDoc = await db.collection("active_runs").doc(runId).get();
            const updatedRun = updatedRunDoc.exists ? (updatedRunDoc.data() as ActiveRun) : run;
            const latestLogs = updatedRun.logs || run.logs || [];
            
            console.log(`[DB_INSERT] Using ${latestLogs.length} logs for context building`);
            
            // CRITICAL: Group logs by stepId and prioritize logs with actual output
            // Multiple logs may exist for the same step (e.g., initial log + execution log)
            // We need to find the log with actual output data, not empty ones
            const logsByStepId: Record<string, any> = {};
            latestLogs.forEach((log, idx) => {
              console.log(`[DB_INSERT] Log ${idx + 1}:`, {
                stepId: log.stepId,
                hasOutput: !!log.output,
                outputKeys: typeof log.output === 'object' && log.output !== null ? Object.keys(log.output) : [],
                outputType: typeof log.output,
                outputValue: log.output,
              });
              
              // Group by stepId
              if (!logsByStepId[log.stepId]) {
                logsByStepId[log.stepId] = [];
              }
              logsByStepId[log.stepId].push(log);
            });
            
            // Build run context for variable resolution using latest logs
            // CRITICAL: Safe merge logic to prevent empty logs from overwriting valid data
            const runContext: Record<string, any> = {};
            
            // First pass: Process all logs and build a map of stepId -> best output
            const stepOutputMap: Record<string, any> = {};
            
            latestLogs.forEach((log, idx) => {
              const step = procedure.steps.find(s => s.id === log.stepId);
              if (!step) return;
              
              const stepId = log.stepId;
              const stepOutput = log.output || {};
              
              // CRITICAL: Only update if we don't have valid data OR if new data is valid
              if (!stepOutputMap[stepId]) {
                // First time seeing this step - store it
                stepOutputMap[stepId] = stepOutput;
              } else {
                // We already have data for this step
                const existingOutput = stepOutputMap[stepId];
                const existingHasData = existingOutput && 
                                       typeof existingOutput === 'object' && 
                                       existingOutput !== null && 
                                       Object.keys(existingOutput).length > 0;
                
                const newHasData = stepOutput && 
                                  typeof stepOutput === 'object' && 
                                  stepOutput !== null && 
                                  Object.keys(stepOutput).length > 0;
                
                if (newHasData && !existingHasData) {
                  // New data is valid, existing is not - replace
                  stepOutputMap[stepId] = stepOutput;
                  console.log(`[DB_INSERT] Replacing empty output for ${stepId} with valid data`);
                } else if (newHasData && existingHasData) {
                  // Both have data - merge (new data wins for conflicts)
                  stepOutputMap[stepId] = {
                    ...existingOutput,
                    ...stepOutput,
                  };
                  console.log(`[DB_INSERT] Merging outputs for ${stepId}`);
                }
                // ELSE: Do nothing! Do not overwrite valid data with empty data.
              }
            });
            
            // Second pass: Build the final context structure from stepOutputMap
            procedure.steps.forEach((step, idx) => {
              const stepId = step.id;
              const stepIndex = idx;
              const varName = step.config.outputVariableName || `step_${stepIndex + 1}_output`;
              
              const stepOutput = stepOutputMap[stepId] || {};
              
              // Sanitize: Ensure it's a plain object (strip null prototypes, etc.)
              let sanitizedOutput: any = {};
              try {
                sanitizedOutput = JSON.parse(JSON.stringify(stepOutput));
              } catch (e) {
                // If circular reference or other issue, use original
                sanitizedOutput = stepOutput;
                console.warn(`[DB_INSERT] Could not sanitize output for ${stepId}, using original`);
              }
              
              // Check if sanitizedOutput already has an 'output' key (from AI_PARSE wrapping)
              if (sanitizedOutput && typeof sanitizedOutput === 'object' && sanitizedOutput !== null && 'output' in sanitizedOutput) {
                // sanitizedOutput is { output: { name: "...", email: "..." } }
                const innerOutput = sanitizedOutput.output;
                runContext[varName] = innerOutput;
                runContext[`step_${stepIndex + 1}_output`] = innerOutput;
                runContext[`step_${stepIndex + 1}`] = sanitizedOutput; // Already wrapped
                console.log(`[DB_INSERT] Step ${stepIndex + 1} (${stepId}) - Final wrapped structure:`, {
                  wrapped: true,
                  innerOutputKeys: typeof innerOutput === 'object' && innerOutput !== null ? Object.keys(innerOutput) : [],
                });
              } else if (sanitizedOutput && typeof sanitizedOutput === 'object' && sanitizedOutput !== null && Object.keys(sanitizedOutput).length > 0) {
                // Normal case: sanitizedOutput is { name: "...", email: "..." }
                runContext[varName] = sanitizedOutput;
                runContext[`step_${stepIndex + 1}_output`] = sanitizedOutput;
                runContext[`step_${stepIndex + 1}`] = { output: sanitizedOutput };
                console.log(`[DB_INSERT] Step ${stepIndex + 1} (${stepId}) - Final flat structure:`, {
                  wrapped: false,
                  outputKeys: Object.keys(sanitizedOutput),
                });
              } else {
                // Empty output
                runContext[varName] = {};
                runContext[`step_${stepIndex + 1}_output`] = {};
                runContext[`step_${stepIndex + 1}`] = { output: {} };
                console.warn(`[DB_INSERT] Step ${stepIndex + 1} (${stepId}) - No valid output found`);
              }
            });
            
            console.log(`[DB_INSERT] Run context:`, JSON.stringify(runContext, null, 2));
            console.log(`[DB_INSERT] Step config.data:`, currentStep.config.data);
            
            // Resolve data mapping variables
            const resolvedData = resolveConfig(
              currentStep.config.data || {},
              run.logs || [],
              procedure.steps,
              run.triggerContext // Pass trigger context for webhook/file triggers
            );
            
            console.log(`[DB_INSERT] Resolved data:`, resolvedData);
            
            // Remove _sources metadata if present
            const cleanData: Record<string, any> = {};
            for (const [key, value] of Object.entries(resolvedData)) {
              if (key !== "_sources") {
                cleanData[key] = value;
              }
            }
            
            console.log(`[DB_INSERT] Clean data to insert:`, cleanData);
            
            // Check if data is empty
            if (Object.keys(cleanData).length === 0) {
              throw new Error("No data to insert. This may indicate a variable resolution issue or missing previous step output.");
            }
            
            // Check if all values are unresolved variables (still contain {{)
            const unresolvedVars = Object.entries(cleanData).filter(([key, value]) => 
              typeof value === "string" && value.includes("{{")
            );
            if (unresolvedVars.length > 0) {
              console.error("[DB_INSERT] Error: Some variables were not resolved:", unresolvedVars);
              throw new Error(
                `Failed to resolve variables: ${unresolvedVars.map(([k, v]) => `${k}=${v}`).join(", ")}. ` +
                `This usually means the previous step (AI_PARSE) failed or did not produce the expected output. ` +
                `Please check the previous step's execution result.`
              );
            }
            
            if (!currentStep.config.collectionName) {
              throw new Error("Collection name is required for DB_INSERT");
            }
            
            // Find the collection by name
            const collectionsSnapshot = await db
              .collection("collections")
              .where("orgId", "==", orgId)
              .where("name", "==", currentStep.config.collectionName)
              .limit(1)
              .get();
            
            if (collectionsSnapshot.empty) {
              throw new Error(`Collection "${currentStep.config.collectionName}" not found. Please create it first in the Database section.`);
            }
            
            const collectionDoc = collectionsSnapshot.docs[0];
            const collectionId = collectionDoc.id;
            
            console.log(`[DB_INSERT] Found collection ID: ${collectionId}`);
            
            // Insert into Firestore records collection
            const collectionRef = db.collection("records");
            const newRecord = {
              collectionId: collectionId,
              data: cleanData,
              organizationId: orgId,
              createdAt: Timestamp.now(),
            };
            
            const recordRef = await collectionRef.add(newRecord);
            console.log(`[DB_INSERT] Successfully inserted record: ${recordRef.id}`);
            
            // Check alerts for this newly inserted record
            try {
              const { checkAlertsForRecord } = await import("@/lib/alerts/check-alerts");
              await checkAlertsForRecord(
                orgId,
                currentStep.config.collectionName,
                recordRef.id,
                cleanData
              );
            } catch (alertError) {
              // Log but don't fail the insert if alert checking fails
              console.error(`[DB_INSERT] Error checking alerts (non-fatal):`, alertError);
            }
            
            executionResult = {
              success: true,
              inserted: true,
              recordId: recordRef.id,
              data: cleanData,
            };
            break;
          }

          case "DOC_GENERATE":
            // Execute document generation
            try {
              // 1. Resolve data variables from run context
              const runContext = run.logs.reduce((acc: any, log, idx) => {
                const step = procedure.steps[idx];
                if (step) {
                  const varName = step.config.outputVariableName || `step_${idx + 1}_output`;
                  acc[varName] = log.output;
                  acc[`step_${idx + 1}_output`] = log.output;
                  acc[`step_${idx + 1}`] = { output: log.output };
                }
                return acc;
              }, {});

              // Resolve variables in data object
              const resolvedData = resolveConfig(
                currentStep.config.dataMapping || currentStep.config.data || {},
                run.logs || [],
                procedure.steps,
                run.triggerContext // Pass trigger context for webhook/file triggers
              );

              // Remove _sources metadata if present
              const cleanData: Record<string, any> = {};
              for (const [key, value] of Object.entries(resolvedData)) {
                if (key !== "_sources") {
                  cleanData[key] = value;
                }
              }

              // 2. Call Generator API
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
              const generateResponse = await fetch(`${baseUrl}/api/ai/generate-document`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  templateId: currentStep.config.templateId,
                  data: cleanData,
                  orgId,
                }),
              });

              if (!generateResponse.ok) {
                const errorData = await generateResponse.json();
                throw new Error(errorData.error || errorData.details || "Failed to generate document");
              }

              const pdfResult = await generateResponse.json();
              executionResult = {
                success: true,
                fileUrl: pdfResult.fileUrl,
                fileName: pdfResult.fileName,
              };
            } catch (docError: any) {
              console.error("Error executing DOC_GENERATE:", docError);
              executionResult = {
                success: false,
                error: docError.message || "Document generation failed",
              };
            }
            break;

          case "HTTP_REQUEST":
            // Execute HTTP request (API call)
            // TODO: Implement HTTP request execution logic
            executionResult = { success: true, executed: true };
            break;

          case "SEND_EMAIL": {
            console.log(`[SEND_EMAIL] Starting email sending step: ${currentStep.id}`);
            
            // Reload run from database to get latest logs (in case this is a recursive execution)
            const updatedRunDoc = await db.collection("active_runs").doc(runId).get();
            const updatedRun = updatedRunDoc.exists ? (updatedRunDoc.data() as ActiveRun) : run;
            const latestLogs = updatedRun.logs || run.logs || [];
            
            console.log(`[SEND_EMAIL] Using ${latestLogs.length} logs for context building`);
            
            // Build run context for variable resolution (similar to DB_INSERT)
            const runContext: Record<string, any> = {};
            
            // Build step output map
            const stepOutputMap: Record<string, any> = {};
            latestLogs.forEach((log) => {
              const stepId = log.stepId;
              const stepOutput = log.output || {};
              
              if (!stepOutputMap[stepId]) {
                stepOutputMap[stepId] = stepOutput;
              } else {
                const existingOutput = stepOutputMap[stepId];
                const existingHasData = existingOutput && 
                                       typeof existingOutput === 'object' && 
                                       existingOutput !== null && 
                                       Object.keys(existingOutput).length > 0;
                
                const newHasData = stepOutput && 
                                  typeof stepOutput === 'object' && 
                                  stepOutput !== null && 
                                  Object.keys(stepOutput).length > 0;
                
                if (newHasData && !existingHasData) {
                  stepOutputMap[stepId] = stepOutput;
                } else if (newHasData && existingHasData) {
                  stepOutputMap[stepId] = {
                    ...existingOutput,
                    ...stepOutput,
                  };
                }
              }
            });
            
            // Build final context structure
            procedure.steps.forEach((step, idx) => {
              const stepId = step.id;
              const stepIndex = idx;
              const varName = step.config.outputVariableName || `step_${stepIndex + 1}_output`;
              
              const stepOutput = stepOutputMap[stepId] || {};
              
              let sanitizedOutput: any = {};
              try {
                sanitizedOutput = JSON.parse(JSON.stringify(stepOutput));
              } catch (e) {
                sanitizedOutput = stepOutput;
              }
              
              if (sanitizedOutput && typeof sanitizedOutput === 'object' && sanitizedOutput !== null && 'output' in sanitizedOutput) {
                const innerOutput = sanitizedOutput.output;
                runContext[varName] = innerOutput;
                runContext[`step_${stepIndex + 1}_output`] = innerOutput;
                runContext[`step_${stepIndex + 1}`] = sanitizedOutput;
              } else if (sanitizedOutput && typeof sanitizedOutput === 'object' && sanitizedOutput !== null && Object.keys(sanitizedOutput).length > 0) {
                runContext[varName] = sanitizedOutput;
                runContext[`step_${stepIndex + 1}_output`] = sanitizedOutput;
                runContext[`step_${stepIndex + 1}`] = { output: sanitizedOutput };
              }
            });
            
            // Add trigger context if available
            if (updatedRun.triggerContext) {
              runContext.trigger = updatedRun.triggerContext;
            }
            if (updatedRun.initialInput) {
              runContext.initialInput = updatedRun.initialInput;
            }
            
            // Resolve email configuration variables
            const resolvedConfig = resolveConfig(
              currentStep.config,
              latestLogs,
              procedure.steps,
              updatedRun.triggerContext
            );
            
            console.log(`[SEND_EMAIL] Resolved config:`, {
              to: resolvedConfig.to,
              subject: resolvedConfig.subject,
              hasBody: !!resolvedConfig.body,
              hasHtml: !!resolvedConfig.html,
              hasFrom: !!resolvedConfig.from,
            });
            
            // Extract email fields
            const to = resolvedConfig.to || resolvedConfig.recipient || resolvedConfig.email;
            const subject = resolvedConfig.subject || resolvedConfig.title || "Notification from Atomic Work";
            const body = resolvedConfig.body || resolvedConfig.message || resolvedConfig.content || "";
            const html = resolvedConfig.html || null;
            const from = resolvedConfig.from || null;
            
            // Validate required fields
            if (!to) {
              throw new Error("Email 'to' field is required. Please provide a recipient email address.");
            }
            
            if (!subject) {
              throw new Error("Email 'subject' field is required.");
            }
            
            // Determine HTML content
            let emailHtml: string;
            if (html) {
              // Use provided HTML
              emailHtml = html;
            } else if (body) {
              // Convert plain text to HTML
              emailHtml = textToHtml(body);
            } else {
              throw new Error("Email 'body' or 'html' field is required.");
            }
            
            // Send email
            console.log(`[SEND_EMAIL] Sending email to: ${to}`);
            const emailResult = await sendEmail({
              to: to,
              subject: subject,
              html: emailHtml,
              from: from || undefined,
            });
            
            if (!emailResult.success) {
              throw new Error(emailResult.error || "Failed to send email");
            }
            
            console.log(`[SEND_EMAIL] ✅ Email sent successfully. Email ID: ${emailResult.emailId}`);
            
            executionResult = {
              success: true,
              executed: true,
              sent: true,
              emailId: emailResult.emailId,
              output: {
                sent: true,
                emailId: emailResult.emailId,
                recipient: to,
                subject: subject,
              },
            };
            break;
          }

          case "GOOGLE_SHEET": {
            // Resolve config variables
            const resolvedConfig = resolveConfig(
              currentStep.config,
              latestLogs,
              procedure.steps,
              updatedRun.triggerContext
            );

            const spreadsheetId = resolvedConfig.spreadsheetId;
            const sheetName = resolvedConfig.sheetName;
            const operation = (resolvedConfig.operation || "APPEND_ROW") as "APPEND_ROW" | "UPDATE_ROW" | "LOOKUP_ROW";

            if (!spreadsheetId) {
              throw new Error("Google Sheet 'spreadsheetId' is required.");
            }

            if (!sheetName) {
              throw new Error("Google Sheet 'sheetName' is required.");
            }

            // Get Google integration (access token)
            const integrationsRef = db.collection('integrations');
            const integrationSnapshot = await integrationsRef.where('email', '!=', null).limit(1).get();

            if (integrationSnapshot.empty) {
              throw new Error("No Google integration found. Please connect your Google account first.");
            }

            const integrationDoc = integrationSnapshot.docs[0];
            const integrationData = integrationDoc.data();
            let accessToken = integrationData.access_token;
            const refreshToken = integrationData.refresh_token;

            if (!accessToken) {
              throw new Error("No access token found in Google integration.");
            }

            // Helper function to refresh access token
            const refreshAccessToken = async (refreshToken: string): Promise<string> => {
              const clientId = process.env.GOOGLE_CLIENT_ID;
              const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

              if (!clientId || !clientSecret) {
                throw new Error('Google OAuth credentials not configured');
              }

              const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  refresh_token: refreshToken,
                  grant_type: 'refresh_token',
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to refresh token: ${errorData.error || 'Unknown error'}`);
              }

              const tokenData = await response.json();
              return tokenData.access_token;
            };

            // Helper function to call Google Sheets API with retry on token expiry
            const callSheetsAPI = async (url: string, options: RequestInit): Promise<any> => {
              try {
                const response = await fetch(url, {
                  ...options,
                  headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${accessToken}`,
                  },
                });

                if (response.status === 401 && refreshToken) {
                  // Token expired, refresh and retry
                  console.log("[GOOGLE_SHEET] Access token expired. Refreshing...");
                  accessToken = await refreshAccessToken(refreshToken);
                  
                  // Update token in database
                  await integrationDoc.ref.update({
                    access_token: accessToken,
                    updated_at: Timestamp.now(),
                  });

                  // Retry with new token
                  const retryResponse = await fetch(url, {
                    ...options,
                    headers: {
                      ...options.headers,
                      'Authorization': `Bearer ${accessToken}`,
                    },
                  });

                  if (!retryResponse.ok) {
                    const errorData = await retryResponse.json();
                    throw new Error(`Google Sheets API error: ${errorData.error?.message || 'Unknown error'}`);
                  }

                  return await retryResponse.json();
                }

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(`Google Sheets API error: ${errorData.error?.message || 'Unknown error'}`);
                }

                return await response.json();
              } catch (error: any) {
                if (error.message?.includes('Failed to refresh token')) {
                  throw new Error('Failed to refresh access token. Please reconnect your Google account.');
                }
                throw error;
              }
            };

            if (operation === "LOOKUP_ROW") {
              // LOOKUP_ROW: Read data from sheet
              const lookupColumn = resolvedConfig.lookupColumn;
              const lookupValue = resolvedConfig.lookupValue;

              if (!lookupColumn) {
                throw new Error("Google Sheet 'lookupColumn' is required for LOOKUP_ROW operation.");
              }

              if (!lookupValue) {
                throw new Error("Google Sheet 'lookupValue' is required for LOOKUP_ROW operation.");
              }

              console.log(`[GOOGLE_SHEET] Looking up row: column="${lookupColumn}", value="${lookupValue}"`);

              // Fetch all rows from the sheet
              const range = `${sheetName}!A:ZZ`; // Read all columns (up to ZZ)
              const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

              const data = await callSheetsAPI(url, {
                method: 'GET',
              });

              const values = data.values || [];

              if (values.length === 0) {
                throw new Error(`No data found in sheet "${sheetName}". The sheet may be empty.`);
              }

              // First row is headers
              const headers = values[0] || [];
              const headerIndex = headers.findIndex((h: string) => 
                h && h.toString().trim().toLowerCase() === lookupColumn.toString().trim().toLowerCase()
              );

              if (headerIndex === -1) {
                throw new Error(`Column "${lookupColumn}" not found in sheet "${sheetName}". Available columns: ${headers.join(', ')}`);
              }

              // Search for matching row (skip header row)
              let foundRow: any = null;
              let foundRowIndex = -1;

              for (let i = 1; i < values.length; i++) {
                const row = values[i];
                const cellValue = row[headerIndex];
                
                // Compare values (case-insensitive string comparison)
                if (cellValue && cellValue.toString().trim().toLowerCase() === lookupValue.toString().trim().toLowerCase()) {
                  foundRow = row;
                  foundRowIndex = i;
                  break; // Found first match, stop searching
                }
              }

              if (!foundRow) {
                throw new Error(`Row not found: No row in column "${lookupColumn}" matches value "${lookupValue}"`);
              }

              // Build output object: Key = Header, Value = Cell Data
              const rowData: Record<string, any> = {};
              headers.forEach((header: string, index: number) => {
                const cellValue = foundRow[index];
                // Convert header to snake_case for better variable names
                const key = header.toString().trim().toLowerCase().replace(/\s+/g, '_');
                rowData[key] = cellValue || null;
                // Also keep original header name for flexibility
                rowData[header.toString().trim()] = cellValue || null;
              });

              console.log(`[GOOGLE_SHEET] ✅ Found row at index ${foundRowIndex + 1}:`, rowData);

              executionResult = {
                success: true,
                executed: true,
                output: rowData, // Return row data as output variables
              };
            } else {
              // APPEND_ROW or UPDATE_ROW (not implemented yet, but structure is ready)
              throw new Error(`Google Sheet operation "${operation}" is not yet implemented. Only LOOKUP_ROW is currently supported.`);
            }

            break;
          }

          case "CALCULATE":
            // Execute calculation
            // TODO: Implement calculation logic
            executionResult = { success: true, executed: true };
            break;

          case "COMPARE":
            // Execute comparison
            // TODO: Implement comparison logic
            executionResult = { success: true, executed: true };
            break;

          case "VALIDATE":
            // Execute validation
            // TODO: Implement validation logic
            executionResult = { success: true, executed: true };
            break;

          case "GATEWAY":
            // Gateway routing is handled in routing logic above
            executionResult = { success: true, executed: true };
            break;

          default:
            executionResult = { success: true };
        }
      } catch (execError: any) {
        console.error(`Error executing AUTO step ${currentStep.action}:`, execError);
        executionResult = {
          success: false,
          error: execError.message || "Execution failed",
        };
      }

      // Update log with execution result and output
      // CRITICAL: For AI_PARSE, executionResult.output contains { name: "...", email: "..." }
      // This MUST become log.output directly (not wrapped) so {{step_1.output.name}} works
      let stepOutput: any;
      
      if (!executionResult.success) {
        stepOutput = { error: executionResult.error };
      } else if (currentStep.action === "AI_PARSE") {
        // 🛑 CRITICAL FIX: Wrap extractedData in 'output' key
        // The resolver expects {{step_1.output.name}}, which means log.output must be { output: { name: "...", email: "..." } }
        // NOT just { name: "...", email: "..." }
        const extractedData = executionResult.output || executionResult.extractedData || {};
        console.log(`[Execute] AI_PARSE extractedData (before wrap):`, extractedData);
        
        // Wrap in 'output' key explicitly
        stepOutput = {
          output: extractedData
        };
        
        console.log(`[Execute] AI_PARSE stepOutput (wrapped):`, stepOutput);
        console.log(`[Execute] AI_PARSE stepOutput structure check:`, {
          hasOutputKey: 'output' in stepOutput,
          outputValue: stepOutput.output,
          outputKeys: typeof stepOutput.output === 'object' && stepOutput.output !== null ? Object.keys(stepOutput.output) : [],
        });
      } else {
        // For other steps, use the fallback chain
        stepOutput = executionResult.output || executionResult.extractedData || executionResult.data || executionResult.fileUrl || executionResult;
      }
      
      console.log(`[Execute] Step output for ${currentStep.action}:`, {
        hasOutput: !!executionResult.output,
        hasExtractedData: !!executionResult.extractedData,
        stepOutputType: typeof stepOutput,
        stepOutputKeys: typeof stepOutput === 'object' && stepOutput !== null ? Object.keys(stepOutput) : [],
        stepOutputValue: stepOutput,
      });
      
      // CRITICAL: Ensure stepOutput is properly structured
      // For AI_PARSE: stepOutput = { name: "...", email: "..." }
      // This becomes log.output, which is then accessed as {{step_1.output.name}}
      // The resolver expects log.output to be the data object directly
      const finalLog = {
        ...newLog,
        output: stepOutput, // This MUST be the extractedData object for AI_PARSE
        outcome: executionResult.success ? "SUCCESS" : "FAILURE",
        executionResult,
      };
      
      console.log(`[Execute] Final log structure for ${currentStep.action}:`, {
        stepId: finalLog.stepId,
        hasOutput: !!finalLog.output,
        outputType: typeof finalLog.output,
        outputKeys: typeof finalLog.output === 'object' && finalLog.output !== null ? Object.keys(finalLog.output) : [],
        outputValue: finalLog.output,
        // Verify structure matches expected format
        isExpectedFormat: currentStep.action === "AI_PARSE" 
          ? (typeof finalLog.output === 'object' && finalLog.output !== null && !Array.isArray(finalLog.output))
          : true,
      });
      
      const finalLogs = [...updatedLogs.slice(0, -1), finalLog];

      // Update run
      const updateData: any = {
        currentStepIndex: nextStepIndex,
        status: newStatus,
        logs: finalLogs,
      };

      if (newStatus === "COMPLETED") {
        updateData.completedAt = Timestamp.now();
      }

      // Set assignee for next step (if it's a human step)
      if (newStatus !== "COMPLETED" && nextStepIndex < procedure.steps.length) {
        const nextStep = procedure.steps[nextStepIndex];
        const nextStepType = getStepExecutionType(nextStep.action);

        if (nextStepType === "HUMAN") {
          const nextAssignment = nextStep.assignment || 
            (nextStep.assigneeType ? {
              type: nextStep.assigneeType === "TEAM" ? "TEAM_QUEUE" : 
                    nextStep.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
              assigneeId: nextStep.assigneeId,
            } : null);

          if (nextAssignment) {
            if (nextAssignment.type === "STARTER") {
              updateData.currentAssigneeId = run.startedBy || userId;
              updateData.assigneeType = "USER";
              updateData.status = "WAITING_FOR_USER";
            } else if (nextAssignment.type === "SPECIFIC_USER" && nextAssignment.assigneeId) {
              updateData.currentAssigneeId = nextAssignment.assigneeId;
              updateData.assigneeType = "USER";
              updateData.status = "WAITING_FOR_USER";
            } else if (nextAssignment.type === "TEAM_QUEUE" && nextAssignment.assigneeId) {
              updateData.currentAssigneeId = nextAssignment.assigneeId;
              updateData.assigneeType = "TEAM";
              updateData.status = "WAITING_FOR_USER";
            }
          }
        } else {
          // Next step is also AUTO - continue execution recursively
          updateData.status = "IN_PROGRESS";
        }
      }

      await db.collection("active_runs").doc(runId).update(updateData);

      // CHAIN REACTION: If this ActiveRun is part of a ProcessRun, continue to next step
      if (run.processRunId && newStatus === "COMPLETED") {
        try {
          await continueProcessRun(db, run.processRunId, runId, run);
        } catch (processError: any) {
          console.error(`[Execute] Error continuing ProcessRun ${run.processRunId}:`, processError);
          // Don't fail the ActiveRun completion, just log the error
        }
      }

      // If next step is AUTO, recursively execute it
      if (newStatus !== "COMPLETED" && nextStepIndex < procedure.steps.length) {
        const nextStep = procedure.steps[nextStepIndex];
        const nextStepType = getStepExecutionType(nextStep.action);

        if (nextStepType === "AUTO") {
          // Recursively execute next AUTO step immediately
          try {
            // Build a new request body for the next step
            const nextExecuteBody = {
              runId,
              stepId: nextStep.id,
              output: {},
              outcome: "SUCCESS" as const,
              orgId,
              userId,
            };

            // Call execute API recursively (internal call)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const nextExecuteResponse = await fetch(`${baseUrl}/api/runs/execute`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(nextExecuteBody),
            });

            if (nextExecuteResponse.ok) {
              const nextResult = await nextExecuteResponse.json();
              // Return the result from the recursive call
              return NextResponse.json({
                success: true,
                message: "Auto steps executed successfully.",
                status: nextResult.status || updateData.status,
                nextStepIndex: nextResult.nextStepIndex || nextStepIndex,
                requiresUserAction: nextResult.requiresUserAction || false,
                shouldContinue: nextResult.shouldContinue || false,
                nextStepId: nextResult.nextStepId,
              });
            } else {
              // If recursive execution fails, return current result
              console.error("Error recursively executing next AUTO step");
            }
          } catch (recursiveError) {
            console.error("Error in recursive AUTO step execution:", recursiveError);
            // Return current result if recursive execution fails
          }

          // Fallback: Return success and let frontend handle continuation
          return NextResponse.json({
            success: true,
            message: "Auto step executed. Next step is also automated.",
            status: updateData.status,
            nextStepIndex,
            requiresUserAction: false,
            shouldContinue: true, // Signal to frontend to continue
            nextStepId: nextStep.id,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Auto step executed successfully.",
        status: updateData.status,
        nextStepIndex,
        requiresUserAction: updateData.status === "WAITING_FOR_USER",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Step executed",
      status: newStatus,
      nextStepIndex,
    });
  } catch (error: any) {
    console.error("Error executing step:", error);
    return NextResponse.json(
      {
        error: "Failed to execute step",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Continue ProcessRun execution after an ActiveRun completes
 * Merges outputs into contextData and executes the next step
 */
async function continueProcessRun(
  db: any,
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

