/**
 * Seed script for Basic Tasks
 * This creates a comprehensive library of atomic, reusable tasks
 * that are common across all businesses
 * 
 * Run with: npx tsx scripts/seed-basic-tasks.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { collection, addDoc, serverTimestamp, getDocs, query, where, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { BusinessDomain, BasicTask, TaskCategory, DigitalAction, StepConfig } from "../src/types/workos";

// Initialize Firebase for script (Firestore only, no Auth)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BUSINESS_DOMAIN_LABELS: Record<BusinessDomain, string> = {
  FINANCE: "Finance & Accounting",
  TECH_IT: "Tech & IT",
  HR: "Human Resources",
  OPERATIONS: "Operations",
  SALES: "Sales",
  MARKETING: "Marketing",
  LEGAL: "Legal & Compliance",
  CUSTOMER_SERVICE: "Customer Service",
  SUPPLY_CHAIN: "Supply Chain",
  GENERAL: "General",
};

// Comprehensive list of Basic Tasks organized by business domain
const basicTasks: Omit<BasicTask, "id" | "createdAt" | "updatedAt">[] = [
  // ========== FINANCE & ACCOUNTING ==========
  {
    name: "Upload Invoice",
    description: "Upload and import invoice document (PDF, image, or CSV) into the system",
    shortDescription: "Import invoice files for processing",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "IMPORT",
    defaultConfig: {
      sourceType: "USER_UPLOAD",
      expectedFormat: "PDF",
      inputType: "FILE_UPLOAD",
      required: true,
    },
    tags: ["invoice", "upload", "file", "document", "finance"],
    isSystem: true,
  },
  {
    name: "Enter Invoice Data",
    description: "Manually enter invoice details (amount, date, vendor, line items)",
    shortDescription: "Input invoice information manually",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "TEXT",
      required: true,
    },
    tags: ["invoice", "data-entry", "manual", "finance"],
    isSystem: true,
  },
  {
    name: "Verify Invoice Amount",
    description: "Compare invoice total amount with purchase order or expected amount",
    shortDescription: "Check if invoice amount matches expected value",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "COMPARE",
    defaultConfig: {
      targetA: "invoice.total_amount",
      targetB: "purchase_order.amount",
      comparisonType: "NUMERIC",
      tolerance: 0.01,
      inputType: "SELECTION",
      required: true,
    },
    tags: ["invoice", "verify", "compare", "amount", "finance"],
    isSystem: true,
  },
  {
    name: "Match Invoice to Purchase Order",
    description: "Link invoice to corresponding purchase order and verify details match",
    shortDescription: "Connect invoice with PO and validate",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "COMPARE",
    defaultConfig: {
      targetA: "invoice.details",
      targetB: "purchase_order.details",
      comparisonType: "FUZZY",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["invoice", "purchase-order", "match", "verify", "finance"],
    isSystem: true,
  },
  {
    name: "Calculate Tax",
    description: "Calculate applicable taxes (VAT, sales tax, etc.) based on amount and location",
    shortDescription: "Compute tax amount automatically",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "APPLY_RULE",
    defaultConfig: {
      ruleType: "CALCULATION",
      ruleDefinition: "tax_calculation",
      inputType: "NUMBER",
      required: true,
    },
    tags: ["tax", "calculation", "finance", "automation"],
    isSystem: true,
  },
  {
    name: "Approve Payment",
    description: "Approve or reject payment request based on validation criteria",
    shortDescription: "Authorize payment after review",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "CONCLUDE",
    defaultConfig: {
      conclusionType: "APPROVE",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["approval", "payment", "finance", "authorization"],
    isSystem: true,
  },
  {
    name: "Generate Financial Report",
    description: "Create financial report (PDF, Excel) with summary data and charts",
    shortDescription: "Export financial summary report",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "REPORT",
    defaultConfig: {
      reportFormat: "PDF",
      includeData: true,
      inputType: "SELECTION",
      required: false,
    },
    tags: ["report", "financial", "export", "finance"],
    isSystem: true,
  },
  {
    name: "Reconcile Accounts",
    description: "Compare and match transactions between two accounts or statements",
    shortDescription: "Match transactions between accounts",
    category: "BASIC_DIGITAL",
    businessDomain: "FINANCE",
    digitalAction: "COMPARE",
    defaultConfig: {
      targetA: "account_a.transactions",
      targetB: "account_b.transactions",
      comparisonType: "EXACT",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["reconciliation", "accounts", "match", "finance"],
    isSystem: true,
  },

  // ========== TECH & IT ==========
  {
    name: "Upload Code File",
    description: "Upload source code file (JavaScript, Python, etc.) for review or deployment",
    shortDescription: "Import code file into system",
    category: "BASIC_DIGITAL",
    businessDomain: "TECH_IT",
    digitalAction: "IMPORT",
    defaultConfig: {
      sourceType: "USER_UPLOAD",
      expectedFormat: "TEXT",
      inputType: "FILE_UPLOAD",
      required: true,
    },
    tags: ["code", "upload", "file", "development", "tech"],
    isSystem: true,
  },
  {
    name: "Run Code Review",
    description: "Compare code against standards and check for issues",
    shortDescription: "Validate code quality and standards",
    category: "BASIC_DIGITAL",
    businessDomain: "TECH_IT",
    digitalAction: "APPLY_RULE",
    defaultConfig: {
      ruleType: "VALIDATION",
      ruleDefinition: "code_review_rules",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["code-review", "validation", "quality", "tech"],
    isSystem: true,
  },
  {
    name: "Deploy to Server",
    description: "Connect to deployment server and push code/application",
    shortDescription: "Publish code to production/staging",
    category: "BASIC_DIGITAL",
    businessDomain: "TECH_IT",
    digitalAction: "FINALISE",
    defaultConfig: {
      finalizationAction: "PUBLISH",
      connectionType: "API",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["deploy", "server", "publish", "tech", "devops"],
    isSystem: true,
  },
  {
    name: "Test API Connection",
    description: "Verify connection to external API and test endpoint",
    shortDescription: "Check API connectivity and response",
    category: "BASIC_DIGITAL",
    businessDomain: "TECH_IT",
    digitalAction: "CONNECT",
    defaultConfig: {
      connectionType: "API",
      connectionMethod: "GET",
      inputType: "TEXT",
      required: true,
    },
    tags: ["api", "test", "connection", "tech"],
    isSystem: true,
  },
  {
    name: "Compare Database Schemas",
    description: "Compare two database schemas to find differences",
    shortDescription: "Identify schema changes between databases",
    category: "BASIC_DIGITAL",
    businessDomain: "TECH_IT",
    digitalAction: "COMPARE",
    defaultConfig: {
      targetA: "schema_a",
      targetB: "schema_b",
      comparisonType: "EXACT",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["database", "schema", "compare", "tech"],
    isSystem: true,
  },
  {
    name: "Generate System Log",
    description: "Create system log report with errors, warnings, and events",
    shortDescription: "Export system activity log",
    category: "BASIC_DIGITAL",
    businessDomain: "TECH_IT",
    digitalAction: "REPORT",
    defaultConfig: {
      reportFormat: "JSON",
      includeData: true,
      inputType: "SELECTION",
      required: false,
    },
    tags: ["log", "system", "report", "tech"],
    isSystem: true,
  },

  // ========== HR ==========
  {
    name: "Upload Resume",
    description: "Upload candidate resume document for review",
    shortDescription: "Import resume file",
    category: "BASIC_DIGITAL",
    businessDomain: "HR",
    digitalAction: "IMPORT",
    defaultConfig: {
      sourceType: "USER_UPLOAD",
      expectedFormat: "PDF",
      inputType: "FILE_UPLOAD",
      required: true,
    },
    tags: ["resume", "upload", "recruitment", "hr"],
    isSystem: true,
  },
  {
    name: "Enter Employee Information",
    description: "Input employee personal and professional details",
    shortDescription: "Add employee data to system",
    category: "BASIC_DIGITAL",
    businessDomain: "HR",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "TEXT",
      required: true,
    },
    tags: ["employee", "data-entry", "hr", "onboarding"],
    isSystem: true,
  },
  {
    name: "Verify Employee Documents",
    description: "Check if all required employee documents are present and valid",
    shortDescription: "Validate employee documentation",
    category: "BASIC_DIGITAL",
    businessDomain: "HR",
    digitalAction: "APPLY_RULE",
    defaultConfig: {
      ruleType: "VALIDATION",
      ruleDefinition: "document_checklist",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["documents", "verify", "validation", "hr"],
    isSystem: true,
  },
  {
    name: "Approve Leave Request",
    description: "Review and approve or reject employee leave request",
    shortDescription: "Authorize employee time off",
    category: "BASIC_DIGITAL",
    businessDomain: "HR",
    digitalAction: "CONCLUDE",
    defaultConfig: {
      conclusionType: "APPROVE",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["leave", "approval", "hr", "time-off"],
    isSystem: true,
  },
  {
    name: "Generate Payroll Report",
    description: "Create payroll summary report with employee payments",
    shortDescription: "Export payroll data",
    category: "BASIC_DIGITAL",
    businessDomain: "HR",
    digitalAction: "REPORT",
    defaultConfig: {
      reportFormat: "EXCEL",
      includeData: true,
      inputType: "SELECTION",
      required: false,
    },
    tags: ["payroll", "report", "hr", "export"],
    isSystem: true,
  },

  // ========== OPERATIONS ==========
  {
    name: "Upload Inventory File",
    description: "Import inventory data from CSV or Excel file",
    shortDescription: "Load inventory data from file",
    category: "BASIC_DIGITAL",
    businessDomain: "OPERATIONS",
    digitalAction: "IMPORT",
    defaultConfig: {
      sourceType: "USER_UPLOAD",
      expectedFormat: "CSV",
      inputType: "FILE_UPLOAD",
      required: true,
    },
    tags: ["inventory", "upload", "file", "operations"],
    isSystem: true,
  },
  {
    name: "Enter Order Details",
    description: "Manually input customer order information",
    shortDescription: "Add order data manually",
    category: "BASIC_DIGITAL",
    businessDomain: "OPERATIONS",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "TEXT",
      required: true,
    },
    tags: ["order", "data-entry", "operations"],
    isSystem: true,
  },
  {
    name: "Compare Inventory Levels",
    description: "Compare current inventory with expected levels and flag discrepancies",
    shortDescription: "Check inventory against targets",
    category: "BASIC_DIGITAL",
    businessDomain: "OPERATIONS",
    digitalAction: "COMPARE",
    defaultConfig: {
      targetA: "current_inventory",
      targetB: "expected_inventory",
      comparisonType: "NUMERIC",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["inventory", "compare", "operations"],
    isSystem: true,
  },
  {
    name: "Validate Order",
    description: "Check if order meets business rules (stock availability, pricing, etc.)",
    shortDescription: "Verify order compliance",
    category: "BASIC_DIGITAL",
    businessDomain: "OPERATIONS",
    digitalAction: "APPLY_RULE",
    defaultConfig: {
      ruleType: "VALIDATION",
      ruleDefinition: "order_validation",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["order", "validate", "operations"],
    isSystem: true,
  },
  {
    name: "Send Shipping Notification",
    description: "Notify customer about order shipment status",
    shortDescription: "Alert customer of shipment",
    category: "BASIC_DIGITAL",
    businessDomain: "OPERATIONS",
    digitalAction: "FINALISE",
    defaultConfig: {
      finalizationAction: "NOTIFY",
      inputType: "SELECTION",
      required: false,
    },
    tags: ["shipping", "notification", "operations"],
    isSystem: true,
  },
  {
    name: "Generate Order Report",
    description: "Create order summary report with status and details",
    shortDescription: "Export order data report",
    category: "BASIC_DIGITAL",
    businessDomain: "OPERATIONS",
    digitalAction: "REPORT",
    defaultConfig: {
      reportFormat: "EXCEL",
      includeData: true,
      inputType: "SELECTION",
      required: false,
    },
    tags: ["order", "report", "operations", "export"],
    isSystem: true,
  },

  // ========== SALES ==========
  {
    name: "Enter Customer Information",
    description: "Input new customer details (name, contact, address)",
    shortDescription: "Add customer to database",
    category: "BASIC_DIGITAL",
    businessDomain: "SALES",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "TEXT",
      required: true,
    },
    tags: ["customer", "data-entry", "sales", "crm"],
    isSystem: true,
  },
  {
    name: "Calculate Quote",
    description: "Generate price quote based on products and pricing rules",
    shortDescription: "Compute sales quote automatically",
    category: "BASIC_DIGITAL",
    businessDomain: "SALES",
    digitalAction: "APPLY_RULE",
    defaultConfig: {
      ruleType: "CALCULATION",
      ruleDefinition: "quote_calculation",
      inputType: "NUMBER",
      required: true,
    },
    tags: ["quote", "calculation", "sales", "pricing"],
    isSystem: true,
  },
  {
    name: "Compare Quote to Budget",
    description: "Verify if quote amount is within customer budget",
    shortDescription: "Check quote against budget limits",
    category: "BASIC_DIGITAL",
    businessDomain: "SALES",
    digitalAction: "COMPARE",
    defaultConfig: {
      targetA: "quote.amount",
      targetB: "customer.budget",
      comparisonType: "NUMERIC",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["quote", "budget", "compare", "sales"],
    isSystem: true,
  },
  {
    name: "Send Quote to Customer",
    description: "Email or publish quote document to customer",
    shortDescription: "Deliver quote to client",
    category: "BASIC_DIGITAL",
    businessDomain: "SALES",
    digitalAction: "FINALISE",
    defaultConfig: {
      finalizationAction: "NOTIFY",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["quote", "send", "customer", "sales"],
    isSystem: true,
  },
  {
    name: "Generate Sales Report",
    description: "Create sales performance report with metrics and trends",
    shortDescription: "Export sales analytics",
    category: "BASIC_DIGITAL",
    businessDomain: "SALES",
    digitalAction: "REPORT",
    defaultConfig: {
      reportFormat: "PDF",
      includeData: true,
      inputType: "SELECTION",
      required: false,
    },
    tags: ["sales", "report", "analytics", "export"],
    isSystem: true,
  },

  // ========== GENERAL ==========
  {
    name: "Upload Document",
    description: "Upload any document file (PDF, Word, Excel, image) to the system",
    shortDescription: "Import document file",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "IMPORT",
    defaultConfig: {
      sourceType: "USER_UPLOAD",
      inputType: "FILE_UPLOAD",
      required: true,
    },
    tags: ["document", "upload", "file", "general"],
    isSystem: true,
  },
  {
    name: "Enter Text Data",
    description: "Input text information manually",
    shortDescription: "Type in text data",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "TEXT",
      required: true,
    },
    tags: ["text", "data-entry", "input", "general"],
    isSystem: true,
  },
  {
    name: "Enter Number",
    description: "Input numeric value",
    shortDescription: "Type in number",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "NUMBER",
      required: true,
    },
    tags: ["number", "data-entry", "input", "general"],
    isSystem: true,
  },
  {
    name: "Select from Options",
    description: "Choose one or more options from a predefined list",
    shortDescription: "Pick from dropdown/multi-select",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "SELECTION",
      required: true,
    },
    tags: ["select", "dropdown", "options", "general"],
    isSystem: true,
  },
  {
    name: "Enter Date",
    description: "Select or input a date value",
    shortDescription: "Choose date",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "IMPORT",
    defaultConfig: {
      inputType: "DATE",
      required: true,
    },
    tags: ["date", "calendar", "input", "general"],
    isSystem: true,
  },
  {
    name: "Compare Two Values",
    description: "Compare any two values or data sources and flag if different",
    shortDescription: "Check if two values match",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "COMPARE",
    defaultConfig: {
      targetA: "value_a",
      targetB: "value_b",
      comparisonType: "EXACT",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["compare", "verify", "match", "general"],
    isSystem: true,
  },
  {
    name: "Apply Business Rule",
    description: "Apply custom business logic or validation rule",
    shortDescription: "Execute business rule",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "APPLY_RULE",
    defaultConfig: {
      ruleType: "VALIDATION",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["rule", "validation", "logic", "general"],
    isSystem: true,
  },
  {
    name: "Approve or Reject",
    description: "Make approval decision (approve, reject, or flag for review)",
    shortDescription: "Authorize or decline request",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "CONCLUDE",
    defaultConfig: {
      conclusionType: "APPROVE",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["approval", "decision", "authorize", "general"],
    isSystem: true,
  },
  {
    name: "Save to Database",
    description: "Save data to internal database or storage",
    shortDescription: "Store data permanently",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "FINALISE",
    defaultConfig: {
      finalizationAction: "SAVE",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["save", "database", "store", "general"],
    isSystem: true,
  },
  {
    name: "Send Email Notification",
    description: "Send email notification to specified recipients",
    shortDescription: "Email alert to users",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "FINALISE",
    defaultConfig: {
      finalizationAction: "NOTIFY",
      inputType: "SELECTION",
      required: false,
    },
    tags: ["email", "notification", "alert", "general"],
    isSystem: true,
  },
  {
    name: "Generate Report",
    description: "Create and export report in various formats (PDF, Excel, JSON)",
    shortDescription: "Export data report",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "REPORT",
    defaultConfig: {
      reportFormat: "PDF",
      includeData: true,
      inputType: "SELECTION",
      required: false,
    },
    tags: ["report", "export", "document", "general"],
    isSystem: true,
  },
  {
    name: "Connect to External API",
    description: "Establish connection to external API and fetch/send data",
    shortDescription: "Call external service API",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "CONNECT",
    defaultConfig: {
      connectionType: "API",
      connectionMethod: "GET",
      inputType: "TEXT",
      required: true,
    },
    tags: ["api", "connect", "external", "general"],
    isSystem: true,
  },
  {
    name: "Organize Data",
    description: "Sort, group, or categorize data according to rules",
    shortDescription: "Structure and organize data",
    category: "BASIC_DIGITAL",
    businessDomain: "GENERAL",
    digitalAction: "ORGANISE",
    defaultConfig: {
      organizationRule: "sort_by_date",
      inputType: "SELECTION",
      required: true,
    },
    tags: ["organize", "sort", "group", "general"],
    isSystem: true,
  },
];

async function seedBasicTasks() {
  console.log("🌱 Starting Basic Tasks seed...\n");
  
  // Check if tasks already exist
  const existingQuery = query(collection(db, "basic_tasks"), where("isSystem", "==", true));
  const existingDocs = await getDocs(existingQuery);
  
  if (existingDocs.size > 0) {
    console.log(`⚠️  Found ${existingDocs.size} existing system tasks.`);
    console.log("   Skipping seed to avoid duplicates.");
    console.log("   To re-seed, delete existing system tasks first.\n");
    return;
  }

  console.log(`Total tasks to create: ${basicTasks.length}\n`);

  let created = 0;
  let skipped = 0;

  for (const task of basicTasks) {
    try {
      await addDoc(collection(db, "basic_tasks"), {
        ...task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      created++;
      console.log(`✅ Created: ${task.name} (${BUSINESS_DOMAIN_LABELS[task.businessDomain]})`);
    } catch (error) {
      console.error(`❌ Failed to create ${task.name}:`, error);
      skipped++;
    }
  }

  console.log(`\n✨ Seed completed!`);
  console.log(`   Created: ${created}`);
  console.log(`   Failed: ${skipped}`);
  console.log(`   Total: ${basicTasks.length}`);
}

// Run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  seedBasicTasks()
    .then(() => {
      console.log("\n🎉 All done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Seed failed:", error);
      process.exit(1);
    });
}

export { seedBasicTasks, basicTasks };

