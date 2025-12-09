/**
 * Workflow Step Type Constants
 * 
 * Defines which steps require human interaction vs automated execution
 */

import { AtomicAction } from "@/types/schema";

/**
 * Human Steps: Require user interaction and assignment
 * These steps pause the workflow and wait for user completion
 */
export const HUMAN_STEP_TYPES: AtomicAction[] = [
  "INPUT",        // Form Input
  "APPROVAL",     // Approval/authorization (renamed from AUTHORIZE)
  "MANUAL_TASK",  // Generic Manual Task
  "NEGOTIATE",    // Human negotiation
  "INSPECT",      // Manual inspection
];

/**
 * Automated Steps: Executed by system/AI without human intervention
 * These steps execute immediately and continue to next step
 */
export const AUTO_STEP_TYPES: AtomicAction[] = [
  "AI_PARSE",        // Read Document - AI parsing
  "DB_INSERT",       // Save to Atomic DB
  "HTTP_REQUEST",    // API call (renamed from FETCH)
  "SEND_EMAIL",      // Send Email (extracted from TRANSMIT)
  "GOOGLE_SHEET",    // Google Sheet operations (renamed from GOOGLE_SHEET_APPEND)
  "DOC_GENERATE",    // Create PDF from templates
  "CALCULATE",       // Calculate - Automated calculation
  "GATEWAY",         // Logic/Branching
  "VALIDATE",        // Validate - Automated validation
  "COMPARE",         // Compare - Automated comparison
];

/**
 * Check if a step type requires human interaction
 */
export function isHumanStep(action: AtomicAction): boolean {
  return HUMAN_STEP_TYPES.includes(action);
}

/**
 * Check if a step type is automated
 */
export function isAutoStep(action: AtomicAction): boolean {
  return AUTO_STEP_TYPES.includes(action);
}

/**
 * Get step execution type
 */
export function getStepExecutionType(action: AtomicAction): "HUMAN" | "AUTO" {
  return isHumanStep(action) ? "HUMAN" : "AUTO";
}

