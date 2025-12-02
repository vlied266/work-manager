"use client";

import { useState, useRef } from "react";
import { AtomicStep } from "@/types/schema";
import { CheckCircle2, XCircle, PenTool, Loader2, Upload } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { motion } from "framer-motion";

interface AuthorizeRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  handleCompleteStep: (outcome: "SUCCESS" | "FAILURE" | "FLAGGED") => void;
  submitting: boolean;
  runId?: string;
}

export function AuthorizeRenderer({
  step,
  output,
  setOutput,
  handleCompleteStep,
  submitting,
  runId,
}: AuthorizeRendererProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string | null>(output?.signature || null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(output?.signatureUrl || null);
  const [signerName, setSignerName] = useState(output?.signerName || "");
  const [uploading, setUploading] = useState(false);
  const [organizationId] = useState("default-org"); // TODO: Get from auth context

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setSignatureData(null);
    setSignatureUrl(null);
    setOutput({ ...output, signature: null, signatureUrl: null, signerName: "" });
  };

  const handleSave = async () => {
    if (!sigCanvasRef.current) return;
    
    const dataURL = sigCanvasRef.current.toDataURL();
    setSignatureData(dataURL);
    
    // Convert dataURL to Blob
    const blob = await (await fetch(dataURL)).blob();
    
    // Upload to Firebase Storage
    setUploading(true);
    try {
      const timestamp = Date.now();
      const storagePath = `signatures/${organizationId}/${runId || "temp"}/${timestamp}_signature.png`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      
      setSignatureUrl(url);
      setOutput({
        ...output,
        signature: dataURL, // Keep local copy for preview
        signatureUrl: url, // Firebase Storage URL
        signerName: signerName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error uploading signature:", error);
      alert("Failed to upload signature. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = () => {
    if (step.config.requireSignature && !signatureUrl) {
      alert("Please save your signature before approving.");
      return;
    }
    if (step.config.requireSignature && !signerName.trim()) {
      alert("Please enter your name.");
      return;
    }
    handleCompleteStep("SUCCESS");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
        <p className="text-base font-bold text-blue-900 mb-2">💡 Authorization Required</p>
        <p className="text-sm text-blue-700 font-medium">
          {step.config.instruction || step.config.instructions || "Please review and approve this step."}
        </p>
      </div>

      {step.config.requireSignature && (
        <div className="space-y-6">
          <div>
            <label className="block text-base font-bold text-slate-900 mb-3 tracking-tight">
              Signer Name
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => {
                setSignerName(e.target.value);
                setOutput({ ...output, signerName: e.target.value });
              }}
              placeholder="Enter your full name"
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-900 mb-3 tracking-tight">
              Digital Signature
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  className: "w-full h-48 border-2 border-slate-200 rounded-xl bg-white cursor-crosshair",
                }}
                backgroundColor="white"
                penColor="#1e293b"
              />
              <div className="mt-4 flex gap-3">
                <motion.button
                  onClick={handleSave}
                  disabled={uploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-xl border-2 border-blue-300 bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="h-5 w-5" strokeWidth={2.5} />
                      Save & Upload Signature
                    </span>
                  )}
                </motion.button>
                <button
                  onClick={handleClear}
                  className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {signatureUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" strokeWidth={2} />
                  <div>
                    <p className="text-base font-bold text-green-900">
                      Signature saved successfully
                    </p>
                    <p className="text-sm text-green-700 font-medium">
                      Signed by: {signerName || "Anonymous"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-green-200 bg-white p-4">
                  <img
                    src={signatureData || signatureUrl}
                    alt="Signature"
                    className="max-h-32 mx-auto border border-slate-200 rounded-lg"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-6 border-t border-slate-200">
        <motion.button
          onClick={handleApprove}
          disabled={submitting || (step.config.requireSignature && (!signatureUrl || !signerName.trim()))}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-5 text-base font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
            <span>Approve & Continue</span>
          </div>
        </motion.button>
        <motion.button
          onClick={() => handleCompleteStep("FLAGGED")}
          disabled={submitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-2xl border-2 border-rose-300 bg-white px-8 py-5 text-base font-bold text-rose-700 transition-all hover:bg-rose-50 disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-3">
            <XCircle className="h-5 w-5" strokeWidth={2.5} />
            <span>Reject</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
