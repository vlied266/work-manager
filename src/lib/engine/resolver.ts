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
 * @returns Resolved config with actual values and source metadata
 */
export function resolveConfig(
  rawConfig: any,
  runLogs: RunLog[],
  procedureSteps: AtomicStep[]
): ResolvedConfig {
  if (!rawConfig || typeof rawConfig !== "object") {
    return rawConfig;
  }

  const resolved: ResolvedConfig = {};
  const sources: Record<string, { stepId: string; stepTitle: string; variableName: string }> = {};

  // Helper to find variable in logs
  const findVariableInLogs = (variableName: string): { log: RunLog; step: AtomicStep } | null => {
    // Check if it's a step reference like "step_1_output" or "step_1"
    const stepMatch = variableName.match(/^step_(\d+)(_output)?$/);
    if (stepMatch) {
      const stepIndex = parseInt(stepMatch[1]) - 1;
      if (stepIndex >= 0 && stepIndex < procedureSteps.length) {
        const step = procedureSteps[stepIndex];
        const log = runLogs.find((l) => l.stepId === step.id);
        if (log) return { log, step };
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

  // Helper to get nested property from an object using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  };

  // Helper to resolve a single value
  const resolveValue = (value: any, key: string): any => {
    if (typeof value === "string") {
      // Check if the entire value is a variable reference like {{ variableName }}
      const fullMatch = value.match(/^\{\{\s*([^}]+)\s*\}\}$/);
      if (fullMatch) {
        const trimmedVar = fullMatch[1].trim();
        
        // Check if it's a nested property like "step_1.output.email"
        const nestedMatch = trimmedVar.match(/^(step_\d+)(\.(.+))?$/);
        if (nestedMatch) {
          const stepVar = nestedMatch[1]; // e.g., "step_1"
          const propertyPath = nestedMatch[3]; // e.g., "output.email"
          
          const found = findVariableInLogs(stepVar);
          if (found) {
            let resolvedValue = found.log.output;
            
            // If there's a property path, navigate to it
            if (propertyPath) {
              resolvedValue = getNestedValue(resolvedValue, propertyPath);
            }
            
            // Store source information
            sources[key] = {
              stepId: found.step.id,
              stepTitle: found.step.title,
              variableName: trimmedVar,
            };
            
            return resolvedValue !== undefined ? resolvedValue : value; // Keep placeholder if property not found
          }
        } else {
          // Try regular variable lookup
          const found = findVariableInLogs(trimmedVar);
          
          if (found) {
            // Store source information
            sources[key] = {
              stepId: found.step.id,
              stepTitle: found.step.title,
              variableName: trimmedVar,
            };
            // Return the actual value (preserve type)
            return found.log.output;
          }
        }
        
        // Variable not found
        console.warn(`Variable not found: ${trimmedVar}`);
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
        
        const trimmedVar = match[1].trim();
        
        // Check if it's a nested property like "step_1.output.email"
        const nestedMatch = trimmedVar.match(/^(step_\d+)(\.(.+))?$/);
        let resolvedVarValue: any = undefined;
        
        if (nestedMatch) {
          const stepVar = nestedMatch[1]; // e.g., "step_1"
          const propertyPath = nestedMatch[3]; // e.g., "output.email"
          
          const found = findVariableInLogs(stepVar);
          if (found) {
            let output = found.log.output;
            
            // If there's a property path, navigate to it
            if (propertyPath) {
              output = getNestedValue(output, propertyPath);
            }
            
            resolvedVarValue = output;
          }
        } else {
          // Try regular variable lookup
          const found = findVariableInLogs(trimmedVar);
          if (found) {
            resolvedVarValue = found.log.output;
          }
        }
        
        if (resolvedVarValue !== undefined) {
          const outputStr = typeof resolvedVarValue === "object" && resolvedVarValue !== null
            ? JSON.stringify(resolvedVarValue)
            : String(resolvedVarValue ?? "");
          parts.push({ text: outputStr, isVariable: true, variable: trimmedVar });
        } else {
          parts.push({ text: match[0], isVariable: false }); // Keep placeholder
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
