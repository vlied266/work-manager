"use client";

import { useState } from "react";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Procedure, AtomicStep } from "@/types/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Users, DollarSign, Wrench, CheckCircle2, Loader2, FileText, TrendingUp, ShoppingCart, Shield, Code, Scale, Megaphone, ClipboardCheck, Calendar, CreditCard, Building2, Package, Truck, AlertTriangle, UserPlus, GraduationCap, BarChart, Receipt, FileCheck, Key, Bug, BookOpen, Target, Image, Stethoscope, Briefcase, GraduationCap as GraduationCapIcon, UtensilsCrossed, Home, Car, Plane, Heart, Music, Paintbrush, Camera, Gamepad2, Hammer, Zap, Factory, Microscope, Beaker, Globe, Mail, Phone, Printer, Scissors, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { TemplateCustomizerModal } from "@/components/templates/TemplateCustomizerModal";

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
  // Healthcare Templates
  {
    id: "patient-admission",
    category: "Healthcare",
    title: "Patient Admission",
    description: "Hospital patient admission and registration workflow",
    icon: Stethoscope,
    color: "red",
    steps: [
      {
        id: "step-1",
        title: "Patient Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Name", "Date of Birth", "ID Number", "Emergency Contact", "Insurance"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Medical History",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Allergies", "Current Medications", "Previous Conditions"],
          required: true,
        },
      },
      {
        id: "step-3",
        title: "Verify Insurance",
        action: "VALIDATE" as const,
        config: {
          rule: "contains",
          target: "step_1_insurance",
          value: "valid",
          errorMessage: "Insurance verification required.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Assign Room",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "admissions",
        },
      },
      {
        id: "step-5",
        title: "Financial Counselor Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review uninsured patient admission.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "prescription-dispensing",
    category: "Healthcare",
    title: "Prescription Dispensing",
    description: "Pharmacy prescription verification and dispensing process",
    icon: Stethoscope,
    color: "red",
    steps: [
      {
        id: "step-1",
        title: "Prescription Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Patient Name", "Medication", "Dosage", "Quantity", "Doctor Name"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Verify Prescription",
        action: "VALIDATE" as const,
        config: {
          rule: "contains",
          target: "step_1_doctorName",
          value: "licensed",
          errorMessage: "Prescription must be from licensed physician.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-3",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-3",
        title: "Check Drug Interactions",
        action: "COMPARE" as const,
        config: {
          targetA: "step_1_medication",
          targetB: "patientCurrentMedications",
          autoEvaluate: true,
        },
      },
      {
        id: "step-4",
        title: "Pharmacist Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Verify prescription and approve dispensing.",
        },
      },
      {
        id: "step-5",
        title: "Dispense Medication",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "dispensations",
        },
      },
    ] as AtomicStep[],
  },
  // Education Templates
  {
    id: "student-enrollment",
    category: "Education",
    title: "Student Enrollment",
    description: "New student registration and enrollment process",
    icon: GraduationCapIcon,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Student Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Full Name", "Date of Birth", "Parent/Guardian", "Contact", "Address"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Documents",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".jpg", ".png"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-3",
        title: "Academic Records",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 5,
            columns: 4,
            headers: ["Subject", "Grade", "Year", "School"],
          },
        },
      },
      {
        id: "step-4",
        title: "Admissions Officer Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review enrollment application and approve admission.",
        },
      },
      {
        id: "step-5",
        title: "Create Student Record",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "students",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "exam-grading",
    category: "Education",
    title: "Exam Grading",
    description: "Student exam evaluation and grade recording",
    icon: GraduationCapIcon,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Exam Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Course", "Exam Date", "Total Marks", "Student Count"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Answer Sheets",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".jpg", ".png"],
          maxSize: "50MB",
        },
      },
      {
        id: "step-3",
        title: "Grade Entry",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 50,
            columns: 3,
            headers: ["Student ID", "Marks Obtained", "Grade"],
          },
        },
      },
      {
        id: "step-4",
        title: "Calculate Statistics",
        action: "CALCULATE" as const,
        config: {
          formula: "AVERAGE(marks) + STDDEV(marks)",
          variables: ["marks"],
        },
      },
      {
        id: "step-5",
        title: "Department Head Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review grading and approve publication.",
        },
      },
      {
        id: "step-6",
        title: "Publish Grades",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "grades",
        },
      },
    ] as AtomicStep[],
  },
  // Hospitality Templates
  {
    id: "hotel-checkin",
    category: "Hospitality",
    title: "Hotel Check-in",
    description: "Guest check-in and room assignment process",
    icon: Home,
    color: "amber",
    steps: [
      {
        id: "step-1",
        title: "Guest Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Name", "ID/Passport", "Phone", "Email", "Check-in Date", "Check-out Date"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Verify Reservation",
        action: "COMPARE" as const,
        config: {
          targetA: "step_1_name",
          targetB: "reservationName",
          autoEvaluate: true,
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-3",
          onFailureStepId: "step-4",
        },
      },
      {
        id: "step-3",
        title: "Assign Room",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "checkins",
        },
      },
      {
        id: "step-4",
        title: "Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve walk-in guest check-in.",
        },
      },
      {
        id: "step-5",
        title: "Process Payment",
        action: "TRANSMIT" as const,
        config: {
          method: "POST",
          endpoint: "payment_processor",
          data: "step_1_output",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "restaurant-order",
    category: "Hospitality",
    title: "Restaurant Order Processing",
    description: "Food order taking and kitchen workflow",
    icon: UtensilsCrossed,
    color: "amber",
    steps: [
      {
        id: "step-1",
        title: "Order Details",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 20,
            columns: 4,
            headers: ["Item", "Quantity", "Special Instructions", "Price"],
          },
        },
      },
      {
        id: "step-2",
        title: "Calculate Total",
        action: "CALCULATE" as const,
        config: {
          formula: "SUM(itemPrice * quantity) + tax + tip",
          variables: ["itemPrice", "quantity", "tax", "tip"],
        },
      },
      {
        id: "step-3",
        title: "Send to Kitchen",
        action: "TRANSMIT" as const,
        config: {
          method: "POST",
          endpoint: "kitchen_display",
          data: "step_1_output",
        },
      },
      {
        id: "step-4",
        title: "Verify Order Ready",
        action: "INSPECT" as const,
        config: {
          instruction: "Verify all items are prepared correctly before serving.",
        },
      },
      {
        id: "step-5",
        title: "Process Payment",
        action: "TRANSMIT" as const,
        config: {
          method: "POST",
          endpoint: "pos_system",
          data: "step_2_output",
        },
      },
    ] as AtomicStep[],
  },
  // Transportation Templates
  {
    id: "vehicle-maintenance",
    category: "Transportation",
    title: "Vehicle Maintenance",
    description: "Fleet vehicle service and maintenance tracking",
    icon: Car,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Vehicle Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["License Plate", "Make/Model", "Mileage", "Service Type"],
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
            rows: 10,
            columns: 3,
            headers: ["Item", "Status", "Notes"],
          },
        },
      },
      {
        id: "step-3",
        title: "Upload Service Photos",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-4",
        title: "Mechanic Sign-off",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Complete maintenance and approve vehicle for use.",
        },
      },
      {
        id: "step-5",
        title: "Update Service Record",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "vehicle_maintenance",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "flight-booking",
    category: "Transportation",
    title: "Flight Booking",
    description: "Airline ticket reservation and confirmation process",
    icon: Plane,
    color: "blue",
    steps: [
      {
        id: "step-1",
        title: "Passenger Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Name", "Passport Number", "Date of Birth", "Contact"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Flight Selection",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Origin", "Destination", "Departure Date", "Return Date", "Class"],
          required: true,
        },
      },
      {
        id: "step-3",
        title: "Check Seat Availability",
        action: "FETCH" as const,
        config: {
          source: "flight_system",
          fields: ["availableSeats", "pricing"],
        },
      },
      {
        id: "step-4",
        title: "Calculate Total Price",
        action: "CALCULATE" as const,
        config: {
          formula: "basePrice + taxes + fees + seatSelection",
          variables: ["basePrice", "taxes", "fees", "seatSelection"],
        },
      },
      {
        id: "step-5",
        title: "Process Payment",
        action: "TRANSMIT" as const,
        config: {
          method: "POST",
          endpoint: "payment_gateway",
          data: "step_4_output",
        },
      },
      {
        id: "step-6",
        title: "Issue Ticket",
        action: "GENERATE" as const,
        config: {
          template: "Flight Ticket: {{passengerName}} - {{origin}} to {{destination}}",
          outputFormat: "document",
        },
      },
    ] as AtomicStep[],
  },
  // Real Estate Templates
  {
    id: "property-listing",
    category: "Real Estate",
    title: "Property Listing",
    description: "Real estate property listing and approval workflow",
    icon: Home,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Property Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Address", "Property Type", "Size", "Bedrooms", "Bathrooms", "Price"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Property Photos",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png"],
          maxSize: "50MB",
        },
      },
      {
        id: "step-3",
        title: "Property Inspection",
        action: "INSPECT" as const,
        config: {
          instruction: "Verify property condition and document any issues.",
        },
      },
      {
        id: "step-4",
        title: "Validate Pricing",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN",
          target: "step_1_price",
          value: 0,
          errorMessage: "Property price must be greater than zero.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-5",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-5",
        title: "Broker Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve property listing for publication.",
        },
      },
      {
        id: "step-6",
        title: "Publish Listing",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "property_listings",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "rental-application",
    category: "Real Estate",
    title: "Rental Application",
    description: "Tenant rental application review and approval",
    icon: Home,
    color: "green",
    steps: [
      {
        id: "step-1",
        title: "Applicant Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Name", "Email", "Phone", "Current Address", "Employment", "Income"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Documents",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".jpg", ".png"],
          maxSize: "10MB",
        },
      },
      {
        id: "step-3",
        title: "Credit Check",
        action: "FETCH" as const,
        config: {
          source: "credit_bureau",
          fields: ["creditScore", "paymentHistory"],
        },
      },
      {
        id: "step-4",
        title: "Validate Credit Score",
        action: "VALIDATE" as const,
        config: {
          rule: "GREATER_THAN_OR_EQUAL",
          target: "step_3_creditScore",
          value: 600,
          errorMessage: "Credit score below minimum requirement.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-5",
          onFailureStepId: "step-6",
        },
      },
      {
        id: "step-5",
        title: "Landlord Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve rental application.",
        },
      },
      {
        id: "step-6",
        title: "Require Co-signer",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Application requires co-signer due to credit score.",
        },
      },
    ] as AtomicStep[],
  },
  // Construction Templates
  {
    id: "construction-permit",
    category: "Construction",
    title: "Construction Permit",
    description: "Building permit application and approval process",
    icon: Hammer,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Project Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Project Type", "Location", "Estimated Cost", "Contractor", "Timeline"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Plans",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".dwg", ".jpg"],
          maxSize: "50MB",
        },
      },
      {
        id: "step-3",
        title: "Building Code Compliance",
        action: "VALIDATE" as const,
        config: {
          rule: "contains",
          target: "step_2_plans",
          value: "codeCompliant",
          errorMessage: "Plans must comply with building codes.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-4",
        title: "Building Inspector Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review plans and approve permit issuance.",
        },
      },
      {
        id: "step-5",
        title: "Issue Permit",
        action: "GENERATE" as const,
        config: {
          template: "Building Permit #{{permitNumber}} - {{projectType}} at {{location}}",
          outputFormat: "document",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "site-inspection",
    category: "Construction",
    title: "Site Inspection",
    description: "Construction site safety and progress inspection",
    icon: Hammer,
    color: "orange",
    steps: [
      {
        id: "step-1",
        title: "Inspection Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Site Location", "Inspection Type", "Date", "Inspector Name"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Safety Checklist",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 15,
            columns: 3,
            headers: ["Item", "Status", "Notes"],
          },
        },
      },
      {
        id: "step-3",
        title: "Upload Inspection Photos",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png"],
          maxSize: "20MB",
        },
      },
      {
        id: "step-4",
        title: "Progress Assessment",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Completion Percentage", "Issues Found", "Recommendations"],
          required: true,
        },
      },
      {
        id: "step-5",
        title: "Site Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review inspection report and approve continuation.",
        },
      },
    ] as AtomicStep[],
  },
  // Manufacturing Templates
  {
    id: "production-order",
    category: "Manufacturing",
    title: "Production Order",
    description: "Manufacturing production order creation and execution",
    icon: Factory,
    color: "slate",
    steps: [
      {
        id: "step-1",
        title: "Order Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Product Code", "Quantity", "Due Date", "Priority"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Check Raw Materials",
        action: "FETCH" as const,
        config: {
          source: "inventory_system",
          fields: ["materialAvailability", "stockLevels"],
        },
      },
      {
        id: "step-3",
        title: "Validate Material Availability",
        action: "COMPARE" as const,
        config: {
          targetA: "step_1_quantity",
          targetB: "step_2_materialAvailability",
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
        title: "Schedule Production",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "production_orders",
        },
      },
      {
        id: "step-5",
        title: "Purchase Materials",
        action: "GENERATE" as const,
        config: {
          template: "Purchase order for materials: {{materialList}}",
          outputFormat: "document",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "quality-assurance",
    category: "Manufacturing",
    title: "Quality Assurance",
    description: "Product quality testing and certification",
    icon: Microscope,
    color: "slate",
    steps: [
      {
        id: "step-1",
        title: "Product Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Batch Number", "Product Code", "Production Date", "Quantity"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Quality Tests",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 10,
            columns: 4,
            headers: ["Test", "Standard", "Result", "Status"],
          },
        },
      },
      {
        id: "step-3",
        title: "Compare with Standards",
        action: "COMPARE" as const,
        config: {
          targetA: "step_2_result",
          targetB: "step_2_standard",
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
        title: "QA Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve product for release.",
        },
      },
      {
        id: "step-5",
        title: "Flag for Rework",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Product fails quality standards - requires rework.",
        },
      },
    ] as AtomicStep[],
  },
  // Energy Templates
  {
    id: "energy-audit",
    category: "Energy",
    title: "Energy Audit",
    description: "Building energy consumption audit and recommendations",
    icon: Zap,
    color: "yellow",
    steps: [
      {
        id: "step-1",
        title: "Building Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Address", "Building Type", "Size", "Age", "Occupancy"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Energy Consumption Data",
        action: "FETCH" as const,
        config: {
          source: "utility_system",
          fields: ["monthlyUsage", "cost", "peakDemand"],
        },
      },
      {
        id: "step-3",
        title: "Calculate Efficiency",
        action: "CALCULATE" as const,
        config: {
          formula: "usage / size / occupancy",
          variables: ["usage", "size", "occupancy"],
        },
      },
      {
        id: "step-4",
        title: "Identify Improvements",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Recommendations", "Estimated Savings", "Implementation Cost"],
          required: true,
        },
      },
      {
        id: "step-5",
        title: "Energy Consultant Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review audit report and approve recommendations.",
        },
      },
    ] as AtomicStep[],
  },
  // Research Templates
  {
    id: "research-proposal",
    category: "Research",
    title: "Research Proposal",
    description: "Research project proposal submission and review",
    icon: Beaker,
    color: "purple",
    steps: [
      {
        id: "step-1",
        title: "Proposal Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Title", "Principal Investigator", "Duration", "Budget", "Objectives"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Proposal Document",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".pdf", ".doc", ".docx"],
          maxSize: "20MB",
        },
      },
      {
        id: "step-3",
        title: "Validate Budget",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN_OR_EQUAL",
          target: "step_1_budget",
          value: "researchBudget",
          errorMessage: "Proposal budget exceeds available funds.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Research Committee Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review proposal and approve funding.",
        },
      },
      {
        id: "step-5",
        title: "Require Budget Revision",
        action: "GENERATE" as const,
        config: {
          template: "Budget revision required for proposal: {{title}}",
          outputFormat: "document",
        },
      },
    ] as AtomicStep[],
  },
  // Creative Industry Templates
  {
    id: "design-approval",
    category: "Creative",
    title: "Design Approval",
    description: "Creative design review and client approval workflow",
    icon: Paintbrush,
    color: "pink",
    steps: [
      {
        id: "step-1",
        title: "Design Brief",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Project Name", "Client", "Requirements", "Deadline", "Budget"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Upload Design Files",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".png", ".psd", ".ai", ".pdf"],
          maxSize: "100MB",
        },
      },
      {
        id: "step-3",
        title: "Brand Compliance Check",
        action: "VALIDATE" as const,
        config: {
          rule: "contains",
          target: "step_2_design",
          value: "brandGuidelines",
          errorMessage: "Design must comply with brand guidelines.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "COMPLETED",
        },
      },
      {
        id: "step-4",
        title: "Creative Director Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review design and approve for client presentation.",
        },
      },
      {
        id: "step-5",
        title: "Client Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Client review and approval of final design.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "photo-shoot",
    category: "Creative",
    title: "Photo Shoot",
    description: "Photography project planning and execution",
    icon: Camera,
    color: "pink",
    steps: [
      {
        id: "step-1",
        title: "Shoot Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Client", "Location", "Date", "Time", "Photographer", "Equipment Needed"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Shot List",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 20,
            columns: 4,
            headers: ["Shot", "Description", "Priority", "Notes"],
          },
        },
      },
      {
        id: "step-3",
        title: "Equipment Check",
        action: "INSPECT" as const,
        config: {
          instruction: "Verify all equipment is available and functional.",
        },
      },
      {
        id: "step-4",
        title: "Execute Shoot",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "photo_shoots",
        },
      },
      {
        id: "step-5",
        title: "Upload Photos",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".jpg", ".raw", ".png"],
          maxSize: "500MB",
        },
      },
      {
        id: "step-6",
        title: "Client Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review photos and approve for editing.",
        },
      },
    ] as AtomicStep[],
  },
  // Entertainment Templates
  {
    id: "event-planning",
    category: "Entertainment",
    title: "Event Planning",
    description: "Event organization and execution workflow",
    icon: Music,
    color: "purple",
    steps: [
      {
        id: "step-1",
        title: "Event Details",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Event Name", "Type", "Date", "Location", "Expected Attendees", "Budget"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Vendor Coordination",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 10,
            columns: 4,
            headers: ["Vendor", "Service", "Cost", "Status"],
          },
        },
      },
      {
        id: "step-3",
        title: "Calculate Total Cost",
        action: "CALCULATE" as const,
        config: {
          formula: "SUM(vendorCost) + venue + catering + entertainment",
          variables: ["vendorCost", "venue", "catering", "entertainment"],
        },
      },
      {
        id: "step-4",
        title: "Compare with Budget",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN_OR_EQUAL",
          target: "step_3_output",
          value: "step_1_budget",
          errorMessage: "Event cost exceeds budget.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-5",
          onFailureStepId: "step-6",
        },
      },
      {
        id: "step-5",
        title: "Event Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve event plan and proceed with execution.",
        },
      },
      {
        id: "step-6",
        title: "Budget Revision Required",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review budget overrun and approve additional funding.",
        },
      },
    ] as AtomicStep[],
  },
  {
    id: "content-production",
    category: "Entertainment",
    title: "Content Production",
    description: "Video/audio content creation and publishing workflow",
    icon: Camera,
    color: "purple",
    steps: [
      {
        id: "step-1",
        title: "Content Brief",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Title", "Format", "Duration", "Target Audience", "Key Messages"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Script Review",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review and approve script before production.",
        },
      },
      {
        id: "step-3",
        title: "Production",
        action: "STORE" as const,
        config: {
          storageType: "database",
          collection: "productions",
        },
      },
      {
        id: "step-4",
        title: "Upload Raw Footage",
        action: "FETCH" as const,
        config: {
          allowedTypes: [".mp4", ".mov", ".avi"],
          maxSize: "1GB",
        },
      },
      {
        id: "step-5",
        title: "Post-Production",
        action: "GENERATE" as const,
        config: {
          template: "Post-production tasks for: {{title}}",
          outputFormat: "text",
        },
      },
      {
        id: "step-6",
        title: "Final Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Review final cut and approve for publication.",
        },
      },
    ] as AtomicStep[],
  },
  // Gaming Templates
  {
    id: "game-release",
    category: "Gaming",
    title: "Game Release",
    description: "Video game release and quality assurance process",
    icon: Gamepad2,
    color: "indigo",
    steps: [
      {
        id: "step-1",
        title: "Game Information",
        action: "INPUT" as const,
        config: {
          inputType: "text",
          fields: ["Title", "Platform", "Genre", "Release Date", "Target Audience"],
          required: true,
        },
      },
      {
        id: "step-2",
        title: "QA Testing",
        action: "INPUT" as const,
        config: {
          inputType: "table",
          tableConfig: {
            rows: 20,
            columns: 4,
            headers: ["Test Case", "Status", "Bug Count", "Severity"],
          },
        },
      },
      {
        id: "step-3",
        title: "Validate Bug Count",
        action: "VALIDATE" as const,
        config: {
          rule: "LESS_THAN_OR_EQUAL",
          target: "step_2_bugCount",
          value: 10,
          errorMessage: "Too many bugs - release blocked.",
        },
        routes: {
          defaultNextStepId: "COMPLETED",
          onSuccessStepId: "step-4",
          onFailureStepId: "step-5",
        },
      },
      {
        id: "step-4",
        title: "Production Manager Approval",
        action: "AUTHORIZE" as const,
        config: {
          requireSignature: true,
          instruction: "Approve game for release.",
        },
      },
      {
        id: "step-5",
        title: "Bug Fix Required",
        action: "GENERATE" as const,
        config: {
          template: "Bug fix required before release: {{bugList}}",
          outputFormat: "document",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [customizingTemplate, setCustomizingTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));
  
  // Group templates by category
  const templatesByCategory = categories.reduce((acc, category) => {
    acc[category] = TEMPLATES.filter((t) => t.category === category);
    return acc;
  }, {} as Record<string, typeof TEMPLATES>);

  // Filter templates based on search and category
  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter categories based on search
  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true;
    const categoryTemplates = templatesByCategory[category];
    return categoryTemplates.some((t) => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleUseTemplate = (template: typeof TEMPLATES[0]) => {
    // Open the customization modal instead of directly creating
    setCustomizingTemplate(template);
  };

  const handleConfirmCustomization = async (finalSteps: AtomicStep[]) => {
    if (!customizingTemplate) return;

    setLoadingTemplateId(customizingTemplate.id);
    setCustomizingTemplate(null); // Close modal

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
      const newSteps = finalSteps.map((step) => {
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
        title: customizingTemplate.title,
        description: customizingTemplate.description,
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
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-3">
            Template Gallery
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Browse workflows by business type. Start with pre-built templates and customize them.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates by name, description, or business type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-xl text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Business Categories Grid - Show when no category selected or search is active */}
        {(!selectedCategory || searchQuery) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Browse by Business Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCategories.map((category) => {
                const categoryTemplates = templatesByCategory[category];
                const categoryCount = categoryTemplates.length;
                const firstTemplate = categoryTemplates[0];
                const IconComponent = firstTemplate?.icon || Building2;
                
                // Get color for category
                const getCategoryColor = (cat: string) => {
                  const colorMap: Record<string, string> = {
                    "HR": "blue",
                    "Finance": "green",
                    "Operations": "orange",
                    "Sales": "purple",
                    "IT": "indigo",
                    "Legal": "amber",
                    "Marketing": "pink",
                    "Healthcare": "red",
                    "Education": "blue",
                    "Hospitality": "amber",
                    "Transportation": "blue",
                    "Real Estate": "green",
                    "Construction": "orange",
                    "Manufacturing": "slate",
                    "Energy": "yellow",
                    "Research": "purple",
                    "Creative": "pink",
                    "Entertainment": "purple",
                    "Gaming": "indigo",
                  };
                  return colorMap[cat] || "blue";
                };
                
                // Get gradient classes for category color
                const getCategoryGradient = (color: string) => {
                  const gradients: Record<string, string> = {
                    "blue": "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
                    "green": "bg-gradient-to-br from-green-500 to-green-600 text-white",
                    "orange": "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
                    "purple": "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
                    "indigo": "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white",
                    "amber": "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
                    "pink": "bg-gradient-to-br from-pink-500 to-pink-600 text-white",
                    "red": "bg-gradient-to-br from-red-500 to-red-600 text-white",
                    "yellow": "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
                    "slate": "bg-gradient-to-br from-slate-500 to-slate-600 text-white",
                  };
                  return gradients[color] || gradients["blue"];
                };
                
                const categoryColor = getCategoryColor(category);
                
                return (
                  <motion.button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSearchQuery(""); // Clear search when selecting category
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200 p-6 text-left transition-all hover:border-blue-400 hover:shadow-xl"
                  >
                    {/* Category Icon */}
                    <div className="mb-4 flex items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110 ${getCategoryGradient(categoryColor)}`}
                      >
                        <IconComponent className="h-8 w-8" strokeWidth={2} />
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">
                      {category}
                    </h3>
                    
                    {/* Template Count */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      <FileText className="h-4 w-4" />
                      <span className="font-semibold">{categoryCount} {categoryCount === 1 ? 'template' : 'templates'}</span>
                    </div>
                    
                    {/* Hover Arrow */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-5 w-5 text-blue-500" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Category Header */}
        {selectedCategory && !searchQuery && (
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Categories</span>
              </button>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  {selectedCategory} Templates
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {templatesByCategory[selectedCategory]?.length || 0} templates available
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Search Results
            </h2>
            <p className="text-sm text-slate-600">
              Found {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} matching "{searchQuery}"
            </p>
          </div>
        )}


        {/* Templates Grid - Only show when category is selected or search is active */}
        {(selectedCategory || searchQuery) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                          : template.color === "red"
                          ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                          : template.color === "yellow"
                          ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
                          : template.color === "slate"
                          ? "bg-gradient-to-br from-slate-500 to-slate-600 text-white"
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
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (selectedCategory || searchQuery) && (
          <div className="py-20 text-center">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
              <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                <Search className="h-16 w-16 text-slate-400 mx-auto" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-base font-extrabold text-slate-800 tracking-tight mb-1">No templates found</p>
            <p className="text-sm text-slate-600">
              {searchQuery 
                ? `No templates match "${searchQuery}". Try a different search term.`
                : "Try selecting a different category or clearing your search."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>

      {/* Template Customizer Modal */}
      {customizingTemplate && (
        <TemplateCustomizerModal
          template={customizingTemplate}
          onClose={() => setCustomizingTemplate(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}
    </div>
  );
}

