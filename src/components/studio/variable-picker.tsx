"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Search, ChevronRight, FileText, Webhook, File, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AtomicStep, Procedure } from "@/types/schema";

interface VariableOption {
  id: string;
  label: string; // Friendly name (e.g., "Emergency Client Call > Phone Number")
  variable: string; // Full variable syntax (e.g., "{{step_1.output.phone_number}}")
  category: "trigger" | "step";
  stepId?: string;
  stepTitle?: string;
  fieldName?: string;
}

interface VariablePickerProps {
  allSteps: AtomicStep[];
  currentStepId: string;
  procedureTrigger?: Procedure["trigger"];
  onSelect: (variable: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export function VariablePicker({
  allSteps,
  currentStepId,
  procedureTrigger,
  onSelect,
  inputRef,
}: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Get current step index
  const currentStepIndex = allSteps.findIndex((s) => s.id === currentStepId);
  const previousSteps = allSteps.slice(0, currentStepIndex);

  // Infer output fields from step configuration
  const inferOutputFields = (step: AtomicStep, stepIndex: number): string[] => {
    const fields: string[] = [];
    const stepNum = stepIndex + 1;
    const stepVar = step.config.outputVariableName || `step_${stepNum}`;

    switch (step.action) {
      case "INPUT":
        // INPUT outputs a single field, typically named after fieldLabel or outputVariableName
        if (step.config.fieldLabel) {
          const fieldKey = step.config.fieldLabel
            .toLowerCase()
            .replace(/\s+/g, "_");
          fields.push(fieldKey);
        } else if (step.config.outputVariableName) {
          fields.push(step.config.outputVariableName);
        } else {
          fields.push("value");
        }
        break;

      case "AI_PARSE":
        // AI_PARSE outputs fields from fieldsToExtract
        if (step.config.fieldsToExtract && Array.isArray(step.config.fieldsToExtract)) {
          fields.push(...step.config.fieldsToExtract);
        } else {
          // Default fields if not specified
          fields.push("name", "email", "phone");
        }
        break;

      case "DB_INSERT":
        // DB_INSERT outputs the inserted data
        if (step.config.data && typeof step.config.data === "object") {
          fields.push(...Object.keys(step.config.data));
        } else {
          fields.push("record_id", "inserted_at");
        }
        break;

      case "HTTP_REQUEST":
        // HTTP_REQUEST typically outputs response data
        fields.push("status", "body", "headers");
        break;

      case "SEND_EMAIL":
        // SEND_EMAIL outputs send status
        fields.push("sent", "message_id");
        break;

      case "CALCULATE":
        // CALCULATE outputs the calculated result
        fields.push("result");
        break;

      case "VALIDATE":
      case "COMPARE":
        // VALIDATE/COMPARE output validation result
        fields.push("result", "matched", "error");
        break;

      case "APPROVAL":
      case "MANUAL_TASK":
      case "NEGOTIATE":
      case "INSPECT":
        // Human tasks output completion status
        fields.push("outcome", "completed_by", "notes");
        break;

      default:
        // Default: generic output
        fields.push("output", "result");
    }

    return fields;
  };

  // Build variable options from previous steps
  const buildStepVariables = (): VariableOption[] => {
    const options: VariableOption[] = [];

    previousSteps.forEach((step, idx) => {
      const stepNum = idx + 1;
      const stepTitle = step.title || `Step ${stepNum}`;
      const stepVar = step.config.outputVariableName || `step_${stepNum}`;
      const fields = inferOutputFields(step, idx);

      // Add each output field as an option
      fields.forEach((field) => {
        options.push({
          id: `${step.id}-${field}`,
          label: `${stepTitle} > ${field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
          variable: `{{${stepVar}.output.${field}}}`,
          category: "step",
          stepId: step.id,
          stepTitle,
          fieldName: field,
        });
      });

      // Also add the full output object option
      options.push({
        id: `${step.id}-output`,
        label: `${stepTitle} > All Output`,
        variable: `{{${stepVar}.output}}`,
        category: "step",
        stepId: step.id,
        stepTitle,
      });
    });

    return options;
  };

  // Build trigger variables
  const buildTriggerVariables = (): VariableOption[] => {
    const options: VariableOption[] = [];

    if (!procedureTrigger) return options;

    if (procedureTrigger.type === "WEBHOOK") {
      // Webhook trigger variables
      options.push(
        {
          id: "trigger-body",
          label: "Webhook > Request Body",
          variable: "{{trigger.body}}",
          category: "trigger",
        },
        {
          id: "trigger-headers",
          label: "Webhook > Request Headers",
          variable: "{{trigger.headers}}",
          category: "trigger",
        }
      );

      // Common webhook body fields (inferred)
      const commonFields = ["email", "name", "phone", "message", "data", "payload"];
      commonFields.forEach((field) => {
        options.push({
          id: `trigger-body-${field}`,
          label: `Webhook > Body.${field}`,
          variable: `{{trigger.body.${field}}}`,
          category: "trigger",
        });
      });
    } else if (procedureTrigger.type === "ON_FILE_CREATED") {
      // File trigger variables
      options.push(
        {
          id: "trigger-file",
          label: "File > File Path",
          variable: "{{trigger.file}}",
          category: "trigger",
        },
        {
          id: "trigger-file-url",
          label: "File > File URL",
          variable: "{{trigger.fileUrl}}",
          category: "trigger",
        },
        {
          id: "trigger-file-id",
          label: "File > File ID",
          variable: "{{trigger.fileId}}",
          category: "trigger",
        },
        {
          id: "trigger-file-path",
          label: "File > File Path (Full)",
          variable: "{{trigger.filePath}}",
          category: "trigger",
        }
      );
    }

    return options;
  };

  const allVariables = [...buildTriggerVariables(), ...buildStepVariables()];

  // Filter by search query
  const filteredVariables = searchQuery
    ? allVariables.filter(
        (v) =>
          v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.variable.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allVariables;

  // Group by category and step
  const groupedVariables = filteredVariables.reduce(
    (acc, variable) => {
      if (variable.category === "trigger") {
        if (!acc.trigger) acc.trigger = [];
        acc.trigger.push(variable);
      } else {
        const stepId = variable.stepId || "unknown";
        if (!acc.steps[stepId]) {
          acc.steps[stepId] = {
            stepId,
            stepTitle: variable.stepTitle || "Unknown Step",
            variables: [],
          };
        }
        acc.steps[stepId].variables.push(variable);
      }
      return acc;
    },
    {
      trigger: [] as VariableOption[],
      steps: {} as Record<
        string,
        { stepId: string; stepTitle: string; variables: VariableOption[] }
      >,
    }
  );

  const handleSelect = (variable: string) => {
    if (inputRef?.current) {
      // Insert at cursor position
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = (input as HTMLInputElement).value || (input as HTMLTextAreaElement).value || "";
      const newValue = currentValue.slice(0, start) + variable + currentValue.slice(end);
      
      // Update input value
      if (input instanceof HTMLInputElement) {
        input.value = newValue;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (input instanceof HTMLTextAreaElement) {
        input.value = newValue;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        input.setSelectionRange(start + variable.length, start + variable.length);
        input.focus();
      }, 0);
    }
    
    // Also call the onSelect callback
    onSelect(variable);
    setIsOpen(false);
    setSearchQuery("");
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-50 transition-colors group border border-slate-200 hover:border-blue-300"
        title="Insert variable"
      >
        <Zap className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Popover */}
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 w-96 rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden"
              style={{ right: 0, top: "100%" }}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Insert Variable</h3>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search variables..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                    autoFocus
                  />
                </div>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {filteredVariables.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    <p className="font-medium">No variables found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {/* Trigger Variables */}
                    {groupedVariables.trigger.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 px-3 py-2 mb-2">
                          {procedureTrigger?.type === "WEBHOOK" ? (
                            <Webhook className="h-4 w-4 text-purple-600" />
                          ) : (
                            <File className="h-4 w-4 text-blue-600" />
                          )}
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                            {procedureTrigger?.type === "WEBHOOK" ? "Webhook Data" : "File Data"}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {groupedVariables.trigger.map((variable) => (
                            <button
                              key={variable.id}
                              type="button"
                              onClick={() => handleSelect(variable.variable)}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 truncate">
                                    {variable.label}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                                    {variable.variable}
                                  </div>
                                </div>
                                <Zap className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step Variables */}
                    {Object.keys(groupedVariables.steps).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 px-3 py-2 mb-2">
                          <FileText className="h-4 w-4 text-slate-600" />
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                            Previous Steps
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {Object.values(groupedVariables.steps).map((stepGroup) => {
                            const isExpanded = expandedSteps.has(stepGroup.stepId);
                            const hasMultipleFields = stepGroup.variables.length > 1;

                            return (
                              <div key={stepGroup.stepId} className="border border-slate-100 rounded-lg overflow-hidden">
                                {/* Step Header */}
                                {hasMultipleFields ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleStepExpansion(stepGroup.stepId)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <ChevronRight
                                        className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${
                                          isExpanded ? "rotate-90" : ""
                                        }`}
                                      />
                                      <span className="text-sm font-bold text-slate-900 truncate">
                                        {stepGroup.stepTitle}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        ({stepGroup.variables.length} fields)
                                      </span>
                                    </div>
                                  </button>
                                ) : null}

                                {/* Step Variables */}
                                <AnimatePresence>
                                  {(!hasMultipleFields || isExpanded) && (
                                    <motion.div
                                      initial={hasMultipleFields ? { height: 0, opacity: 0 } : false}
                                      animate={hasMultipleFields ? { height: "auto", opacity: 1 } : false}
                                      exit={hasMultipleFields ? { height: 0, opacity: 0 } : false}
                                      className={hasMultipleFields ? "overflow-hidden" : ""}
                                    >
                                      {stepGroup.variables.map((variable) => (
                                        <button
                                          key={variable.id}
                                          type="button"
                                          onClick={() => handleSelect(variable.variable)}
                                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                                          style={{ paddingLeft: hasMultipleFields ? "2.5rem" : "0.75rem" }}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-semibold text-slate-900 truncate">
                                                {variable.fieldName
                                                  ? variable.label.split(" > ")[1] || variable.fieldName
                                                  : "All Output"}
                                              </div>
                                              <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                                                {variable.variable}
                                              </div>
                                            </div>
                                            <Zap className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                                          </div>
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

