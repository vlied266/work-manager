"use client";

import { useEffect, useState, useRef } from "react";
import { AtomicStep, AtomicAction, ATOMIC_ACTION_METADATA, Team, UserProfile, Procedure } from "@/types/schema";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { Users, User, ShieldCheck, Upload, CheckCircle2, Calculator, Sparkles, AlertTriangle, Info, HelpCircle, Zap } from "lucide-react";
import { MagicInput } from "@/components/studio/magic-input";
import { GoogleSheetConfig } from "@/components/studio/GoogleSheetConfig";
import { useOrgId, useOrgQuery } from "@/hooks/useOrgData";
import { isHumanStep } from "@/lib/constants";
import { KeyValueBuilder } from "./key-value-builder";
import { VariableInput } from "@/components/studio/variable-input";

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
              Question Text <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.fieldLabel || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, fieldLabel: e.target.value } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="e.g., Enter the oven temperature"
            />
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
              <option value="multiline">Multiline Text</option>
              <option value="file">File Upload</option>
            </select>
          </div>

          {/* Conditional: Show options only for select/checkbox */}
          {(config.inputType === "select" || config.inputType === "checkbox") && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Options <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={config.options ? config.options.map(o => typeof o === "string" ? o : o.label).join("\n") : ""}
                onChange={(e) => {
                  const optionStrings = e.target.value.split("\n").filter(o => o.trim());
                  const options: Array<{ label: string; value: string }> | undefined = optionStrings.length > 0 
                    ? optionStrings.map(o => ({ label: o, value: o }))
                    : undefined;
                  onUpdate({ config: { ...config, options } });
                }}
                rows={4}
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
              <p className="mt-1 text-xs text-slate-500">Enter one option per line</p>
            </div>
          )}

          {/* Conditional: Show allowedExtensions only for file */}
          {config.inputType === "file" && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Allowed File Types
              </label>
              <input
                type="text"
                value={config.allowedExtensions ? config.allowedExtensions.join(", ") : ""}
                onChange={(e) => {
                  const extensions = e.target.value.split(",").map(e => e.trim()).filter(e => e);
                  onUpdate({ config: { ...config, allowedExtensions: extensions.length > 0 ? extensions : undefined } });
                }}
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., pdf, jpg, png, docx"
              />
              <p className="mt-1 text-xs text-slate-500">Comma-separated file extensions (e.g., pdf, jpg, png)</p>
            </div>
          )}
        </div>
      );

    case "DB_INSERT":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Collection Name <span className="text-rose-500">*</span>
            </label>
            {collections.length > 0 ? (
              <select
                value={config.collectionName || ""}
                onChange={(e) =>
                  onUpdate({ config: { ...config, collectionName: e.target.value || undefined } })
                }
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="">Select a collection...</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.collectionName || ""}
                onChange={(e) =>
                  onUpdate({ config: { ...config, collectionName: e.target.value || undefined } })
                }
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., Deals, Employees, Orders"
              />
            )}
            <p className="mt-1 text-xs text-slate-500">
              {collections.length > 0 
                ? "Select an existing collection"
                : "Type the collection name (must match an existing collection)"}
            </p>
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
      
      // Add previous INPUT steps with file type
      const currentStepIndex = allSteps.findIndex((s) => s.id === step.id);
      const previousFileInputSteps = allSteps
        .filter((s) => {
          const stepIndex = allSteps.findIndex((st) => st.id === s.id);
          return s.action === "INPUT" && s.config.inputType === "file" && stepIndex < currentStepIndex;
        })
        .map((s) => ({ label: s.title, value: s.id }));
      
      sourceOptions.push(...previousFileInputSteps);
      
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
              {isFirstStep && hasAutomatedTrigger
                ? "Select the trigger event for automated workflows, or a previous INPUT step for manual uploads"
                : "Select the INPUT step where the file was uploaded"}
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
            <MagicInput
              value={config.to || config.recipient || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, to: value || undefined, recipient: value || undefined } })
              }
              placeholder="email@example.com or {{step_1.output.email}}"
              availableVariables={availableVariables}
            />
            <p className="mt-1 text-xs text-slate-500">
              Use variables like <code className="bg-slate-100 px-1 rounded">{`{{step_1.output.email}}`}</code> or <code className="bg-slate-100 px-1 rounded">{`{{trigger.body.email}}`}</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Subject <span className="text-rose-500">*</span>
            </label>
            <MagicInput
              value={config.subject || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, subject: value || undefined } })
              }
              placeholder="Email subject or {{step_1.output.title}}"
              availableVariables={availableVariables}
            />
            <p className="mt-1 text-xs text-slate-500">
              Use variables like <code className="bg-slate-100 px-1 rounded">{`{{step_1.output.name}}`}</code>
            </p>
          </div>
        </div>
      );

    case "GOOGLE_SHEET":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Spreadsheet ID <span className="text-rose-500">*</span>
            </label>
            <MagicInput
              value={config.spreadsheetId || ""}
              onChange={(value) =>
                onUpdate({ config: { ...config, spreadsheetId: value || undefined } })
              }
              placeholder="Spreadsheet ID or {{step_1.sheetId}}"
              availableVariables={availableVariables}
            />
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
    case "NEGOTIATE":
    case "INSPECT":
      return (
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
              placeholder="Enter detailed instructions..."
            />
          </div>
        </div>
      );

    case "MANUAL_TASK":
      return (
        <div className="space-y-4">
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
              placeholder="Enter detailed instructions in Markdown format...&#10;&#10;## Steps:&#10;1. First, do this...&#10;2. Then, do that...&#10;&#10;## Notes:&#10;- Important point 1&#10;- Important point 2"
            />
            <p className="mt-1 text-xs text-slate-500">
              Supports Markdown formatting (headers, lists, links). This will be displayed to the operator when they complete the task.
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
            <input
              type="text"
              value={config.from || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, from: e.target.value || undefined } })
              }
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Sender Name <sender@example.com>"
            />
            <p className="mt-1 text-xs text-slate-500">
              Default: Atomic Work &lt;alerts@theatomicwork.com&gt;
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
            />
          </div>
        </div>
      );

    case "AI_PARSE":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Fields to Extract <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={config.fieldsToExtract ? config.fieldsToExtract.join("\n") : ""}
              onChange={(e) => {
                const fields = e.target.value.split("\n").filter(f => f.trim());
                onUpdate({ config: { ...config, fieldsToExtract: fields.length > 0 ? fields : undefined } });
              }}
              rows={6}
              className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="invoiceDate&#10;amount&#10;vendor&#10;invoiceNumber"
            />
            <p className="mt-1 text-xs text-slate-500">Enter one field name per line</p>
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
        </div>
      </div>

      <div className="relative space-y-8">
        {/* Tab 1: Basic */}
        {activeTab === "basic" && (
          <div className="space-y-6">
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
          {otherSteps.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
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
              {otherSteps.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
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
              {otherSteps.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
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

