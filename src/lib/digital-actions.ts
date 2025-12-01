import { DigitalAction } from "@/types/workos";

export interface DigitalActionMetadata {
  action: DigitalAction;
  label: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  example: string;
}

export const DIGITAL_ACTION_METADATA: Record<DigitalAction, DigitalActionMetadata> = {
  IMPORT: {
    action: "IMPORT",
    label: "Import Data",
    description: "Import data from external sources (database, API, file upload, or file system). This is the first step in the data lifecycle.",
    requiredFields: ["sourceType"],
    optionalFields: ["sourceUrl", "sourcePath", "expectedFormat", "inputType"],
    example: "Import customer data from CSV file uploaded by user",
  },
  ORGANISE: {
    action: "ORGANISE",
    label: "Organize Data",
    description: "Sort, group, categorize, or restructure imported data according to defined rules.",
    requiredFields: ["organizationRule"],
    optionalFields: ["targetStructure", "sortBy", "groupBy", "inputType"],
    example: "Group transactions by date and sort by amount descending",
  },
  CONNECT: {
    action: "CONNECT",
    label: "Connect to Service",
    description: "Establish connection to external services, APIs, databases, or file systems to fetch or send data.",
    requiredFields: ["connectionType", "connectionEndpoint"],
    optionalFields: ["connectionCredentials", "connectionMethod", "requestBody", "inputType"],
    example: "Connect to payment API to verify transaction status",
  },
  COMPARE: {
    action: "COMPARE",
    label: "Compare Values",
    description: "Compare two data sources or values to detect matches, mismatches, or differences. Flags if mismatch detected.",
    requiredFields: ["targetA", "targetB"],
    optionalFields: ["comparisonType", "tolerance", "ignoreCase", "inputType"],
    example: "Compare invoice total with payment record - flag if mismatch",
  },
  APPLY_RULE: {
    action: "APPLY_RULE",
    label: "Apply Business Rule",
    description: "Apply validation, transformation, calculation, or conditional logic rules to data.",
    requiredFields: ["ruleDefinition", "ruleType"],
    optionalFields: ["ruleParameters", "inputType"],
    example: "Validate that order total is within credit limit",
  },
  CONCLUDE: {
    action: "CONCLUDE",
    label: "Make Conclusion",
    description: "Make a decision based on previous steps: approve, reject, flag, or continue to next step.",
    requiredFields: ["conclusionType", "conclusionCriteria"],
    optionalFields: ["nextStepOnSuccess", "nextStepOnFailure", "inputType"],
    example: "If all validations pass, approve order; otherwise flag for review",
  },
  FINALISE: {
    action: "FINALISE",
    label: "Finalize Process",
    description: "Complete the process by saving, archiving, publishing, or notifying stakeholders.",
    requiredFields: ["finalizationAction"],
    optionalFields: ["finalizationTarget", "notificationRecipients", "inputType"],
    example: "Save approved order to database and notify customer service team",
  },
  REPORT: {
    action: "REPORT",
    label: "Generate Report",
    description: "Generate and distribute reports in various formats (PDF, Excel, JSON, HTML) to specified recipients.",
    requiredFields: ["reportFormat"],
    optionalFields: ["reportTemplate", "reportRecipients", "includeData", "inputType"],
    example: "Generate monthly sales report in PDF format and email to management",
  },
};

export function getActionMetadata(action: DigitalAction): DigitalActionMetadata {
  return DIGITAL_ACTION_METADATA[action];
}

export function getActionRequiredFields(action: DigitalAction): string[] {
  return DIGITAL_ACTION_METADATA[action]?.requiredFields || [];
}

export function getActionOptionalFields(action: DigitalAction): string[] {
  return DIGITAL_ACTION_METADATA[action]?.optionalFields || [];
}

