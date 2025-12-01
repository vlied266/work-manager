/**
 * Seed script for Financial System Mock Data
 * Run with: npx tsx scripts/seed-financial-data.ts
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    // Try to use default credentials (if running on Firebase or with gcloud auth)
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "work-flow-manager-b0e0e",
    });
    console.log("✅ Using default Firebase Admin credentials");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
    console.log("\n💡 Make sure you have:");
    console.log("   1. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local");
    console.log("   2. Authenticated with Firebase (gcloud auth application-default login)");
    console.log("   OR");
    console.log("   3. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
    process.exit(1);
  }
}

const db = getFirestore();

// Mock data
const ORGANIZATION_ID = "org_financial_core";
const TEAM_IDS = {
  finance: "team_finance",
  accounting: "team_accounting",
  operations: "team_operations",
};

const USER_IDS = {
  cfo: "user_cfo",
  accountant1: "user_accountant_1",
  accountant2: "user_accountant_2",
  operator1: "user_operator_1",
  operator2: "user_operator_2",
};

async function seedData() {
  console.log("🌱 Starting seed process...\n");

  try {
    // 1. Create Organization
    console.log("📦 Creating organization...");
    await db.collection("organizations").doc(ORGANIZATION_ID).set({
      name: "FinancialCore Inc.",
      domain: "financialcore.com",
      plan: "PRO",
      createdAt: Timestamp.now(),
    });
    console.log("✅ Organization created\n");

    // 2. Create Teams
    console.log("👥 Creating teams...");
    const teams = [
      {
        id: TEAM_IDS.finance,
        organizationId: ORGANIZATION_ID,
        name: "Finance Team",
        members: [USER_IDS.cfo, USER_IDS.accountant1],
      },
      {
        id: TEAM_IDS.accounting,
        organizationId: ORGANIZATION_ID,
        name: "Accounting Department",
        members: [USER_IDS.accountant1, USER_IDS.accountant2],
      },
      {
        id: TEAM_IDS.operations,
        organizationId: ORGANIZATION_ID,
        name: "Financial Operations",
        members: [USER_IDS.operator1, USER_IDS.operator2],
      },
    ];

    for (const team of teams) {
      await db.collection("teams").doc(team.id).set({
        organizationId: team.organizationId,
        name: team.name,
        members: team.members,
      });
    }
    console.log("✅ Teams created\n");

    // 3. Create Users
    console.log("👤 Creating users...");
    const users = [
      {
        uid: USER_IDS.cfo,
        email: "cfo@financialcore.com",
        displayName: "Sarah Chen",
        avatarUrl: "",
        organizationId: ORGANIZATION_ID,
        teamIds: [TEAM_IDS.finance],
        role: "ADMIN",
      },
      {
        uid: USER_IDS.accountant1,
        email: "accountant1@financialcore.com",
        displayName: "Michael Rodriguez",
        avatarUrl: "",
        organizationId: ORGANIZATION_ID,
        teamIds: [TEAM_IDS.finance, TEAM_IDS.accounting],
        role: "LEAD",
      },
      {
        uid: USER_IDS.accountant2,
        email: "accountant2@financialcore.com",
        displayName: "Emily Watson",
        avatarUrl: "",
        organizationId: ORGANIZATION_ID,
        teamIds: [TEAM_IDS.accounting],
        role: "OPERATOR",
      },
      {
        uid: USER_IDS.operator1,
        email: "operator1@financialcore.com",
        displayName: "David Kim",
        avatarUrl: "",
        organizationId: ORGANIZATION_ID,
        teamIds: [TEAM_IDS.operations],
        role: "OPERATOR",
      },
      {
        uid: USER_IDS.operator2,
        email: "operator2@financialcore.com",
        displayName: "Lisa Anderson",
        avatarUrl: "",
        organizationId: ORGANIZATION_ID,
        teamIds: [TEAM_IDS.operations],
        role: "OPERATOR",
      },
    ];

    for (const user of users) {
      await db.collection("users").doc(user.uid).set(user);
    }
    console.log("✅ Users created\n");

    // 4. Create Procedures
    console.log("📋 Creating procedures...");

    // Procedure 1: Invoice Processing
    const invoiceProcessingSteps = [
      {
        id: "step-invoice-1",
        title: "Import Invoice Data",
        description: "Import invoice data from uploaded CSV or API",
        assigneeType: "ANY_TEAM_MEMBER",
        assigneeId: TEAM_IDS.operations,
        category: "BASIC_DIGITAL",
        digitalAction: "IMPORT",
        config: {
          sourceType: "USER_UPLOAD",
          expectedFormat: "CSV",
          inputType: "FILE_UPLOAD",
          required: true,
        },
      },
      {
        id: "step-invoice-2",
        title: "Organize Invoice Data",
        description: "Sort invoices by date and group by vendor",
        assigneeType: "ANY_TEAM_MEMBER",
        assigneeId: TEAM_IDS.operations,
        category: "BASIC_DIGITAL",
        digitalAction: "ORGANISE",
        config: {
          organizationRule: "Sort by invoice date descending, group by vendor name",
          sortBy: "invoice_date",
          groupBy: "vendor_name",
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-invoice-3",
        title: "Verify Invoice Amounts",
        description: "Compare invoice amounts with purchase orders",
        assigneeType: "ANY_TEAM_MEMBER",
        assigneeId: TEAM_IDS.accounting,
        category: "BASIC_DIGITAL",
        digitalAction: "COMPARE",
        config: {
          targetA: "invoice.total_amount",
          targetB: "purchase_order.approved_amount",
          comparisonType: "NUMERIC",
          tolerance: 0.01,
          inputType: "SELECTION",
          required: true,
        },
      },
      {
        id: "step-invoice-4",
        title: "Apply Validation Rules",
        description: "Validate invoice against company policies",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant1,
        category: "BASIC_DIGITAL",
        digitalAction: "APPLY_RULE",
        config: {
          ruleType: "VALIDATION",
          ruleDefinition: "If invoice amount > 10000, require manager approval. If vendor not in approved list, flag for review.",
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-invoice-5",
        title: "Finalize Invoice Approval",
        description: "Save approved invoice and notify accounts payable",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant1,
        category: "BASIC_DIGITAL",
        digitalAction: "FINALISE",
        config: {
          finalizationAction: "SAVE",
          finalizationTarget: "approved_invoices",
          inputType: "TEXT",
          required: true,
        },
      },
    ];

    const invoiceProcessingId = "proc_invoice_processing";
    await db.collection("procedures").doc(invoiceProcessingId).set({
      organizationId: ORGANIZATION_ID,
      teamId: TEAM_IDS.accounting,
      name: "Invoice Processing",
      description: "Complete workflow for processing and approving vendor invoices",
      steps: invoiceProcessingSteps,
      updatedAt: Timestamp.now(),
      createdBy: USER_IDS.cfo,
    });

    // Procedure 2: Payment Verification
    const paymentVerificationSteps = [
      {
        id: "step-payment-1",
        title: "Import Bank Statement",
        description: "Import bank statement data for reconciliation",
        assigneeType: "ANY_TEAM_MEMBER",
        assigneeId: TEAM_IDS.operations,
        category: "BASIC_DIGITAL",
        digitalAction: "IMPORT",
        config: {
          sourceType: "EXTERNAL_API",
          sourceUrl: "https://api.bank.com/statements",
          expectedFormat: "JSON",
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-payment-2",
        title: "Connect to Payment System",
        description: "Connect to payment gateway to fetch transaction details",
        assigneeType: "ANY_TEAM_MEMBER",
        assigneeId: TEAM_IDS.operations,
        category: "BASIC_DIGITAL",
        digitalAction: "CONNECT",
        config: {
          connectionType: "API",
          connectionEndpoint: "https://api.paymentgateway.com/transactions",
          connectionMethod: "GET",
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-payment-3",
        title: "Compare Payments",
        description: "Compare bank statement with payment records",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant2,
        category: "BASIC_DIGITAL",
        digitalAction: "COMPARE",
        config: {
          targetA: "bank_statement.transaction_amount",
          targetB: "payment_record.amount",
          comparisonType: "EXACT",
          inputType: "SELECTION",
          required: true,
        },
      },
      {
        id: "step-payment-4",
        title: "Generate Reconciliation Report",
        description: "Generate reconciliation report for review",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant2,
        category: "BASIC_DIGITAL",
        digitalAction: "REPORT",
        config: {
          reportFormat: "PDF",
          reportTemplate: "reconciliation_template",
          inputType: "TEXT",
          required: true,
        },
      },
    ];

    const paymentVerificationId = "proc_payment_verification";
    await db.collection("procedures").doc(paymentVerificationId).set({
      organizationId: ORGANIZATION_ID,
      teamId: TEAM_IDS.finance,
      name: "Payment Verification",
      description: "Verify and reconcile payment transactions with bank statements",
      steps: paymentVerificationSteps,
      updatedAt: Timestamp.now(),
      createdBy: USER_IDS.cfo,
    });

    // Procedure 3: Financial Close
    const financialCloseSteps = [
      {
        id: "step-close-1",
        title: "Import All Financial Data",
        description: "Import data from all financial systems",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant1,
        category: "BASIC_DIGITAL",
        digitalAction: "IMPORT",
        config: {
          sourceType: "INTERNAL_DB",
          sourcePath: "financial_data.ledger",
          expectedFormat: "JSON",
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-close-2",
        title: "Organize Financial Data",
        description: "Organize data by account and period",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant1,
        category: "BASIC_DIGITAL",
        digitalAction: "ORGANISE",
        config: {
          organizationRule: "Group by account code, sort by period",
          sortBy: "period",
          groupBy: "account_code",
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-close-3",
        title: "Apply Closing Rules",
        description: "Apply month-end closing calculations and adjustments",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant1,
        category: "BASIC_DIGITAL",
        digitalAction: "APPLY_RULE",
        config: {
          ruleType: "CALCULATION",
          ruleDefinition: "Calculate depreciation, accruals, and adjustments. Close revenue and expense accounts to retained earnings.",
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-close-4",
        title: "Conclude Financial Close",
        description: "Review and approve financial close",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.cfo,
        category: "BASIC_DIGITAL",
        digitalAction: "CONCLUDE",
        config: {
          conclusionType: "APPROVE",
          conclusionCriteria: "If all accounts balance and adjustments are correct, approve close",
          inputType: "SELECTION",
          required: true,
        },
      },
      {
        id: "step-close-5",
        title: "Generate Financial Statements",
        description: "Generate income statement, balance sheet, and cash flow",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant1,
        category: "BASIC_DIGITAL",
        digitalAction: "REPORT",
        config: {
          reportFormat: "PDF",
          reportTemplate: "financial_statements_template",
          reportRecipients: ["cfo@financialcore.com", "board@financialcore.com"],
          inputType: "TEXT",
          required: true,
        },
      },
      {
        id: "step-close-6",
        title: "Finalize and Archive",
        description: "Finalize financial close and archive documents",
        assigneeType: "SPECIFIC_USER",
        assigneeId: USER_IDS.accountant1,
        category: "BASIC_DIGITAL",
        digitalAction: "FINALISE",
        config: {
          finalizationAction: "ARCHIVE",
          finalizationTarget: "financial_archive/monthly_close",
          inputType: "TEXT",
          required: true,
        },
      },
    ];

    const financialCloseId = "proc_financial_close";
    await db.collection("procedures").doc(financialCloseId).set({
      organizationId: ORGANIZATION_ID,
      teamId: TEAM_IDS.finance,
      name: "Monthly Financial Close",
      description: "Complete monthly financial closing process including adjustments and reporting",
      steps: financialCloseSteps,
      updatedAt: Timestamp.now(),
      createdBy: USER_IDS.cfo,
    });

    console.log("✅ Procedures created\n");

    // 5. Create Process
    console.log("🔄 Creating process...");
    const monthlyCloseProcessId = "process_monthly_close";
    await db.collection("processes").doc(monthlyCloseProcessId).set({
      organizationId: ORGANIZATION_ID,
      teamId: TEAM_IDS.finance,
      name: "Monthly Financial Close Process",
      description: "Complete monthly financial close workflow including invoice processing, payment verification, and financial close",
      procedures: [
        {
          id: invoiceProcessingId,
          order: 0,
          procedureName: "Invoice Processing",
          procedureDescription: "Complete workflow for processing and approving vendor invoices",
        },
        {
          id: paymentVerificationId,
          order: 1,
          procedureName: "Payment Verification",
          procedureDescription: "Verify and reconcile payment transactions with bank statements",
        },
        {
          id: financialCloseId,
          order: 2,
          procedureName: "Monthly Financial Close",
          procedureDescription: "Complete monthly financial closing process including adjustments and reporting",
        },
      ],
      updatedAt: Timestamp.now(),
      createdBy: USER_IDS.cfo,
    });
    console.log("✅ Process created\n");

    console.log("🎉 Seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Organization: ${ORGANIZATION_ID}`);
    console.log(`   - Teams: ${teams.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Procedures: 3`);
    console.log(`   - Process: 1`);
    console.log("\n💡 You can now log in with any of these emails:");
    users.forEach((user) => {
      console.log(`   - ${user.email} (${user.role})`);
    });
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData().then(() => {
  console.log("\n✨ Done!");
  process.exit(0);
});

