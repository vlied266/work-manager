/**
 * Atomic Work Engine - Data Processing & Logic
 * Handles intelligent processing of atomic actions
 */

import Papa from "papaparse";
import { createWorker } from "tesseract.js";
import { AtomicStep } from "@/types/schema";
import { resolveVariables } from "@/lib/engine/variable-parser";

/**
 * Run Context - Shared memory for all steps
 * Stores output of each step by variable name
 */
export interface RunContext {
  [variableName: string]: any;
}

/**
 * Execute an atomic action with variable resolution
 * 
 * Before executing any step, valid placeholders in step.config are replaced
 * with real data from context using mustache syntax (e.g., {{ step_1.output.email }}).
 * 
 * @param step - The atomic step to execute
 * @param context - The run context containing variable values
 * @returns Execution result with output, outcome, and optional error message
 */
export async function executeAtomicAction(
  step: AtomicStep,
  context: RunContext
): Promise<{ output: any; outcome: "SUCCESS" | "FAILURE"; error?: string }> {
  try {
    // Step 1: Resolve variables in step.config
    const resolvedConfig = resolveVariables(step.config, context);

    // Step 2: Execute based on action type
    switch (step.action) {
      case "INPUT": {
        // INPUT action: User provides data
        // The actual input value should come from user interaction, not from config
        // For now, return the resolved config as output
        // In a real execution, this would wait for user input
        const inputValue = resolvedConfig.inputValue || resolvedConfig.defaultValue;
        
        // Validate input if validation rules exist
        if (inputValue !== undefined && inputValue !== null) {
          const validation = validateInput(inputValue, resolvedConfig);
          if (!validation.valid) {
            return {
              output: null,
              outcome: "FAILURE",
              error: validation.error || "Input validation failed",
            };
          }
        }

        return {
          output: inputValue || resolvedConfig,
          outcome: "SUCCESS",
        };
      }

      case "COMPARE": {
        // COMPARE action: Compare two values from context
        const targetA = resolvedConfig.targetA;
        const targetB = resolvedConfig.targetB;
        const comparisonType = resolvedConfig.comparisonType || "exact";

        if (!targetA || !targetB) {
          return {
            output: null,
            outcome: "FAILURE",
            error: "Both targetA and targetB must be specified for comparison",
          };
        }

        // Get values from context
        const valA = getContextValue(context, targetA);
        const valB = getContextValue(context, targetB);

        // Evaluate comparison
        const result = evaluateComparison(valA, valB, comparisonType);

        return {
          output: {
            match: result.match,
            diff: result.diff,
            details: result.details,
            valueA: valA,
            valueB: valB,
          },
          outcome: result.match ? "SUCCESS" : "FAILURE",
        };
      }

      case "CALCULATE": {
        // CALCULATE action: Perform mathematical calculation
        const formula = resolvedConfig.formula;
        const variables = resolvedConfig.variables || {};

        if (!formula) {
          return {
            output: null,
            outcome: "FAILURE",
            error: "Formula is required for CALCULATE action",
          };
        }

        // Get variable values from context
        const varValues: Record<string, number> = {};
        for (const [key, varName] of Object.entries(variables)) {
          const value = getContextValue(context, varName as string);
          if (value !== undefined) {
            varValues[key] = parseFloat(String(value)) || 0;
          } else {
            varValues[key] = 0;
          }
        }

        // Replace variables in formula
        let formulaToEval = formula;
        for (const [key, value] of Object.entries(varValues)) {
          formulaToEval = formulaToEval.replace(new RegExp(`\\b${key}\\b`, "g"), String(value));
        }

        // Evaluate formula (simplified - in production, use a safe math evaluator)
        try {
          // Basic safety: only allow numbers, operators, parentheses, and spaces
          if (!/^[0-9+\-*/().\s]+$/.test(formulaToEval)) {
            throw new Error("Invalid characters in formula");
          }

          // Use Function constructor for evaluation (be careful in production!)
          const result = Function(`"use strict"; return (${formulaToEval})`)();

          return {
            output: {
              result,
              formula: formulaToEval,
              variables: varValues,
            },
            outcome: "SUCCESS",
          };
        } catch (error) {
          return {
            output: null,
            outcome: "FAILURE",
            error: `Calculation failed: ${(error as Error).message}`,
          };
        }
      }

      case "VALIDATE": {
        // VALIDATE action: Validate data against rules
        const target = resolvedConfig.target;
        const validationRule = resolvedConfig.validationRule;
        const rule = resolvedConfig.rule || "REGEX";
        const valueToCompare = resolvedConfig.value;

        if (!target) {
          return {
            output: null,
            outcome: "FAILURE",
            error: "target is required for VALIDATE action",
          };
        }

        // Get value from context
        const value = getContextValue(context, target);

        // Perform validation based on rule type
        let isValid = false;
        let errorMessage = "";

        switch (rule) {
          case "GREATER_THAN":
            const numGT = parseFloat(String(value));
            const compareGT = parseFloat(String(valueToCompare));
            if (isNaN(numGT) || isNaN(compareGT)) {
              isValid = false;
              errorMessage = "Both values must be numbers for GREATER_THAN comparison";
            } else {
              isValid = numGT > compareGT;
              if (!isValid) {
                errorMessage = `Value ${numGT} is not greater than ${compareGT}`;
              }
            }
            break;

          case "LESS_THAN":
            const numLT = parseFloat(String(value));
            const compareLT = parseFloat(String(valueToCompare));
            if (isNaN(numLT) || isNaN(compareLT)) {
              isValid = false;
              errorMessage = "Both values must be numbers for LESS_THAN comparison";
            } else {
              isValid = numLT < compareLT;
              if (!isValid) {
                errorMessage = `Value ${numLT} is not less than ${compareLT}`;
              }
            }
            break;

          case "EQUAL":
            isValid = String(value) === String(valueToCompare);
            if (!isValid) {
              errorMessage = `Value "${value}" does not equal "${valueToCompare}"`;
            }
            break;

          case "CONTAINS":
            const strValue = String(value || "");
            const strCompare = String(valueToCompare || "");
            isValid = strValue.includes(strCompare);
            if (!isValid) {
              errorMessage = `Value "${strValue}" does not contain "${strCompare}"`;
            }
            break;

          case "REGEX":
          default:
            if (!validationRule) {
              return {
                output: null,
                outcome: "FAILURE",
                error: "validationRule (regex pattern) is required for REGEX validation",
              };
            }
            try {
              const regex = new RegExp(validationRule);
              isValid = regex.test(String(value || ""));
              if (!isValid) {
                errorMessage = resolvedConfig.errorMessage || "Value does not match required pattern";
              }
            } catch (error) {
              return {
                output: null,
                outcome: "FAILURE",
                error: `Invalid regex pattern: ${(error as Error).message}`,
              };
            }
            break;
        }

        return {
          output: {
            valid: isValid,
            value,
            error: isValid ? undefined : errorMessage,
          },
          outcome: isValid ? "SUCCESS" : "FAILURE",
          error: isValid ? undefined : errorMessage,
        };
      }

      default:
        // For other actions, return resolved config as output
        return {
          output: resolvedConfig,
          outcome: "SUCCESS",
        };
    }
  } catch (error) {
    // Error handling: wrap in try-catch
    return {
      output: null,
      outcome: "FAILURE",
      error: `Execution failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Process IMPORT_FILE action
 * Parses CSV/Excel or extracts text from images using OCR
 */
export async function processImport(
  file: File,
  config: AtomicStep["config"]
): Promise<{ data: any; extracted?: any }> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // CSV/Excel Processing
  if (
    fileType === "text/csv" ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls")
  ) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data;
          
          // Extract specific column if configured
          if (config.extractionConfig?.csvColumn && parsedData.length > 0) {
            const columnName = config.extractionConfig.csvColumn;
            const extracted = parsedData.map((row: any) => row[columnName]).filter(Boolean);
            resolve({
              data: parsedData,
              extracted: extracted.length === 1 ? extracted[0] : extracted,
            });
          } else {
            resolve({ data: parsedData });
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }

  // Image OCR Processing
  if (fileType.startsWith("image/") || /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(fileName)) {
    try {
      const worker = await createWorker(config.extractionConfig?.ocrLanguage || "eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();
      
      return {
        data: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
        extracted: data.text,
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${(error as Error).message}`);
    }
  }

  // Default: Return file metadata
  return {
    data: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
  };
}

