"use client";

import { useEffect, useState } from "react";
import { AtomicStep, AtomicAction, ATOMIC_ACTION_METADATA, Team, UserProfile } from "@/types/schema";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { Users, User, ShieldCheck, Upload, CheckCircle2, Calculator, Sparkles, AlertTriangle, Info, HelpCircle } from "lucide-react";
import { MagicInput } from "@/components/studio/magic-input";

interface ConfigPanelProps {
  step: AtomicStep | null;
  allSteps: AtomicStep[];
  onUpdate: (updates: Partial<AtomicStep>) => void;
  validationError?: string | null;
}

export function ConfigPanel({ step, allSteps, onUpdate, validationError }: ConfigPanelProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context

  // Fetch teams and users for assignment
  useEffect(() => {
    const teamsQuery = query(
      collection(db, "teams"),
      where("organizationId", "==", organizationId)
    );

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

    const usersQuery = query(
      collection(db, "users"),
      where("organizationId", "==", organizationId)
    );

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
            organizationId: data.organizationId || organizationId,
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
      unsubscribeTeams();
      unsubscribeUsers();
    };
  }, [organizationId]);

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


  const metadata = ATOMIC_ACTION_METADATA[step.action];
  const IconComponent = (LucideIcons as any)[metadata.icon] || LucideIcons.Type;

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
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{metadata.label}</p>
        </div>
      </div>

      <div className="relative space-y-8">
        {/* Basic Info - Grouped */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Basic Information
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Step Title
              </label>
              <input
                type="text"
                value={step.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter step title"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                Variable name for referencing this step's data later
              </p>
            </div>
          </div>
        </div>

        {/* Responsibility Section 👤 */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Responsibility
          </h3>
          <div className="rounded-xl bg-slate-50/50 p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Assignment Type
              </label>
              <select
                value={
                  step.assignment?.type || 
                  (step.assigneeType === "TEAM" ? "TEAM_QUEUE" : step.assigneeType === "SPECIFIC_USER" ? "SPECIFIC_USER" : "STARTER")
                }
                onChange={(e) => {
                  const assignmentType = e.target.value as "STARTER" | "SPECIFIC_USER" | "TEAM_QUEUE";
                  onUpdate({
                    assignment: {
                      type: assignmentType,
                      assigneeId: assignmentType === "STARTER" ? undefined : step.assignment?.assigneeId || step.assigneeId,
                    },
                    // Legacy support
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

            {(step.assignment?.type === "SPECIFIC_USER" || step.assigneeType === "SPECIFIC_USER") && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Select User
                </label>
                <select
                  value={step.assignment?.assigneeId || step.assigneeId || ""}
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

        {/* Evidence Requirement Section 📎 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Evidence
          </h3>
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
        </div>

        {/* AI Automation Toggle */}
        {(step.action === "GENERATE" || step.action === "TRANSFORM" || step.action === "ORGANISE" || step.action === "CALCULATE") && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">AI Automation</h3>
                    <p className="text-xs text-slate-600">Let AI complete this task automatically</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step.config.isAiAutomated || false}
                    onChange={(e) =>
                      onUpdate({ config: { ...step.config, isAiAutomated: e.target.checked } })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action-specific Configuration - Natural Language */}
        <div className="space-y-4">
          {renderActionConfig(step, availableVariablesLegacy, onUpdate, allSteps)}
        </div>

        {/* Flow Logic (Routing) */}
        <div className="space-y-4 mt-6 pt-6 border-t border-white/20">
          <h3 className="text-sm font-semibold text-slate-900">Flow Logic</h3>
          {renderFlowLogic(step, allSteps, onUpdate)}
        </div>
      </div>
    </motion.div>
  );
}

function renderActionConfig(
  step: AtomicStep,
  availableVariablesLegacy: { value: string; label: string }[],
  onUpdate: (updates: Partial<AtomicStep>) => void,
  allSteps: AtomicStep[]
) {
  const { action, config } = step;
  
  // Get available variables in the new format
  const currentStepIndex = allSteps.findIndex((s) => s.id === step.id);
  const previousSteps = allSteps.slice(0, currentStepIndex);
  
  const availableVariables = previousSteps.map((s, idx) => ({
    id: s.id,
    label: `Step ${idx + 1}: ${s.title}`,
    type: s.action,
    variableName: s.config.outputVariableName || `step_${idx + 1}_output`,
  }));

  switch (action) {
    case "INPUT":
      return (
        <div className="space-y-6">
          {/* Natural Language Header */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <LucideIcons.MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">What information do you need?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tell us what question to ask the operator. They'll see this on their mobile device.
            </p>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Question text <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.fieldLabel || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, fieldLabel: e.target.value } })
              }
              className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 focus:ring-1 focus:ring-black/5 focus:bg-white/70 transition-all"
              placeholder="e.g., Enter the oven temperature"
            />
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <LucideIcons.Info className="h-3 w-3" />
              This is exactly what the operator will see on their screen
            </p>
          </div>

          {/* Data Type - Natural Language */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              What type of answer? <span className="text-rose-500">*</span>
            </label>
            <select
              value={config.inputType || "text"}
              onChange={(e) =>
                onUpdate({ config: { ...config, inputType: e.target.value as any } })
              }
              className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 focus:ring-1 focus:ring-black/5 focus:bg-white/70 transition-all"
            >
              <option value="text">Text (words or sentences)</option>
              <option value="number">Number (e.g., 350, 12.5)</option>
              <option value="email">Email address</option>
              <option value="date">Date</option>
              <option value="file">File Upload</option>
              <option value="table">Table (multiple rows)</option>
            </select>
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <LucideIcons.Info className="h-3 w-3" />
              Choose how the operator should answer your question
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Placeholder
            </label>
            <input
              type="text"
              value={config.placeholder || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, placeholder: e.target.value } })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter placeholder text"
            />
          </div>

          {/* Required Toggle */}
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
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {config.inputType === "table" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-900">Table Configuration</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Rows
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.tableConfig?.rows || 3}
                    onChange={(e) =>
                      onUpdate({
                        config: {
                          ...config,
                          tableConfig: {
                            ...config.tableConfig,
                            rows: parseInt(e.target.value) || 3,
                            columns: config.tableConfig?.columns || 3,
                            headers: config.tableConfig?.headers || [],
                          },
                        },
                      })
                    }
                    className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={config.tableConfig?.columns || 3}
                    onChange={(e) => {
                      const newColumns = parseInt(e.target.value) || 3;
                      const currentHeaders = config.tableConfig?.headers || [];
                      const newHeaders = Array(newColumns)
                        .fill("")
                        .map((_, idx) => currentHeaders[idx] || "");
                      onUpdate({
                        config: {
                          ...config,
                          tableConfig: {
                            ...config.tableConfig,
                            columns: newColumns,
                            rows: config.tableConfig?.rows || 3,
                            headers: newHeaders,
                          },
                        },
                      });
                    }}
                    className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Headers (comma-separated)
                </label>
                <input
                  type="text"
                  value={config.tableConfig?.headers?.join(", ") || ""}
                  onChange={(e) => {
                    const headers = e.target.value
                      .split(",")
                      .map((h) => h.trim())
                      .filter((h) => h.length > 0);
                    onUpdate({
                      config: {
                        ...config,
                        tableConfig: {
                          ...config.tableConfig,
                          headers,
                          rows: config.tableConfig?.rows || 3,
                          columns: config.tableConfig?.columns || 3,
                        },
                      },
                    });
                  }}
                  placeholder="e.g., Name, Email, Phone"
                  className="w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter column headers separated by commas
                </p>
              </div>
            </div>
          )}

          {/* File Upload Specific Config */}
          {config.inputType === "file" && (
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <LucideIcons.Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">What file is required?</h3>
                  <p className="text-xs text-slate-600">Configure the upload button and allowed file types</p>
                </div>
              </div>
              
              {/* Button Label - Natural Language */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Button Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.buttonLabel || ""}
                  onChange={(e) =>
                    onUpdate({ config: { ...config, buttonLabel: e.target.value } })
                  }
                  className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 focus:ring-1 focus:ring-black/5 focus:bg-white/70 transition-all"
                  placeholder="e.g., Upload Invoice"
                />
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                  <LucideIcons.Info className="h-3 w-3" />
                  This text appears on the upload button
                </p>
              </div>

              {/* Allowed File Types */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Allowed File Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["PDF", "Excel", "Word", "Image", "CSV", "JSON"].map((type) => {
                    const ext = type.toLowerCase();
                    const isSelected = config.allowedExtensions?.includes(ext) || false;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const current = config.allowedExtensions || [];
                          const updated = isSelected
                            ? current.filter((e) => e !== ext)
                            : [...current, ext];
                          onUpdate({ config: { ...config, allowedExtensions: updated } });
                        }}
                        className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-100 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Select which file types users can upload
                </p>
              </div>

              {/* Data Extraction */}
              <div className="pt-4 border-t border-blue-200">
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Extract Data From File
                </label>
                <select
                  value={config.extractionRule || ""}
                  onChange={(e) =>
                    onUpdate({
                      config: { ...config, extractionRule: e.target.value || undefined },
                    })
                  }
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="">No extraction (store file only)</option>
                  <option value="Parse CSV">Parse CSV - Extract all data</option>
                  <option value="Extract CSV Column">Extract CSV Column</option>
                  <option value="OCR Text">OCR Text (from images)</option>
                </select>
                {config.extractionRule === "Extract CSV Column" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={config.extractionConfig?.csvColumn || ""}
                      onChange={(e) =>
                        onUpdate({
                          config: {
                            ...config,
                            extractionConfig: {
                              ...config.extractionConfig,
                              csvColumn: e.target.value || undefined,
                            },
                          },
                        })
                      }
                      placeholder="e.g., Price, Amount, Total"
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Validation Regex (optional)
            </label>
            <input
              type="text"
              value={config.validationRegex || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, validationRegex: e.target.value || undefined } })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="^[A-Z0-9]+$"
            />
          </div>
        </div>
      );

    case "COMPARE":
      return (
        <div className="space-y-6">
          {/* Natural Language Header */}
          <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <LucideIcons.GitCompare className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">The Logic Builder</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create a rule that checks if two values match. The workflow will continue based on the result.
            </p>
          </div>

          {/* Sentence Builder UI */}
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900 mb-4">Check if:</p>
              
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <MagicInput
                    value={config.targetA || ""}
                    onChange={(value) =>
                      onUpdate({ config: { ...config, targetA: value || undefined } })
                    }
                    placeholder="First value..."
                    availableVariables={availableVariables}
                    label=""
                    helpText=""
                  />
                </div>
                
                <span className="text-sm font-semibold text-slate-700">is</span>
                
                <select
                  value={config.comparisonType || "exact"}
                  onChange={(e) =>
                    onUpdate({ config: { ...config, comparisonType: e.target.value as any } })
                  }
                  className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                >
                  <option value="exact">Equal To</option>
                  <option value="numeric">Greater Than</option>
                  <option value="numeric">Less Than</option>
                  <option value="fuzzy">Similar To</option>
                </select>
                
                <div className="flex-1 min-w-[120px]">
                  <MagicInput
                    value={config.targetB || ""}
                    onChange={(value) =>
                      onUpdate({ config: { ...config, targetB: value || undefined } })
                    }
                    placeholder="Second value..."
                    availableVariables={availableVariables}
                    label=""
                    helpText=""
                  />
                </div>
              </div>
            </div>

            {/* Force Explanation Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-1">
                  If it fails, force user to explain?
                </label>
                <p className="text-xs text-slate-600">
                  When the comparison fails, ask the operator why
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireMismatchReason || false}
                  onChange={(e) =>
                    onUpdate({ config: { ...config, requireMismatchReason: e.target.checked } })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      );

    case "GENERATE":
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">💡 Generate Content</p>
            <p className="text-xs text-blue-700">
              Configure how content should be generated (e.g., documents, reports, emails)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Template
            </label>
            <textarea
              value={config.template || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, template: e.target.value || undefined } })
              }
              rows={6}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter template content...&#10;&#10;You can use variables from previous steps:&#10;{{step_1_output}} or {{invoice_total}}&#10;&#10;Example:&#10;Dear {{customer_name}},&#10;Your invoice for {{invoice_amount}} is ready."
            />
            <p className="mt-1 text-xs text-slate-500">
              Use double curly braces for variables: {"{{variable_name}}"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Output Format
            </label>
            <select
              value={config.outputFormat || "text"}
              onChange={(e) =>
                onUpdate({ config: { ...config, outputFormat: e.target.value as any } })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="text">Plain Text</option>
              <option value="document">Document (PDF/DOCX)</option>
              <option value="image">Image</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Select the format for the generated content
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Instructions (optional)
            </label>
            <textarea
              value={config.instructions || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, instructions: e.target.value || undefined } })
              }
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Additional instructions for content generation..."
            />
            <p className="mt-1 text-xs text-slate-500">
              Provide additional context or instructions for the generation process
            </p>
          </div>

          {availableVariables.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-900 mb-2">Available Variables</p>
              <div className="space-y-1">
                {availableVariables.map((v) => (
                  <div key={v.value} className="text-xs text-green-700 font-mono">
                    {"{{" + v.value + "}}"}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-green-600">
                Copy these variable names into your template
              </p>
            </div>
          )}
        </div>
      );

    case "GATEWAY":
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">💡 Gateway Logic</p>
            <p className="text-xs text-blue-700">
              Define conditions to route the flow to different steps
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Default Next Step (Else)
            </label>
            <select
              value={config.gatewayDefaultStepId || ""}
              onChange={(e) =>
                onUpdate({
                  config: { ...config, gatewayDefaultStepId: e.target.value || undefined },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select step...</option>
              <option value="COMPLETED">Complete Process</option>
              {allSteps
                .filter((s) => s.id !== step.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Conditions
            </label>
            {(config.gatewayConditions || []).map((condition, idx) => (
              <div key={idx} className="mb-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <select
                    value={condition.variable}
                    onChange={(e) => {
                      const newConditions = [...(config.gatewayConditions || [])];
                      newConditions[idx] = { ...condition, variable: e.target.value };
                      onUpdate({ config: { ...config, gatewayConditions: newConditions } });
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                  >
                    <option value="">Variable...</option>
                    {availableVariables.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={condition.operator}
                    onChange={(e) => {
                      const newConditions = [...(config.gatewayConditions || [])];
                      newConditions[idx] = { ...condition, operator: e.target.value as any };
                      onUpdate({ config: { ...config, gatewayConditions: newConditions } });
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
                      const newConditions = [...(config.gatewayConditions || [])];
                      newConditions[idx] = { ...condition, value: e.target.value };
                      onUpdate({ config: { ...config, gatewayConditions: newConditions } });
                    }}
                    placeholder="Value"
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                  />
                </div>
                <select
                  value={condition.targetStepId}
                  onChange={(e) => {
                    const newConditions = [...(config.gatewayConditions || [])];
                    newConditions[idx] = { ...condition, targetStepId: e.target.value };
                    onUpdate({ config: { ...config, gatewayConditions: newConditions } });
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs mb-2"
                >
                  <option value="">Then go to...</option>
                  {allSteps
                    .filter((s) => s.id !== step.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    const newConditions = (config.gatewayConditions || []).filter(
                      (_, i) => i !== idx
                    );
                    onUpdate({ config: { ...config, gatewayConditions: newConditions } });
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newConditions = [
                  ...(config.gatewayConditions || []),
                  { variable: "", operator: "==" as const, value: "", targetStepId: "" },
                ];
                onUpdate({ config: { ...config, gatewayConditions: newConditions } });
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + Add Condition
            </button>
          </div>
        </div>
      );

    case "AUTHORIZE":
      return (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <LucideIcons.ShieldCheck className="h-4 w-4 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Approval Configuration</p>
            </div>
            <p className="text-xs text-green-700 leading-relaxed">
              Configure approval requirements and instructions for the approver
            </p>
          </div>

          {/* Instructions Textarea - Natural Language */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              What should the approver review? <span className="text-rose-500">*</span>
              <div className="group relative">
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 rounded-lg bg-slate-900 text-white text-xs p-3 shadow-xl z-50">
                  <p>Tell the approver exactly what to check. Be specific: "Verify that the invoice amount matches the purchase order."</p>
                  <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-slate-900" />
                </div>
              </div>
            </label>
            <textarea
              value={config.instruction || config.instructions || ""}
              onChange={(e) =>
                onUpdate({
                  config: {
                    ...config,
                    instruction: e.target.value,
                    instructions: e.target.value,
                  },
                })
              }
              rows={6}
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
              placeholder="Enter detailed instructions for the approver...&#10;&#10;Example:&#10;Please review the invoice details and verify that:&#10;1. Amount matches the purchase order&#10;2. Vendor information is correct&#10;3. All required documents are attached"
            />
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <Info className="h-3 w-3" />
              This is exactly what the approver will see on their screen
            </p>
          </div>

          {/* Require Signature Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-0.5">
                Require Digital Signature
              </label>
              <p className="text-xs text-slate-600">
                Approver must provide a digital signature to complete this step
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireSignature || false}
                onChange={(e) =>
                  onUpdate({ config: { ...config, requireSignature: e.target.checked } })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Approval Level (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              Approval Level (Optional)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.approvalLevel || ""}
              onChange={(e) =>
                onUpdate({
                  config: {
                    ...config,
                    approvalLevel: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              placeholder="e.g., 1, 2, 3"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Set approval hierarchy level (1 = first approver, 2 = second, etc.)
            </p>
          </div>
        </div>
      );

    case "VALIDATE":
      return (
        <div className="space-y-6">
          {/* Natural Language Header */}
          <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <LucideIcons.CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check if data follows a rule</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create a validation rule. If the data doesn't match, the workflow can stop or ask for correction.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              Validation Rule
            </label>
            <select
              value={config.rule || "EQUAL"}
              onChange={(e) =>
                onUpdate({ config: { ...config, rule: e.target.value as any } })
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="GREATER_THAN">Greater Than</option>
              <option value="LESS_THAN">Less Than</option>
              <option value="EQUAL">Equal</option>
              <option value="CONTAINS">Contains</option>
              <option value="REGEX">Regex Pattern</option>
            </select>
          </div>

          <MagicInput
            value={config.target || ""}
            onChange={(value) =>
              onUpdate({ config: { ...config, target: value || undefined } })
            }
            placeholder="e.g., step_1_output, invoice_amount"
            availableVariables={availableVariables}
            label="Value to Check"
            helpText="Select variable from previous step or enter manually"
          />

          <MagicInput
            value={config.value ? String(config.value) : ""}
            onChange={(value) =>
              onUpdate({ config: { ...config, value: value || undefined } })
            }
            placeholder="e.g., 100, 'approved', {{step_2_status}}"
            availableVariables={availableVariables}
            label="Expected Value"
            helpText="The value to compare against (can be a variable or literal)"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              Error Message
            </label>
            <input
              type="text"
              value={config.errorMessage || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, errorMessage: e.target.value || undefined } })
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              placeholder="e.g., Validation failed: Amount is too high"
            />
          </div>
        </div>
      );

    case "CALCULATE":
      return (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <LucideIcons.Calculator className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-semibold text-purple-900">Calculation Configuration</p>
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              Define mathematical formulas using variables from previous steps
            </p>
          </div>

          <MagicInput
            value={config.formula || ""}
            onChange={(value) =>
              onUpdate({ config: { ...config, formula: value || undefined } })
            }
            placeholder="e.g., {{step_1_amount}} * 1.1, {{step_2_total}} + {{step_3_tax}}"
            availableVariables={availableVariables}
            label="Formula *"
            helpText="Use variables from previous steps in your formula (e.g., {{step_1_output}} * 2)"
          />

          {availableVariables.length > 0 && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <p className="text-xs font-semibold text-purple-900 mb-2">Available Variables</p>
              <div className="space-y-1">
                {availableVariables.map((v) => (
                  <div key={v.id} className="text-xs text-purple-700 font-mono">
                    {"{{" + v.variableName + "}}"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "TRANSMIT":
      return (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <LucideIcons.Upload className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Transmission Configuration</p>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Configure how data should be sent to external destinations
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              HTTP Method
            </label>
            <select
              value={config.method || "POST"}
              onChange={(e) =>
                onUpdate({ config: { ...config, method: e.target.value as any } })
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              Destination URL
            </label>
            <input
              type="text"
              value={config.destinationUrl || ""}
              onChange={(e) =>
                onUpdate({ config: { ...config, destinationUrl: e.target.value || undefined } })
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="e.g., https://api.example.com/webhook"
            />
          </div>

          <MagicInput
            value={config.recipientEmail || ""}
            onChange={(value) =>
              onUpdate({ config: { ...config, recipientEmail: value || undefined } })
            }
            placeholder="e.g., user@example.com, {{step_1_email}}"
            availableVariables={availableVariables}
            label="Recipient Email (Optional)"
            helpText="Email address or variable from previous step (e.g., {{step_1_customer_email}})"
          />
        </div>
      );

    default:
      return (
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center">
          <LucideIcons.Settings className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Configuration Coming Soon
          </p>
          <p className="text-xs text-slate-500">
            Configuration options for {ATOMIC_ACTION_METADATA[action].label} will be available soon.
          </p>
        </div>
      );
  }
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
              value={condition.targetStepId}
              onChange={(e) => {
                const newConditions = [...(routes.conditions || [])];
                newConditions[idx] = { ...condition, targetStepId: e.target.value };
                onUpdate({ routes: { ...routes, conditions: newConditions } });
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
            const newConditions = [
              ...(routes.conditions || []),
              { variable: "", operator: "==" as const, value: "", targetStepId: "" },
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

