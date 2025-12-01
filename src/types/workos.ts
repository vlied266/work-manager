import { FieldValue, Timestamp } from "firebase/firestore";

export type PlanTier = "FREE" | "PRO";

export type UserRole = "ADMIN" | "LEAD" | "OPERATOR";

export type TaskCategory =
  | "BASIC_DIGITAL"
  | "BASIC_LABOR"
  | "BASIC_CREATIVE"
  | "BASIC_MACHINERY";

export type DigitalAction =
  | "IMPORT"
  | "ORGANISE"
  | "CONNECT"
  | "COMPARE"
  | "APPLY_RULE"
  | "CONCLUDE"
  | "FINALISE"
  | "REPORT";

export type AssigneeStrategy =
  | "SPECIFIC_USER"
  | "TEAM_ROUND_ROBIN"
  | "ANY_TEAM_MEMBER";

export type InputType = "TEXT" | "NUMBER" | "FILE_UPLOAD" | "DATE" | "SELECTION";

export type ProofType = "PHOTO" | "SIGNATURE" | "CHECKBOX";

export type RunStatus = "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type RunOutcome = "SUCCESS" | "FLAGGED";

export type FirestoreDate = Timestamp | FieldValue;

export interface Organization {
  id: string;
  name: string;
  domain: string;
  plan: PlanTier;
  createdAt: FirestoreDate;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  members: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  organizationId: string;
  teamIds: string[];
  role: UserRole;
}

// Configuration for each Digital Action
export interface DigitalActionConfig {
  // For IMPORT
  sourceType?: "INTERNAL_DB" | "EXTERNAL_API" | "USER_UPLOAD" | "FILE_SYSTEM";
  sourceUrl?: string;
  sourcePath?: string;
  expectedFormat?: string; // e.g., "CSV", "JSON", "Excel"
  
  // For ORGANISE
  organizationRule?: string; // How to organize (sort, group, categorize)
  targetStructure?: string; // Target data structure
  sortBy?: string;
  groupBy?: string;
  
  // For CONNECT
  connectionType?: "API" | "DATABASE" | "SERVICE" | "FILE";
  connectionEndpoint?: string;
  connectionCredentials?: string; // Reference to secure storage
  connectionMethod?: "GET" | "POST" | "PUT" | "DELETE";
  requestBody?: string; // JSON template
  
  // For COMPARE
  targetA?: string; // Variable reference or data source
  targetB?: string; // Variable reference or data source
  comparisonType?: "EXACT" | "FUZZY" | "NUMERIC" | "DATE";
  tolerance?: number; // For numeric comparisons
  ignoreCase?: boolean;
  
  // For APPLY_RULE
  ruleDefinition?: string; // Rule logic or reference
  ruleType?: "VALIDATION" | "TRANSFORMATION" | "CALCULATION" | "CONDITIONAL";
  ruleParameters?: Record<string, unknown>; // Dynamic rule params
  
  // For CONCLUDE
  conclusionType?: "APPROVE" | "REJECT" | "FLAG" | "CONTINUE";
  conclusionCriteria?: string; // Conditions for conclusion
  nextStepOnSuccess?: string; // Step ID to jump to
  nextStepOnFailure?: string; // Step ID to jump to
  
  // For FINALISE
  finalizationAction?: "SAVE" | "ARCHIVE" | "PUBLISH" | "NOTIFY";
  finalizationTarget?: string; // Where to save/publish
  notificationRecipients?: string[]; // Who to notify
  
  // For REPORT
  reportFormat?: "PDF" | "EXCEL" | "JSON" | "HTML";
  reportTemplate?: string; // Template reference
  reportRecipients?: string[]; // Who receives the report
  includeData?: boolean; // Include raw data in report
  
  // Common fields
  inputType?: InputType;
  required?: boolean;
  instructions?: string;
  proofType?: ProofType;
}

export interface StepConfig extends DigitalActionConfig {
  // Legacy fields for backward compatibility
  targetA?: string;
  targetB?: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description?: string;
  assigneeType: AssigneeStrategy;
  assigneeId: string;
  category: TaskCategory;
  digitalAction?: DigitalAction;
  config: StepConfig;
  procedureLabel?: string;
  procedureSourceId?: string;
}

export interface Procedure {
  id: string;
  organizationId: string;
  teamId: string;
  name: string;
  description: string;
  steps: ProcessStep[];
  updatedAt: FirestoreDate;
}

export interface ProcessProcedureRef {
  procedureId: string;
  procedureName: string;
  teamId?: string;
  order: number;
}

export interface ProcessDefinition {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  procedures: ProcessProcedureRef[];
  createdBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface ActiveRunLog {
  stepId: string;
  stepTitle: string;
  performedBy: string;
  performedAt: Timestamp | FieldValue;
  inputData: unknown;
  outcome: RunOutcome;
  procedureLabel?: string;
}

export interface ProcedureAssignment {
  procedureId: string;
  procedureName: string;
  assignedToUserId: string; // Specific user assigned to this procedure
  order: number; // Order in which this procedure should be executed
  completed: boolean;
  completedAt?: FirestoreDate;
}

export interface ActiveRun {
  id: string;
  organizationId: string;
  procedureId: string;
  startedBy: string;
  status: RunStatus;
  currentStepIndex: number;
  currentProcedureIndex: number; // Which procedure in the process is currently active
  logs: ActiveRunLog[];
  processId?: string;
  processName?: string;
  procedureName?: string;
  procedureSnapshot?: Procedure;
  procedureAssignments?: ProcedureAssignment[]; // For sequential multi-procedure processes
  startedAt: FirestoreDate;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: FirestoreDate;
  read: boolean;
  actionLink?: string;
  context?: Record<string, unknown>;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  "BASIC_DIGITAL",
  "BASIC_LABOR",
  "BASIC_CREATIVE",
  "BASIC_MACHINERY",
];

export const DIGITAL_ACTIONS: DigitalAction[] = [
  "IMPORT",
  "ORGANISE",
  "CONNECT",
  "COMPARE",
  "APPLY_RULE",
  "CONCLUDE",
  "FINALISE",
  "REPORT",
];

export const ASSIGNEE_STRATEGIES: AssigneeStrategy[] = [
  "SPECIFIC_USER",
  "TEAM_ROUND_ROBIN",
  "ANY_TEAM_MEMBER",
];

export const INPUT_TYPES: InputType[] = [
  "TEXT",
  "NUMBER",
  "FILE_UPLOAD",
  "DATE",
  "SELECTION",
];

export const PROOF_TYPES: ProofType[] = ["PHOTO", "SIGNATURE", "CHECKBOX"];

