"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export function CreatableSelect({
  value,
  onChange,
  options,
  placeholder = "Select or type to create...",
  helperText,
  className = "",
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update filtered options based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())
      );
      // Add current input as a creatable option if it doesn't exist
      const inputLower = inputValue.toLowerCase().trim();
      const exists = options.some(
        (opt) => opt.value.toLowerCase() === inputLower || opt.label.toLowerCase() === inputLower
      );
      if (!exists && inputLower) {
        filtered.push({ value: inputValue.trim(), label: `Create "${inputValue.trim()}"` });
      }
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options]);

  // Set input value when value prop changes
  useEffect(() => {
    const selectedOption = options.find((opt) => opt.value === value);
    setInputValue(selectedOption ? selectedOption.label : value);
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If inputValue doesn't match any option, use it as the value
        if (inputValue.trim() && !options.find((opt) => opt.value === inputValue.trim())) {
          onChange(inputValue.trim());
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, options, onChange]);

  const handleSelect = (optionValue: string, optionLabel: string) => {
    setInputValue(optionLabel);
    onChange(optionValue);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    onChange("");
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 pr-20 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
          placeholder={placeholder}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-200 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value, option.label)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                    value === option.value ? "bg-blue-50 font-semibold" : ""
                  } ${
                    option.label.startsWith("Create") ? "text-blue-600 font-medium" : "text-slate-900"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {helperText && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

