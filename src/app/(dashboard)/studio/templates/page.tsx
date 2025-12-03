"use client";

import { useState } from "react";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Procedure, AtomicStep } from "@/types/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Users, DollarSign, Wrench, CheckCircle2, Loader2, FileText, TrendingUp, ShoppingCart, Shield, Code, Scale, Megaphone, ClipboardCheck, Calendar, CreditCard, Building2, Package, Truck, AlertTriangle, UserPlus, GraduationCap, BarChart, Receipt, FileCheck, Key, Bug, BookOpen, Target, Image } from "lucide-react";
import { motion } from "framer-motion";

// Template definitions
const TEMPLATES = [
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".doc", ".docx"],
          maxSize: "5MB",
        },
      },
      {
        id: "step-3",
        title: "Interview Score",
        action: "INPUT" as const,
        config: {
          inputType: "number",
          min: 0,
          max: 100,
          label: "Technical Assessment Score (0-100)",
        },
      },
      {
        id: "step-4",
        title: "Qualify Candidate",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN",
          target: "step_3_output",
          value: 70,
          errorMessage: "Candidate score is too low.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-5",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-5",
        title: "Manager Sign-off",
        action: "AUTHORIZE" as const,
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
          formula: "totalDays - usedDays",
          variables: ["totalDays", "usedDays"],
        },
      },
      {
        id: "step-3",
        title: "Validate Leave Balance",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN_OR_EQUAL",
          target: "step_2_output",
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
        action: "AUTHORIZE" as const,
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".jpg", ".png"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-3",
        title: "Verify Amount",
        action: "COMPARE" as const,
        config: {
          targetA: "step_1_amount",
          targetB: "step_2_extracted_amount",
          autoEvaluate: true,
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
        action: "AUTHORIZE" as const,
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".jpg", ".png"],
          maxSize: "5MB",
        },
      },
      {
        id: "step-3",
        title: "Validate Amount",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN_OR_EQUAL",
          target: "step_1_amount",
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
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve expense reimbursement.",
        },
      },
      {
        id: "step-5",
        title: "Senior Manager Approval",
        action: "AUTHORIZE" as const,
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png"],
          maxSize: "10MB",
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
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "safety_inspections",
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-4",
        title: "Supervisor Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review maintenance log and approve completion.",
        },
      },
      {
        id: "step-5",
        title: "Schedule Next Maintenance",
        action: "GENERATE" as const,
        config: {
          template: "Next maintenance scheduled for {{nextMaintenanceDate}}",
          outputFormat: "text",
        },
      },
    ] as AtomicStep[],
  },
  // HR Templates
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
          formula: "(selfScore + managerScore) / 2",
          variables: ["selfScore", "managerScore"],
        },
      },
      {
        id: "step-4",
        title: "HR Review",
        action: "AUTHORIZE" as const,
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
          formula: "baseSalary + accruedLeave - deductions",
          variables: ["baseSalary", "accruedLeave", "deductions"],
        },
      },
      {
        id: "step-4",
        title: "HR Manager Approval",
        action: "AUTHORIZE" as const,
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
          rule: "LESS_THAN_OR_EQUAL",
          target: "step_1_cost",
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
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve training request.",
        },
      },
      {
        id: "step-4",
        title: "HR Director Approval",
        action: "AUTHORIZE" as const,
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
        title: "Fetch Attendance Data",
        action: "FETCH" as const,
        config: {
          source: "attendance_system",
          fields: ["employeeId", "daysWorked", "overtimeHours"],
        },
      },
      {
        id: "step-2",
        title: "Calculate Gross Salary",
        action: "CALCULATE" as const,
        config: {
          formula: "(baseSalary / 30) * daysWorked + (overtimeRate * overtimeHours)",
          variables: ["baseSalary", "daysWorked", "overtimeRate", "overtimeHours"],
        },
      },
      {
        id: "step-3",
        title: "Calculate Deductions",
        action: "CALCULATE" as const,
        config: {
          formula: "tax + insurance + otherDeductions",
          variables: ["tax", "insurance", "otherDeductions"],
        },
      },
      {
        id: "step-4",
        title: "Calculate Net Salary",
        action: "CALCULATE" as const,
        config: {
          formula: "grossSalary - deductions",
          variables: ["grossSalary", "deductions"],
        },
      },
      {
        id: "step-5",
        title: "Finance Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review and approve payroll calculations.",
        },
      },
      {
        id: "step-6",
        title: "Generate Payslips",
        action: "GENERATE" as const,
        config: {
          template: "Payslip for {{employeeName}} - Net: {{netSalary}}",
          outputFormat: "document",
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
          formula: "checkOutTime - checkInTime - breakDuration",
          variables: ["checkOutTime", "checkInTime", "breakDuration"],
        },
      },
      {
        id: "step-3",
        title: "Validate Work Hours",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN_OR_EQUAL",
          target: "step_2_output",
          value: 8,
          errorMessage: "Work hours below minimum requirement.",
        },
      },
      {
        id: "step-4",
        title: "Store Attendance Record",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "attendance_records",
        },
      },
    ] as AtomicStep[],
  },
  // Finance Templates
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
          formula: "SUM(Q1 + Q2 + Q3 + Q4)",
          variables: ["Q1", "Q2", "Q3", "Q4"],
        },
      },
      {
        id: "step-3",
        title: "Compare with Previous Year",
        action: "COMPARE" as const,
        config: {
          targetA: "step_2_output",
          targetB: "previousYearBudget",
          autoEvaluate: true,
        },
      },
      {
        id: "step-4",
        title: "Finance Director Approval",
        action: "AUTHORIZE" as const,
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
          targetA: "step_1_amount",
          targetB: "invoiceAmount",
          autoEvaluate: true,
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
        action: "TRANSMIT" as const,
        config: {
          method: "POST",
          endpoint: "payment_gateway",
          data: "step_1_output",
        },
      },
      {
        id: "step-4",
        title: "Record Transaction",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "payments",
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
        action: "GENERATE" as const,
        config: {
          template: "Financial Report for {{month}} - Revenue: {{revenue}}, Expenses: {{expenses}}",
          outputFormat: "document",
        },
      },
      {
        id: "step-2",
        title: "Calculate Net Profit",
        action: "CALCULATE" as const,
        config: {
          formula: "revenue - expenses",
          variables: ["revenue", "expenses"],
        },
      },
      {
        id: "step-3",
        title: "Compare with Budget",
        action: "COMPARE" as const,
        config: {
          targetA: "step_2_output",
          targetB: "budgetedProfit",
          autoEvaluate: true,
        },
      },
      {
        id: "step-4",
        title: "CFO Approval",
        action: "AUTHORIZE" as const,
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-3",
        title: "Validate Tax ID",
        action: "VALIDATE" as const,
        config: {
          rule: "REGEX",
          target: "step_1_taxId",
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
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review vendor information and approve registration.",
        },
      },
      {
        id: "step-5",
        title: "Store Vendor Data",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "vendors",
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
          formula: "SUM(itemTotal)",
          variables: ["itemTotal"],
        },
      },
      {
        id: "step-3",
        title: "Check Budget",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN_OR_EQUAL",
          target: "step_2_output",
          value: "departmentBudget",
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
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve purchase order.",
        },
      },
      {
        id: "step-5",
        title: "Finance Director Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve budget-exceeding purchase order.",
        },
      },
    ] as AtomicStep[],
  },
  // Operations Templates
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png"],
          maxSize: "10MB",
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
        action: "AUTHORIZE" as const,
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
        title: "Fetch Current Stock Levels",
        action: "FETCH" as const,
        config: {
          source: "inventory_system",
          fields: ["itemCode", "currentStock", "minThreshold"],
        },
      },
      {
        id: "step-2",
        title: "Compare Stock Levels",
        action: "COMPARE" as const,
        config: {
          targetA: "step_1_currentStock",
          targetB: "step_1_minThreshold",
          autoEvaluate: true,
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "COMPLETED",
          onFailureStepId: "step-3",
        },
      },
      {
        id: "step-3",
        title: "Calculate Reorder Quantity",
        action: "CALCULATE" as const,
        config: {
          formula: "(maxStock - currentStock) * 1.2",
          variables: ["maxStock", "currentStock"],
        },
      },
      {
        id: "step-4",
        title: "Generate Purchase Request",
        action: "GENERATE" as const,
        config: {
          template: "Purchase Request: {{itemCode}} - Quantity: {{reorderQuantity}}",
          outputFormat: "document",
        },
      },
      {
        id: "step-5",
        title: "Operations Manager Approval",
        action: "AUTHORIZE" as const,
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
          targetA: "step_2_receivedItems",
          targetB: "orderItems",
          autoEvaluate: true,
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
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "inventory",
        },
      },
      {
        id: "step-5",
        title: "Flag Discrepancy",
        action: "AUTHORIZE" as const,
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
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png", ".pdf"],
          maxSize: "10MB",
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
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review incident report and approve investigation.",
        },
      },
      {
        id: "step-5",
        title: "Store Incident Record",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "incidents",
        },
      },
    ] as AtomicStep[],
  },
  // Sales Templates
  {
    id: "lead-qualification",
    category: "Sales",
    title: "Lead Qualification",
    description: "Sales lead scoring and qualification process",
    icon: Target,
    color: "purple",
    steps: [
      {
        id: "step-1",
        title: "Lead Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Company", "Contact Name", "Email", "Phone", "Industry", "Budget"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Calculate Lead Score",
        action: "CALCULATE" as const,
        config: {
          formula: "(budget * 0.4) + (industryMatch * 0.3) + (companySize * 0.3)",
          variables: ["budget", "industryMatch", "companySize"],
        },
      },
      {
        id: "step-3",
        title: "Validate Lead Score",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN_OR_EQUAL",
          target: "step_2_output",
          value: 70,
          errorMessage: "Lead score below qualification threshold.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-4",
        title: "Assign to Sales Rep",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "qualified_leads",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "order-processing",
    category: "Sales",
    title: "Order Processing",
    description: "Customer order fulfillment workflow",
    icon: ShoppingCart,
    color: "purple",
    steps: [
      {
        id: "step-1",
        title: "Order Details",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 20,
            columns: 5,
            headers: ["Product", "Quantity", "Unit Price", "Total", "Notes"],
          },
        },
      },
      {
        id: "step-2",
        title: "Calculate Order Total",
        action: "CALCULATE" as const,
        config: {
          formula: "SUM(itemTotal) + tax + shipping",
          variables: ["itemTotal", "tax", "shipping"],
        },
      },
      {
        id: "step-3",
        title: "Verify Inventory",
        action: "COMPARE" as const,
        config: {
          targetA: "step_1_quantity",
          targetB: "availableStock",
          autoEvaluate: true,
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Process Payment",
        action: "TRANSMIT" as const,
        config: {
          method: "POST",
          endpoint: "payment_processor",
          data: "step_2_output",
        },
      },
      {
        id: "step-5",
        title: "Backorder Notification",
        action: "GENERATE" as const,
        config: {
          template: "Backorder notification for {{productName}} - Expected delivery: {{estimatedDate}}",
          outputFormat: "text",
        },
      },
      {
        id: "step-6",
        title: "Sales Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve order processing.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "contract-review",
    category: "Sales",
    title: "Contract Review",
    description: "Sales contract review and approval process",
    icon: FileText,
    color: "purple",
    steps: [
      {
        id: "step-1",
        title: "Contract Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Client", "Contract Value", "Duration", "Terms"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Contract Document",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".doc", ".docx"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-3",
        title: "Legal Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review contract terms and legal compliance.",
        },
      },
      {
        id: "step-4",
        title: "Sales Director Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve contract for execution.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "customer-onboarding",
    category: "Sales",
    title: "Customer Onboarding",
    description: "New customer account setup and activation",
    icon: UserPlus,
    color: "purple",
    steps: [
      {
        id: "step-1",
        title: "Customer Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Company Name", "Contact Person", "Email", "Phone", "Billing Address"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Credit Check",
        action: "FETCH" as const,
        config: {
          source: "credit_bureau",
          fields: ["creditScore", "paymentHistory"],
        },
      },
      {
        id: "step-3",
        title: "Validate Credit Score",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN_OR_EQUAL",
          target: "step_2_creditScore",
          value: 650,
          errorMessage: "Credit score below minimum requirement.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Create Customer Account",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "customers",
        },
      },
      {
        id: "step-5",
        title: "Require Deposit",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve customer with deposit requirement.",
        },
      },
    ] as AtomicStep[],
  },
  // IT Templates
  {
    id: "access-request",
    category: "IT",
    title: "Access Request",
    description: "Employee system access request and approval",
    icon: Key,
    color: "indigo",
    steps: [
      {
        id: "step-1",
        title: "Access Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["System", "Access Level", "Justification", "Duration"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve access request.",
        },
      },
      {
        id: "step-3",
        title: "IT Security Review",
        action: "VALIDATE" as const,
        config: {
          rule: "contains",
          target: "step_1_justification",
          value: "business",
          errorMessage: "Access request must include business justification.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-4",
        title: "Provision Access",
        action: "TRANSMIT" as const,
        config: {
          method: "POST",
          endpoint: "identity_management",
          data: "step_1_output",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "incident-management",
    category: "IT",
    title: "Incident Management",
    description: "IT incident ticket resolution workflow",
    icon: Bug,
    color: "indigo",
    steps: [
      {
        id: "step-1",
        title: "Incident Report",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Title", "Description", "Severity", "Affected Systems"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Assign Priority",
        action: "GATEWAY" as const,
        config: {},
        routes: {
          defaultNextStepId: "step-3",
          conditions: [
            {
              variable: "step_1_severity",
              operator: "==",
              value: "Critical",
              targetStepId: "step-4",
            },
          ],
        },
      },
      {
        id: "step-3",
        title: "Standard Resolution",
        action: "INSPECT" as const,
        config: {
          instruction: "Investigate and resolve incident.",
        },
      },
      {
        id: "step-4",
        title: "Escalate to Senior Engineer",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Critical incident - immediate attention required.",
        },
      },
      {
        id: "step-5",
        title: "Document Resolution",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "incidents",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "software-license-request",
    category: "IT",
    title: "Software License Request",
    description: "Software license procurement and approval",
    icon: Code,
    color: "indigo",
    steps: [
      {
        id: "step-1",
        title: "License Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Software Name", "Version", "Number of Licenses", "Cost", "Justification"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Check Budget",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN_OR_EQUAL",
          target: "step_1_cost",
          value: "itBudget",
          errorMessage: "License cost exceeds IT budget.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-3",
          onFailureStepId: "step-4",
        },
      },
      {
        id: "step-3",
        title: "IT Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve software license purchase.",
        },
      },
      {
        id: "step-4",
        title: "CIO Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve budget-exceeding license purchase.",
        },
      },
    ] as AtomicStep[],
  },
  // Legal Templates
  {
    id: "legal-contract-review",
    category: "Legal",
    title: "Legal Contract Review",
    description: "Legal document review and approval process",
    icon: Scale,
    color: "amber",
    steps: [
      {
        id: "step-1",
        title: "Contract Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Contract Type", "Parties", "Value", "Term"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Contract",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".doc", ".docx"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-3",
        title: "Legal Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review contract for legal compliance and risk assessment.",
        },
      },
      {
        id: "step-4",
        title: "Executive Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve contract for execution.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "compliance-check",
    category: "Legal",
    title: "Compliance Check",
    description: "Regulatory compliance verification process",
    icon: Shield,
    color: "amber",
    steps: [
      {
        id: "step-1",
        title: "Compliance Requirements",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Regulation", "Scope", "Deadline", "Requirements"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Gather Evidence",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".doc", ".xlsx"],
          maxSize: "20MB",
        },
      },
      {
        id: "step-3",
        title: "Verify Compliance",
        action: "VALIDATE" as const,
        config: {
          rule: "contains",
          target: "step_2_evidence",
          value: "compliance",
          errorMessage: "Insufficient compliance evidence.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Compliance Officer Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve compliance certification.",
        },
      },
      {
        id: "step-5",
        title: "Remediation Required",
        action: "GENERATE" as const,
        config: {
          template: "Compliance remediation plan: {{requirements}}",
          outputFormat: "document",
        },
      },
    ] as AtomicStep[],
  },
  // Marketing Templates
  {
    id: "campaign-approval",
    category: "Marketing",
    title: "Campaign Approval",
    description: "Marketing campaign review and approval workflow",
    icon: Megaphone,
    color: "pink",
    steps: [
      {
        id: "step-1",
        title: "Campaign Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Campaign Name", "Target Audience", "Budget", "Duration", "Channels"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Creative Assets",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png", ".mp4", ".pdf"],
          maxSize: "50MB",
        },
      },
      {
        id: "step-3",
        title: "Calculate ROI Estimate",
        action: "CALCULATE" as const,
        config: {
          formula: "(expectedRevenue - budget) / budget * 100",
          variables: ["expectedRevenue", "budget"],
        },
      },
      {
        id: "step-4",
        title: "Marketing Director Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review campaign proposal and approve launch.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "content-review",
    category: "Marketing",
    title: "Content Review",
    description: "Marketing content review and publication approval",
    icon: Image,
    color: "pink",
    steps: [
      {
        id: "step-1",
        title: "Content Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Title", "Type", "Target Audience", "Key Messages"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Content",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".doc", ".jpg", ".png", ".mp4"],
          maxSize: "100MB",
        },
      },
      {
        id: "step-3",
        title: "Brand Compliance Check",
        action: "VALIDATE" as const,
        config: {
          rule: "contains",
          target: "step_2_content",
          value: "brandGuidelines",
          errorMessage: "Content does not comply with brand guidelines.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-4",
        title: "Content Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve content for publication.",
        },
      },
    ] as AtomicStep[],
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));
  const filteredTemplates = selectedCategory
    ? TEMPLATES.filter((t) => t.category === selectedCategory)
    : TEMPLATES;

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    setLoadingTemplateId(template.id);
    try {
      // Find or create "Uncategorized" process group
      let defaultGroupId: string;
      const defaultGroupQuery = query(
        collection(db, "process_groups"),
        where("organizationId", "==", organizationId),
        where("title", "==", "Uncategorized")
      );
      const defaultGroupSnapshot = await getDocs(defaultGroupQuery);

      if (defaultGroupSnapshot.empty) {
        const groupRef = await addDoc(collection(db, "process_groups"), {
          organizationId,
          title: "Uncategorized",
          description: "Default group for procedures without a specific category",
          icon: "FolderOpen",
          procedureSequence: [],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        defaultGroupId = groupRef.id;
      } else {
        defaultGroupId = defaultGroupSnapshot.docs[0].id;
      }

      // Generate new IDs for steps to avoid conflicts
      const stepIdMap = new Map<string, string>();
      const newSteps = template.steps.map((step) => {
        const newId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        stepIdMap.set(step.id, newId);
        return {
          ...step,
          id: newId,
        };
      });

      // Update route references to use new step IDs
      const updatedSteps = newSteps.map((step) => {
        if (!step.routes) return step;
        
        const updatedRoutes = { ...step.routes };
        
        // Update defaultNextStepId
        if (updatedRoutes.defaultNextStepId && updatedRoutes.defaultNextStepId !== "COMPLETED") {
          const newDefaultId = stepIdMap.get(updatedRoutes.defaultNextStepId);
          if (newDefaultId) {
            updatedRoutes.defaultNextStepId = newDefaultId;
          }
        }
        
        // Update onSuccessStepId
        if (updatedRoutes.onSuccessStepId) {
          const newSuccessId = stepIdMap.get(updatedRoutes.onSuccessStepId);
          if (newSuccessId) {
            updatedRoutes.onSuccessStepId = newSuccessId;
          }
        }
        
        // Update onFailureStepId
        if (updatedRoutes.onFailureStepId) {
          const newFailureId = stepIdMap.get(updatedRoutes.onFailureStepId);
          if (newFailureId) {
            updatedRoutes.onFailureStepId = newFailureId;
          }
        }
        
        // Update conditions
        if (updatedRoutes.conditions) {
          updatedRoutes.conditions = updatedRoutes.conditions.map((condition) => {
            const newTargetId = stepIdMap.get(condition.targetStepId);
            if (newTargetId) {
              return { ...condition, targetStepId: newTargetId };
            }
            return condition;
          });
        }
        
        return { ...step, routes: updatedRoutes };
      });

      // Create procedure from template
      const docRef = await addDoc(collection(db, "procedures"), {
        organizationId,
        processGroupId: defaultGroupId,
        title: template.title,
        description: template.description,
        isPublished: false, // Start as draft so user can edit
        steps: updatedSteps,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Redirect to designer
      router.push(`/studio/procedure/${docRef.id}`);
    } catch (error) {
      console.error("Error creating procedure from template:", error);
      alert("Failed to create procedure from template. Please try again.");
      setLoadingTemplateId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 relative overflow-hidden font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/30">
        <div className="mx-auto max-w-[1800px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                <Link
                  href="/studio"
                  className="flex items-center gap-1 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1800px] px-6 py-12">
        {/* Hero Title */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-3">
            Jumpstart your workflow.
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Start with pre-built workflows. Customize them to fit your needs.
          </p>
        </div>

        {/* Category Filter - iOS Segmented Control Style */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg p-1.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold tracking-tight transition-all ${
                selectedCategory === null
                  ? "bg-white text-slate-800 shadow-md"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold tracking-tight transition-all ${
                  selectedCategory === category
                    ? "bg-white text-slate-800 shadow-md"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => {
            const IconComponent = template.icon;
            const isLoading = loadingTemplateId === template.id;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group relative rounded-[2rem] bg-white shadow-xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl"
              >
                {/* Large Colorful Icon */}
                <div className="mb-6 flex items-center justify-center">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg ${
                      template.color === "blue"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : template.color === "green"
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                        : template.color === "orange"
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : template.color === "purple"
                        ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                        : template.color === "indigo"
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                        : template.color === "amber"
                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                        : "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                    }`}
                  >
                    <IconComponent className="h-10 w-10" strokeWidth={2} />
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mb-4 flex justify-center">
                  <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {template.category}
                  </span>
                </div>

                {/* Template Info */}
                <h3 className="mb-3 text-xl font-extrabold text-slate-800 tracking-tight text-center">{template.title}</h3>
                <p className="mb-6 text-sm text-slate-600 text-center leading-relaxed line-clamp-3">{template.description}</p>

                {/* Steps Count */}
                <div className="mb-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{template.steps.length} steps</span>
                </div>

                {/* Use Template Button */}
                <button
                  onClick={() => handleUseTemplate(template)}
                  disabled={isLoading}
                  className="w-full rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0071E3] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Use Template
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="py-20 text-center">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
              <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                <Sparkles className="h-16 w-16 text-slate-400 mx-auto" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-base font-extrabold text-slate-800 tracking-tight mb-1">No templates found</p>
            <p className="text-sm text-slate-600">Try selecting a different category</p>
          </div>
        )}
      </main>
    </div>
  );
}

