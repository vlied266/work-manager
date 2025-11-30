// app/admin/page.tsx
"use client";

import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Procedure, ProcessStep } from "../../types/process";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([]);

  // Add empty step
  const addNewStep = () => {
    const newStep: ProcessStep = {
      id: `step_${steps.length + 1}`,
      title: "",
      category: "BASIC_DIGITAL",
      config: {},
      digitalAction: "IMPORT"
    };
    setSteps([...steps, newStep]);
  };

  // Generic update function
  const updateStep = (index: number, field: keyof ProcessStep, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  // Config update function (Nested object)
  const updateConfig = (index: number, configKey: string, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index].config = { ...updatedSteps[index].config, [configKey]: value };
    setSteps(updatedSteps);
  };

  const handleSave = async () => {
    if (!name || steps.length === 0) {
      alert("Please enter a name and steps.");
      return;
    }
    setLoading(true);
    try {
      const newProcedure: Procedure = {
        name,
        description,
        createdAt: new Date(),
        steps
      };
      await addDoc(collection(db, "procedures"), newProcedure);
      alert("✅ Procedure saved successfully!");
      setName("");
      setDescription("");
      setSteps([]);
    } catch (error) {
      console.error(error);
      alert("❌ Error saving data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-900 pb-24">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-8 text-blue-800 border-b pb-4">Define New Procedure</h1>

        {/* General Info */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <label className="block font-bold text-slate-700 mb-2">Procedure Name</label>
            <input
              type="text"
              className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-blue-500 outline-none transition"
              placeholder="e.g. Monthly Salary Calculation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-blue-500 outline-none transition"
              placeholder="Goal of this process..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="border-2 border-slate-200 p-6 rounded-xl bg-slate-50 relative group hover:border-blue-300 transition">
              
              {/* Step Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">Step {index + 1}</span>
                <button 
                  onClick={() => {
                    const newSteps = steps.filter((_, i) => i !== index);
                    setSteps(newSteps);
                  }}
                  className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-1 rounded-lg transition"
                >
                  Delete Step
                </button>
              </div>

              {/* Main Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="Step Title"
                    className="w-full border p-2 rounded bg-white"
                    value={step.title}
                    onChange={(e) => updateStep(index, "title", e.target.value)}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    className="w-full border p-2 rounded bg-white"
                    value={step.category}
                    onChange={(e) => updateStep(index, "category", e.target.value)}
                  >
                    <option value="BASIC_DIGITAL">Basic Digital Task</option>
                    <option value="BASIC_LABOR">Basic Labor Task</option>
                    <option value="BASIC_CREATIVE">Basic Creative Task</option>
                    <option value="BASIC_MACHINERY">Basic Machinery Task</option>
                  </select>
                </div>

                {step.category === "BASIC_DIGITAL" && (
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-blue-600">Action Type</label>
                    <select
                      className="w-full border-2 border-blue-100 p-2 rounded bg-blue-50 text-blue-900 font-medium"
                      value={step.digitalAction}
                      onChange={(e) => updateStep(index, "digitalAction", e.target.value)}
                    >
                      <option value="IMPORT">Import Data</option>
                      <option value="ORGANISE">Organise</option>
                      <option value="CONNECT">Connect</option>
                      <option value="COMPARE">Compare</option>
                      <option value="APPLY_RULE">Apply Rule</option>
                      <option value="CONCLUDE">Conclude</option>
                      <option value="FINALISE">Finalise</option>
                      <option value="REPORT">Report</option>
                    </select>
                  </div>
                )}
              </div>

              {/* --- DYNAMIC CONFIGURATION AREA --- */}
              <div className="bg-white border p-4 rounded-lg mt-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b pb-2">Configuration Settings</h4>
                
                {/* 1. CONFIG FOR IMPORT */}
                {step.category === "BASIC_DIGITAL" && step.digitalAction === "IMPORT" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Source Type</label>
                      <select 
                        className="w-full border p-2 rounded"
                        onChange={(e) => updateConfig(index, "sourceType", e.target.value)}
                      >
                        <option value="">Select Source...</option>
                        <option value="EXTERNAL_API">External API</option>
                        <option value="USER_UPLOAD">User Upload (Excel/PDF)</option>
                        <option value="INTERNAL_DB">Internal Database</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Source URL / Endpoint</label>
                      <input 
                        type="text" 
                        className="w-full border p-2 rounded"
                        placeholder="https://api.example.com/data"
                        onChange={(e) => updateConfig(index, "sourceUrl", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 2. CONFIG FOR COMPARE */}
                {step.category === "BASIC_DIGITAL" && step.digitalAction === "COMPARE" && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Target A (Variable)</label>
                      <input 
                        type="text" className="w-full border p-2 rounded" 
                        placeholder="e.g. step_1.output"
                        onChange={(e) => updateConfig(index, "targetA", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Target B (Variable)</label>
                      <input 
                        type="text" className="w-full border p-2 rounded" 
                        placeholder="e.g. broker_data.price"
                        onChange={(e) => updateConfig(index, "targetB", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Tolerance</label>
                      <input 
                        type="number" className="w-full border p-2 rounded" 
                        placeholder="0"
                        onChange={(e) => updateConfig(index, "tolerance", Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {/* 3. CONFIG FOR LABOR / CREATIVE */}
                {(step.category === "BASIC_LABOR" || step.category === "BASIC_CREATIVE") && (
                  <div>
                    <label className="block text-sm mb-1">Instructions for Worker</label>
                    <textarea 
                      className="w-full border p-2 rounded"
                      rows={2}
                      placeholder="Explain exactly what the human needs to do..."
                      onChange={(e) => updateConfig(index, "instructions", e.target.value)}
                    />
                    <div className="mt-2">
                      <label className="block text-sm mb-1">Proof of Work</label>
                      <select 
                        className="w-full border p-2 rounded"
                        onChange={(e) => updateConfig(index, "requiredProof", e.target.value)}
                      >
                         <option value="CHECKBOX">Simple Checkbox</option>
                         <option value="PHOTO">Take a Photo</option>
                         <option value="SIGNATURE">Digital Signature</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Default Message if no config needed */}
                {step.category === "BASIC_DIGITAL" && 
                 !["IMPORT", "COMPARE"].includes(step.digitalAction || "") && (
                  <p className="text-sm text-gray-400 italic">No specific configuration needed for this action type yet.</p>
                )}

              </div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <button
          onClick={addNewStep}
          className="mt-6 w-full py-4 border-2 border-dashed border-blue-200 text-blue-500 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-400 transition"
        >
          + Add New Step
        </button>

        {/* Save Button */}
        <div className="mt-8 sticky bottom-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-10 py-4 bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-800 disabled:opacity-50 transition transform hover:-translate-y-1"
          >
            {loading ? "Saving..." : "Save Procedure"}
          </button>
        </div>
      </div>
    </div>
  );
}