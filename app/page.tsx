// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { Procedure } from "../types/process";
import Link from "next/link";
import { useRouter } from "next/navigation"; // For redirection

export default function Dashboard() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Hook for navigation

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "procedures"));
        const data: Procedure[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Procedure[];
        setProcedures(data);
      } catch (error) {
        console.error("Error fetching procedures:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProcedures();
  }, []);

  // --- NEW FUNCTION: Start a Process ---
  const handleStart = async (proc: Procedure) => {
    const confirmStart = confirm(`Start new run for "${proc.name}"?`);
    if (!confirmStart) return;

    try {
      // 1. Create a new "Active Run" record
      const docRef = await addDoc(collection(db, "active_runs"), {
        procedureId: proc.id,
        procedureName: proc.name,
        currentStepIndex: 0, // Start at step 0
        status: "IN_PROGRESS",
        startedAt: new Date(),
        logs: []
      });

      // 2. Redirect to the Run Page
      router.push(`/run/${docRef.id}`);
      
    } catch (error) {
      console.error("Error starting process:", error);
      alert("Failed to start process.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Work Manager</h1>
          <p className="text-slate-500 mt-2">Manage and monitor your business workflows.</p>
        </div>
        <Link 
          href="/admin" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <span>+ Create New Procedure</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading workflows...</p>
          </div>
        ) : procedures.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-slate-400 mb-2">No procedures found</h3>
            <Link href="/admin" className="text-blue-600 font-bold hover:underline">
              Go to Admin Panel &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map((proc) => (
              <div key={proc.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition border border-slate-100 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                      Procedure
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">{proc.name}</h2>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-6">
                    {proc.description || "No description provided."}
                  </p>
                </div>
                <div className="border-t pt-4 mt-auto">
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="font-semibold text-slate-600">Total Steps:</span>
                    <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold">{proc.steps?.length || 0}</span>
                  </div>
                  
                  {/* Updated Button with onClick */}
                  <button 
                    onClick={() => handleStart(proc)}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
                  >
                    Start Process ▷
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}