"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Reorder } from "framer-motion";
import { ArrowLeft, GripVertical, Plus, Save, Trash2, Workflow, Settings2, Edit2, X } from "lucide-react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  ASSIGNEE_STRATEGIES,
  DIGITAL_ACTIONS,
  INPUT_TYPES,
  PROOF_TYPES,
  ProcessStep,
  TaskCategory,
  Procedure,
} from "@/types/workos";
import { getActionMetadata } from "@/lib/digital-actions";
import { useAuth } from "@/hooks/use-auth";
import { useTeams } from "@/hooks/use-teams";
import { useOrganizationUsers } from "@/hooks/use-organization-users";
import { useProcedures } from "@/hooks/use-procedures";
import { db } from "@/lib/firebase";

const defaultConfig = () => ({
  inputType: "TEXT",
  required: true,
});

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createStep = (index: number): ProcessStep => ({
  id: `step-${index}-${generateId()}`,
  title: `Step ${index}`,
  description: "",
  assigneeType: "ANY_TEAM_MEMBER",
  assigneeId: "",
  category: "BASIC_DIGITAL",
  digitalAction: "IMPORT",
  config: defaultConfig(),
});

const categoryCopy: Record<TaskCategory, string> = {
  BASIC_DIGITAL: "Digital",
  BASIC_LABOR: "Labor",
  BASIC_CREATIVE: "Creative",
  BASIC_MACHINERY: "Machinery",
};

