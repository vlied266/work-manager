"use client";

import { useRef } from "react";
import { VariablePicker } from "./variable-picker";
import { AtomicStep, Procedure } from "@/types/schema";

interface VariableInputProps {
  type?: "input" | "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  allSteps: AtomicStep[];
  currentStepId: string;
  procedureTrigger?: Procedure["trigger"];
  [key: string]: any; // Allow other input props
}

export function VariableInput({
  type = "input",
  value,
  onChange,
  placeholder,
  className = "",
  rows,
  allSteps,
  currentStepId,
  procedureTrigger,
  ...inputProps
}: VariableInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleVariableSelect = (variable: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = value || "";
      const newValue = currentValue.slice(0, start) + variable + currentValue.slice(end);
      
      onChange(newValue);
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + variable.length, start + variable.length);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      // Fallback: just append
      onChange(value ? `${value} ${variable}` : variable);
    }
  };

  const baseInputClasses = "w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all";
  const textareaClasses = baseInputClasses + " resize-none font-mono";
  const inputClasses = baseInputClasses;

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        {type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows || 4}
            className={`${textareaClasses} flex-1 ${className}`}
            {...inputProps}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${inputClasses} flex-1 ${className}`}
            {...inputProps}
          />
        )}
        <div className={`flex-shrink-0 ${type === "textarea" ? "pt-3" : "pt-0"}`}>
          <VariablePicker
            allSteps={allSteps}
            currentStepId={currentStepId}
            procedureTrigger={procedureTrigger}
            onSelect={handleVariableSelect}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
}

