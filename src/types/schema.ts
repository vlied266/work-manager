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
  // Human Tasks
  | "INPUT"
  | "APPROVAL"      // Renamed from AUTHORIZE
  | "MANUAL_TASK"   // New generic manual task
  | "NEGOTIATE"
  | "INSPECT"
  // Automation Tasks
  | "AI_PARSE"
  | "DB_INSERT"
  | "HTTP_REQUEST"  // Renamed from FETCH
  | "SEND_EMAIL"    // Extracted from TRANSMIT
  | "GOOGLE_SHEET"  // Renamed from GOOGLE_SHEET_APPEND
  | "DOC_GENERATE"
  | "CALCULATE"
  | "GATEWAY"
  | "VALIDATE"
  | "COMPARE";

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
  // Workflow Trigger Configuration
  trigger?: {
    type: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK";
    config?: {
      folderPath?: string; // e.g., "/uploads/contracts" (for ON_FILE_CREATED)
      provider?: "google_drive" | "dropbox" | "local"; // File provider (for ON_FILE_CREATED)
      webhookUrl?: string; // Webhook URL (for WEBHOOK, read-only, auto-generated)
      webhookSecret?: string; // Webhook secret for verification (for WEBHOOK)
    };
  };
  // Active State: For automated triggers, indicates if the workflow is listening for events
  // When true, the system will automatically create new runs when trigger events occur
  isActive?: boolean; // Default: false (only applicable for ON_FILE_CREATED and WEBHOOK triggers)
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
  
  // UI Metadata (for Visual Editor)
  ui?: {
    position?: { x: number; y: number }; // Manual position set by user drag & drop
  };

  // Routing Logic (Non-Linear Flow)
  routes?: {
    defaultNextStepId?: string | "COMPLETED"; // Normal path
    onSuccessStepId?: string; // e.g., Match found -> Go to Step 5 (for VALIDATE/COMPARE)
    onFailureStepId?: string; // e.g., Mismatch -> Go back to Step 1 (Loop) (for VALIDATE/COMPARE)
    conditions?: {
      variable: string; // e.g., "step_1_amount" or "{{step_1.amount}}"
      operator: ">" | "<" | "==" | "!=" | ">=" | "<=" | "contains" | "startsWith" | "endsWith";
      value: any;
      nextStepId: string; // Step ID to jump to if condition is true (renamed from targetStepId)
    }[];
  };

  // Polymorphic Config (Changes based on Action)
  config: {
    // Common fields
    outputVariableName?: string; // e.g., "invoice_total", "step_1_output"

    // ===== HUMAN TASKS =====
    
    // INPUT (Enhanced)
    inputType?: "text" | "number" | "email" | "date" | "file" | "select" | "checkbox" | "multiline";
    fieldLabel?: string; // Display label for the input field
    placeholder?: string;
    required?: boolean;
    options?: Array<{ label: string; value: string }>; // For 'select' or 'checkbox' types
    buttonLabel?: string; // For file uploads
    allowedExtensions?: string[]; // For file uploads
    tableConfig?: {
      rows: number;
      columns: number;
      headers?: string[];
    };
    validationRegex?: string;
    validationMessage?: string;
    saveToGoogleDrive?: boolean;
    googleDriveFolderId?: string;
    extractionRule?: string;
    extractionConfig?: {
      csvColumn?: string;
      jsonPath?: string;
      ocrLanguage?: string;
    };

    // APPROVAL, MANUAL_TASK, NEGOTIATE, INSPECT (shared fields)
    instruction?: string; // Instructions/guidelines (used by APPROVAL, MANUAL_TASK, NEGOTIATE, INSPECT)
    requireSignature?: boolean; // APPROVAL: Require digital signature
    actions?: string[]; // APPROVAL: Custom approval actions (default: ["Approve", "Reject"])
    approvalLevel?: number; // APPROVAL: Optional approval level
    dueInHours?: number; // MANUAL_TASK: Number of hours from task assignment until due date
    proofType?: "photo" | "signature" | "checkbox"; // INSPECT: Optional type of proof required

    // ===== AUTOMATION TASKS =====

    // AI_PARSE
    fileSourceStepId?: string; // Required: The ID of the INPUT step where file was uploaded, or "TRIGGER_EVENT" for trigger-based workflows
    fieldsToExtract?: string[]; // Required: List of field names to extract (e.g., ["invoiceDate", "amount", "vendor"])
    fileUrl?: string; // Optional: Direct file URL (alternative to fileSourceStepId)
    fileType?: "pdf" | "excel" | "image"; // Optional: File type hint
    // Note: outputVariableName is defined in common fields above

    // DB_INSERT
    collectionName?: string; // Required: Name of the collection/table to save data to (must match existing collection)
    data?: Record<string, any>; // Required: JSON object mapping field names to values (supports {{variable}} syntax)

    // HTTP_REQUEST
    url?: string; // Required: API endpoint URL (supports {{variable}} syntax)
    method?: "GET" | "POST" | "PUT" | "DELETE"; // Required: HTTP method
    headers?: Record<string, string>; // Optional: HTTP headers (e.g., Authorization, Content-Type)
    requestBody?: string; // Optional: JSON body for POST/PUT requests (supports {{variable}} syntax)

    // SEND_EMAIL
    recipient?: string; // Required: Email address (supports {{variable}} syntax)
    subject?: string; // Required: Email subject line (supports {{variable}} syntax)
    emailBody?: string; // Required: HTML email body content (supports {{variable}} syntax)
    attachments?: string[]; // Optional: File URLs from previous steps (one URL per array element)

    // GOOGLE_SHEET
    connectionId?: string; // Optional: ID of the Google Sheets connection/credential
    spreadsheetId?: string; // Required: Google Sheets spreadsheet ID (supports {{variable}} syntax)
    sheetName?: string; // Required: Name of the sheet/tab within the spreadsheet
    operation?: "APPEND_ROW" | "UPDATE_ROW" | "LOOKUP_ROW"; // Required: Operation type
    columnMapping?: Record<string, string>; // Required for APPEND_ROW/UPDATE_ROW: Maps column letters (A, B, C) or names to values (supports {{variable}} syntax)
    rowNumber?: string; // Required for UPDATE_ROW: Row number to update (supports {{variable}} syntax)
    lookupColumn?: string; // Required for LOOKUP_ROW: Column header to search in (supports {{variable}} syntax)
    lookupValue?: string; // Required for LOOKUP_ROW: Value to find (supports {{variable}} syntax)

    // DOC_GENERATE
    sourceType?: "template" | "inline"; // Required: Source type (default: "template")
    templateId?: string; // Required for template mode: ID of the template record in the 'document_templates' Firestore collection
    dataMapping?: Record<string, string>; // Required for template mode: Maps variables to template placeholders (supports {{variable}} syntax)
    inlineContent?: string; // Required for inline mode: Direct text/HTML content (supports {{variable}} syntax)
    outputFormat?: "pdf" | "docx"; // Optional: Output file format (default: "pdf")

    // CALCULATE
    formula?: string; // Required: Mathematical formula using variables from previous steps (supports {{variable}} syntax)

    // GATEWAY
    conditions?: Array<{
      variable: string; // Variable name (e.g., "step_1.amount") or variable reference
      operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "starts_with" | "is_empty" | "is_not_empty"; // Comparison operator
      value: string; // Value to compare against (can be variable or literal)
      nextStepId: string; // Step ID to jump to if condition is true
      label?: string; // Optional label for the condition (e.g., "VIP", "High Value > 10k") - appears on visual canvas
    }>;
    defaultNextStepId?: string; // Step to proceed to if no conditions match (the "else" case)

    // VALIDATE
    rule?: "IS_NOT_EMPTY" | "IS_VALID_EMAIL" | "IS_VALID_PHONE" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN" | "EQUAL" | "REGEX"; // Required: Type of validation to perform
    target?: string; // Required: Variable or value to validate (supports {{variable}} syntax)
    value?: any; // Required for some rules: Expected value to compare against (can be variable or literal) - Not needed for IS_NOT_EMPTY, IS_VALID_EMAIL, IS_VALID_PHONE
    errorMessage?: string; // Optional: Message to display/log if validation fails

    // COMPARE
    targetA?: string; // Required: First value to compare (supports {{variable}} syntax)
    targetB?: string; // Required: Second value to compare against (supports {{variable}} syntax)
    comparisonType?: "exact" | "fuzzy" | "numeric" | "date"; // Required: Type of comparison to perform
    requireMismatchReason?: boolean; // Optional: When enabled and comparison fails, workflow routes to user input step asking for explanation
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
  status: "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "FLAGGED" | "OPEN_FOR_CLAIM" | "WAITING_FOR_USER";
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
  // Trigger context for automated workflows
  triggerContext?: {
    // File trigger context
    file?: string;
    fileUrl?: string;
    filePath?: string;
    fileId?: string;
    // Webhook trigger context
    body?: any; // Request body accessible via {{trigger.body.field_name}}
    headers?: Record<string, string>; // Request headers accessible via {{trigger.headers.header_name}}
    method?: string;
    url?: string;
    timestamp?: string;
  };
  // Initial input for workflows (from trigger or manual start)
  initialInput?: {
    filePath?: string;
    fileUrl?: string;
    [key: string]: any;
  };
  // Triggered run metadata
  triggeredBy?: {
    type: "FILE_UPLOAD" | "WEBHOOK" | "MANUAL";
    filePath?: string;
  };
  // Steps reference (for execution)
  steps?: AtomicStep[];
  currentStepId?: string;
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
  group: "Human Tasks" | "Automation";
  color: string;
}

