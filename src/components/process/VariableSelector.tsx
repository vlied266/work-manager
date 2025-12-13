"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Link2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Procedure } from "@/types/schema";

// Process Step Type (Discriminated Union)
export type ProcessStepType = 'procedure' | 'logic_delay';

export interface BaseProcessStep {
  instanceId: string; // Unique ID for this specific step in the timeline
  type: ProcessStepType;
}

export interface ProcedureStep extends BaseProcessStep {
  type: 'procedure';
  procedureId: string;
  procedureData: Procedure; // The full metadata we grabbed during drag
  inputMappings: Record<string, string>; // e.g. { "email": "{{step_1.output.email}}" }
}

export interface DelayStep extends BaseProcessStep {
  type: 'logic_delay';
  config: {
    duration: number;
    unit: 'minutes' | 'hours' | 'days';
  };
}

export type ProcessStep = ProcedureStep | DelayStep;

interface VariableSelectorProps {
  value: string;
  onChange: (value: string) => void;
  previousSteps: ProcessStep[];
  placeholder?: string;
}

export function VariableSelector({
  value,
  onChange,
  previousSteps,
  placeholder = "Enter value or select variable...",
}: VariableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate variable options from previous steps (only from procedure steps)
  const variableOptions = previousSteps.flatMap((step, stepIndex) => {
    // Skip delay steps - they don't produce outputs
    if (step.type !== 'procedure') return [];
    
    const stepNum = stepIndex + 1;
    const stepTitle = step.procedureData.title || `Step ${stepNum}`;
    const options: Array<{ label: string; value: string }> = [];

    // Default output variable
    options.push({
      label: `${stepTitle} → Output`,
      value: `{{step_${stepNum}.output}}`,
    });

    // Check if procedure has INPUT step with fields
    const inputStep = step.procedureData.steps?.find(s => s.action === "INPUT");
    if (inputStep?.config?.fields && Array.isArray(inputStep.config.fields)) {
      inputStep.config.fields.forEach((field: string) => {
        options.push({
          label: `${stepTitle} → ${field}`,
          value: `{{step_${stepNum}.${field}}}`,
        });
      });
    }

    // Check for outputVariableName in steps
    step.procedureData.steps?.forEach((s) => {
      if (s.config?.outputVariableName) {
        options.push({
          label: `${stepTitle} → ${s.config.outputVariableName}`,
          value: `{{step_${stepNum}.${s.config.outputVariableName}}}`,
        });
      }
    });

    return options;
  });

  const handleSelectVariable = (variableValue: string) => {
    onChange(variableValue);
    setInputValue(variableValue);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    onChange("");
    setInputValue("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Link2 className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-20 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && variableOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Available Variables
              </div>
              {variableOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectVariable(option.value)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-2"
                >
                  <Link2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-slate-500 font-mono">{option.value}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

