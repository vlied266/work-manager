/**
 * Runtime Variable Resolver
 * 
 * Replaces variable placeholders like {{ step_1_output }} with actual values
 * from the run logs at execution time.
 */

import { RunLog, AtomicStep } from "@/types/schema";

export interface ResolvedConfig {
  [key: string]: any;
  _sources?: Record<string, { stepId: string; stepTitle: string; variableName: string }>;
}

/**
 * Resolves variable references in a config object
 * 
 * @param rawConfig - The raw config object with variable placeholders
 * @param runLogs - Array of completed step logs
 * @param procedureSteps - All steps in the procedure (for step index lookup)
 * @param triggerContext - Optional trigger context (for webhook/file triggers) accessible via {{trigger.body.field}} or {{trigger.headers.header}}
 * @returns Resolved config with actual values and source metadata
 */
export function resolveConfig(
  rawConfig: any,
  runLogs: RunLog[],
  procedureSteps: AtomicStep[],
  triggerContext?: any
): ResolvedConfig {
  if (!rawConfig || typeof rawConfig !== "object") {
    return rawConfig;
  }

  const resolved: ResolvedConfig = {};
  const sources: Record<string, { stepId: string; stepTitle: string; variableName: string }> = {};

  // Helper to find variable in logs
  const findVariableInLogs = (variableName: string, propertyPath?: string): { log: RunLog; step: AtomicStep } | null => {
    // Check if it's a step reference like "step_1_output" or "step_1"
    const stepMatch = variableName.match(/^step_(\d+)(_output)?$/);
    if (stepMatch) {
      const stepIndex = parseInt(stepMatch[1]) - 1;
      if (stepIndex >= 0 && stepIndex < procedureSteps.length) {
        const step = procedureSteps[stepIndex];
        const log = runLogs.find((l) => l.stepId === step.id);
        if (log) {
          // If a property path is specified, check if it exists in the output
          if (propertyPath) {
            const value = getNestedValue(log.output, propertyPath);
            // If the value exists, return this log
            if (value !== undefined && value !== null && value !== "") {
              return { log, step };
            }
            // If not found, try fallback: search forwards through subsequent steps
            // This handles cases where AI generated wrong step references (e.g., step_1 when data is in step_2)
            console.warn(`[Resolver] Property "${propertyPath}" not found in ${variableName}. Searching subsequent steps...`);
            for (let i = stepIndex + 1; i < procedureSteps.length; i++) {
              const nextStep = procedureSteps[i];
              const nextLog = runLogs.find((l) => l.stepId === nextStep.id);
              if (nextLog) {
                const nextValue = getNestedValue(nextLog.output, propertyPath);
                if (nextValue !== undefined && nextValue !== null && nextValue !== "") {
                  console.log(`[Resolver] Found "${propertyPath}" in step_${i + 1} instead of ${variableName}`);
                  return { log: nextLog, step: nextStep };
                }
              }
            }
            // If still not found, also try searching backwards (in case data is in an earlier step)
            console.warn(`[Resolver] Property "${propertyPath}" not found in subsequent steps. Searching previous steps...`);
            for (let i = stepIndex - 1; i >= 0; i--) {
              const prevStep = procedureSteps[i];
              const prevLog = runLogs.find((l) => l.stepId === prevStep.id);
              if (prevLog) {
                const prevValue = getNestedValue(prevLog.output, propertyPath);
                if (prevValue !== undefined && prevValue !== null && prevValue !== "") {
                  console.log(`[Resolver] Found "${propertyPath}" in step_${i + 1} instead of ${variableName}`);
                  return { log: prevLog, step: prevStep };
                }
              }
            }
          } else {
            // No property path, just return the log if it exists
            return { log, step };
          }
        }
      }
    } else {
      // Try to find by outputVariableName
      const step = procedureSteps.find(
        (s) => s.config.outputVariableName === variableName
      );
      if (step) {
        const log = runLogs.find((l) => l.stepId === step.id);
        if (log) return { log, step };
      }
    }
    return null;
  };

  // Helper for safe deep access with robust traversal
  // CRITICAL: This must properly traverse nested objects step-by-step
  // Example: getSafeValue({ output: { name: "..." } }, "output.name") -> "..."
  const getSafeValue = (obj: any, path: string): any => {
    if (!obj) return undefined;
    if (!path || path.trim().length === 0) return obj;
    
    const cleanPath = path.trim();
    return cleanPath.split('.').reduce((acc, part) => {
      return (acc && acc[part] !== undefined) ? acc[part] : undefined;
    }, obj);
  };
  
  // Alias for backward compatibility
  const getNestedValue = getSafeValue;
  
  // Build environment from logs using STRICT stepId-based mapping
  // CRITICAL: Use log.stepId, NOT array index, to prevent data shifting
  const buildEnvironmentFromLogs = (): Record<string, any> => {
    // 1. Start with a fresh environment
    const env: Record<string, any> = {};
    
    // 2. Iterate strictly over existing logs
    // STRICT RULE: Trust the log's stepId. Never use array index or current step ID.
    const logsToProcess = runLogs || [];
    
    logsToProcess.forEach((log) => {
      // STRICT RULE: Use log.stepId, not array index
      const stepId = log.stepId;
      
      if (!stepId) {
        console.warn(`[Context Builder] Log missing stepId, skipping:`, log);
        return;
      }
      
      // Find the step to get its index for naming (step_1, step_2, etc.)
      const step = procedureSteps.find(s => s.id === stepId);
      if (!step) {
        console.warn(`[Context Builder] Step not found for stepId: ${stepId}`);
        return;
      }
      
      // Get step index from procedureSteps array (for step_1, step_2 naming)
      const stepIndex = procedureSteps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) {
        console.warn(`[Context Builder] Step index not found for stepId: ${stepId}`);
        return;
      }
      
      const stepNumber = stepIndex + 1; // step_1, step_2, etc.
      const varName = step.config.outputVariableName || `step_${stepNumber}_output`;
      
      // Prioritize logs that have actual output
      const hasOutput = log.output && typeof log.output === 'object' && log.output !== null && Object.keys(log.output).length > 0;
      
      // If we haven't seen this step yet, OR if this log has better data, save it.
      // This prevents empty logs from overwriting valid data
      if (!env[`step_${stepNumber}`] || hasOutput) {
        // Get the output, handling wrapped structures
        let stepOutput = log.output || {};
        
        // Sanitize: Ensure it's a plain object
        try {
          stepOutput = JSON.parse(JSON.stringify(stepOutput));
        } catch (e) {
          // If circular reference or other issue, use original
          stepOutput = log.output || {};
        }
        
        // Normalize the output structure
        // Check if stepOutput already has an 'output' key (from AI_PARSE wrapping)
        if (stepOutput && typeof stepOutput === 'object' && stepOutput !== null && 'output' in stepOutput) {
          // stepOutput is { output: { name: "...", email: "..." } }
          const innerOutput = stepOutput.output;
          env[varName] = innerOutput;
          env[`step_${stepNumber}_output`] = innerOutput;
          env[`step_${stepNumber}`] = stepOutput; // Already wrapped as { output: {...} }
        } else if (hasOutput) {
          // Normal case: stepOutput is { name: "...", email: "..." }
          env[varName] = stepOutput;
          env[`step_${stepNumber}_output`] = stepOutput;
          env[`step_${stepNumber}`] = { output: stepOutput };
        } else {
          // Empty output - only set if we haven't seen this step before
          if (!env[`step_${stepNumber}`]) {
            env[varName] = {};
            env[`step_${stepNumber}_output`] = {};
            env[`step_${stepNumber}`] = { output: {} };
          }
        }
      }
    });
    
    console.log("[Context Builder] Final Environment:", JSON.stringify(env, null, 2));
    
    return env;
  };

  // Helper to resolve a single value
  const resolveValue = (value: any, key: string): any => {
    if (typeof value === "string") {
      // Check if the entire value is a variable reference like {{ variableName }}
      const fullMatch = value.match(/^\{\{\s*([^}]+)\s*\}\}$/);
      if (fullMatch) {
        // 1. Clean the variable string (Remove {{, }}, and spaces)
        const cleanVar = fullMatch[1].trim(); // e.g., "step_1.output.name"
        
        console.log(`[Resolver] Attempting to resolve: "${cleanVar}"`);
        
        // 2. Split into step ID and property path
        const parts = cleanVar.split('.');
        const stepId = parts[0]; // e.g., "step_1"
        const path = parts.slice(1).join('.'); // e.g., "output.name"
        
        // Build environment using the SAME structure as DB_INSERT's runContext
        const environment = buildEnvironmentFromLogs();
        
        console.log(`[Resolver] Looking for Step ID: "${stepId}" in environment keys:`, Object.keys(environment));
        
        let resolvedValue: any = undefined;
        
        // STRATEGY 1: Standard Nested Lookup (step_1.output.name)
        if (environment[stepId]) {
          resolvedValue = getSafeValue(environment[stepId], path);
          if (resolvedValue !== undefined) {
            console.log(`[Resolver] ✅ Resolved "${cleanVar}" via Strategy 1 (nested):`, resolvedValue);
            
            // Store source information
            const stepIndex = parseInt(stepId.replace('step_', '')) - 1;
            const step = stepIndex >= 0 && stepIndex < procedureSteps.length ? procedureSteps[stepIndex] : null;
            sources[key] = {
              stepId: step?.id || stepId,
              stepTitle: step?.title || stepId,
              variableName: cleanVar,
            };
            
            return resolvedValue;
          }
        }
        
        // STRATEGY 2: Fallback to Flattened Output (step_1_output.name)
        // Sometimes the context builder flattens outputs to "step_1_output"
        if (resolvedValue === undefined && path.startsWith('output.')) {
          const flatKey = `${stepId}_output`;
          const flatPath = parts.slice(2).join('.'); // remove "output" from path
          
          console.log(`[Resolver] Trying fallback key: "${flatKey}" with path "${flatPath}"`);
          
          if (environment[flatKey]) {
            resolvedValue = getSafeValue(environment[flatKey], flatPath);
            if (resolvedValue !== undefined) {
              console.log(`[Resolver] ✅ Resolved "${cleanVar}" via Strategy 2 (flattened):`, resolvedValue);
              
              // Store source information
              const stepIndex = parseInt(stepId.replace('step_', '')) - 1;
              const step = stepIndex >= 0 && stepIndex < procedureSteps.length ? procedureSteps[stepIndex] : null;
              sources[key] = {
                stepId: step?.id || stepId,
                stepTitle: step?.title || stepId,
                variableName: cleanVar,
              };
              
              return resolvedValue;
            }
          }
        }
        
        // STRATEGY 3: Try to find via logs (fallback for edge cases)
        if (resolvedValue === undefined) {
          const found = findVariableInLogs(stepId, path);
          if (found) {
            let logValue = found.log.output;
            
            if (path) {
              logValue = getSafeValue(logValue, path);
            }
            
            if (logValue !== undefined) {
              console.log(`[Resolver] ✅ Resolved "${cleanVar}" via Strategy 3 (logs):`, logValue);
              
              sources[key] = {
                stepId: found.step.id,
                stepTitle: found.step.title,
                variableName: cleanVar,
              };
              
              return logValue;
            }
          }
        }
        
        // Final check - variable not found
        console.error(`[Resolver] ❌ Failed to resolve "${cleanVar}"`);
        console.error(`[Resolver] Environment structure:`, JSON.stringify(environment, null, 2));
        return value; // Keep the placeholder if not found
      }

      // Check for variable references within a string (e.g., "Total: {{ step_1_output }}")
      const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;
      let resolvedValue = value;
      let match;
      let lastIndex = 0;
      const parts: Array<{ text: string; isVariable: boolean; variable?: string }> = [];

      while ((match = variableRegex.exec(value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: value.substring(lastIndex, match.index), isVariable: false });
        }
        
        // 1. Clean the variable string (Remove {{, }}, and spaces)
        const cleanVar = match[1].trim(); // e.g., "step_1.output.name"
        
        console.log(`[Resolver] Attempting to resolve: "${cleanVar}"`);
        
        // 2. Split into step ID and property path
        const varParts = cleanVar.split('.');
        const stepId = varParts[0]; // e.g., "step_1"
        const path = varParts.slice(1).join('.'); // e.g., "output.name"
        
        // Build environment using the SAME structure as DB_INSERT's runContext
        const environment = buildEnvironmentFromLogs();
        
        let resolvedVarValue: any = undefined;
        
        // STRATEGY 1: Standard Nested Lookup (step_1.output.name)
        if (environment[stepId]) {
          resolvedVarValue = getSafeValue(environment[stepId], path);
          if (resolvedVarValue !== undefined) {
            console.log(`[Resolver] ✅ Resolved "${cleanVar}" in string via Strategy 1 (nested):`, resolvedVarValue);
          }
        }
        
        // STRATEGY 2: Fallback to Flattened Output (step_1_output.name)
        if (resolvedVarValue === undefined && path.startsWith('output.')) {
          const flatKey = `${stepId}_output`;
          const flatPath = varParts.slice(2).join('.'); // remove "output" from path
          
          console.log(`[Resolver] Trying fallback key: "${flatKey}" with path "${flatPath}"`);
          
          if (environment[flatKey]) {
            resolvedVarValue = getSafeValue(environment[flatKey], flatPath);
            if (resolvedVarValue !== undefined) {
              console.log(`[Resolver] ✅ Resolved "${cleanVar}" in string via Strategy 2 (flattened):`, resolvedVarValue);
            }
          }
        }
        
        // STRATEGY 3: Try to find via logs (fallback for edge cases)
        if (resolvedVarValue === undefined) {
          const nestedMatch = cleanVar.match(/^(step_\d+)(\.(.+))?$/);
          if (nestedMatch) {
            const stepVar = nestedMatch[1]; // e.g., "step_1"
            const propertyPath = nestedMatch[3]; // e.g., "output.email"
            
            const found = findVariableInLogs(stepVar, propertyPath);
            if (found) {
              let output = found.log.output;
              
              if (propertyPath) {
                output = getSafeValue(output, propertyPath);
              }
              
              if (output !== undefined) {
                resolvedVarValue = output;
                console.log(`[Resolver] ✅ Resolved "${cleanVar}" in string via Strategy 3 (logs):`, resolvedVarValue);
              }
            }
          } else {
            // Try regular variable lookup
            const found = findVariableInLogs(cleanVar);
            if (found) {
              resolvedVarValue = found.log.output;
            }
          }
        }
        
        // Final check
        if (resolvedVarValue !== undefined) {
          console.log(`[Resolver] ✅ Successfully resolved "${cleanVar}" to:`, resolvedVarValue);
          const outputStr = typeof resolvedVarValue === "object" && resolvedVarValue !== null
            ? JSON.stringify(resolvedVarValue)
            : String(resolvedVarValue ?? "");
          parts.push({ text: outputStr, isVariable: true, variable: cleanVar });
        } else {
          console.error(`[Resolver] ❌ Failed to resolve "${cleanVar}"`);
          // Keep the placeholder if not found
          parts.push({ text: match[0], isVariable: true, variable: cleanVar });
        }
        
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < value.length) {
        parts.push({ text: value.substring(lastIndex), isVariable: false });
      }

      // If we have parts, reconstruct the string
      if (parts.length > 0) {
        return parts.map((p) => p.text).join("");
      }

      return resolvedValue;
    }

    if (Array.isArray(value)) {
      return value.map((item, idx) => resolveValue(item, `${key}[${idx}]`));
    }

    if (typeof value === "object" && value !== null) {
      const resolvedObj: any = {};
      for (const [k, v] of Object.entries(value)) {
        resolvedObj[k] = resolveValue(v, `${key}.${k}`);
      }
      return resolvedObj;
    }

    return value;
  };

  // Resolve all config values
  for (const [key, value] of Object.entries(rawConfig)) {
    if (key !== "_sources") {
      resolved[key] = resolveValue(value, key);
    }
  }

  // Attach source metadata
  if (Object.keys(sources).length > 0) {
    resolved._sources = sources;
  }

  return resolved;
}

/**
 * Get the source information for a specific config key
 */
export function getConfigSource(
  resolvedConfig: ResolvedConfig,
  key: string
): { stepId: string; stepTitle: string; variableName: string } | null {
  return resolvedConfig._sources?.[key] || null;
}

/**
 * Check if a config value was resolved from a variable
 */
export function hasVariableSource(resolvedConfig: ResolvedConfig, key: string): boolean {
  return key in (resolvedConfig._sources || {});
}
