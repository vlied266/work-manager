"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, getDocs, query, orderBy, addDoc, 
  updateDoc, doc, serverTimestamp, increment, where, deleteDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Procedure, AtomicStep, Organization } from "@/types/schema";
import { 
  FileText, Loader2, AlertCircle, Plus, 
  Building2, Copy, Trash2, ExternalLink, Search
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OWNER_EMAIL = "atomicworkos@gmail.com";

interface GlobalTemplate {
  id: string;
  title: string;
  description: string;
  steps: AtomicStep[];
  category: string;
  icon?: string;
  createdBy: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function BackofficeTemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Import from org state
  const [showImportModal, setShowImportModal] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Security check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setAuthorized(false);
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      if (currentUser.email !== OWNER_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch templates
  useEffect(() => {
    if (!authorized) return;

    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templatesQuery = query(
          collection(db, "global_templates"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(templatesQuery);
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as GlobalTemplate[];
        setTemplates(templatesData);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [authorized]);

  // Fetch organizations for import
  useEffect(() => {
    if (!showImportModal || !authorized) return;

    const fetchOrganizations = async () => {
      try {
        const orgsQuery = query(collection(db, "organizations"));
        const snapshot = await getDocs(orgsQuery);
        const orgsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Organization[];
        setOrganizations(orgsData);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, [showImportModal, authorized]);

  // Fetch procedures when org is selected
  useEffect(() => {
    if (!selectedOrgId || !authorized) {
      setProcedures([]);
      setSelectedProcedureId("");
      return;
    }

    const fetchProcedures = async () => {
      try {
        const proceduresQuery = query(
          collection(db, "procedures"),
          where("organizationId", "==", selectedOrgId)
        );
        const snapshot = await getDocs(proceduresQuery);
        const proceduresData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Procedure[];
        setProcedures(proceduresData);
      } catch (error) {
        console.error("Error fetching procedures:", error);
      }
    };

    fetchProcedures();
  }, [selectedOrgId, authorized]);

  const handleImportFromOrg = async () => {
    if (!selectedOrgId || !selectedProcedureId) {
      alert("Please select an organization and procedure");
      return;
    }

    setImporting(true);
    try {
      const selectedProcedure = procedures.find(p => p.id === selectedProcedureId);
      if (!selectedProcedure) {
        alert("Procedure not found");
        return;
      }

      // Create global template from procedure
      await addDoc(collection(db, "global_templates"), {
        title: selectedProcedure.title,
        description: selectedProcedure.description || "",
        steps: selectedProcedure.steps,
        category: "General",
        createdBy: "admin",
        usageCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Refresh templates
      const templatesQuery = query(
        collection(db, "global_templates"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(templatesQuery);
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as GlobalTemplate[];
      setTemplates(templatesData);

      // Reset modal
      setShowImportModal(false);
      setSelectedOrgId("");
      setSelectedProcedureId("");
      setProcedures([]);
      
      alert("Template created successfully!");
    } catch (error) {
      console.error("Error importing template:", error);
      alert("Failed to import template. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await updateDoc(doc(db, "global_templates", templateId), {
        // Soft delete by setting a flag, or actually delete
        // For now, we'll actually delete it
      });
      
      // Actually delete
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "global_templates", templateId));

      // Refresh templates
      setTemplates(templates.filter(t => t.id !== templateId));
      alert("Template deleted successfully!");
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template. Please try again.");
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-100"></div>
          <p className="text-sm text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h1>
          <p className="text-slate-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-[1400px] px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link
                href="/backoffice"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Backoffice
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                  Global Templates
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Manage official templates for all users
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Import from Org
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-12 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Templates List */}
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-12 text-center">
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No templates found</p>
            <p className="text-slate-500 text-sm">
              {searchQuery ? "Try a different search term" : "Import a procedure from an organization to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {template.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {template.description || "No description"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{template.steps.length} steps</span>
                    <span>•</span>
                    <span>{template.usageCount} uses</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                    {template.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-2xl w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Import from Organization</h2>

              <div className="space-y-6">
                {/* Select Organization */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Organization
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => {
                      setSelectedOrgId(e.target.value);
                      setSelectedProcedureId("");
                    }}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Choose an organization...</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Procedure */}
                {selectedOrgId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select Procedure
                    </label>
                    {procedures.length === 0 ? (
                      <p className="text-slate-400 text-sm">No procedures found in this organization</p>
                    ) : (
                      <select
                        value={selectedProcedureId}
                        onChange={(e) => setSelectedProcedureId(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Choose a procedure...</option>
                        {procedures.map(proc => (
                          <option key={proc.id} value={proc.id}>
                            {proc.title} ({proc.steps.length} steps)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setSelectedOrgId("");
                      setSelectedProcedureId("");
                      setProcedures([]);
                    }}
                    className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportFromOrg}
                    disabled={!selectedOrgId || !selectedProcedureId || importing}
                    className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Make Global
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