/**
 * Action metadata mapping
 */
export const ATOMIC_ACTION_METADATA: Record<AtomicAction, AtomicActionMetadata> = {
  // Human Tasks
  INPUT: {
    label: "Input",
    description: "Create a form to collect data from users.",
    icon: "Type",
    group: "Human Tasks",
    color: "blue",
  },
  APPROVAL: {
    label: "Approval",
    description: "Request approval (Yes/No) from a manager.",
    icon: "CheckSquare",
    group: "Human Tasks",
    color: "blue",
  },
  MANUAL_TASK: {
    label: "Manual Task",
    description: "Assign an offline task or checklist.",
    icon: "ClipboardCheck",
    group: "Human Tasks",
    color: "blue",
  },
  NEGOTIATE: {
    label: "Negotiate",
    description: "Human negotiation or discussion",
    icon: "MessageSquare",
    group: "Human Tasks",
    color: "blue",
  },
  INSPECT: {
    label: "Inspect",
    description: "Examine an object or location",
    icon: "Search",
    group: "Human Tasks",
    color: "blue",
  },
  // Automation Tasks
  AI_PARSE: {
    label: "Read Document",
    description: "Extract data from PDFs, images, or Excel.",
    icon: "ScanLine",
    group: "Automation",
    color: "purple",
  },
  DB_INSERT: {
    label: "Save to DB",
    description: "Save workflow data into the database.",
    icon: "Database",
    group: "Automation",
    color: "purple",
  },
  HTTP_REQUEST: {
    label: "HTTP Request",
    description: "Make API calls to external services.",
    icon: "Globe",
    group: "Automation",
    color: "purple",
  },
  SEND_EMAIL: {
    label: "Send Email",
    description: "Send an automated email notification.",
    icon: "Mail",
    group: "Automation",
    color: "purple",
  },
  GOOGLE_SHEET: {
    label: "Google Sheet",
    description: "Append or update rows in Google Sheets.",
    icon: "FileSpreadsheet",
    group: "Automation",
    color: "purple",
  },
  DOC_GENERATE: {
    label: "Generate Doc",
    description: "Generate PDF documents from HTML templates.",
    icon: "FilePenLine",
    group: "Automation",
    color: "purple",
  },
  CALCULATE: {
    label: "Calculate",
    description: "Apply mathematical formulas or computations.",
    icon: "Calculator",
    group: "Automation",
    color: "purple",
  },
  GATEWAY: {
    label: "Gateway",
    description: "Create conditional branches (If/Else).",
    icon: "GitBranch",
    group: "Automation",
    color: "purple",
  },
  VALIDATE: {
    label: "Validate",
    description: "Check data against rules (true/false).",
    icon: "CheckCircle2",
    group: "Automation",
    color: "purple",
  },
  COMPARE: {
    label: "Compare",
    description: "Compare two values for reconciliation.",
    icon: "GitCompare",
    group: "Automation",
    color: "purple",
  },
};

