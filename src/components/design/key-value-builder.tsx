"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { VariableInput } from "@/components/studio/variable-input";
import { AtomicStep, Procedure } from "@/types/schema";

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueBuilderProps {
  value?: Record<string, any> | null;
  onChange: (value: Record<string, any> | undefined) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  keyLabel?: string;
  valueLabel?: string;
  availableVariables?: Array<{ variableName: string; label: string }>;
  allowEmpty?: boolean;
  // New props for VariableInput integration
  allSteps?: AtomicStep[];
  currentStepId?: string;
  procedureTrigger?: Procedure["trigger"];
}

export function KeyValueBuilder({
  value,
  onChange,
  keyPlaceholder = "Key (e.g., clientName)",
  valuePlaceholder = "Value (e.g., {{step_1.name}})",
  keyLabel = "Key",
  valueLabel = "Value",
  availableVariables = [],
  allowEmpty = false,
  allSteps = [],
  currentStepId = "",
  procedureTrigger,
}: KeyValueBuilderProps) {
  // Convert object to array of pairs
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    if (!value || typeof value !== "object") {
      return allowEmpty ? [] : [{ key: "", value: "" }];
    }
    const entries = Object.entries(value).map(([k, v]) => ({
      key: k,
      value: typeof v === "string" ? v : JSON.stringify(v),
    }));
    return entries.length > 0 ? entries : (allowEmpty ? [] : [{ key: "", value: "" }]);
  });

  // Track the last value we sent to parent to prevent infinite loops
  const lastSentValueRef = useRef<string>("");

  // Sync pairs when value prop changes from parent (but only if different)
  // Use a ref to track the last value we received to prevent unnecessary updates
  const lastReceivedValueRef = useRef<string>("");
  
  useEffect(() => {
    const currentValueStr = JSON.stringify(value || {});
    
    // Only sync if the value prop actually changed from outside
    if (currentValueStr === lastReceivedValueRef.current) {
      return;
    }
    
    lastReceivedValueRef.current = currentValueStr;
    
    if (!value || typeof value !== "object") {
      const newPairs = allowEmpty ? [] : [{ key: "", value: "" }];
      setPairs(newPairs);
      return;
    }
    
    const entries = Object.entries(value).map(([k, v]) => ({
      key: k,
      value: typeof v === "string" ? v : JSON.stringify(v),
    }));
    const newPairs = entries.length > 0 ? entries : (allowEmpty ? [] : [{ key: "", value: "" }]);
    setPairs(newPairs);
  }, [value, allowEmpty]);

  // Update parent when pairs change
  useEffect(() => {
    const obj: Record<string, any> = {};
    let hasValidPairs = false;

    pairs.forEach((pair) => {
      if (pair.key.trim()) {
        // Try to parse value as JSON if it looks like JSON, otherwise keep as string
        let parsedValue: any = pair.value;
        if (pair.value.trim().startsWith("{") || pair.value.trim().startsWith("[")) {
          try {
            parsedValue = JSON.parse(pair.value);
          } catch {
            // Not valid JSON, keep as string
            parsedValue = pair.value;
          }
        }
        obj[pair.key.trim()] = parsedValue;
        hasValidPairs = true;
      }
    });

    const newValue = Object.keys(obj).length > 0 ? obj : undefined;
    const newValueStr = JSON.stringify(newValue || {});
    
    // Only call onChange if the value actually changed and we haven't sent this value before
    if (newValueStr !== lastSentValueRef.current && (hasValidPairs || allowEmpty)) {
      lastSentValueRef.current = newValueStr;
      // Also update the received value ref to prevent sync effect from running when parent updates
      lastReceivedValueRef.current = newValueStr;
      onChange(newValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs, allowEmpty]);

  const addPair = () => {
    setPairs([...pairs, { key: "", value: "" }]);
  };

  const removePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs.length > 0 ? newPairs : (allowEmpty ? [] : [{ key: "", value: "" }]));
  };

  const updatePair = (index: number, field: "key" | "value", newValue: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: newValue };
    setPairs(newPairs);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">{keyLabel} / {valueLabel}</span>
        </div>
        <button
          type="button"
          onClick={addPair}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </button>
      </div>

      <div className="space-y-2">
        {pairs.map((pair, index) => (
          <div key={index} className="flex items-start gap-2 group">
            <div className="flex-1">
              <input
                type="text"
                value={pair.key}
                onChange={(e) => updatePair(index, "key", e.target.value)}
                placeholder={keyPlaceholder}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="flex-1">
              {allSteps.length > 0 && currentStepId ? (
                <VariableInput
                  type="input"
                  value={pair.value}
                  onChange={(val) => updatePair(index, "value", val || "")}
                  placeholder={valuePlaceholder}
                  allSteps={allSteps}
                  currentStepId={currentStepId}
                  procedureTrigger={procedureTrigger}
                  className="font-mono text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={pair.value}
                  onChange={(e) => updatePair(index, "value", e.target.value)}
                  placeholder={valuePlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removePair(index)}
              className="mt-0.5 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Remove row"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {pairs.length === 0 && (
        <div className="text-center py-4 text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
          No mappings yet. Click "Add Row" to start.
        </div>
      )}
    </div>
  );
}

