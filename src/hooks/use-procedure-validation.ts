import { useMemo } from "react";
import { AtomicStep } from "@/types/schema";

export interface ValidationError {
  stepId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  errorCount: number;
}

/**
 * Validates a procedure's steps to ensure all required configuration is present
 */
export function useProcedureValidation(steps: AtomicStep[]): ValidationResult {
  const validation = useMemo(() => {
    const errors: ValidationError[] = [];

    steps.forEach((step) => {
      const stepConfig = step.config || {};

      switch (step.action) {
        case "INPUT":
          // INPUT requires label and data type
          const fieldLabel = stepConfig.fieldLabel;
          if (!fieldLabel || typeof fieldLabel !== "string" || fieldLabel.trim() === "") {
            errors.push({
              stepId: step.id,
              message: "Missing field label. Please provide a label for this input field.",
            });
          }
          if (!stepConfig.inputType) {
            errors.push({
              stepId: step.id,
              message: "Missing data type. Please select an input type (text, number, file, etc.).",
            });
          }
          // If inputType is "file", also require allowedExtensions
          if (stepConfig.inputType === "file" && (!stepConfig.allowedExtensions || stepConfig.allowedExtensions.length === 0)) {
            errors.push({
              stepId: step.id,
              message: "Missing file type restrictions. Please specify allowed file extensions.",
            });
          }
          break;

        case "COMPARE":
          // COMPARE requires targetA and targetB
          const targetA = stepConfig.targetA;
          if (!targetA || typeof targetA !== "string" || targetA.trim() === "") {
            errors.push({
              stepId: step.id,
              message: "Missing Target A. Please select a variable for the first comparison target.",
            });
          }
          const targetB = stepConfig.targetB;
          if (!targetB || typeof targetB !== "string" || targetB.trim() === "") {
            errors.push({
              stepId: step.id,
              message: "Missing Target B. Please select a variable for the second comparison target.",
            });
          }
          break;

        case "AUTHORIZE":
        case "NEGOTIATE":
          // AUTHORIZE/NEGOTIATE requires instructions
          const instruction = stepConfig.instruction;
          if (!instruction || typeof instruction !== "string" || instruction.trim() === "") {
            errors.push({
              stepId: step.id,
              message: "Missing instructions. Please provide approval instructions for this step.",
            });
          }
          break;

        case "GOOGLE_SHEET_APPEND":
          // GOOGLE_SHEET_APPEND requires sheetId
          const sheetId = stepConfig.sheetId;
          if (!sheetId || typeof sheetId !== "string" || sheetId.trim() === "") {
            errors.push({
              stepId: step.id,
              message: "Missing Google Sheet. Please select a Google Sheet in the configuration panel.",
            });
          }
          // Also check if at least one column mapping is provided
          const mapping = stepConfig.mapping || {};
          const hasMapping = mapping.A || mapping.B || mapping.C;
          if (!hasMapping) {
            errors.push({
              stepId: step.id,
              message: "Missing column mapping. Please configure at least one column (A, B, or C) in the mapping section.",
            });
          }
          break;

        // Add more validation rules as needed
        default:
          // Other actions might not require specific validation
          break;
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      errorCount: errors.length,
    };
  }, [steps]);

  return validation;
}