/**
 * All 15 atomic actions as an array
 * Matches the complete toolbox documentation
 */
export const ATOMIC_ACTIONS: AtomicAction[] = [
  // Human Tasks (5)
  "INPUT",
  "APPROVAL",
  "MANUAL_TASK",
  "NEGOTIATE",
  "INSPECT",
  // Automation (10)
  "AI_PARSE",
  "DB_INSERT",
  "HTTP_REQUEST",
  "SEND_EMAIL",
  "GOOGLE_SHEET",
  "DOC_GENERATE",
  "CALCULATE",
  "GATEWAY",
  "VALIDATE",
  "COMPARE",
];

/**
 * Group actions by category for UI organization
 * Organized into Human Tasks (requires human interaction) and Automation (runs automatically)
 */
export const ATOMIC_ACTIONS_BY_GROUP = {
  "Human Tasks": [
    "INPUT",
    "APPROVAL",
    "MANUAL_TASK",
    "NEGOTIATE",
    "INSPECT",
  ] as AtomicAction[],
  "Automation": [
    "AI_PARSE",
    "DB_INSERT",
    "HTTP_REQUEST",
    "SEND_EMAIL",
    "GOOGLE_SHEET",
    "DOC_GENERATE",
    "CALCULATE",
    "GATEWAY",
    "VALIDATE",
    "COMPARE",
  ] as AtomicAction[],
};

