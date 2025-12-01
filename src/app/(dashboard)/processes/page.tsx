"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Reorder } from "framer-motion";
import { Workflow, Save, GripVertical, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { Procedure, ProcessProcedureRef, ProcessDefinition } from "@/types/workos";
import { useAuth } from "@/hooks/use-auth";
import { useProcesses } from "@/hooks/use-processes";
import { useRouter } from "next/navigation";

export default function ProcessesPage() {
  const { profile, firebaseUser } = useAuth();
  const router = useRouter();
  const { processes } = useProcesses();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<ProcessProcedureRef[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcedures = async () => {
      if (!profile?.organizationId) return;
      const snapshot = await getDocs(collection(db, "procedures"));
      const data = snapshot.docs
        .map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...(docSnap.data() as Procedure),
            }) satisfies Procedure,
        )
        .filter((proc) => proc.organizationId === profile.organizationId);
      setProcedures(data);
    };
    fetchProcedures();
  }, [profile?.organizationId]);

  const availableProcedures = useMemo(
    () => procedures.filter((proc) => !selectedProcedures.some((sel) => sel.procedureId === proc.id)),
    [procedures, selectedProcedures],
  );

  const addProcedure = (proc: Procedure) => {
    setSelectedProcedures((prev) => [
      ...prev,
      {
        procedureId: proc.id,
        procedureName: proc.name,
        teamId: proc.teamId,
        order: prev.length,
      },
    ]);
  };

  const removeProcedure = (procedureId: string) => {
    setSelectedProcedures((prev) => prev.filter((proc) => proc.procedureId !== procedureId));
  };

  const handleSave = async () => {
    if (!profile?.organizationId || !firebaseUser) {
      setError("Authentication required.");
      return;
    }
    if (!name.trim() || selectedProcedures.length === 0) {
      setError("Provide a name and select at least one procedure.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await addDoc(collection(db, "processes"), {
        name: name.trim(),
        description: description.trim(),
        organizationId: profile.organizationId,
        procedures: selectedProcedures.map((proc, index) => ({ ...proc, order: index })),
        createdBy: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess("Process saved.");
      setName("");
      setDescription("");
      setSelectedProcedures([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchProcess = async (process: ProcessDefinition) => {
    if (!profile?.organizationId || !firebaseUser) return;
    setLaunching(process.id);
    setError(null);
    try {
      const expanded = await Promise.all(
        process.procedures.map(async (ref) => {
          // Handle both 'id' and 'procedureId' for backward compatibility
          const procedureId = ref.procedureId || (ref as ProcessProcedureRef & { id?: string }).id;
          if (!procedureId) {
            throw new Error(`Procedure reference missing ID: ${JSON.stringify(ref)}`);
          }
          const procSnap = await getDoc(doc(db, "procedures", procedureId));
          if (!procSnap.exists()) throw new Error(`Procedure ${ref.procedureName || procedureId} missing`);
          return { id: procSnap.id, ...(procSnap.data() as Procedure) };
        }),
      );
      const flattenedSteps = expanded.flatMap((proc) =>
        proc.steps.map((step) => ({
          ...step,
          procedureLabel: proc.name,
          procedureSourceId: proc.id,
        })),
      );

      const runRef = await addDoc(collection(db, "active_runs"), {
        organizationId: profile.organizationId,
        procedureId: `process:${process.id}`,
        procedureName: process.name,
        processId: process.id,
        processName: process.name,
        procedureSnapshot: {
          id: `process:${process.id}`,
          organizationId: profile.organizationId,
          teamId: expanded[0]?.teamId ?? "",
          name: process.name,
          description: process.description || "",
          steps: flattenedSteps,
          updatedAt: serverTimestamp(),
        },
        startedBy: firebaseUser.uid,
        status: "IN_PROGRESS",
        currentStepIndex: 0,
        startedAt: serverTimestamp(),
        logs: [],
      });
      router.push(`/run/${runRef.id}`);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLaunching(null);
    }
  };

  return (
    <div className="space-y-10">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 pb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="apple-button inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:hover:shadow-lg"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Process"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6 rounded-3xl bg-white/80 p-8 shadow-glass ring-1 ring-white/60 backdrop-blur-2xl">
          <div className="flex items-center gap-3 text-muted">
            <Workflow className="h-5 w-5 text-accent" />
            <p className="text-xs uppercase tracking-[0.4em]">Process Meta</p>
          </div>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-muted">Process Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-base text-ink shadow-subtle outline-none transition focus:border-accent"
                placeholder="Onboard New Client"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-muted">Description</span>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink shadow-subtle outline-none transition focus:border-accent"
                placeholder="Outline the overall business outcome."
              />
            </label>
          </div>
          <div className="rounded-2xl border border-ink/5 bg-base/50 p-4 text-xs text-muted">
            <p className="uppercase tracking-[0.4em]">Available Procedures</p>
            {availableProcedures.length === 0 ? (
              <p className="mt-3 text-sm text-muted">All procedures have been added to this process.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {availableProcedures.map((proc) => (
                  <button
                    key={proc.id}
                    onClick={() => addProcedure(proc)}
                    className="w-full rounded-2xl border border-dashed border-ink/10 px-4 py-3 text-left text-sm font-semibold text-ink hover:border-ink/30"
                  >
                    {proc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl bg-white/90 p-8 shadow-subtle ring-1 ring-white/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-muted">
            <Workflow className="h-5 w-5 text-accent" />
            <p className="text-xs uppercase tracking-[0.4em]">Procedure Order</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          {selectedProcedures.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/10 px-6 py-10 text-center text-muted">
              Add procedures from the left panel to define the process sequence.
            </p>
          ) : (
            <Reorder.Group axis="y" values={selectedProcedures} onReorder={setSelectedProcedures} className="space-y-4">
              {selectedProcedures.map((proc) => (
                <Reorder.Item
                  key={proc.procedureId}
                  value={proc}
                  className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-inner"
                >
                  <div>
                    <p className="text-lg font-semibold text-ink">{proc.procedureName}</p>
                    {proc.teamId && <p className="text-sm text-muted">Team: {proc.teamId}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeProcedure(proc.procedureId)}
                      className="rounded-2xl border-2 border-ink/30 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                    >
                      Remove
                    </button>
                    <GripVertical className="h-5 w-5 text-muted" />
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </section>
      </main>

      <div className="sticky bottom-6 z-10 mx-auto flex w-full max-w-6xl justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="apple-button inline-flex items-center gap-2 px-8 py-4 text-sm font-medium text-white disabled:opacity-50 disabled:hover:shadow-lg"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Process"}
        </button>
      </div>
      <section className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Existing Processes</h2>
          <span className="text-sm text-muted">{processes.length} defined</span>
        </div>
        {processes.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-ink/10 px-6 py-10 text-center text-muted">
            No processes yet. Create a process from the form above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {processes.map((proc) => (
              <div key={proc.id} className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-subtle">
                <p className="text-xs uppercase tracking-[0.4em] text-muted">Process</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">{proc.name}</h3>
                <p className="text-sm text-muted">
                  {proc.description || "No description"} · {proc.procedures.length} procedure(s)
                </p>
                <button
                  onClick={() => handleLaunchProcess(proc)}
                  className="apple-button mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  disabled={!!launching && launching !== proc.id}
                >
                  <Play className="h-4 w-4" />
                  {launching === proc.id ? "Launching…" : "Start Process"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

