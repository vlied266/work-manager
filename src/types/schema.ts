/**
 * WORKOS V2 - The Atomic Engine
 * 
 * 4-Layer Biological Hierarchy:
 * Level 4: Organization (The Organism)
 * Level 3: Process Group (The Material)
 * Level 2: Procedure (The Molecule)
 * Level 1: Atomic Step (The Atom)
 */

/**
 * The Periodic Table of Work - 15 Atomic Actions
 * Every step in a Procedure MUST be one of these
 */
export type AtomicAction =
  // Information Group
  | "INPUT"
  | "FETCH"
  | "TRANSMIT"
  | "STORE"
  | "GOOGLE_SHEET_APPEND"
  // Logic Group
  | "TRANSFORM"
  | "ORGANISE"
  | "CALCULATE"
  | "COMPARE"
  | "VALIDATE"
  | "GATEWAY"
  // Physical Group
  | "MOVE_OBJECT"
  | "TRANSFORM_OBJECT"
  | "INSPECT"
  // Human Group
  | "GENERATE"
  | "NEGOTIATE"
  | "AUTHORIZE";

/**
 * Level 4: Organization (The Organism)
 * The top-level entity representing a company/workspace
 */
export interface Organization {
  id: string;
  name: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  subscriptionStatus: "active" | "canceled" | "past_due";
  // Limits
  limits: {
    maxUsers: number;
    maxActiveRuns: number;
    aiGenerations: number; // Monthly limit for AI features
  };
  // Integrations
  slackWebhookUrl?: string; // Optional Slack webhook URL for notifications
  createdAt: Date;
}

/**
 * Level 3: Process Group (The Material)
 * A folder/category of value (e.g., "HR Onboarding", "Order to Cash")
 */
export interface ProcessGroup {
  id: string;
  organizationId: string;
  title: string; // e.g., "Order to Cash"
  description?: string; // Optional description of the process
  icon: string; // Lucide icon name
  procedureSequence: string[]; // Ordered list of procedure IDs that make up this process
  isActive: boolean; // Whether this process is active/published
  defaultAssignee?: {
    type: "USER" | "TEAM";
    id: string;
  }; // Default assignee for this process
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Level 2: Procedure (The Molecule)
 * A linear recipe/sequence of steps (e.g., "Sign Contract", "Invoice Generation")
 */
export interface Procedure {
  id: string;
  organizationId: string;
  processGroupId: string; // Link to Level 3
  title: string; // e.g., "Invoice Generation"
  description: string;
  isPublished: boolean;
  steps: AtomicStep[]; // The chain of atoms
  defaultAssignee?: {
    type: "USER" | "TEAM";
    id: string;
  }; // Default assignee for this procedure
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Level 1: Atomic Step (The Atom)
 * The indivisible unit of work
 */
export interface AtomicStep {
  id: string;
  title: string;
  action: AtomicAction;
  assignment?: {
    type: "STARTER" | "SPECIFIC_USER" | "TEAM_QUEUE";
    assigneeId?: string; // UserUID or TeamID
  };
  // Legacy support - keep for backward compatibility
  assigneeType?: "SPECIFIC_USER" | "TEAM" | "STARTER";
  assigneeId?: string; // User ID or Team ID
  assignee?: string; // Optional display name/email for AI-generated assignment
  requiresEvidence?: boolean; // If true, user must upload a file before completing the task

  // Routing Logic (Non-Linear Flow)
  routes?: {
    defaultNextStepId?: string | "COMPLETED"; // Normal path
    onSuccessStepId?: string; // e.g., Match found -> Go to Step 5
    onFailureStepId?: string; // e.g., Mismatch -> Go back to Step 1 (Loop)
    conditions?: {
      variable: string; // e.g., "step_1_amount"
      operator: ">" | "<" | "==" | "!=" | ">=" | "<=" | "contains" | "startsWith" | "endsWith";
      value: any;
      targetStepId: string;
    }[];
  };

