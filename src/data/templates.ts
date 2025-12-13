/**
 * Pre-built Workflow Templates
 * 
 * These templates have been migrated from the legacy schema to the new Atomic Step Architecture.
 * 
 * Migration Rules Applied:
 * - FETCH -> AI_PARSE (Read Document) with extractionMode
 * - STORE -> DB_INSERT (Save to DB) with collectionName
 * - AUTHORIZE -> APPROVAL
 * - GENERATE -> DOC_GENERATE with sourceType and outputFormat
 * - NOTIFY -> SEND_EMAIL
 * - DECIDE -> GATEWAY
 * 
 * Note: Only top 20 most important templates included for initial release.
 */

import { AtomicStep } from "@/types/schema";
import { Users, DollarSign, Wrench, CheckCircle2, FileText, TrendingUp, ShoppingCart, Shield, Code, Scale, Megaphone, ClipboardCheck, Calendar, CreditCard, Building2, Package, Truck, AlertTriangle, UserPlus, GraduationCap, BarChart, Receipt, FileCheck } from "lucide-react";

export const TEMPLATES: Array<{
  id: string;
  category: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  steps: AtomicStep[];
}> = [
  {
    id: "employee-onboarding",
    category: "HR",
    title: "Employee Onboarding",
    description: "Complete onboarding workflow for new hires including documentation, training, and setup",
    icon: Users,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Candidate Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Full Name", "Email", "Phone", "Position"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Resume",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".pdf", ".doc", ".docx"],
          buttonLabel: "Upload Resume",
        },
      },
      {
        id: "step-3",
        title: "Read Resume",
        action: "AI_PARSE" as const,
        config: {
          fileSourceStepId: "step-2",
          extractionMode: "specific_fields",
          fieldsToExtract: ["name", "email", "experience", "skills"],
          fileType: "pdf",
        },
      },
      {
        id: "step-4",
        title: "Interview Score",
        action: "INPUT" as const,
        config: {
          inputType: "number",
          fieldLabel: "Technical Assessment Score (0-100)",
          min: 0,
          max: 100,
          required: true,
        },
      },
      {
        id: "step-5",
        title: "Qualify Candidate",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN",
          target: "{{step-4.output}}",
          value: 70,
          errorMessage: "Candidate score is too low.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-6",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-6",
        title: "Manager Sign-off",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Confirm hiring based on attached CV and Score.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "leave-request",
    category: "HR",
    title: "Leave Request",
    description: "Employee leave request approval workflow with manager review",
    icon: Users,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Leave Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Start Date", "End Date", "Reason", "Days Requested"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Calculate Leave Balance",
        action: "CALCULATE" as const,
        config: {
          formula: "{{totalDays}} - {{usedDays}}",
          outputVariableName: "leaveBalance",
        },
      },
      {
        id: "step-3",
        title: "Validate Leave Balance",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN",
          target: "{{step-2.output}}",
          value: 0,
          errorMessage: "Insufficient leave balance.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-4",
        title: "Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review and approve the leave request.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "invoice-approval",
    category: "Finance",
    title: "Invoice Approval",
    description: "Multi-step invoice verification and approval process",
    icon: DollarSign,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Invoice Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Invoice Number", "Vendor", "Amount", "Due Date"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Invoice Document",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".pdf", ".jpg", ".png"],
          buttonLabel: "Upload Invoice",
        },
      },
      {
        id: "step-3",
        title: "Read Invoice",
        action: "AI_PARSE" as const,
        config: {
          fileSourceStepId: "step-2",
          extractionMode: "specific_fields",
          fieldsToExtract: ["invoiceNumber", "amount", "vendor", "dueDate"],
          fileType: "pdf",
        },
      },
      {
        id: "step-4",
        title: "Verify Amount",
        action: "COMPARE" as const,
        config: {
          targetA: "{{step-1.Amount}}",
          targetB: "{{step-3.amount}}",
          comparisonType: "exact",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-5",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-5",
        title: "Finance Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Verify invoice details and approve payment.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "expense-reimbursement",
    category: "Finance",
    title: "Expense Reimbursement",
    description: "Employee expense claim submission and approval workflow",
    icon: DollarSign,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Expense Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Date", "Category", "Description", "Amount"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Receipt",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".pdf", ".jpg", ".png"],
          buttonLabel: "Upload Receipt",
        },
      },
      {
        id: "step-3",
        title: "Validate Amount",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN",
          target: "{{step-1.Amount}}",
          value: 10000,
          errorMessage: "Expense exceeds maximum limit. Requires additional approval.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve expense reimbursement.",
        },
      },
      {
        id: "step-5",
        title: "Senior Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve high-value expense reimbursement.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "safety-check",
    category: "Operations",
    title: "Daily Safety Check",
    description: "Daily workplace safety inspection checklist",
    icon: Wrench,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Safety Checklist",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Fire Extinguisher", "Emergency Exits", "First Aid Kit", "Equipment Status"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Safety Photos",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".jpg", ".png"],
          buttonLabel: "Upload Photos",
        },
      },
      {
        id: "step-3",
        title: "Safety Officer Review",
        action: "INSPECT" as const,
        config: {
          instruction: "Review safety checklist and photos. Confirm all items are in compliance.",
        },
      },
      {
        id: "step-4",
        title: "Record Inspection",
        action: "DB_INSERT" as const,
        config: {
          collectionName: "safety_inspections",
          data: {
            checklist: "{{step-1.output}}",
            photos: "{{step-2.output}}",
            reviewedBy: "{{step-3.output}}",
          },
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "machine-maintenance",
    category: "Operations",
    title: "Machine Maintenance",
    description: "Equipment maintenance log and scheduling workflow",
    icon: Wrench,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Maintenance Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Machine ID", "Maintenance Type", "Date", "Technician"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Maintenance Checklist",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 5,
            columns: 3,
            headers: ["Item", "Status", "Notes"],
          },
        },
      },
      {
        id: "step-3",
        title: "Upload Maintenance Photos",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".jpg", ".png"],
          buttonLabel: "Upload Photos",
        },
      },
      {
        id: "step-4",
        title: "Supervisor Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review maintenance log and approve completion.",
        },
      },
      {
        id: "step-5",
        title: "Schedule Next Maintenance",
        action: "DOC_GENERATE" as const,
        config: {
          sourceType: "inline",
          inlineContent: "Next maintenance scheduled for {{nextMaintenanceDate}}",
          outputFormat: "pdf",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "performance-review",
    category: "HR",
    title: "Performance Review",
    description: "Annual employee performance evaluation and feedback process",
    icon: TrendingUp,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Employee Self-Assessment",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Achievements", "Challenges", "Goals", "Feedback"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Manager Evaluation",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Performance Rating", "Strengths", "Areas for Improvement", "Recommendations"],
          required: true,
        },
      },
      {
        id: "step-3",
        title: "Calculate Overall Score",
        action: "CALCULATE" as const,
        config: {
          formula: "({{selfScore}} + {{managerScore}}) / 2",
          outputVariableName: "overallScore",
        },
      },
      {
        id: "step-4",
        title: "HR Review",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review performance evaluation and approve final rating.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "employee-offboarding",
    category: "HR",
    title: "Employee Offboarding",
    description: "Complete exit process for departing employees",
    icon: UserPlus,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Exit Interview",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Reason for Leaving", "Feedback", "Suggestions"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Return Company Assets",
        action: "INSPECT" as const,
        config: {
          instruction: "Verify return of laptop, badge, keys, and other company assets.",
        },
      },
      {
        id: "step-3",
        title: "Final Payroll Processing",
        action: "CALCULATE" as const,
        config: {
          formula: "{{baseSalary}} + {{accruedLeave}} - {{deductions}}",
          outputVariableName: "finalPay",
        },
      },
      {
        id: "step-4",
        title: "HR Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve final settlement and complete offboarding.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "training-request",
    category: "HR",
    title: "Training Request",
    description: "Employee training and development request approval",
    icon: GraduationCap,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Training Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Course Name", "Provider", "Cost", "Duration", "Justification"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Validate Budget",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN",
          target: "{{step-1.Cost}}",
          value: 5000,
          errorMessage: "Training cost exceeds budget limit.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-3",
          onFailureStepId: "step-4",
        },
      },
      {
        id: "step-3",
        title: "Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve training request.",
        },
      },
      {
        id: "step-4",
        title: "HR Director Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve high-value training request.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "payroll-processing",
    category: "HR",
    title: "Payroll Processing",
    description: "Monthly payroll calculation and approval workflow",
    icon: CreditCard,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Calculate Gross Salary",
        action: "CALCULATE" as const,
        config: {
          formula: "({{baseSalary}} / 30) * {{daysWorked}} + ({{overtimeRate}} * {{overtimeHours}})",
          outputVariableName: "grossSalary",
        },
      },
      {
        id: "step-2",
        title: "Calculate Deductions",
        action: "CALCULATE" as const,
        config: {
          formula: "{{tax}} + {{insurance}} + {{otherDeductions}}",
          outputVariableName: "deductions",
        },
      },
      {
        id: "step-3",
        title: "Calculate Net Salary",
        action: "CALCULATE" as const,
        config: {
          formula: "{{grossSalary}} - {{deductions}}",
          outputVariableName: "netSalary",
        },
      },
      {
        id: "step-4",
        title: "Finance Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review and approve payroll calculations.",
        },
      },
      {
        id: "step-5",
        title: "Generate Payslips",
        action: "DOC_GENERATE" as const,
        config: {
          sourceType: "inline",
          inlineContent: "Payslip for {{employeeName}} - Net: {{netSalary}}",
          outputFormat: "pdf",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "attendance-tracking",
    category: "HR",
    title: "Attendance Tracking",
    description: "Daily attendance logging and verification process",
    icon: Calendar,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Log Attendance",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Date", "Check-in Time", "Check-out Time", "Break Duration"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Calculate Work Hours",
        action: "CALCULATE" as const,
        config: {
          formula: "{{checkOutTime}} - {{checkInTime}} - {{breakDuration}}",
          outputVariableName: "workHours",
        },
      },
      {
        id: "step-3",
        title: "Validate Work Hours",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN",
          target: "{{step-2.output}}",
          value: 8,
          errorMessage: "Work hours below minimum requirement.",
        },
      },
      {
        id: "step-4",
        title: "Store Attendance Record",
        action: "DB_INSERT" as const,
        config: {
          collectionName: "attendance_records",
          data: {
            date: "{{step-1.Date}}",
            workHours: "{{step-2.output}}",
          },
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "budget-approval",
    category: "Finance",
    title: "Budget Approval",
    description: "Department budget request and approval workflow",
    icon: BarChart,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Budget Proposal",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 10,
            columns: 4,
            headers: ["Category", "Q1", "Q2", "Q3", "Q4"],
          },
        },
      },
      {
        id: "step-2",
        title: "Calculate Total Budget",
        action: "CALCULATE" as const,
        config: {
          formula: "{{Q1}} + {{Q2}} + {{Q3}} + {{Q4}}",
          outputVariableName: "totalBudget",
        },
      },
      {
        id: "step-3",
        title: "Compare with Previous Year",
        action: "COMPARE" as const,
        config: {
          targetA: "{{step-2.output}}",
          targetB: "{{previousYearBudget}}",
          comparisonType: "numeric",
        },
      },
      {
        id: "step-4",
        title: "Finance Director Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review budget proposal and approve allocation.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "payment-processing",
    category: "Finance",
    title: "Payment Processing",
    description: "Vendor payment processing and reconciliation",
    icon: Receipt,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Payment Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Vendor", "Invoice Number", "Amount", "Payment Method"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Verify Invoice",
        action: "COMPARE" as const,
        config: {
          targetA: "{{step-1.Amount}}",
          targetB: "{{invoiceAmount}}",
          comparisonType: "exact",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-3",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-3",
        title: "Process Payment",
        action: "HTTP_REQUEST" as const,
        config: {
          url: "https://payment-gateway.example.com/process",
          method: "POST",
          requestBody: "{{step-1.output}}",
        },
      },
      {
        id: "step-4",
        title: "Record Transaction",
        action: "DB_INSERT" as const,
        config: {
          collectionName: "payments",
          data: {
            vendor: "{{step-1.Vendor}}",
            amount: "{{step-1.Amount}}",
            paymentMethod: "{{step-1.Payment Method}}",
          },
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "financial-report-review",
    category: "Finance",
    title: "Financial Report Review",
    description: "Monthly financial statement review and approval",
    icon: FileCheck,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Generate Financial Report",
        action: "DOC_GENERATE" as const,
        config: {
          sourceType: "inline",
          inlineContent: "Financial Report for {{month}} - Revenue: {{revenue}}, Expenses: {{expenses}}",
          outputFormat: "pdf",
        },
      },
      {
        id: "step-2",
        title: "Calculate Net Profit",
        action: "CALCULATE" as const,
        config: {
          formula: "{{revenue}} - {{expenses}}",
          outputVariableName: "netProfit",
        },
      },
      {
        id: "step-3",
        title: "Compare with Budget",
        action: "COMPARE" as const,
        config: {
          targetA: "{{step-2.output}}",
          targetB: "{{budgetedProfit}}",
          comparisonType: "numeric",
        },
      },
      {
        id: "step-4",
        title: "CFO Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review financial report and approve for publication.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "vendor-onboarding",
    category: "Finance",
    title: "Vendor Onboarding",
    description: "New vendor registration and verification process",
    icon: Building2,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Vendor Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Company Name", "Tax ID", "Address", "Contact Person", "Email", "Phone"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Documents",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".pdf"],
          buttonLabel: "Upload Documents",
        },
      },
      {
        id: "step-3",
        title: "Validate Tax ID",
        action: "VALIDATE" as const,
        config: {
          rule: "REGEX",
          target: "{{step-1.Tax ID}}",
          value: "^[0-9]{9,12}$",
          errorMessage: "Invalid tax ID format.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-4",
        title: "Finance Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review vendor information and approve registration.",
        },
      },
      {
        id: "step-5",
        title: "Store Vendor Data",
        action: "DB_INSERT" as const,
        config: {
          collectionName: "vendors",
          data: {
            companyName: "{{step-1.Company Name}}",
            taxId: "{{step-1.Tax ID}}",
            email: "{{step-1.Email}}",
          },
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "purchase-order-approval",
    category: "Finance",
    title: "Purchase Order Approval",
    description: "Purchase order creation and multi-level approval",
    icon: ShoppingCart,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "PO Details",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 10,
            columns: 5,
            headers: ["Item", "Quantity", "Unit Price", "Total", "Supplier"],
          },
        },
      },
      {
        id: "step-2",
        title: "Calculate Total Amount",
        action: "CALCULATE" as const,
        config: {
          formula: "SUM({{itemTotal}})",
          outputVariableName: "totalAmount",
        },
      },
      {
        id: "step-3",
        title: "Check Budget",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN",
          target: "{{step-2.output}}",
          value: "{{departmentBudget}}",
          errorMessage: "Purchase exceeds department budget.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Department Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve purchase order.",
        },
      },
      {
        id: "step-5",
        title: "Finance Director Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve budget-exceeding purchase order.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "quality-control",
    category: "Operations",
    title: "Quality Control Inspection",
    description: "Product quality inspection and approval workflow",
    icon: ClipboardCheck,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Product Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Batch Number", "Product Code", "Quantity", "Manufacturing Date"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Quality Checklist",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 8,
            columns: 3,
            headers: ["Check Item", "Status", "Notes"],
          },
        },
      },
      {
        id: "step-3",
        title: "Upload Inspection Photos",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".jpg", ".png"],
          buttonLabel: "Upload Photos",
        },
      },
      {
        id: "step-4",
        title: "Quality Inspector Review",
        action: "INSPECT" as const,
        config: {
          instruction: "Review quality checklist and photos. Verify product meets standards.",
        },
      },
      {
        id: "step-5",
        title: "Quality Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve product for shipment.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "inventory-management",
    category: "Operations",
    title: "Inventory Management",
    description: "Stock level monitoring and reorder process",
    icon: Package,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Compare Stock Levels",
        action: "COMPARE" as const,
        config: {
          targetA: "{{currentStock}}",
          targetB: "{{minThreshold}}",
          comparisonType: "numeric",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "COMPLETED",
          onFailureStepId: "step-2",
        },
      },
      {
        id: "step-2",
        title: "Calculate Reorder Quantity",
        action: "CALCULATE" as const,
        config: {
          formula: "({{maxStock}} - {{currentStock}}) * 1.2",
          outputVariableName: "reorderQuantity",
        },
      },
      {
        id: "step-3",
        title: "Generate Purchase Request",
        action: "DOC_GENERATE" as const,
        config: {
          sourceType: "inline",
          inlineContent: "Purchase Request: {{itemCode}} - Quantity: {{reorderQuantity}}",
          outputFormat: "pdf",
        },
      },
      {
        id: "step-4",
        title: "Operations Manager Approval",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Approve inventory reorder request.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "shipping-receiving",
    category: "Operations",
    title: "Shipping & Receiving",
    description: "Incoming and outgoing shipment processing",
    icon: Truck,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Shipment Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Tracking Number", "Carrier", "Expected Date", "Items"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Receive Shipment",
        action: "INSPECT" as const,
        config: {
          instruction: "Verify shipment contents match order. Check for damage.",
        },
      },
      {
        id: "step-3",
        title: "Compare with Order",
        action: "COMPARE" as const,
        config: {
          targetA: "{{step-2.receivedItems}}",
          targetB: "{{orderItems}}",
          comparisonType: "exact",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Update Inventory",
        action: "DB_INSERT" as const,
        config: {
          collectionName: "inventory",
          data: {
            items: "{{step-2.receivedItems}}",
            trackingNumber: "{{step-1.Tracking Number}}",
          },
        },
      },
      {
        id: "step-5",
        title: "Flag Discrepancy",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Document shipment discrepancy for investigation.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "incident-report",
    category: "Operations",
    title: "Incident Report",
    description: "Workplace incident documentation and investigation",
    icon: AlertTriangle,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Incident Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Date", "Time", "Location", "Description", "Witnesses"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Evidence",
        action: "INPUT" as const,
        config: {
          inputType: "file",
          allowedExtensions: [".jpg", ".png", ".pdf"],
          buttonLabel: "Upload Evidence",
        },
      },
      {
        id: "step-3",
        title: "Severity Assessment",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Severity Level", "Impact", "Immediate Actions Taken"],
          required: true,
        },
      },
      {
        id: "step-4",
        title: "Safety Manager Review",
        action: "APPROVAL" as const,
        config: {
          requireSignature: true,
          instruction: "Review incident report and approve investigation.",
        },
      },
      {
        id: "step-5",
        title: "Store Incident Record",
        action: "DB_INSERT" as const,
        config: {
          collectionName: "incidents",
          data: {
            date: "{{step-1.Date}}",
            location: "{{step-1.Location}}",
            description: "{{step-1.Description}}",
            severity: "{{step-3.Severity Level}}",
          },
        },
      },
    ] as AtomicStep[],
  },
];