/**
 * Evaluate COMPARE action
 * Automatically compares two values from Run Context
 */
export function evaluateComparison(
  valA: any,
  valB: any,
  comparisonType: "exact" | "fuzzy" | "numeric" | "date" = "exact"
): { match: boolean; diff: string; details?: any } {
  if (valA === undefined || valB === undefined) {
    return {
      match: false,
      diff: "One or both values are missing",
    };
  }

  switch (comparisonType) {
    case "exact":
      const exactMatch = String(valA) === String(valB);
      return {
        match: exactMatch,
        diff: exactMatch ? "Values match exactly" : `Mismatch: "${valA}" vs "${valB}"`,
        details: {
          valueA: valA,
          valueB: valB,
        },
      };

    case "numeric":
      const numA = parseFloat(String(valA));
      const numB = parseFloat(String(valB));
      if (isNaN(numA) || isNaN(numB)) {
        return {
          match: false,
          diff: "One or both values are not numeric",
        };
      }
      const numericMatch = numA === numB;
      const numericDiff = Math.abs(numA - numB);
      return {
        match: numericMatch,
        diff: numericMatch
          ? "Values match numerically"
          : `Numeric difference: ${numericDiff}`,
        details: {
          valueA: numA,
          valueB: numB,
          difference: numericDiff,
        },
      };

    case "date":
      const dateA = new Date(valA);
      const dateB = new Date(valB);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return {
          match: false,
          diff: "One or both values are not valid dates",
        };
      }
      const dateMatch = dateA.getTime() === dateB.getTime();
      return {
        match: dateMatch,
        diff: dateMatch
          ? "Dates match"
          : `Date difference: ${dateA.toLocaleDateString()} vs ${dateB.toLocaleDateString()}`,
        details: {
          valueA: dateA,
          valueB: dateB,
        },
      };

    case "fuzzy":
      // Simple fuzzy matching (can be enhanced with Levenshtein distance)
      const strA = String(valA).toLowerCase().trim();
      const strB = String(valB).toLowerCase().trim();
      const fuzzyMatch = strA === strB || strA.includes(strB) || strB.includes(strA);
      return {
        match: fuzzyMatch,
        diff: fuzzyMatch
          ? "Values match (fuzzy)"
          : `Fuzzy mismatch: "${valA}" vs "${valB}"`,
        details: {
          valueA: valA,
          valueB: valB,
        },
      };

    default:
      return {
        match: false,
        diff: "Unknown comparison type",
      };
  }
}