  // Polymorphic Config (Changes based on Action)
  config: {
    // For INPUT/SELECT
    inputType?: "text" | "number" | "file" | "date" | "table" | "email";
    fieldLabel?: string; // Display label for the input field
    buttonLabel?: string; // For file uploads: "Upload Invoice", etc.
    allowedExtensions?: string[]; // For file uploads: ["pdf", "xlsx", "jpg"]
    tableConfig?: {
      rows: number;
      columns: number;
      headers?: string[];
    };
    options?: string[];
    placeholder?: string;
    required?: boolean;
    validationRegex?: string;
    validationMessage?: string;

    // For COMPARE
    targetA?: string; // Variable name from previous step (e.g., "step_1_output")
    targetB?: string; // Variable name from previous step (e.g., "step_2_output")
    comparisonType?: "exact" | "fuzzy" | "numeric" | "date";

    // For FETCH/TRANSMIT
    sourceUrl?: string;
    destinationUrl?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    recipientEmail?: string; // For email transmission, can be a variable reference

    // For STORE
    storageType?: "database" | "file" | "cache" | "google_sheet";
    storagePath?: string;

    // For Google Integration (used in INPUT, STORE, TRANSMIT)
    sheetId?: string; // Google Sheet ID
    fileName?: string; // Google Sheet/Drive file name
    saveToGoogleDrive?: boolean; // For file uploads: save to Google Drive
    googleDriveFolderId?: string; // Optional: specific folder in Google Drive

    // For GOOGLE_SHEET_APPEND
    mapping?: Record<string, string>; // Map workflow variables to sheet columns

    // For TRANSFORM/ORGANISE
    transformationRule?: string;
    sortBy?: string;
    groupBy?: string;

    // For CALCULATE
    formula?: string;
    variables?: Record<string, string>;

    // For VALIDATE
    validationRule?: string;
    errorMessage?: string;
    rule?: "GREATER_THAN" | "LESS_THAN" | "EQUAL" | "CONTAINS" | "REGEX";
    target?: string; // Variable name from previous step (e.g., "step_3_output")
    value?: any; // Value to compare against

    // For LABOR/PHYSICAL
    instructions?: string;
    proofType?: "photo" | "signature" | "checkbox";

    // For GENERATE
    template?: string;
    outputFormat?: "text" | "document" | "image";

    // For NEGOTIATE/AUTHORIZE
    approverId?: string;
    approvalLevel?: number;
    requireSignature?: boolean;
    instruction?: string;

    // Data Flow & Extraction
    outputVariableName?: string; // e.g., "invoice_total", "step_1_output"
    extractionRule?: string; // e.g., "Parse CSV Column: Price", "OCR Text", "Extract JSON Field: amount"
    extractionConfig?: {
      csvColumn?: string;
      jsonPath?: string;
      ocrLanguage?: string;
    };

    // AI Automation
    isAiAutomated?: boolean; // If true, this step is executed by AI instead of a user
  };
}

/**
 * Team (for assignment)
 */
export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Profile
 */
export interface UserProfile {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string; // Avatar Image URL
  jobTitle?: string; // e.g., "Senior Accountant"
  role: "ADMIN" | "MANAGER" | "OPERATOR";
  teamIds: string[];
  organizationId: string;
  orgId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution Instance
 * Represents an active execution of a Procedure
 */
export interface ActiveRun {
  id: string;
  procedureId: string;
  procedureTitle: string;
  organizationId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "FLAGGED" | "OPEN_FOR_CLAIM";
  currentStepIndex: number;
  startedAt: Date;
  completedAt?: Date;
  logs: RunLog[];
  currentAssigneeId?: string; // Current assignee (User ID or Team ID) for the current step
  assigneeType?: "USER" | "TEAM"; // Type of assignee
  assigneeId?: string; // Legacy: User ID or Team ID assigned to this run
  startedBy?: string; // User ID who started this run
  errorDetail?: string; // Error message when status is FLAGGED due to system task failure
  currentAssignee?: string; // Email of current assignee (for easier filtering)
  title?: string; // Alias for procedureTitle
  lastActivity?: Date; // Last update timestamp for sorting in Monitor
}

export interface RunLog {
  stepId: string;
  stepTitle: string;
  action: AtomicAction;
  output: any;
  timestamp: Date;
  outcome: "SUCCESS" | "FAILURE" | "FLAGGED";
}

/**
 * Comment on a task/run
 * Stored as sub-collection in active_runs/{runId}/comments
 */
export interface Comment {
  id: string;
  stepId: string; // Which task is this about?
  userId: string;
  userName: string; // Fetch from Profile
  userAvatar?: string; // Fetch from Profile (photoURL)
  content: string;
  createdAt: any; // Timestamp
}

/**
 * Notification for users
 * Stored in notifications collection
 */
export interface Notification {
  id: string;
  recipientId: string; // Who receives it?
  triggerBy: {
    userId: string;
    name: string; // User's displayName
    avatar?: string; // User's photoURL
  }; // Who caused it?
  type: "MENTION" | "ASSIGNMENT" | "COMMENT" | "FLAG" | "COMPLETION";
  title: string;
  message?: string;
  link: string; // e.g., "/run/xyz"
  isRead: boolean;
  createdAt: any; // Timestamp
  runId?: string;
  stepId?: string;
}

/**
 * Metadata for Atomic Actions (for UI display)
 */
export interface AtomicActionMetadata {
  label: string;
  description: string;
  icon: string; // Lucide icon name
  group: "Information" | "Logic" | "Physical" | "Human";
  color: string;
}

/**
 * Action metadata mapping
 */
export const ATOMIC_ACTION_METADATA: Record<AtomicAction, AtomicActionMetadata> = {
  // Information Group
  INPUT: {
    label: "Input",
    description: "User enters data (text, number, file, date)",
    icon: "Type",
    group: "Information",
    color: "blue",
  },
  FETCH: {
    label: "Fetch",
    description: "Retrieve data from external source",
    icon: "Download",
    group: "Information",
    color: "blue",
  },
  TRANSMIT: {
    label: "Transmit",
    description: "Send data to external destination",
    icon: "Upload",
    group: "Information",
    color: "blue",
  },
  STORE: {
    label: "Store",
    description: "Save data to storage (database, file, cache)",
    icon: "Database",
    group: "Information",
    color: "blue",
  },
  GOOGLE_SHEET_APPEND: {
    label: "Save to Google Sheet",
    description: "Append data to a Google Sheet automatically",
    icon: "FileSpreadsheet",
    group: "Information",
    color: "green",
  },
  // Logic Group
  TRANSFORM: {
    label: "Transform",
    description: "Convert data from one format to another",
    icon: "RefreshCw",
    group: "Logic",
    color: "purple",
  },
  ORGANISE: {
    label: "Organise",
    description: "Sort, filter, or group data",
    icon: "ArrowUpDown",
    group: "Logic",
    color: "purple",
  },
  CALCULATE: {
    label: "Calculate",
    description: "Apply mathematical formula or computation",
    icon: "Calculator",
    group: "Logic",
    color: "purple",
  },
  COMPARE: {
    label: "Compare",
    description: "Compare two values (reconciliation)",
    icon: "GitCompare",
    group: "Logic",
    color: "purple",
  },
  VALIDATE: {
    label: "Validate",
    description: "Check data against rules (true/false)",
    icon: "CheckCircle2",
    group: "Logic",
    color: "purple",
  },
  GATEWAY: {
    label: "Gateway",
    description: "Conditional routing based on data (if/then/else)",
    icon: "GitBranch",
    group: "Logic",
    color: "purple",
  },
  // Physical Group
  MOVE_OBJECT: {
    label: "Move Object",
    description: "Physically relocate an object",
    icon: "Move",
    group: "Physical",
    color: "orange",
  },
  TRANSFORM_OBJECT: {
    label: "Transform Object",
    description: "Physically modify an object",
    icon: "Wrench",
    group: "Physical",
    color: "orange",
  },
  INSPECT: {
    label: "Inspect",
    description: "Examine an object or location",
    icon: "Search",
    group: "Physical",
    color: "orange",
  },
  // Human Group
  GENERATE: {
    label: "Generate",
    description: "Create content (text, document, image)",
    icon: "Sparkles",
    group: "Human",
    color: "green",
  },
  NEGOTIATE: {
    label: "Negotiate",
    description: "Human negotiation or discussion",
    icon: "MessageSquare",
    group: "Human",
    color: "green",
  },
  AUTHORIZE: {
    label: "Authorize",
    description: "Approval or authorization step",
    icon: "CheckSquare",
    group: "Human",
    color: "green",
  },
};

/**
 * All 15 atomic actions as an array
 */
export const ATOMIC_ACTIONS: AtomicAction[] = [
  "INPUT",
  "FETCH",
  "TRANSMIT",
  "STORE",
  "GOOGLE_SHEET_APPEND",
  "TRANSFORM",
  "ORGANISE",
  "CALCULATE",
  "COMPARE",
  "VALIDATE",
  "GATEWAY",
  "MOVE_OBJECT",
  "TRANSFORM_OBJECT",
  "INSPECT",
  "GENERATE",
  "NEGOTIATE",
  "AUTHORIZE",
];

/**
 * Group actions by category for UI organization
 */
export const ATOMIC_ACTIONS_BY_GROUP = {
  Information: ["INPUT", "FETCH", "TRANSMIT", "STORE", "GOOGLE_SHEET_APPEND"] as AtomicAction[],
  Logic: ["TRANSFORM", "ORGANISE", "CALCULATE", "COMPARE", "VALIDATE", "GATEWAY"] as AtomicAction[],
  Physical: ["MOVE_OBJECT", "TRANSFORM_OBJECT", "INSPECT"] as AtomicAction[],
  Human: ["GENERATE", "NEGOTIATE", "AUTHORIZE"] as AtomicAction[],
};

