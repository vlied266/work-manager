/**
 * WorkOS Engine - Data Processing & Logic
 * Handles intelligent processing of atomic actions
 */

import Papa from "papaparse";
import { createWorker } from "tesseract.js";
import { AtomicStep } from "@/types/schema";

/**
 * Run Context - Shared memory for all steps
 * Stores output of each step by variable name
 */
export interface RunContext {
  [variableName: string]: any;
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

