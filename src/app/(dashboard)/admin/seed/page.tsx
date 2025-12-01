"use client";

import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

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

export default function SeedPage() {
  const { firebaseUser, profile } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const seedData = async () => {
    if (!firebaseUser || !profile) {
      setError("You must be logged in to seed data");
      return;
    }

    setSeeding(true);
    setError(null);
    setSuccess(false);
    setProgress("Starting seed process...");

    try {
      // Use current user's organization or create new one
      const orgId = profile.organizationId || ORGANIZATION_ID;

      // 1. Create Organization (if using mock org)
      if (!profile.organizationId) {
        setProgress("Creating organization...");
        await setDoc(doc(db, "organizations", ORGANIZATION_ID), {
          name: "FinancialCore Inc.",
          domain: "financialcore.com",
          plan: "PRO",
          createdAt: serverTimestamp(),
        });
      }

      // 2. Create Teams
      setProgress("Creating teams...");
      const teams = [
        {
          id: TEAM_IDS.finance,
          organizationId: orgId,
          name: "Finance Team",
          members: [USER_IDS.cfo, USER_IDS.accountant1],
        },
        {
          id: TEAM_IDS.accounting,
          organizationId: orgId,
          name: "Accounting Department",
          members: [USER_IDS.accountant1, USER_IDS.accountant2],
        },
        {
          id: TEAM_IDS.operations,
          organizationId: orgId,
          name: "Financial Operations",
          members: [USER_IDS.operator1, USER_IDS.operator2],
        },
      ];

      for (const team of teams) {
        await setDoc(doc(db, "teams", team.id), {
          organizationId: team.organizationId,
          name: team.name,
          members: team.members,
        });
      }

      // 3. Create Users
      setProgress("Creating users...");
      const users = [
        {
          uid: USER_IDS.cfo,
          email: "cfo@financialcore.com",
          displayName: "Sarah Chen",
          avatarUrl: "",
          organizationId: orgId,
          teamIds: [TEAM_IDS.finance],
          role: "ADMIN",
        },
        {
          uid: USER_IDS.accountant1,
          email: "accountant1@financialcore.com",
          displayName: "Michael Rodriguez",
          avatarUrl: "",
          organizationId: orgId,
          teamIds: [TEAM_IDS.finance, TEAM_IDS.accounting],
          role: "LEAD",
        },
        {
          uid: USER_IDS.accountant2,
          email: "accountant2@financialcore.com",
          displayName: "Emily Watson",
          avatarUrl: "",
          organizationId: orgId,
          teamIds: [TEAM_IDS.accounting],
          role: "OPERATOR",
        },
        {
          uid: USER_IDS.operator1,
          email: "operator1@financialcore.com",
          displayName: "David Kim",
          avatarUrl: "",
          organizationId: orgId,
          teamIds: [TEAM_IDS.operations],
          role: "OPERATOR",
        },
        {
          uid: USER_IDS.operator2,
          email: "operator2@financialcore.com",
          displayName: "Lisa Anderson",
          avatarUrl: "",
          organizationId: orgId,
          teamIds: [TEAM_IDS.operations],
          role: "OPERATOR",
        },
      ];

      for (const user of users) {
        await setDoc(doc(db, "users", user.uid), user);
      }

      // 4. Create Procedures
      setProgress("Creating procedures...");

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
      await setDoc(doc(db, "procedures", invoiceProcessingId), {
        organizationId: orgId,
        teamId: TEAM_IDS.accounting,
        name: "Invoice Processing",
        description: "Complete workflow for processing and approving vendor invoices",
        steps: invoiceProcessingSteps,
        updatedAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
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
      await setDoc(doc(db, "procedures", paymentVerificationId), {
        organizationId: orgId,
        teamId: TEAM_IDS.finance,
        name: "Payment Verification",
        description: "Verify and reconcile payment transactions with bank statements",
        steps: paymentVerificationSteps,
        updatedAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
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
      await setDoc(doc(db, "procedures", financialCloseId), {
        organizationId: orgId,
        teamId: TEAM_IDS.finance,
        name: "Monthly Financial Close",
        description: "Complete monthly financial closing process including adjustments and reporting",
        steps: financialCloseSteps,
        updatedAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
      });

      // 5. Create Process
      setProgress("Creating process...");
      const monthlyCloseProcessId = "process_monthly_close";
      await setDoc(doc(db, "processes", monthlyCloseProcessId), {
        organizationId: orgId,
        teamId: TEAM_IDS.finance,
        name: "Monthly Financial Close Process",
        description: "Complete monthly financial close workflow including invoice processing, payment verification, and financial close",
        procedures: [
          {
            procedureId: invoiceProcessingId,
            order: 0,
            procedureName: "Invoice Processing",
            procedureDescription: "Complete workflow for processing and approving vendor invoices",
          },
          {
            procedureId: paymentVerificationId,
            order: 1,
            procedureName: "Payment Verification",
            procedureDescription: "Verify and reconcile payment transactions with bank statements",
          },
          {
            procedureId: financialCloseId,
            order: 2,
            procedureName: "Monthly Financial Close",
            procedureDescription: "Complete monthly financial closing process including adjustments and reporting",
          },
        ],
        updatedAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
      });

      setProgress("✅ Seed completed successfully!");
      setSuccess(true);
    } catch (err) {
      console.error("Seed error:", err);
      setError((err as Error).message);
      setProgress("");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/90 p-8 shadow-glass ring-1 ring-white/70 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Development Tools</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Seed Mock Data</h1>
        <p className="text-muted">Populate database with financial system mock data</p>
      </header>

      <div className="rounded-3xl bg-white/90 p-8 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">What will be created:</h2>
            <ul className="space-y-2 text-sm text-ink">
              <li>✅ <strong>1 Organization:</strong> FinancialCore Inc.</li>
              <li>✅ <strong>3 Teams:</strong> Finance Team, Accounting Department, Financial Operations</li>
              <li>✅ <strong>5 Users:</strong> CFO (ADMIN), 2 Accountants (LEAD/OPERATOR), 2 Operators</li>
              <li>✅ <strong>3 Procedures:</strong> Invoice Processing, Payment Verification, Monthly Financial Close</li>
              <li>✅ <strong>1 Process:</strong> Monthly Financial Close Process</li>
            </ul>
          </div>

          {progress && (
            <div className="rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-4">
              <p className="text-sm font-semibold text-ink">{progress}</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">
                ✅ Seed completed! You can now view the data in Procedures, Processes, and Settings pages.
              </p>
            </div>
          )}

          <button
            onClick={seedData}
            disabled={seeding || !firebaseUser}
            className="apple-button w-full px-8 py-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {seeding ? "Seeding data..." : "Seed Financial Mock Data"}
          </button>

          {!firebaseUser && (
            <p className="text-sm text-muted text-center">Please sign in to seed data</p>
          )}
        </div>
      </div>
    </div>
  );
}

