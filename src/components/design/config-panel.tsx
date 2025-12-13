"use client";

import { useEffect, useState, useRef } from "react";
import { AtomicStep, AtomicAction, ATOMIC_ACTION_METADATA, Team, UserProfile, Procedure } from "@/types/schema";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { Users, User, ShieldCheck, Upload, CheckCircle2, Calculator, Sparkles, AlertTriangle, Info, HelpCircle, Zap, Plus, X, Phone, Mail, Package, Truck, FileText, Archive, Wrench, ClipboardList, Lightbulb } from "lucide-react";
import { MagicInput } from "@/components/studio/magic-input";
import { GoogleSheetConfig } from "@/components/studio/GoogleSheetConfig";
import { useOrgId, useOrgQuery } from "@/hooks/useOrgData";
import { isHumanStep } from "@/lib/constants";
import { KeyValueBuilder } from "./key-value-builder";
import { VariableInput } from "@/components/studio/variable-input";
import { CreatableSelect } from "./creatable-select";

// Usage Hints for all Action Types
const ACTION_USAGE_HINTS: Record<string, string> = {
  INPUT: "Use this to collect new data from a user (Forms). If you need a manager to approve existing data, use an Approval Step.",
  APPROVAL: "Use this when a human needs to make a decision (Approve/Reject). For simple data entry, use an Input Step.",
  MANUAL_TASK: "Use this for offline/physical actions (e.g., Call client, Ship package). No data is collected here except confirmation.",
  NEGOTIATE: "Use this for back-and-forth discussions to reach an agreement. For simple approvals, use Approval Step.",
  INSPECT: "Use this for quality checks or physical inspections where a checklist or photo evidence is required.",
  AI_PARSE: "Use this to extract text/data from files (PDF, Images) automatically. To just upload without reading, use Input Step.",
  DB_INSERT: "Use this to permanently save workflow data into your database. Essential for keeping records.",
  HTTP_REQUEST: "Use this to connect to external APIs (Zapier, Slack). For internal DB saving, use Save to DB.",
  SEND_EMAIL: "Sends an automated email. You can use dynamic variables (e.g., {{step.email}}) in the body.",
  GOOGLE_SHEET: "Adds a new row to a Google Sheet. Useful for external logging or reporting.",
  DOC_GENERATE: "Creates a PDF/Word document from a template (e.g., Contracts, Invoices).",
  CALCULATE: "Performs math formulas. For logic checks, use Validate or Compare.",
  GATEWAY: "Splits flow into multiple paths based on conditions (If/Else). For simple Pass/Fail, use Validate.",
  VALIDATE: "Checks if data meets a rule (e.g. Age > 18). Routes to 'Pass' or 'Fail' paths.",
  COMPARE: "Compares two values (e.g. Invoice vs PO). Routes to 'Match' or 'Mismatch' paths.",
};

// Helper function to get available variables
function getAvailableVariables(allSteps: AtomicStep[], currentStepId: string) {
  const currentStepIndex = allSteps.findIndex((s) => s.id === currentStepId);
  const previousSteps = allSteps.slice(0, currentStepIndex);
  
  return previousSteps.map((s, idx) => ({
    id: s.id,
    label: `Step ${idx + 1}: ${s.title}`,
    type: s.action,
    variableName: s.config.outputVariableName || `step_${idx + 1}_output`,
  }));
}

// Helper function to generate routing options with termination options
function getRoutingOptions(
  allSteps: AtomicStep[],
  currentStepId: string,
  includeDefault: boolean = true
): Array<{ value: string; label: string }> {
  const currentStepIndex = allSteps.findIndex((s) => s.id === currentStepId);
  const otherSteps = allSteps.filter((s) => s.id !== currentStepId);
  
  const options: Array<{ value: string; label: string }> = [];
  
  if (includeDefault) {
    options.push({ value: "", label: "Next Step (Default)" });
  }
  
  // Add termination options
  options.push(
    { value: "__END_SUCCESS__", label: "🏁 Complete Process (Success)" },
    { value: "__END_FAILURE__", label: "⛔ Terminate Process (Failure/Cancel)" }
  );
  
  // Add other steps
  otherSteps.forEach((s) => {
    const stepNum = allSteps.findIndex(st => st.id === s.id) + 1;
    options.push({
      value: s.id,
      label: `Step ${stepNum}: ${s.title || "Untitled Step"}`,
    });
  });
  
  // Legacy: Also include COMPLETED for backward compatibility
  options.push({ value: "COMPLETED", label: "Complete Process (Legacy)" });
  
  return options;
}

