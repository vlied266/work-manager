// app/run/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Procedure, ProcessStep } from "../../../types/process";

export default function RunProcessPage() {
  const params = useParams();
  const runId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [runData, setRunData] = useState<any>(null);
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  
  // State for user inputs
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Load Data ---
  useEffect(() => {
    if (!runId) return;
    loadData();
  }, [runId]);

  const loadData = async () => {
    try {
      const runSnap = await getDoc(doc(db, "active_runs", runId));
      if (!runSnap.exists()) {
        alert("Run not found!");
        router.push("/");
        return;
      }
      const run = runSnap.data();
      setRunData(run);

      const procSnap = await getDoc(doc(db, "procedures", run.procedureId));
      if (procSnap.exists()) {
        setProcedure(procSnap.data() as Procedure);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Handle Step Completion ---
  const handleCompleteStep = async () => {
    if (!runData || !procedure) return;
    setIsSubmitting(true);

    try {
      const currentIndex = runData.currentStepIndex;
      const nextIndex = currentIndex + 1;
      const isFinished = nextIndex >= procedure.steps.length;

      // Update Firebase
      await updateDoc(doc(db, "active_runs", runId), {
        currentStepIndex: nextIndex,
        status: isFinished ? "COMPLETED" : "IN_PROGRESS",
        // Log the result of this step
        logs: [...(runData.logs || []), {
          stepId: procedure.steps[currentIndex].id,
          completedAt: new Date(),
          output: inputValue || "Completed"
        }]
      });

      // Reload UI
      setInputValue(""); // Clear input
      await loadData(); // Refresh data

      if (isFinished) {
        alert("🎉 Process Completed Successfully!");
        router.push("/");
      }

    } catch (error) {
      console.error("Error updating step:", error);
      alert("Error completing step.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. Render Logic ---
  if (loading) return <div className="p-10 text-center">Loading Engine...</div>;
  if (!runData || !procedure) return <div className="p-10 text-center text-red-500">Error loading data.</div>;

  const currentStepIndex = runData.currentStepIndex;
  const isCompleted = runData.status === "COMPLETED" || currentStepIndex >= procedure.steps.length;

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">Process Completed! 🎉</h1>
          <p className="text-gray-600 mb-6">All steps have been finished successfully.</p>
          <button onClick={() => router.push("/")} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentStep = procedure.steps[currentStepIndex];

  // --- 4. Dynamic UI Generator ---
  const renderTaskInterface = () => {
    const action = currentStep.digitalAction;
    const cat = currentStep.category;

    // CASE A: IMPORT
    if (action === "IMPORT") {
      return (
        <div className="text-left">
          <label className="block font-bold mb-2">Source Data (URL or File Path)</label>
          <input 
            type="text" 
            className="w-full border p-3 rounded-lg mb-4"
            placeholder={currentStep.config?.sourceUrl || "Enter data source link..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <p className="text-sm text-gray-500 mb-4">
            System expects data from: <b>{currentStep.config?.sourceType || "Any Source"}</b>
          </p>
        </div>
      );
    }

    // CASE B: COMPARE
    if (action === "COMPARE") {
      return (
        <div className="text-left">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
            <h4 className="font-bold text-yellow-800">⚠️ Reconciliation Task</h4>
            <p className="text-sm">Please compare <b>{currentStep.config?.targetA}</b> with <b>{currentStep.config?.targetB}</b>.</p>
          </div>
          <label className="block font-bold mb-2">Observation Result</label>
          <select 
            className="w-full border p-3 rounded-lg mb-4"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          >
            <option value="">Select Result...</option>
            <option value="MATCH">✅ Data Matches (No Discrepancy)</option>
            <option value="MISMATCH">❌ Discrepancy Found</option>
          </select>
        </div>
      );
    }

    // CASE C: LABOR / MANUAL
    if (cat === "BASIC_LABOR" || cat === "BASIC_CREATIVE") {
      return (
        <div className="text-left">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <h4 className="font-bold text-blue-800">👷 Manual Instruction</h4>
            <p className="text-lg mt-2">{currentStep.config?.instructions || "No instructions provided."}</p>
          </div>
          <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5"
              onChange={(e) => setInputValue(e.target.checked ? "DONE" : "")}
            />
            <span className="font-bold">I confirm that I have completed this task.</span>
          </label>
        </div>
      );
    }

    // DEFAULT GENERIC
    return (
      <div className="text-center text-gray-400 italic mb-4">
        Press continue to proceed to the next step.
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        
        {/* Header */}
        <div className="border-b pb-4 mb-6 flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Running Process</span>
            <h1 className="text-3xl font-bold text-slate-800 mt-1">{procedure.name}</h1>
          </div>
          <div className="text-right">
             <span className="text-4xl font-black text-slate-200">
               {currentStepIndex + 1}<span className="text-xl">/{procedure.steps.length}</span>
             </span>
          </div>
        </div>

        {/* Current Step Card */}
        <div className="mb-8">
           <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
           <div className="flex gap-2 mb-6">
             <span className="bg-slate-200 px-3 py-1 rounded-full text-xs font-bold">{currentStep.category}</span>
             {currentStep.digitalAction && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{currentStep.digitalAction}</span>
             )}
           </div>

           {/* --- DYNAMIC WORK AREA --- */}
           <div className="border-2 border-slate-200 p-6 rounded-xl bg-slate-50">
              {renderTaskInterface()}
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            onClick={handleCompleteStep}
            disabled={isSubmitting}
            className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition transform hover:-translate-y-1"
          >
            {isSubmitting ? "Processing..." : (currentStepIndex + 1 === procedure.steps.length ? "Finish Process 🎉" : "Next Step →")}
          </button>
        </div>

      </div>
    </div>
  );
}