/**
 * Validate INPUT_DATA based on config
 */
export function validateInput(
  value: any,
  config: AtomicStep["config"]
): { valid: boolean; error?: string } {
  if (config.required && (value === null || value === undefined || value === "")) {
    return {
      valid: false,
      error: config.validationMessage || "This field is required",
    };
  }

  if (value === null || value === undefined || value === "") {
    return { valid: true }; // Empty is OK if not required
  }

  // Type validation
  if (config.inputType === "number") {
    const num = parseFloat(String(value));
    if (isNaN(num)) {
      return {
        valid: false,
        error: "Value must be a number",
      };
    }
  }

  if (config.inputType === "date") {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: "Value must be a valid date",
      };
    }
  }

  // Regex validation
  if (config.validationRegex) {
    const regex = new RegExp(config.validationRegex);
    if (!regex.test(String(value))) {
      return {
        valid: false,
        error: config.validationMessage || "Value does not match required format",
      };
    }
  }

  return { valid: true };
}

/**
 * Get value from Run Context by variable name
 */
export function getContextValue(context: RunContext, variableName: string): any {
  // Support dot notation (e.g., "step_1_output.amount")
  const parts = variableName.split(".");
  let value = context[parts[0]];
  
  for (let i = 1; i < parts.length && value !== undefined; i++) {
    value = value?.[parts[i]];
  }
  
  return value;
}

/**
 * Set value in Run Context
 */
export function setContextValue(
  context: RunContext,
  variableName: string,
  value: any
): RunContext {
  return {
    ...context,
    [variableName]: value,
  };
}

