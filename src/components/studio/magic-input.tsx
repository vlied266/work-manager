"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AtomicStep } from "@/types/schema";

interface VariableOption {
  id: string;
  label: string;
  type: string;
  variableName: string;
}

interface MagicInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  availableVariables: VariableOption[];
  className?: string;
  label?: string;
  helpText?: string;
}

export function MagicInput({
  value,
  onChange,
  placeholder = "Enter value or select variable...",
  availableVariables,
  className = "",
  label,
  helpText,
}: MagicInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse variable references from the value
  const parseVariables = (text: string): Array<{ start: number; end: number; variable: string }> => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches: Array<{ start: number; end: number; variable: string }> = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        variable: match[1].trim(),
      });
    }
    return matches;
  };

  const variables = parseVariables(inputValue);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVariableSelect = (variable: VariableOption) => {
    const variableRef = `{{${variable.variableName}}}`;
    const newValue = inputValue ? `${inputValue} ${variableRef}` : variableRef;
    setInputValue(newValue);
    onChange(newValue);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleRemoveVariable = (variableText: string) => {
    const newValue = inputValue.replace(`{{${variableText}}}`, "").trim();
    setInputValue(newValue);
    onChange(newValue);
  };

  // Render variable pills below input
  const renderVariablePills = () => {
    if (variables.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {variables.map(({ variable }, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200"
          >
            <span>{"{{" + variable + "}}"}</span>
            <button
              type="button"
              onClick={() => handleRemoveVariable(variable)}
              className="hover:bg-blue-200 rounded p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-900">{label}</label>
      )}
      <div className="relative">
        <div
          className={`flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all ${className}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
            title="Insert variable from previous step"
          >
            <Zap className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
        {renderVariablePills()}

        {/* Variable Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 w-full rounded-xl border-2 border-slate-200 bg-white shadow-xl overflow-hidden"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 mb-2">
                  Previous Steps
                </div>
                {availableVariables.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-slate-500">
                    No previous steps available
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable.id}
                        type="button"
                        onClick={() => handleVariableSelect(variable)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {variable.label}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {variable.variableName}
                            </div>
                          </div>
                          <Zap className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {helpText && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
    </div>
  );
}