// Render Basic tab content (critical fields)
function renderActionConfigBasic(
  step: AtomicStep,
  availableVariablesLegacy: { value: string; label: string }[],
  onUpdate: (updates: Partial<AtomicStep>) => void,
  allSteps: AtomicStep[],
  collections: Array<{ id: string; name: string }> = [],
  procedureTrigger?: { type: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK"; config?: any } | undefined
) {
  const { action, config } = step;
  const availableVariables = getAvailableVariables(allSteps, step.id);

  switch (action) {
    case "INPUT":
    return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Field Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.fieldLabel || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, fieldLabel: e.target.value } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="e.g., What is your name?"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              The question the user will see (e.g., "What is your name?").
          </p>
        </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Input Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={config.inputType || "text"}
              onChange={(e) =>
                onUpdate({ config: { ...config, inputType: e.target.value as any } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Dropdown (Select)</option>
              <option value="checkbox">Checkbox</option>
              <option value="multiline">Long Text (Paragraph)</option>
              <option value="file">File Upload</option>
            </select>
          </div>

          {/* Conditional: Show options only for select/checkbox - List Builder UI */}
          {(config.inputType === "select" || config.inputType === "checkbox") && (
            <OptionsListBuilder
              options={config.options || []}
              onChange={(options) => onUpdate({ config: { ...config, options } })}
            />
          )}

          {/* Conditional: Show file restrictions only for file - Multi-Select Checkbox Group */}
          {config.inputType === "file" && (
            <FileRestrictionsBuilder
              allowedExtensions={config.allowedExtensions || []}
              onChange={(extensions) => onUpdate({ config: { ...config, allowedExtensions: extensions.length > 0 ? extensions : undefined } })}
            />
          )}
        </div>
      );

    case "DB_INSERT":
      const collectionOptions = collections.map((col) => ({
        value: col.name,
        label: col.name,
      }));
      
      // Add common collection suggestions if collections list is empty
      const commonCollections = [
        { value: "invoices", label: "invoices" },
        { value: "requests", label: "requests" },
        { value: "users", label: "users" },
        { value: "orders", label: "orders" },
        { value: "employees", label: "employees" },
        { value: "deals", label: "deals" },
      ];
      
      const allCollectionOptions = collectionOptions.length > 0 
        ? collectionOptions 
        : commonCollections;
      
      return (
        <div className="space-y-4">
            <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Collection Name <span className="text-rose-500">*</span>
              </label>
            <CreatableSelect
              value={config.collectionName || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, collectionName: value || undefined } })
              }
              options={allCollectionOptions}
              placeholder="Select an existing collection or type a new name..."
              helperText="Select an existing collection or type a new name to create one."
              />
            </div>

          {/* Show KeyValueBuilder only after collection is selected */}
          {config.collectionName && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Data Mapping <span className="text-rose-500">*</span>
              </label>
              <KeyValueBuilder
                value={config.data}
                onChange={(value) => onUpdate({ config: { ...config, data: value } })}
                keyPlaceholder="Field name (e.g., amount)"
                valuePlaceholder="Value (e.g., {{step_1.amount}})"
                availableVariables={availableVariables.map(v => ({
                  variableName: v.variableName,
                  label: v.label,
                }))}
                allSteps={allSteps}
                currentStepId={step.id}
                procedureTrigger={procedureTrigger}
              />
            </div>
          )}
          </div>
      );

    case "AI_PARSE":
      // Check if this is the first step and if there's an automated trigger
      const isFirstStep = allSteps.findIndex((s) => s.id === step.id) === 0;
      const hasAutomatedTrigger = procedureTrigger && (procedureTrigger.type === "ON_FILE_CREATED" || procedureTrigger.type === "WEBHOOK");
      
      // Build source options: Always include TRIGGER_EVENT if it's the first step and has automated trigger
      const sourceOptions: Array<{ label: string; value: string }> = [];
      
      if (isFirstStep && hasAutomatedTrigger) {
        sourceOptions.push({ label: "⚡️ Start Trigger (Automated File)", value: "TRIGGER_EVENT" });
      }
      
      // Add previous steps that can provide files
      const currentStepIndex = allSteps.findIndex((s) => s.id === step.id);
      const previousSteps = allSteps
        .filter((s) => {
          const stepIndex = allSteps.findIndex((st) => st.id === s.id);
          if (stepIndex >= currentStepIndex) return false;
          
          // INPUT step with file/image/document type
          if (s.action === "INPUT" && (s.config.inputType === "file" || s.config.inputType === "image" || s.config.inputType === "document")) {
            return true;
          }
          
          // DOC_GENERATE step (outputs a file/PDF)
          if (s.action === "DOC_GENERATE") {
            return true;
          }
          
          return false;
        })
        .map((s) => {
          const stepIndex = allSteps.findIndex((st) => st.id === s.id) + 1;
          return { 
            label: `Step ${stepIndex}: ${s.title || "Untitled Step"}`, 
            value: s.id 
          };
        });
      
      sourceOptions.push(...previousSteps);
      
      return (
        <div className="space-y-4">
              <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              File Source Step <span className="text-rose-500">*</span>
                </label>
                <select
              value={config.fileSourceStepId || ""}
                  onChange={(e) =>
                onUpdate({ config: { ...config, fileSourceStepId: e.target.value || undefined } })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
              <option value="">Select a source...</option>
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                    </option>
                  ))}
                </select>
            <p className="mt-1 text-xs text-slate-500">
              Select the step that provides the file to parse (e.g., a File Upload Input, Document Generator, or Trigger Event).
            </p>
              </div>
        </div>
      );

    case "HTTP_REQUEST":
      return (
        <div className="space-y-4">
              <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              URL <span className="text-rose-500">*</span>
            </label>
            <VariableInput
              type="input"
              value={config.url || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, url: value || undefined } })
              }
              placeholder="https://api.example.com/endpoint or {{step_1.output.api_url}}"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Method <span className="text-rose-500">*</span>
                </label>
                <select
              value={config.method || "GET"}
                  onChange={(e) =>
                onUpdate({ config: { ...config, method: e.target.value as any } })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
                </select>
              </div>
                </div>
      );

    case "SEND_EMAIL":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              To (Recipient) <span className="text-rose-500">*</span>
            </label>
            <VariableInput
              type="input"
              value={config.to || config.recipient || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, to: value || undefined, recipient: value || undefined } })
              }
              placeholder="email@example.com or {{step_1.output.email}}"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
        </div>

                  <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Subject <span className="text-rose-500">*</span>
            </label>
            <VariableInput
              type="input"
              value={config.subject || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, subject: value || undefined } })
              }
              placeholder="Email subject or {{step_1.output.title}}"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
              </div>
            </div>
      );

    case "GOOGLE_SHEET":
      // Helper function to extract Google Sheet ID from URL
      const extractSheetId = (input: string): string => {
        // If it's a variable reference, return as-is
        if (input.includes("{{") && input.includes("}}")) {
          return input;
        }
        
        // Try to extract ID from Google Sheets URL
        const urlPattern = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
        const match = input.match(urlPattern);
        if (match && match[1]) {
          return match[1];
        }
        
        // If it looks like just an ID (alphanumeric with dashes/underscores), return as-is
        if (/^[a-zA-Z0-9-_]+$/.test(input)) {
          return input;
        }
        
        // Otherwise return the input (might be invalid, but let user handle it)
        return input;
      };
      
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Spreadsheet ID <span className="text-rose-500">*</span>
            </label>
            <MagicInput
              value={config.spreadsheetId || ""}
              onChange={(value) => {
                const extractedId = extractSheetId(value);
                onUpdate({ config: { ...config, spreadsheetId: extractedId || undefined } });
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value && !value.includes("{{")) {
                  const extractedId = extractSheetId(value);
                  if (extractedId !== value) {
                    onUpdate({ config: { ...config, spreadsheetId: extractedId || undefined } });
                  }
                }
              }}
              placeholder="Spreadsheet ID or full URL or {{step_1.sheetId}}"
              availableVariables={availableVariables}
            />
            <p className="mt-1 text-xs text-slate-500">
              Paste the full Google Sheet URL or just the ID. The ID will be extracted automatically.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Sheet Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.sheetName || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, sheetName: e.target.value || undefined } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="e.g., Sheet1, Data"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Operation <span className="text-rose-500">*</span>
            </label>
            <select
              value={config.operation || "APPEND_ROW"}
              onChange={(e) =>
                onUpdate({ config: { ...config, operation: e.target.value as any } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="APPEND_ROW">Append Row</option>
              <option value="UPDATE_ROW">Update Row</option>
            </select>
          </div>
        </div>
      );

    case "DOC_GENERATE":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Template ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.templateId || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, templateId: e.target.value || undefined } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Template ID"
            />
          </div>

            <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Output Format
              </label>
            <select
              value={config.outputFormat || "pdf"}
                onChange={(e) =>
                onUpdate({ config: { ...config, outputFormat: e.target.value as any } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
            </select>
          </div>
        </div>
      );

    case "APPROVAL":
      const approvalRoutes = step.routes || {};
      const approvalOtherSteps = allSteps.filter((s) => s.id !== step.id);
      
      return (
        <div className="space-y-6">
          <div className="space-y-4">
                <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Instruction <span className="text-rose-500">*</span>
                  </label>
              <textarea
                value={config.instruction || ""}
                    onChange={(e) =>
                  onUpdate({ config: { ...config, instruction: e.target.value } })
                }
                rows={6}
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                placeholder="Enter detailed instructions for the approver..."
                  />
                </div>
          </div>

          {/* Routing Section */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Flow Logic</h3>
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  On Approve (Success) → Go To
                  </label>
                <select
                  value={approvalRoutes.onSuccessStepId || ""}
                  onChange={(e) =>
                      onUpdate({
                      routes: { ...approvalRoutes, onSuccessStepId: e.target.value || undefined },
                    })
                  }
                    className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Next Step (Default)</option>
                  <option value="COMPLETED">Complete Process</option>
                  {approvalOtherSteps.map((s) => {
                    const stepNum = allSteps.findIndex(st => st.id === s.id) + 1;
                    return (
                      <option key={s.id} value={s.id}>
                        Step {stepNum}: {s.title || "Untitled Step"}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  On Reject (Failure) → Go To
                </label>
                <select
                  value={approvalRoutes.onFailureStepId || ""}
                  onChange={(e) =>
                    onUpdate({
                      routes: { ...approvalRoutes, onFailureStepId: e.target.value || undefined },
                    })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {getRoutingOptions(allSteps, step.id, true).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Route to a step that handles rejection (e.g., request revision or notify requester)
                </p>
              </div>
            </div>
                </div>
                </div>
      );
              
    case "NEGOTIATE":
      return (
        <div className="space-y-4">
          {/* Helper Text */}
          <div className="rounded-lg bg-amber-50/80 border border-amber-200/50 p-3">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              💡 <strong>Note:</strong> Use this for back-and-forth discussions to reach an agreement (Deal/Contract). For simple execution tasks, use <strong>Manual Task</strong>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Instruction <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={config.instruction || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, instruction: e.target.value } })
              }
              rows={6}
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              placeholder="Specify the negotiation topic and parties involved.&#10;Example:&#10;- Call the vendor to negotiate a 10% discount.&#10;- Finalize the contract terms with the client."
            />
          </div>
        </div>
      );

    case "INSPECT":
      return (
        <div className="space-y-4">
          {/* Helper Text */}
          <div className="rounded-lg bg-amber-50/80 border border-amber-200/50 p-3">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              💡 <strong>Note:</strong> Use this for quality checks or physical inspections where a checklist or photo evidence is required. For simple execution tasks, use <strong>Manual Task</strong>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Instruction <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={config.instruction || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, instruction: e.target.value } })
              }
              rows={6}
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              placeholder="List inspection criteria and acceptance standards.&#10;Example:&#10;- Check for physical damage.&#10;- Take photos of the 4 corners.&#10;- Verify temperature is below 50°C."
            />
          </div>
        </div>
      );

    case "MANUAL_TASK":
      return (
        <div className="space-y-4">
          {/* Task Category Dropdown */}
              <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Task Category
                </label>
                <select
              value={config.taskSubType || "generic"}
                  onChange={(e) =>
                onUpdate({ config: { ...config, taskSubType: e.target.value as any } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="generic">📋 Generic Task</option>
              <option value="contact">📞 Contact / Call (Phone, Email, Outreach)</option>
              <option value="logistics">📦 Logistics / Physical (Shipping, Moving, Delivering)</option>
              <option value="admin">🗄️ Admin / Archive (Scanning, Filing, Printing)</option>
              <option value="maintenance">🔧 Maintenance (Repair, Install, Inspect)</option>
                </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Categorize the task to help operators understand the type of work required.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Task Title <span className="text-rose-500">*</span>
            </label>
                    <input
                      type="text"
              value={config.title || step.title || ""}
              onChange={(e) => {
                const title = e.target.value;
                        onUpdate({
                  title: title,
                  config: { ...config, title: title || undefined } 
                });
              }}
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="e.g., Call the client, Inspect the machine"
                    />
                  </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={config.instruction || config.instructions || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, instruction: e.target.value, instructions: e.target.value } })
              }
              rows={10}
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              placeholder="Describe the physical/offline action required.&#10;Examples:&#10;- Call the client to confirm the meeting.&#10;- Ship the package to the address.&#10;- Scan and archive the physical contract."
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Supports Markdown formatting (headers, lists, links). This will be displayed to the operator when they complete the task.
            </p>
            {/* Usage Warning */}
            <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-slate-700">
                <span className="font-semibold">💡 Note:</span> This step is for <strong>offline execution</strong>. If you need the user to enter data, use an <strong>Input Step</strong>. If you need a manager's decision, use an <strong>Approval Step</strong>.
              </p>
            </div>
          </div>
        </div>
      );

    case "CALCULATE":
      return (
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Formula <span className="text-rose-500">*</span>
            </label>
            <VariableInput
              type="input"
              value={config.formula || ""}
                    onChange={(value) =>
                onUpdate({ config: { ...config, formula: value || undefined } })
              }
              placeholder="e.g., {{step_1.output.amount}} * 1.1"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
              className="font-mono"
            />
            <p className="mt-1 text-xs text-slate-500">
              Mathematical formula using variables. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
                </div>
        </div>
      );

    case "GATEWAY":
      // Get available steps for dropdowns (exclude current step)
      const availableSteps = allSteps.filter(s => s.id !== step.id);
      
      return (
        <div className="space-y-6">
          {/* Default Route */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Default Route <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-slate-600 mb-3">
              If no conditions match, go to this step:
            </p>
            <select
              value={config.defaultNextStepId || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, defaultNextStepId: e.target.value || undefined } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              {getRoutingOptions(allSteps, step.id, false).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conditions List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-slate-900">
                Conditions
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentConditions = config.conditions || [];
                  const newCondition = {
                    variable: "",
                    operator: "eq" as const,
                    value: "",
                    nextStepId: "",
                  };
                  onUpdate({
                    config: {
                      ...config,
                      conditions: [...currentConditions, newCondition],
                    },
                  });
                }}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Condition
              </button>
                </div>

            {(!config.conditions || config.conditions.length === 0) ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <p className="text-sm text-slate-500 mb-2">No conditions defined</p>
                <p className="text-xs text-slate-400">Click "Add Condition" to create branching logic</p>
              </div>
            ) : (
              <div className="space-y-4">
                {config.conditions.map((condition: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-xl border-2 border-slate-200 bg-white/80 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Condition {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedConditions = config.conditions.filter((_: any, i: number) => i !== index);
                          onUpdate({
                            config: {
                              ...config,
                              conditions: updatedConditions.length > 0 ? updatedConditions : undefined,
                            },
                          });
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </button>
            </div>

                    {/* Variable */}
              <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Variable <span className="text-rose-500">*</span>
                </label>
                      <VariableInput
                        type="input"
                        value={condition.variable || ""}
                        onChange={(value) => {
                          const updatedConditions = [...(config.conditions || [])];
                          updatedConditions[index] = { ...updatedConditions[index], variable: value };
                          onUpdate({ config: { ...config, conditions: updatedConditions } });
                        }}
                        placeholder="e.g., {{step_1.output.amount}}"
                        allSteps={allSteps}
                        currentStepId={step.id}
                        procedureTrigger={procedureTrigger}
                      />
              </div>

                    {/* Operator */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Operator <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={condition.operator || "eq"}
                        onChange={(e) => {
                          const updatedConditions = [...(config.conditions || [])];
                          updatedConditions[index] = {
                            ...updatedConditions[index],
                            operator: e.target.value as any,
                          };
                          onUpdate({ config: { ...config, conditions: updatedConditions } });
                        }}
                        className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="eq">Equals (=)</option>
                        <option value="neq">Not Equals (≠)</option>
                        <option value="gt">Greater Than (&gt;)</option>
                        <option value="lt">Less Than (&lt;)</option>
                        <option value="contains">Contains</option>
                      </select>
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Value <span className="text-rose-500">*</span>
                      </label>
                      <VariableInput
                        type="input"
                        value={condition.value || ""}
                        onChange={(value) => {
                          const updatedConditions = [...(config.conditions || [])];
                          updatedConditions[index] = { ...updatedConditions[index], value: value };
                          onUpdate({ config: { ...config, conditions: updatedConditions } });
                        }}
                        placeholder="e.g., 100 or {{step_2.output.threshold}}"
                        allSteps={allSteps}
                        currentStepId={step.id}
                        procedureTrigger={procedureTrigger}
                      />
                    </div>

                    {/* Next Step */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        If True, Go To <span className="text-rose-500">*</span>
              </label>
                      <select
                        value={condition.nextStepId || ""}
                        onChange={(e) => {
                          const updatedConditions = [...(config.conditions || [])];
                          updatedConditions[index] = {
                            ...updatedConditions[index],
                            nextStepId: e.target.value,
                          };
                          onUpdate({ config: { ...config, conditions: updatedConditions } });
                        }}
                        className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        {getRoutingOptions(allSteps, step.id, false).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
            </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case "COMPARE":
      const compareRoutes = step.routes || {};
      const compareOtherSteps = allSteps.filter((s) => s.id !== step.id);
      
      return (
        <div className="space-y-6">
        <div className="space-y-4">
          <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Target A <span className="text-rose-500">*</span>
            </label>
              <VariableInput
                type="input"
                value={config.targetA || ""}
                onChange={(value) =>
                  onUpdate({ config: { ...config, targetA: value || undefined } })
                }
                placeholder="e.g., {{step_1.output.amount}}"
                allSteps={allSteps}
                currentStepId={step.id}
                procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
                First value to compare. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
          </div>

          <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Target B <span className="text-rose-500">*</span>
            </label>
              <VariableInput
                type="input"
                value={config.targetB || ""}
                onChange={(value) =>
                  onUpdate({ config: { ...config, targetB: value || undefined } })
                }
                placeholder="e.g., {{step_2.output.amount}}"
                allSteps={allSteps}
                currentStepId={step.id}
                procedureTrigger={procedureTrigger}
              />
            <p className="mt-1 text-xs text-slate-500">
                Second value to compare. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
          </div>

          <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Comparison Type <span className="text-rose-500">*</span>
            </label>
              <select
                value={config.comparisonType || "exact"}
              onChange={(e) =>
                  onUpdate({ config: { ...config, comparisonType: e.target.value as any } })
                }
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="exact">Exact Match</option>
                <option value="fuzzy">Fuzzy Match</option>
                <option value="numeric">Numeric Comparison</option>
                <option value="date">Date Comparison</option>
              </select>
            </div>
          </div>

          {/* Routing Section */}
          <div className="pt-6 mt-6 border-t-2 border-slate-300 bg-slate-50/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Flow Logic</h3>
                  </div>
            <p className="text-xs text-slate-600 mb-4">
              Define where the workflow should go based on comparison results
            </p>
        <div className="space-y-4">
          <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  On Match (Success) → Go To
            </label>
            <select
                  value={compareRoutes.onSuccessStepId || ""}
              onChange={(e) =>
                onUpdate({
                      routes: { ...compareRoutes, onSuccessStepId: e.target.value || undefined },
                })
              }
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {getRoutingOptions(allSteps, step.id, true).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  On Mismatch (Failure) → Go To
                </label>
                <select
                  value={compareRoutes.onFailureStepId || ""}
                  onChange={(e) =>
                    onUpdate({
                      routes: { ...compareRoutes, onFailureStepId: e.target.value || undefined },
                    })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {getRoutingOptions(allSteps, step.id, true).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Useful for error loops: send user back to correction step
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    case "VALIDATE":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Validation Rule <span className="text-rose-500">*</span>
            </label>
            <select
              value={config.rule || "EQUAL"}
              onChange={(e) =>
                onUpdate({ config: { ...config, rule: e.target.value as any } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="GREATER_THAN">Greater Than</option>
              <option value="LESS_THAN">Less Than</option>
              <option value="EQUAL">Equal</option>
              <option value="CONTAINS">Contains</option>
              <option value="REGEX">Regex Match</option>
            </select>
            </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Target <span className="text-rose-500">*</span>
            </label>
            <VariableInput
              type="input"
              value={config.target || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, target: value || undefined } })
              }
              placeholder="e.g., {{step_1.output.amount}}"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              Variable or value to validate. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Expected Value <span className="text-rose-500">*</span>
            </label>
            <VariableInput
              type="input"
              value={config.value !== undefined ? String(config.value) : ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, value: value || undefined } })
              }
              placeholder="e.g., 100 or {{step_1.output.threshold}}"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              Value to compare against. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
                </div>
              </div>
      );

    default:
      return null;
  }
}

// Render Settings tab content (advanced fields)
function renderActionConfigSettings(
  step: AtomicStep,
  availableVariablesLegacy: { value: string; label: string }[],
  onUpdate: (updates: Partial<AtomicStep>) => void,
  allSteps: AtomicStep[],
  collections: Array<{ id: string; name: string }> = [],
  procedureTrigger?: { type: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK"; config?: any } | undefined
) {
  const { action, config } = step;
  const availableVariables = getAvailableVariables(allSteps, step.id);

  switch (action) {
    case "INPUT":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Placeholder Text
            </label>
            <input
              type="text"
              value={config.placeholder || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, placeholder: e.target.value || undefined } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Enter placeholder text"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Text shown inside the empty field to guide the user (e.g., "0912...").
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-0.5">
                Required Field
              </label>
              <p className="text-xs text-slate-600">
                Users must fill this field before proceeding
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.required || false}
                onChange={(e) =>
                  onUpdate({ config: { ...config, required: e.target.checked } })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
            </label>
          </div>
        </div>
      );

    case "DB_INSERT":
      // Data mapping is shown in Basic tab after collection selection
      return null;

    case "HTTP_REQUEST":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Headers
            </label>
            <KeyValueBuilder
              value={config.headers}
              onChange={(value) => onUpdate({ config: { ...config, headers: value } })}
              keyPlaceholder="Header name (e.g., Authorization)"
              valuePlaceholder="Header value (e.g., Bearer {{step_1.token}})"
              availableVariables={availableVariables.map(v => ({
                variableName: v.variableName,
                label: v.label,
              }))}
              allowEmpty={true}
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
          </div>

          {/* Conditional: Show body only for POST/PUT */}
          {(config.method === "POST" || config.method === "PUT") && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Request Body
              </label>
              <VariableInput
                type="textarea"
                value={config.requestBody || ""}
                onChange={(value) =>
                  onUpdate({ config: { ...config, requestBody: value || undefined } })
                }
                rows={6}
                placeholder='{"key": "value"} or {{step_1.data}}'
                allSteps={allSteps}
                currentStepId={step.id}
                procedureTrigger={procedureTrigger}
                className="font-mono"
              />
              <p className="mt-1 text-xs text-slate-500">
                Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
          </div>
          )}
        </div>
      );

    case "SEND_EMAIL":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Email Body <span className="text-rose-500">*</span>
            </label>
            <VariableInput
              type="textarea"
              value={config.body || config.emailBody || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, body: value || undefined, emailBody: value || undefined } })
              }
              rows={8}
              placeholder="Hello {{step_1.output.name}},\n\nYour request has been approved.\n\nThank you!"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              Plain text or HTML. Click the <Zap className="inline h-3 w-3" /> button to insert variables. Line breaks are preserved.
            </p>
              </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              HTML Content (Optional)
            </label>
            <VariableInput
              type="textarea"
              value={config.html || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, html: value || undefined } })
              }
              rows={6}
              placeholder="<h1>Welcome!</h1><p>Hello {{step_1.output.name}}</p>"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              If HTML is provided, it will be used instead of the body. Leave empty to use plain text body.
            </p>
            </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              From Address (Optional)
            </label>
            <VariableInput
              type="input"
              value={config.from || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, from: value || undefined } })
              }
              placeholder="Sender Name <sender@example.com> or {{step_1.output.sender}}"
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
            <p className="mt-1 text-xs text-slate-500">
              Default: Atomic Work &lt;alerts@theatomicwork.com&gt;. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
            </p>
          </div>
        </div>
      );

    case "GOOGLE_SHEET":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Column Mapping <span className="text-rose-500">*</span>
            </label>
            <KeyValueBuilder
              value={config.columnMapping}
              onChange={(value) => onUpdate({ config: { ...config, columnMapping: value } })}
              keyPlaceholder="Column (e.g., A, B, C)"
              valuePlaceholder="Value (e.g., {{step_1.name}})"
              availableVariables={availableVariables.map(v => ({
                variableName: v.variableName,
                label: v.label,
              }))}
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
          </div>
        </div>
      );

    case "DOC_GENERATE":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Data Mapping <span className="text-rose-500">*</span>
            </label>
            <KeyValueBuilder
              value={config.dataMapping}
              onChange={(value) => onUpdate({ config: { ...config, dataMapping: value } })}
              keyPlaceholder="Variable name (e.g., clientName)"
              valuePlaceholder="Value (e.g., {{step_1.name}})"
              availableVariables={availableVariables.map(v => ({
                variableName: v.variableName,
                label: v.label,
              }))}
              allSteps={allSteps}
              currentStepId={step.id}
              procedureTrigger={procedureTrigger}
            />
          </div>
        </div>
      );

    case "AI_PARSE":
      const extractionMode = config.extractionMode || "specific_fields";
      
      return (
        <div className="space-y-4">
          {/* Extraction Mode Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Extraction Mode <span className="text-rose-500">*</span>
            </label>
            <select
              value={extractionMode}
              onChange={(e) =>
                onUpdate({ config: { ...config, extractionMode: e.target.value } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="specific_fields">Specific Fields (JSON)</option>
              <option value="summary_qa">Summary / Q&A</option>
              <option value="full_text">Full Text (OCR)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {extractionMode === "specific_fields" && "Good for invoices, forms with structured data"}
              {extractionMode === "summary_qa" && "Good for analyzing contracts, resumes, extracting insights"}
              {extractionMode === "full_text" && "Good for raw archiving, complete text extraction"}
            </p>
          </div>

          {/* Dynamic UI based on Mode */}
          {extractionMode === "specific_fields" && (
            <FieldExtractionBuilder
              fields={config.fieldsToExtract || []}
              onChange={(fields) => onUpdate({ config: { ...config, fieldsToExtract: fields } })}
            />
          )}

          {extractionMode === "summary_qa" && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Prompt / Question <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={config.prompt || ""}
                onChange={(e) =>
                  onUpdate({ config: { ...config, prompt: e.target.value || undefined } })
                }
                rows={6}
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                placeholder="Summarize the key terms of this contract, specifically liability clauses..."
              />
              <p className="mt-1 text-xs text-slate-500">
                Describe what information you want extracted or ask specific questions about the document.
              </p>
            </div>
          )}

          {extractionMode === "full_text" && (
            <div className="rounded-lg bg-blue-50/80 border border-blue-200/50 p-4">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  ℹ️ <strong>Full Text Extraction:</strong> The entire text content of the document will be extracted to the output variable. No specific fields or prompts needed.
                </p>
              </div>
            </div>
          )}
        </div>
      );

    case "VALIDATE":
      const validateRoutes = step.routes || {};
      const validateOtherSteps = allSteps.filter((s) => s.id !== step.id);
      
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Validation Rule <span className="text-rose-500">*</span>
            </label>
            <select
                value={config.rule || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, rule: e.target.value as any } })
              }
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
                <option value="">Select a rule...</option>
              <option value="GREATER_THAN">Greater Than</option>
              <option value="LESS_THAN">Less Than</option>
              <option value="EQUAL">Equal</option>
              <option value="CONTAINS">Contains</option>
              <option value="REGEX">Regex Pattern</option>
            </select>
          </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Target <span className="text-rose-500">*</span>
              </label>
              <VariableInput
                type="input"
            value={config.target || ""}
            onChange={(value) =>
              onUpdate({ config: { ...config, target: value || undefined } })
            }
                placeholder="e.g., {{step_1.output.amount}}"
                allSteps={allSteps}
                currentStepId={step.id}
                procedureTrigger={procedureTrigger}
              />
              <p className="mt-1 text-xs text-slate-500">
                Value to validate. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Error Message (Optional)
              </label>
              <VariableInput
                type="textarea"
                value={config.errorMessage || ""}
            onChange={(value) =>
                  onUpdate({ config: { ...config, errorMessage: value || undefined } })
                }
                rows={3}
                placeholder="Custom error message if validation fails"
                allSteps={allSteps}
                currentStepId={step.id}
                procedureTrigger={procedureTrigger}
              />
              <p className="mt-1 text-xs text-slate-500">
                Message to display/log if validation fails. Click the <Zap className="inline h-3 w-3" /> button to insert variables.
              </p>
            </div>
          </div>

          {/* Routing Section */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Routing</h3>
            <div className="space-y-4">
          <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  On Pass (Success) → Go To
            </label>
                <select
                  value={validateRoutes.onSuccessStepId || ""}
              onChange={(e) =>
                    onUpdate({
                      routes: { ...validateRoutes, onSuccessStepId: e.target.value || undefined },
                    })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {getRoutingOptions(allSteps, step.id, true).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  On Fail → Go To
                </label>
                <select
                  value={validateRoutes.onFailureStepId || ""}
                  onChange={(e) =>
                    onUpdate({
                      routes: { ...validateRoutes, onFailureStepId: e.target.value || undefined },
                    })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {getRoutingOptions(allSteps, step.id, true).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Useful for error loops: send user back to correction step
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    case "COMPARE":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-0.5">
                Require Mismatch Reason
              </label>
              <p className="text-xs text-slate-600">
                If comparison fails, route to user input step asking for explanation
            </p>
          </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireMismatchReason || false}
                onChange={(e) =>
                  onUpdate({ config: { ...config, requireMismatchReason: e.target.checked } })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
            </label>
                  </div>
              </div>
      );

    default:
      return null;
  }
}

interface ConfigPanelProps {
  step: AtomicStep | null;
  allSteps: AtomicStep[];
  onUpdate: (updates: Partial<AtomicStep>) => void;
  validationError?: string | null;
  procedureTrigger?: { type: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK"; config?: any } | undefined;
}

export function ConfigPanel({ step, allSteps, onUpdate, validationError, procedureTrigger }: ConfigPanelProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  // Determine if Logic tab should be shown
  // Hide Logic tab for INPUT, APPROVAL, MANUAL_TASK, NEGOTIATE, and INSPECT (branching handled in Basic tab or by connecting to GATEWAY on canvas)
  const shouldShowLogicTab = step && (
    step.action !== "GATEWAY" && 
    step.action !== "VALIDATE" && 
    step.action !== "COMPARE" &&
    step.action !== "INPUT" &&
    step.action !== "APPROVAL" &&
    step.action !== "MANUAL_TASK" &&
    step.action !== "NEGOTIATE" &&
    step.action !== "INSPECT"
  );
  
  const [activeTab, setActiveTab] = useState<"basic" | "settings" | "logic">("basic");
  
  // Get organization ID from context
  const organizationId = useOrgId();
  const teamsQuery = useOrgQuery("teams");
  const usersQuery = useOrgQuery("users");
  const collectionsQuery = useOrgQuery("collections");

  // Fetch teams and users for assignment
  useEffect(() => {
    if (!teamsQuery) return;

    const unsubscribeTeams = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const teamsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        }) as Team[];
        setTeams(teamsData);
      },
      (error) => {
        console.error("Error fetching teams:", error);
      }
    );

    return () => {
      unsubscribeTeams();
    };
  }, [teamsQuery]);

  useEffect(() => {
    if (!usersQuery) return;

    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: data.uid || doc.id,
            email: data.email || "",
            displayName: data.displayName || "",
            photoURL: data.photoURL,
            jobTitle: data.jobTitle,
            role: data.role || "OPERATOR",
            teamIds: data.teamIds || [],
            organizationId: data.organizationId || organizationId || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        }) as UserProfile[];
        setUsers(usersData);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );

    return () => {
      unsubscribeUsers();
    };
  }, [usersQuery, organizationId]);

  // Fetch collections for DB_INSERT collection picker
  useEffect(() => {
    if (!collectionsQuery) return;

    const unsubscribeCollections = onSnapshot(
      collectionsQuery,
      (snapshot) => {
        const collectionsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || doc.id,
          };
        });
        setCollections(collectionsData);
      },
      (error) => {
        console.error("Error fetching collections:", error);
      }
    );

    return () => {
      unsubscribeCollections();
    };
  }, [collectionsQuery]);

  // Auto-detect assignment from assignee field (from AI @mentions)
  useEffect(() => {
    if (!step || !users.length) return;

    // Check if assignee field is set but assignment type is not configured
    const hasAssignee = step.assignee && step.assignee.trim() !== "";
    const hasAssignmentType = step.assignment?.type || step.assigneeType;
    const hasAssigneeId = step.assignment?.assigneeId || step.assigneeId;
    
    // Only auto-configure if assignee exists but assignment is not fully configured
    if (hasAssignee && (!hasAssignmentType || !hasAssigneeId)) {
      // Try to find the user by email or name
      const assigneeValue = (step.assignee || "").trim();
      
      // Try to match by email first
      let matchedUser = users.find(
        (u) => u.email?.toLowerCase() === assigneeValue.toLowerCase()
      );
      
      // If not found by email, try to match by displayName
      if (!matchedUser) {
        matchedUser = users.find(
          (u) => u.displayName?.toLowerCase().includes(assigneeValue.toLowerCase()) ||
                 assigneeValue.toLowerCase().includes(u.displayName?.toLowerCase() || "")
        );
      }
      
      // If still not found, try partial name matching (e.g., "@Jack" matches "Jack Smith")
      if (!matchedUser) {
        const namePart = assigneeValue.replace(/^@/, "").toLowerCase();
        matchedUser = users.find(
          (u) => u.displayName?.toLowerCase().split(" ").some(part => part.startsWith(namePart)) ||
                 u.email?.toLowerCase().split("@")[0] === namePart
        );
      }

      if (matchedUser) {
        const matchedUserId = matchedUser.uid || matchedUser.id;
        
        // Only update if the assigneeId doesn't match or assignment type is not set
        if (!hasAssigneeId || hasAssigneeId !== matchedUserId || !hasAssignmentType) {
          // Auto-configure assignment
          onUpdate({
            assignment: {
              type: "SPECIFIC_USER",
              assigneeId: matchedUserId,
            },
            assigneeType: "SPECIFIC_USER",
            assigneeId: matchedUserId,
            // Keep the original assignee field for reference
            assignee: step.assignee,
          });
        }
      }
    }
  }, [step?.id, step?.assignee, step?.assignment?.type, step?.assignment?.assigneeId, step?.assigneeType, step?.assigneeId, users.length]);

  if (!step) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50/50 via-white to-white border-l border-slate-200/80 p-10 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100/80 mb-6 shadow-sm"
          >
            <LucideIcons.Settings className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
          </motion.div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">No Step Selected</h3>
          <p className="text-sm text-slate-600 font-medium max-w-xs leading-relaxed">
            Select a step from the canvas to configure its settings
          </p>
            </div>
        </div>
      );
  }


  const metadata = (step.action && step.action in ATOMIC_ACTION_METADATA) 
    ? ATOMIC_ACTION_METADATA[step.action as AtomicAction] 
    : null;
  const IconComponent = metadata ? ((LucideIcons as any)[metadata.icon] || LucideIcons.Type) : LucideIcons.Type;

  // Get available variable names from previous steps
  const currentStepIndex = allSteps.findIndex((s) => s.id === step.id);
  const previousSteps = allSteps.slice(0, currentStepIndex);
  
  const availableVariables = previousSteps.map((s, idx) => ({
    id: s.id,
    label: `Step ${idx + 1}: ${s.title}`,
    type: s.action,
    variableName: s.config.outputVariableName || `step_${idx + 1}_output`,
  }));

  // Legacy format for backward compatibility
  const availableVariablesLegacy = availableVariables.map((v) => ({
    value: v.variableName,
    label: `${v.label} (${v.variableName})`,
  }));

      return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-full w-full overflow-y-auto overflow-x-hidden p-8"
      style={{ minHeight: 0 }}
    >
      {/* Clean Header */}
      <div className="relative sticky top-0 bg-white/70 backdrop-blur-xl pb-6 mb-8 border-b border-slate-100 z-10 -mx-8 px-8 pt-0">
        {validationError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 rounded-xl bg-orange-50/80 border border-orange-200/50 p-3 flex items-start gap-2.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-[#FF9500] mt-0.5 flex-shrink-0" strokeWidth={2} />
            <p className="text-xs text-[#FF9500] font-medium leading-relaxed">{validationError}</p>
          </motion.div>
        )}
        
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">{step.title}</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{metadata?.label || step.action || "Unknown"}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 -mx-8 px-8 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === "basic"
                ? "text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Basic
            {activeTab === "basic" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === "settings"
                ? "text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Settings
            {activeTab === "settings" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          {shouldShowLogicTab && (
            <button
              onClick={() => setActiveTab("logic")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === "logic"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Logic
              {activeTab === "logic" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="relative space-y-8">
        {/* Tab 1: Basic */}
        {activeTab === "basic" && (
          <div className="space-y-6">
            {/* Usage Hint */}
            {step && ACTION_USAGE_HINTS[step.action] && (
              <div className="rounded-lg bg-blue-50/80 border border-blue-200/50 p-3 flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  💡 <strong>Note:</strong> {ACTION_USAGE_HINTS[step.action]}
                </p>
              </div>
            )}

            {/* Step Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Step Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={step.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter step title"
              />
            </div>

            {/* Responsibility Section 👤 - Only show for Human Steps */}
            {step && isHumanStep(step.action) && (
        <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Responsibility</h3>
                <div className="rounded-xl bg-slate-50/50 p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Assignment Type
                    </label>
                    <select
                      value={
                        step.assignment?.type || 
                        (step.assigneeType === "TEAM" ? "TEAM_QUEUE" : 
                         step.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : 
                         (step.assignee && step.assignee.trim() !== "" && !step.assignment?.type && !step.assigneeType) ? "SPECIFIC_USER" : "STARTER")
                      }
                      onChange={(e) => {
                        const assignmentType = e.target.value as "STARTER" | "SPECIFIC_USER" | "TEAM_QUEUE";
                        onUpdate({
                          assignment: {
                            type: assignmentType,
                            assigneeId: assignmentType === "STARTER" ? undefined : step.assignment?.assigneeId || step.assigneeId,
                          },
                          assigneeType: assignmentType === "TEAM_QUEUE" ? "TEAM" : assignmentType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER",
                          assigneeId: assignmentType === "STARTER" ? undefined : step.assignment?.assigneeId || step.assigneeId,
                        });
                      }}
                      className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="STARTER">Process Starter (The person who clicked Run)</option>
                      <option value="SPECIFIC_USER">Specific User</option>
                      <option value="TEAM_QUEUE">Team Queue (Any member can pick it up)</option>
                    </select>
            </div>

                  {(step.assignment?.type === "TEAM_QUEUE" || step.assigneeType === "TEAM") && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Select Team
                      </label>
                      <select
                        value={step.assignment?.assigneeId || step.assigneeId || ""}
                        onChange={(e) =>
                          onUpdate({
                            assignment: {
                              type: "TEAM_QUEUE",
                              assigneeId: e.target.value || undefined,
                            },
                            assigneeType: "TEAM",
                            assigneeId: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="">Select a team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      {teams.length === 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          No teams available. Create teams in Settings.
                        </p>
                      )}
          </div>
                  )}

                  {(step.assignment?.type === "SPECIFIC_USER" || step.assigneeType === "SPECIFIC_USER" || (step.assignee && step.assignee.trim() !== "")) && (
          <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Select User
            </label>
            <select
                        value={(() => {
                          const currentId = step.assignment?.assigneeId || step.assigneeId;
                          if (currentId) return currentId;
                          
                          if (step.assignee && step.assignee.trim() !== "") {
                            const assigneeValue = step.assignee.trim();
                            const byEmail = users.find(
                              (u) => u.email?.toLowerCase() === assigneeValue.toLowerCase()
                            );
                            if (byEmail) return byEmail.uid || byEmail.id;
                            
                            const byName = users.find(
                              (u) => u.displayName?.toLowerCase().includes(assigneeValue.toLowerCase()) ||
                                     assigneeValue.toLowerCase().includes(u.displayName?.toLowerCase() || "")
                            );
                            if (byName) return byName.uid || byName.id;
                            
                            const namePart = assigneeValue.replace(/^@/, "").toLowerCase();
                            const byPartial = users.find(
                              (u) => u.displayName?.toLowerCase().split(" ").some(part => part.startsWith(namePart)) ||
                                     u.email?.toLowerCase().split("@")[0] === namePart
                            );
                            if (byPartial) return byPartial.uid || byPartial.id;
                          }
                          
                          return "";
                        })()}
              onChange={(e) =>
                          onUpdate({
                            assignment: {
                              type: "SPECIFIC_USER",
                              assigneeId: e.target.value || undefined,
                            },
                            assigneeType: "SPECIFIC_USER",
                            assigneeId: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="">Select a user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.uid || user.id}>
                            {user.displayName} ({user.email})
                          </option>
                        ))}
            </select>
                      {users.length === 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          No users available. Invite users in Settings.
                        </p>
                      )}
          </div>
                  )}

                  {((step.assignment?.type && step.assignment.type !== "STARTER" && step.assignment.assigneeId) ||
                    (step.assigneeType && step.assigneeType !== "STARTER" && step.assigneeId)) && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-medium text-blue-900">
                          {step.assignment?.type === "TEAM_QUEUE" || step.assigneeType === "TEAM"
                            ? `Assigned to team: ${teams.find((t) => t.id === (step.assignment?.assigneeId || step.assigneeId))?.name || "Unknown"}`
                            : `Assigned to user: ${users.find((u) => (u.uid || u.id) === (step.assignment?.assigneeId || step.assigneeId))?.displayName || step.assignment?.assigneeId || step.assigneeId}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action-specific Basic Configuration */}
            {renderActionConfigBasic(step, availableVariablesLegacy, onUpdate, allSteps, collections, procedureTrigger)}
          </div>
        )}

        {/* Tab 2: Settings */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Output Variable Name */}
          <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Output Variable Name
            </label>
            <input
              type="text"
                value={step.config.outputVariableName || ""}
              onChange={(e) =>
                  onUpdate({
                    config: { ...step.config, outputVariableName: e.target.value || undefined },
                  })
              }
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., invoice_total"
            />
              <p className="mt-2 text-xs text-slate-500">
                Variable name for referencing this step's data later. Auto-generated if left blank.
              </p>
          </div>

            {/* Evidence Requirement */}
            {step && isHumanStep(step.action) && (
              <div className="rounded-xl bg-slate-50/50 p-5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={step.requiresEvidence || false}
                    onChange={(e) => onUpdate({ requiresEvidence: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
                      Require Evidence Upload
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Users must upload a file (PDF, Image, Doc) before completing this task
                    </p>
        </div>
                </label>
              </div>
            )}

            {/* Action-specific Settings Configuration */}
            {renderActionConfigSettings(step, availableVariablesLegacy, onUpdate, allSteps, collections, procedureTrigger)}
        </div>
        )}

        {/* Tab 3: Logic */}
        {activeTab === "logic" && (
          <div className="space-y-6">
            {renderFlowLogic(step, allSteps, onUpdate)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function renderFlowLogic(
  step: AtomicStep,
  allSteps: AtomicStep[],
  onUpdate: (updates: Partial<AtomicStep>) => void
) {
  const routes = step.routes || {};
  const otherSteps = allSteps.filter((s) => s.id !== step.id);

  return (
    <div className="space-y-4">
      {/* Default Next Step */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Default Next Step
        </label>
        <select
          value={routes.defaultNextStepId || ""}
          onChange={(e) =>
            onUpdate({
              routes: { ...routes, defaultNextStepId: e.target.value || undefined },
            })
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Auto (Next in sequence)</option>
          <option value="COMPLETED">Complete Process</option>
          {otherSteps.map((s) => {
            const stepNum = allSteps.findIndex((st) => st.id === s.id) + 1;
            return (
            <option key={s.id} value={s.id}>
                Step {stepNum}: {s.title || "Untitled Step"}
            </option>
            );
          })}
        </select>
      </div>

      {/* Success/Failure Routes for COMPARE and VALIDATE */}
      {(step.action === "COMPARE" || step.action === "VALIDATE") && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              On Success → Go To
            </label>
            <select
              value={routes.onSuccessStepId || ""}
              onChange={(e) =>
                onUpdate({
                  routes: { ...routes, onSuccessStepId: e.target.value || undefined },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Use Default Next Step</option>
              <option value="COMPLETED">Complete Process</option>
              {otherSteps.map((s) => {
                const stepNum = allSteps.findIndex((st) => st.id === s.id) + 1;
                return (
                <option key={s.id} value={s.id}>
                    Step {stepNum}: {s.title || "Untitled Step"}
                </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              On Failure/Mismatch → Go To
            </label>
            <select
              value={routes.onFailureStepId || ""}
              onChange={(e) =>
                onUpdate({
                  routes: { ...routes, onFailureStepId: e.target.value || undefined },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Use Default Next Step</option>
              <option value="COMPLETED">Complete Process</option>
              {otherSteps.map((s) => {
                const stepNum = allSteps.findIndex((st) => st.id === s.id) + 1;
                return (
                <option key={s.id} value={s.id}>
                    Step {stepNum}: {s.title || "Untitled Step"}
                </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Useful for error loops: send user back to correction step
            </p>
          </div>
        </>
      )}

      {/* Conditional Routes */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Conditional Routes
        </label>
        {(routes.conditions || []).map((condition, idx) => (
          <div key={idx} className="mb-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                value={condition.variable}
                onChange={(e) => {
                  const newConditions = [...(routes.conditions || [])];
                  newConditions[idx] = { ...condition, variable: e.target.value };
                  onUpdate({ routes: { ...routes, conditions: newConditions } });
                }}
                placeholder="Variable name"
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              />
              <select
                value={condition.operator}
                onChange={(e) => {
                  const newConditions = [...(routes.conditions || [])];
                  newConditions[idx] = { ...condition, operator: e.target.value as any };
                  onUpdate({ routes: { ...routes, conditions: newConditions } });
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              >
                <option value=">">Greater Than</option>
                <option value="<">Less Than</option>
                <option value="==">Equal</option>
                <option value="!=">Not Equal</option>
                <option value=">=">Greater or Equal</option>
                <option value="<=">Less or Equal</option>
                <option value="contains">Contains</option>
                <option value="startsWith">Starts With</option>
                <option value="endsWith">Ends With</option>
              </select>
              <input
                type="text"
                value={condition.value || ""}
                onChange={(e) => {
                  const newConditions = [...(routes.conditions || [])];
                  newConditions[idx] = { ...condition, value: e.target.value };
                  onUpdate({ routes: { ...routes, conditions: newConditions } });
                }}
                placeholder="Value"
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              />
            </div>
            <select
              value={(condition as any).nextStepId || (condition as any).targetStepId || ""}
              onChange={(e) => {
                const newConditions = [...(routes.conditions || [])];
                const updatedCondition: any = { ...condition };
                delete updatedCondition.targetStepId;
                updatedCondition.nextStepId = e.target.value;
                newConditions[idx] = updatedCondition;
                onUpdate({ routes: { ...routes, conditions: newConditions as any } });
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs mb-2"
            >
              <option value="">Then go to...</option>
              {otherSteps.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const newConditions = (routes.conditions || []).filter((_, i) => i !== idx);
                onUpdate({ routes: { ...routes, conditions: newConditions } });
              }}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newConditions: any[] = [
              ...(routes.conditions || []),
              { variable: "", operator: "eq" as const, value: "", nextStepId: "" },
            ];
            onUpdate({ routes: { ...routes, conditions: newConditions } });
          }}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add Condition
        </button>
      </div>
    </div>
  );
}

// Options List Builder Component (for Select/Checkbox)
interface OptionsListBuilderProps {
  options: Array<{ label: string; value: string }> | string[];
  onChange: (options: Array<{ label: string; value: string }> | undefined) => void;
}

function OptionsListBuilder({ options, onChange }: OptionsListBuilderProps) {
  const [newOption, setNewOption] = useState("");

  // Convert options to array of strings
  const optionStrings = options.map(o => typeof o === "string" ? o : o.label);

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    const updatedOptions = [
      ...optionStrings,
      newOption.trim()
    ];
    
    onChange(updatedOptions.map(o => ({ label: o, value: o })));
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = optionStrings.filter((_, i) => i !== index);
    onChange(updatedOptions.length > 0 ? updatedOptions.map(o => ({ label: o, value: o })) : undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        Options <span className="text-rose-500">*</span>
      </label>
      
      {/* Input + Add Button */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 rounded-xl border-0 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
          placeholder="Enter an option..."
        />
        <button
          type="button"
          onClick={handleAddOption}
          disabled={!newOption.trim()}
          className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Options as Tags/Chips */}
      {optionStrings.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {optionStrings.map((option, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-sm font-medium text-blue-800"
            >
              <span>{option}</span>
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Remove option"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No options added yet. Add options above.</p>
      )}
    </div>
  );
}

// Field Extraction Builder Component (for AI_PARSE)
interface FieldExtractionBuilderProps {
  fields: Array<{ key: string; description?: string }> | string[];
  onChange: (fields: Array<{ key: string; description?: string }>) => void;
}

function FieldExtractionBuilder({ fields, onChange }: FieldExtractionBuilderProps) {
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldDescription, setNewFieldDescription] = useState("");

  // Convert fields to array of objects
  const fieldObjects = fields.map(f => 
    typeof f === "string" 
      ? { key: f, description: "" } 
      : { key: f.key, description: f.description || "" }
  );

  const handleAddField = () => {
    if (!newFieldKey.trim()) return;
    
    const updatedFields = [
      ...fieldObjects,
      { key: newFieldKey.trim(), description: newFieldDescription.trim() || undefined }
    ];
    
    onChange(updatedFields);
    setNewFieldKey("");
    setNewFieldDescription("");
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = fieldObjects.filter((_, i) => i !== index);
    onChange(updatedFields.length > 0 ? updatedFields : []);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddField();
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        Fields to Extract <span className="text-rose-500">*</span>
      </label>
      
      {/* Input Fields + Add Button */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-xl border-0 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Field name (e.g., invoice_date)"
          />
          <input
            type="text"
            value={newFieldDescription}
            onChange={(e) => setNewFieldDescription(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddField();
              }
            }}
            className="flex-1 rounded-xl border-0 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Description (optional)"
          />
          <button
            type="button"
            onClick={handleAddField}
            disabled={!newFieldKey.trim()}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Fields as List */}
      {fieldObjects.length > 0 ? (
        <div className="space-y-2">
          {fieldObjects.map((field, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-blue-900">{field.key}</div>
                {field.description && (
                  <div className="text-xs text-blue-700 mt-0.5">{field.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveField(index)}
                className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
                title="Remove field"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No fields added yet. Add fields above.</p>
      )}
    </div>
  );
}

// File Restrictions Builder Component (for File Upload)
interface FileRestrictionsBuilderProps {
  allowedExtensions: string[];
  onChange: (extensions: string[]) => void;
}

function FileRestrictionsBuilder({ allowedExtensions, onChange }: FileRestrictionsBuilderProps) {
  const [customExtensions, setCustomExtensions] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  // Predefined file type groups
  const fileTypeGroups = [
    { label: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp"] },
    { label: "Documents", extensions: ["pdf", "docx", "doc", "txt"] },
    { label: "Spreadsheets", extensions: ["xlsx", "xls", "csv"] },
  ];

  // Check if a group is selected (all extensions in group are present)
  const isGroupSelected = (group: typeof fileTypeGroups[0]) => {
    return group.extensions.every(ext => allowedExtensions.includes(ext));
  };

  // Toggle a file type group
  const toggleGroup = (group: typeof fileTypeGroups[0]) => {
    const isSelected = isGroupSelected(group);
    
    if (isSelected) {
      // Remove all extensions from this group
      onChange(allowedExtensions.filter(ext => !group.extensions.includes(ext)));
    } else {
      // Add all extensions from this group (avoid duplicates)
      const newExtensions = [...new Set([...allowedExtensions, ...group.extensions])];
      onChange(newExtensions);
    }
  };

  // Handle custom extensions
  useEffect(() => {
    if (useCustom && customExtensions.trim()) {
      const customExts = customExtensions.split(",").map(e => e.trim().replace(/^\./, "")).filter(e => e);
      // Merge with existing extensions (avoid duplicates)
      const merged = [...new Set([...allowedExtensions, ...customExts])];
      onChange(merged);
    }
  }, [customExtensions, useCustom]);

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        Allowed File Types
      </label>
      
      {/* Multi-Select Checkbox Group */}
      <div className="space-y-2 mb-3">
        {fileTypeGroups.map((group) => (
          <label
            key={group.label}
            className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={isGroupSelected(group)}
              onChange={() => toggleGroup(group)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-900">
              {group.label} ({group.extensions.map(e => `.${e}`).join(", ")})
            </span>
          </label>
        ))}
        
        {/* Custom Option */}
        <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => {
              setUseCustom(e.target.checked);
              if (!e.target.checked) {
                setCustomExtensions("");
              }
            }}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-900">Custom</span>
        </label>
      </div>

      {/* Custom Extensions Input (shown when Custom is checked) */}
      {useCustom && (
        <div className="mb-3">
          <input
            type="text"
            value={customExtensions}
            onChange={(e) => setCustomExtensions(e.target.value)}
            className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="e.g., zip, rar, 7z"
          />
          <p className="mt-1 text-xs text-slate-500">Enter comma-separated extensions (e.g., zip, rar, 7z)</p>
        </div>
      )}

      {/* Display Selected Extensions */}
      {allowedExtensions.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-2">Selected Extensions:</p>
          <div className="flex flex-wrap gap-1.5">
            {allowedExtensions.map((ext, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium"
              >
                .{ext}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