// Searchable Select Component
function SearchableAssigneeSelect({
  value,
  onChange,
  assigneeType,
  teams,
  users,
}: {
  value: string;
  onChange: (value: string) => void;
  assigneeType: string;
  teams: { id: string; name: string }[];
  users: { uid: string; displayName: string; email: string }[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = useMemo(() => {
    if (assigneeType === "SPECIFIC_USER") {
      return users.map((user) => ({
        id: user.uid,
        label: `${user.displayName || user.email} (${user.email})`,
        type: "user" as const,
      }));
    } else {
      return teams.map((team) => ({
        id: team.id,
        label: team.name,
        type: "team" as const,
      }));
    }
  }, [assigneeType, users, teams]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 1) {
      return options;
    }
    const query = searchQuery.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? searchQuery : selectedOption?.label || value || ""}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearchQuery("");
        }}
        placeholder={
          assigneeType === "SPECIFIC_USER"
            ? "Search user by name or email..."
            : "Search team by name..."
        }
        className="w-full rounded-2xl border border-ink/10 bg-base/60 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-ink/10 bg-white shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">
              {searchQuery.length < 1
                ? "Start typing to search..."
                : "No results found"}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className="w-full px-4 py-3 text-left text-sm text-ink hover:bg-[#007AFF]/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">
                    {option.type === "user" ? "👤" : "👥"}
                  </span>
                  <span>{option.label}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ProcedureDesigner() {
  const { firebaseUser, profile } = useAuth();
  const { teams, loading: teamsLoading } = useTeams(profile?.organizationId);
  const { users } = useOrganizationUsers();
  const { procedures, loading: proceduresLoading } = useProcedures(profile?.organizationId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [procedureName, setProcedureName] = useState("Untitled Procedure");
  const [teamId, setTeamId] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([createStep(1)]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId && teams.length) {
      setTeamId(teams[0].id);
    }
  }, [teams, teamId]);


  const addStep = () => {
    setSteps((prev) => [...prev, createStep(prev.length + 1)]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateStep = <K extends keyof ProcessStep>(index: number, key: K, value: ProcessStep[K]) => {
    setSteps((prev) => {
      const copy = [...prev];
      const next = { ...copy[index], [key]: value };

      if (key === "category" && value !== "BASIC_DIGITAL") {
        next.digitalAction = undefined;
      }
      if (key === "category" && value === "BASIC_DIGITAL" && !next.digitalAction) {
        next.digitalAction = "IMPORT";
      }

      copy[index] = next;
      return copy;
    });
  };

  const updateConfig = (index: number, configKey: keyof ProcessStep["config"], value: unknown) => {
    setSteps((prev) => {
      const copy = [...prev];
      const config = { ...(copy[index].config || {}), [configKey]: value };
      copy[index] = { ...copy[index], config };
      return copy;
    });
  };

  const validateProcedure = () => {
    if (!profile?.organizationId) {
      return "You need an organization before saving procedures.";
    }
    if (!procedureName.trim()) {
      return "Procedure name is required.";
    }
    if (!teamId) {
      return "Select a team to own this procedure.";
    }
    if (steps.length === 0) {
      return "Add at least one step.";
    }
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      if (!step.title.trim()) {
        return `Step ${i + 1} is missing a title.`;
      }
      if (!step.assigneeId.trim()) {
        return `Step ${i + 1} requires an assignee identifier.`;
      }
      if (step.category === "BASIC_DIGITAL" && !step.digitalAction) {
        return `Step ${i + 1} must specify a digital action.`;
      }
      if (
        step.category === "BASIC_DIGITAL" &&
        step.digitalAction === "COMPARE" &&
        (!step.config?.targetA || !step.config?.targetB)
      ) {
        return `Provide comparison targets for Step ${i + 1}.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationMessage = validateProcedure();
    if (validationMessage) {
      setFormError(validationMessage);
      setSuccessMessage(null);
      return;
    }

    if (!profile?.organizationId || !firebaseUser) {
      setFormError("Missing authentication context. Please sign in again.");
      setSuccessMessage(null);
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "procedures", editingId), {
          teamId,
          name: procedureName.trim(),
          description: description.trim(),
          steps,
          updatedAt: serverTimestamp(),
        });
        setSuccessMessage("Procedure updated successfully");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "procedures"), {
          organizationId: profile.organizationId,
          teamId,
          name: procedureName.trim(),
          description: description.trim(),
          steps,
          updatedAt: serverTimestamp(),
          createdBy: firebaseUser.uid,
        });
        setSuccessMessage("Procedure saved to workspace");
      }
      // Reset form
      setProcedureName("Untitled Procedure");
      setDescription("");
      setSteps([createStep(1)]);
    } catch (error) {
      console.error(error);
      setFormError("Failed to save procedure. Please try again.");
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingId(procedure.id);
    setProcedureName(procedure.name);
    setTeamId(procedure.teamId);
    setDescription(procedure.description || "");
    setSteps(procedure.steps.length > 0 ? procedure.steps : [createStep(1)]);
    setFormError(null);
    setSuccessMessage(null);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (procedureId: string) => {
    if (!confirm("Are you sure you want to delete this procedure? This action cannot be undone.")) {
      return;
    }
    setDeletingId(procedureId);
    setFormError(null);
    try {
      await deleteDoc(doc(db, "procedures", procedureId));
      setSuccessMessage("Procedure deleted successfully");
      if (editingId === procedureId) {
        setEditingId(null);
        setProcedureName("Untitled Procedure");
        setDescription("");
        setSteps([createStep(1)]);
      }
    } catch (error) {
      console.error(error);
      setFormError("Failed to delete procedure. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setProcedureName("Untitled Procedure");
    setTeamId(teams.length > 0 ? teams[0].id : "");
    setDescription("");
    setSteps([createStep(1)]);
    setFormError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-10">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 pb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <div className="flex items-center gap-3">
          {editingId && (
            <button
              type="button"
              onClick={handleNew}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#1D1D1F]/30 bg-white px-4 py-2.5 text-sm font-bold text-[#1D1D1F] shadow-sm transition-all hover:border-[#007AFF] hover:bg-[#007AFF]/10 hover:shadow-md"
            >
              <X className="h-4 w-4" />
              New
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || teamsLoading}
            className="apple-button inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:hover:shadow-lg"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : editingId ? "Update Procedure" : "Save Procedure"}
          </button>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#1D1D1F]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#1D1D1F] shadow-md transition-all hover:border-[#007AFF] hover:bg-[#007AFF]/10 hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add Step
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6 rounded-3xl bg-white/80 p-8 shadow-glass ring-1 ring-white/60 backdrop-blur-2xl">
          <div className="flex items-center gap-3 text-muted">
            <Workflow className="h-5 w-5 text-accent" />
            <p className="text-xs uppercase tracking-[0.4em]">Meta</p>
          </div>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-muted">Procedure Name</span>
              <input
                value={procedureName}
                onChange={(event) => setProcedureName(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-base text-ink shadow-subtle outline-none transition focus:border-accent"
                placeholder="Quarterly Financial Close"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-muted">Owning Team</span>
              {teamsLoading ? (
                <div className="rounded-2xl border border-ink/5 bg-base/60 px-4 py-3 text-sm text-muted">
                  Loading teams…
                </div>
              ) : teams.length ? (
                <select
                  value={teamId}
                  onChange={(event) => setTeamId(event.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink shadow-subtle outline-none transition focus:border-accent"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    value={teamId}
                    onChange={(event) => setTeamId(event.target.value)}
                    className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink shadow-subtle outline-none transition focus:border-accent"
                    placeholder="team-internal-id"
                  />
                  <p className="text-xs text-muted">
                    No teams found yet. A default team is created during onboarding; create more via Settings soon.
                  </p>
                </div>
              )}
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-muted">Description</span>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink shadow-subtle outline-none transition focus:border-accent"
                placeholder="Summarize the business outcome, references, or compliance requirements."
              />
            </label>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center gap-3 text-muted">
            <Settings2 className="h-5 w-5 text-accent" />
            <p className="text-xs uppercase tracking-[0.4em]">Step Builder</p>
          </div>

          <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-5">
            {steps.map((step, index) => (
              <Reorder.Item
                key={step.id}
                value={step}
                className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-subtle backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.5em] text-muted">Step {index + 1}</p>
                    <input
                      value={step.title}
                      onChange={(event) => updateStep(index, "title", event.target.value)}
                      className="w-full rounded-xl border border-transparent bg-transparent text-xl font-semibold text-ink outline-none focus:border-ink/10"
                      placeholder={`Step ${index + 1} title`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="rounded-2xl border-2 border-ink/20 bg-white/80 px-3 py-2 text-ink shadow-sm transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                    aria-label="Remove step"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="ml-auto flex items-center gap-2 text-muted">
                    <GripVertical className="h-5 w-5" />
                    <span className="text-xs uppercase tracking-[0.3em]">Drag</span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-muted">
                    Category
                    <select
                      value={step.category}
                      onChange={(event) =>
                        updateStep(index, "category", event.target.value as TaskCategory)
                      }
                      className="mt-1 w-full rounded-2xl border border-ink/10 bg-base/60 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                    >
                      {Object.entries(categoryCopy).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-sm text-muted">
                    Assignee Strategy
                    <select
                      value={step.assigneeType}
                      onChange={(event) =>
                        updateStep(index, "assigneeType", event.target.value as ProcessStep["assigneeType"])
                      }
                      className="mt-1 w-full rounded-2xl border border-ink/10 bg-base/60 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                    >
                      {ASSIGNEE_STRATEGIES.map((option) => (
                        <option key={option} value={option}>
                          {option.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-3 block space-y-1 text-sm text-muted">
                  {step.assigneeType === "SPECIFIC_USER" ? "Assign to User" : "Assign to Team"}
                  <SearchableAssigneeSelect
                    value={step.assigneeId}
                    onChange={(value) => updateStep(index, "assigneeId", value)}
                    assigneeType={step.assigneeType}
                    teams={teams}
                    users={users}
                  />
                </label>

                <label className="mt-3 block space-y-1 text-sm text-muted">
                  Description
                  <textarea
                    rows={3}
                    value={step.description}
                    onChange={(event) => updateStep(index, "description", event.target.value)}
                    className="w-full rounded-2xl border border-ink/10 bg-base/60 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                    placeholder="Detail the intent, references, or SOP excerpt for this step."
                  />
                </label>

                {step.category === "BASIC_DIGITAL" && (
                  <div className="mt-5 space-y-4 rounded-2xl border border-ink/5 bg-base/40 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1 text-sm text-muted">
                        Digital Action
                        <select
                          value={step.digitalAction}
                          onChange={(event) =>
                            updateStep(index, "digitalAction", event.target.value as ProcessStep["digitalAction"])
                          }
                          className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                        >
                          {DIGITAL_ACTIONS.map((action) => (
                            <option key={action} value={action}>
                              {action.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1 text-sm text-muted">
                        Input Type
                        <select
                          value={step.config?.inputType || "TEXT"}
                          onChange={(event) => updateConfig(index, "inputType", event.target.value)}
                          className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                        >
                          {INPUT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {step.digitalAction && (
                      <div className="mt-4 rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#007AFF]">
                          {getActionMetadata(step.digitalAction).label}
                        </p>
                        <p className="mt-2 text-sm text-ink">{getActionMetadata(step.digitalAction).description}</p>
                        <p className="mt-2 text-xs text-muted">
                          Example: {getActionMetadata(step.digitalAction).example}
                        </p>
                      </div>
                    )}

                    {step.digitalAction === "IMPORT" && (
                      <div className="mt-4 space-y-4">
                        <label className="space-y-1 text-sm text-muted">
                          Source Type <span className="text-red-500">*</span>
                          <select
                            value={step.config?.sourceType || ""}
                            onChange={(event) => updateConfig(index, "sourceType", event.target.value)}
                            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                          >
                            <option value="">Select source type</option>
                            <option value="INTERNAL_DB">Internal Database</option>
                            <option value="EXTERNAL_API">External API</option>
                            <option value="USER_UPLOAD">User Upload</option>
                            <option value="FILE_SYSTEM">File System</option>
                          </select>
                        </label>
                        {step.config?.sourceType === "EXTERNAL_API" && (
                          <label className="space-y-1 text-sm text-muted">
                            Source URL
                            <input
                              value={step.config?.sourceUrl || ""}
                              onChange={(event) => updateConfig(index, "sourceUrl", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                              placeholder="https://api.example.com/data"
                            />
                          </label>
                        )}
                        {step.config?.sourceType === "FILE_SYSTEM" && (
                          <label className="space-y-1 text-sm text-muted">
                            Source Path
                            <input
                              value={step.config?.sourcePath || ""}
                              onChange={(event) => updateConfig(index, "sourcePath", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                              placeholder="/path/to/file.csv"
                            />
                          </label>
                        )}
                        <label className="space-y-1 text-sm text-muted">
                          Expected Format
                          <select
                            value={step.config?.expectedFormat || ""}
                            onChange={(event) => updateConfig(index, "expectedFormat", event.target.value)}
                            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                          >
                            <option value="">Select format</option>
                            <option value="CSV">CSV</option>
                            <option value="JSON">JSON</option>
                            <option value="Excel">Excel</option>
                            <option value="XML">XML</option>
                          </select>
                        </label>
                      </div>
                    )}

                    {step.digitalAction === "ORGANISE" && (
                      <div className="mt-4 space-y-4">
                        <label className="space-y-1 text-sm text-muted">
                          Organization Rule <span className="text-red-500">*</span>
                          <textarea
                            rows={3}
                            value={step.config?.organizationRule || ""}
                            onChange={(event) => updateConfig(index, "organizationRule", event.target.value)}
                            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                            placeholder="e.g., Sort by date descending, group by category"
                          />
                        </label>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-1 text-sm text-muted">
                            Sort By
                            <input
                              value={step.config?.sortBy || ""}
                              onChange={(event) => updateConfig(index, "sortBy", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                              placeholder="date, amount, name"
                            />
                          </label>
                          <label className="space-y-1 text-sm text-muted">
                            Group By
                            <input
                              value={step.config?.groupBy || ""}
                              onChange={(event) => updateConfig(index, "groupBy", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                              placeholder="category, department"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {step.digitalAction === "CONNECT" && (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-1 text-sm text-muted">
                            Connection Type <span className="text-red-500">*</span>
                            <select
                              value={step.config?.connectionType || ""}
                              onChange={(event) => updateConfig(index, "connectionType", event.target.value)}
                              className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                            >
                              <option value="">Select type</option>
                              <option value="API">API</option>
                              <option value="DATABASE">Database</option>
                              <option value="SERVICE">Service</option>
                              <option value="FILE">File</option>
                            </select>
                          </label>
                          <label className="space-y-1 text-sm text-muted">
                            Connection Method
                            <select
                              value={step.config?.connectionMethod || "GET"}
                              onChange={(event) => updateConfig(index, "connectionMethod", event.target.value)}
                              className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                              <option value="PUT">PUT</option>
                              <option value="DELETE">DELETE</option>
                            </select>
                          </label>
                        </div>
                        <label className="space-y-1 text-sm text-muted">
                          Connection Endpoint <span className="text-red-500">*</span>
                          <input
                            value={step.config?.connectionEndpoint || ""}
                            onChange={(event) => updateConfig(index, "connectionEndpoint", event.target.value)}
                            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                            placeholder="https://api.example.com/endpoint"
                          />
                        </label>
                        {step.config?.connectionMethod === "POST" || step.config?.connectionMethod === "PUT" ? (
                          <label className="space-y-1 text-sm text-muted">
                            Request Body (JSON)
                            <textarea
                              rows={4}
                              value={step.config?.requestBody || ""}
                              onChange={(event) => updateConfig(index, "requestBody", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent font-mono"
                              placeholder='{"key": "value"}'
                            />
                          </label>
                        ) : null}
                      </div>
                    )}

                    {step.digitalAction === "COMPARE" && (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-1 text-sm text-muted">
                            Target A <span className="text-red-500">*</span>
                            <input
                              value={step.config?.targetA || ""}
                              onChange={(event) => updateConfig(index, "targetA", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                              placeholder="ledger.balance"
                            />
                          </label>
                          <label className="space-y-1 text-sm text-muted">
                            Target B <span className="text-red-500">*</span>
                            <input
                              value={step.config?.targetB || ""}
                              onChange={(event) => updateConfig(index, "targetB", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                              placeholder="bank.statement"
                            />
                          </label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-1 text-sm text-muted">
                            Comparison Type
                            <select
                              value={step.config?.comparisonType || "EXACT"}
                              onChange={(event) => updateConfig(index, "comparisonType", event.target.value)}
                              className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                            >
                              <option value="EXACT">Exact Match</option>
                              <option value="FUZZY">Fuzzy Match</option>
                              <option value="NUMERIC">Numeric (with tolerance)</option>
                              <option value="DATE">Date Comparison</option>
                            </select>
                          </label>
                          {step.config?.comparisonType === "NUMERIC" && (
                            <label className="space-y-1 text-sm text-muted">
                              Tolerance
                              <input
                                type="number"
                                value={step.config?.tolerance || 0}
                                onChange={(event) => updateConfig(index, "tolerance", parseFloat(event.target.value) || 0)}
                                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                                placeholder="0.01"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    {step.digitalAction === "APPLY_RULE" && (
                      <div className="mt-4 space-y-4">
                        <label className="space-y-1 text-sm text-muted">
                          Rule Type <span className="text-red-500">*</span>
                          <select
                            value={step.config?.ruleType || ""}
                            onChange={(event) => updateConfig(index, "ruleType", event.target.value)}
                            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                          >
                            <option value="">Select rule type</option>
                            <option value="VALIDATION">Validation</option>
                            <option value="TRANSFORMATION">Transformation</option>
                            <option value="CALCULATION">Calculation</option>
                            <option value="CONDITIONAL">Conditional Logic</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-sm text-muted">
                          Rule Definition <span className="text-red-500">*</span>
                          <textarea
                            rows={4}
                            value={step.config?.ruleDefinition || ""}
                            onChange={(event) => updateConfig(index, "ruleDefinition", event.target.value)}
                            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent font-mono"
                            placeholder="e.g., if amount > 1000 then flag, or calculate tax = amount * 0.1"
                          />
                        </label>
                      </div>
                    )}

                    {step.digitalAction === "CONCLUDE" && (
                      <div className="mt-4 space-y-4">
                        <label className="space-y-1 text-sm text-muted">
                          Conclusion Type <span className="text-red-500">*</span>
                          <select
                            value={step.config?.conclusionType || ""}
                            onChange={(event) => updateConfig(index, "conclusionType", event.target.value)}
                            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                          >
                            <option value="">Select type</option>
                            <option value="APPROVE">Approve</option>
                            <option value="REJECT">Reject</option>
                            <option value="FLAG">Flag for Review</option>
                            <option value="CONTINUE">Continue to Next Step</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-sm text-muted">
                          Conclusion Criteria <span className="text-red-500">*</span>
                          <textarea
                            rows={3}
                            value={step.config?.conclusionCriteria || ""}
                            onChange={(event) => updateConfig(index, "conclusionCriteria", event.target.value)}
                            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                            placeholder="e.g., If all validations pass, approve; otherwise flag"
                          />
                        </label>
                      </div>
                    )}

                    {step.digitalAction === "FINALISE" && (
                      <div className="mt-4 space-y-4">
                        <label className="space-y-1 text-sm text-muted">
                          Finalization Action <span className="text-red-500">*</span>
                          <select
                            value={step.config?.finalizationAction || ""}
                            onChange={(event) => updateConfig(index, "finalizationAction", event.target.value)}
                            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                          >
                            <option value="">Select action</option>
                            <option value="SAVE">Save to Database</option>
                            <option value="ARCHIVE">Archive</option>
                            <option value="PUBLISH">Publish</option>
                            <option value="NOTIFY">Send Notification</option>
                          </select>
                        </label>
                        {step.config?.finalizationAction && (
                          <label className="space-y-1 text-sm text-muted">
                            Finalization Target
                            <input
                              value={step.config?.finalizationTarget || ""}
                              onChange={(event) => updateConfig(index, "finalizationTarget", event.target.value)}
                              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                              placeholder="e.g., orders table, archive folder, notification channel"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {step.digitalAction === "REPORT" && (
                      <div className="mt-4 space-y-4">
                        <label className="space-y-1 text-sm text-muted">
                          Report Format <span className="text-red-500">*</span>
                          <select
                            value={step.config?.reportFormat || ""}
                            onChange={(event) => updateConfig(index, "reportFormat", event.target.value)}
                            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                          >
                            <option value="">Select format</option>
                            <option value="PDF">PDF</option>
                            <option value="EXCEL">Excel</option>
                            <option value="JSON">JSON</option>
                            <option value="HTML">HTML</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-sm text-muted">
                          Report Template
                          <input
                            value={step.config?.reportTemplate || ""}
                            onChange={(event) => updateConfig(index, "reportTemplate", event.target.value)}
                            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                            placeholder="Template reference or path"
                          />
                        </label>
                      </div>
                    )}

                    <label className="mt-4 flex items-center gap-3 text-sm font-medium text-muted">
                      <input
                        type="checkbox"
                        checked={step.config?.required ?? true}
                        onChange={(event) => updateConfig(index, "required", event.target.checked)}
                        className="h-4 w-4 rounded border-ink/20 text-accent focus:ring-accent"
                      />
                      Evidence required to progress
                    </label>
                  </div>
                )}

                {(step.category === "BASIC_LABOR" || step.category === "BASIC_CREATIVE") && (
                  <div className="mt-5 space-y-4 rounded-2xl border border-ink/5 bg-base/40 p-4">
                    <label className="space-y-1 text-sm text-muted">
                      Instructions
                      <textarea
                        rows={3}
                        value={step.config?.instructions ?? ""}
                        onChange={(event) => updateConfig(index, "instructions", event.target.value)}
                        className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                        placeholder="Detail the manual procedure, safety guidance, or creative brief."
                      />
                    </label>
                    <label className="space-y-1 text-sm text-muted">
                      Proof Type
                      <select
                        value={step.config?.proofType ?? "CHECKBOX"}
                        onChange={(event) => updateConfig(index, "proofType", event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                      >
                        {PROOF_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {step.category === "BASIC_MACHINERY" && (
                  <div className="mt-5 rounded-2xl border border-ink/5 bg-base/40 p-4 text-sm text-muted">
                    Document the PLC reference, sensor thresholds, and any human confirmation needed
                    to advance this automation step.
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-dashed border-ink/10 bg-base/20 p-4 text-xs text-muted">
                  <p className="font-semibold uppercase tracking-[0.3em]">Output Schema</p>
                  <p className="mt-2">
                    Define how this step&apos;s evidence will be stored and referenced by downstream
                    tasks. Integrations with Storage and Audit logs will arrive in the next iteration.
                  </p>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {(formError || successMessage) && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                formError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {formError || successMessage}
            </div>
          )}
        </section>
      </main>

      <div className="sticky bottom-6 z-10 mx-auto flex w-full max-w-6xl justify-end">
        <button
          onClick={handleSave}
          disabled={saving || teamsLoading}
          className="apple-button inline-flex items-center gap-2 px-8 py-4 text-sm font-medium text-white disabled:opacity-50 disabled:hover:shadow-lg"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : editingId ? "Update Procedure" : "Save Procedure"}
        </button>
      </div>

      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Library</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Existing Procedures</h2>
            <p className="text-sm text-muted">Manage and edit your procedure templates</p>
          </div>
          <span className="text-sm font-semibold text-muted">{procedures.length} defined</span>
        </div>

        {proceduresLoading ? (
          <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center text-muted shadow-subtle">
            Loading procedures…
          </div>
        ) : procedures.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1D1D1F]/20 bg-white/50 p-10 text-center text-muted shadow-subtle">
            No procedures yet. Create your first procedure above.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {procedures.map((proc) => (
              <div
                key={proc.id}
                className={`rounded-3xl border border-white/70 bg-white/90 p-6 shadow-subtle backdrop-blur-xl transition-all hover:shadow-md ${
                  editingId === proc.id ? "ring-2 ring-[#007AFF]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.4em] text-muted">Procedure</p>
                    <h3 className="mt-2 text-lg font-semibold text-ink">{proc.name}</h3>
                    <p className="mt-1 text-sm text-muted line-clamp-2">
                      {proc.description || "No description"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <span>{proc.steps.length} step{proc.steps.length !== 1 ? "s" : ""}</span>
                      <span>•</span>
                      <span>
                        {teams.find((t) => t.id === proc.teamId)?.name || "Unknown team"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(proc)}
                    disabled={deletingId === proc.id}
                    className="flex-1 rounded-2xl border-2 border-[#1D1D1F]/30 bg-white px-4 py-2 text-sm font-bold text-[#1D1D1F] shadow-sm transition-all hover:border-[#007AFF] hover:bg-[#007AFF]/10 hover:shadow-md disabled:opacity-50"
                  >
                    <Edit2 className="mr-2 inline h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(proc.id)}
                    disabled={deletingId === proc.id || saving}
                    className="rounded-2xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-md disabled:opacity-50"
                  >
                    {deletingId === proc.id ? (
                      "Deleting..."
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

