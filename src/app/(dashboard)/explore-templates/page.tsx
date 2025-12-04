"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, serverTimestamp, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { AtomicStep } from "@/types/schema";
import { useRouter } from "next/navigation";
import { 
  FileText, Loader2, Sparkles, Search, 
  Copy, TrendingUp, Users, Building2, 
  ShoppingCart, Wrench, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

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
}

const CATEGORY_ICONS: Record<string, any> = {
  HR: Users,
  Finance: TrendingUp,
  Operations: Building2,
  Sales: ShoppingCart,
  IT: Wrench,
  General: FileText,
};

const CATEGORY_COLORS: Record<string, string> = {
  HR: "bg-blue-500/20 text-blue-400",
  Finance: "bg-green-500/20 text-green-400",
  Operations: "bg-purple-500/20 text-purple-400",
  Sales: "bg-orange-500/20 text-orange-400",
  IT: "bg-cyan-500/20 text-cyan-400",
  General: "bg-slate-500/20 text-slate-400",
};

export default function TemplatesGalleryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      setUserId(currentUser.uid);
      
      // Fetch user profile to get organizationId
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOrganizationId(userData.organizationId || null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templatesQuery = query(
          collection(db, "global_templates"),
          orderBy("usageCount", "desc")
        );
        const snapshot = await getDocs(templatesQuery);
        const templatesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            description: data.description || "",
            steps: data.steps || [],
            category: data.category || "General",
            icon: data.icon,
            createdBy: data.createdBy || "admin",
            usageCount: data.usageCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as GlobalTemplate;
        });
        setTemplates(templatesData);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [userId]);

  const handleUseTemplate = async (template: GlobalTemplate) => {
    if (!organizationId) {
      alert("You must be part of an organization to use templates");
      return;
    }

    setUsingTemplate(template.id);
    try {
      // Create a new procedure from the template
      const procedureRef = await addDoc(collection(db, "procedures"), {
        organizationId: organizationId,
        processGroupId: "", // User can assign later
        title: `${template.title} (Copy)`,
        description: template.description,
        isPublished: false,
        steps: template.steps.map((step, index) => ({
          ...step,
          id: `step-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Increment usage count
      await updateDoc(doc(db, "global_templates", template.id), {
        usageCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setTemplates(templates.map(t => 
        t.id === template.id 
          ? { ...t, usageCount: t.usageCount + 1 }
          : t
      ));

      // Redirect to studio
      router.push(`/studio/procedure/${procedureRef.id}`);
    } catch (error) {
      console.error("Error using template:", error);
      alert("Failed to create procedure from template. Please try again.");
      setUsingTemplate(null);
    }
  };

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40">
      <div className="mx-auto max-w-[1400px] px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Explore Templates
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Browse and clone official workflow templates
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl px-12 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-black/5"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-white/70 backdrop-blur-xl text-slate-600 hover:bg-white/90"
                  }`}
                >
                  {category === "all" ? "All" : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-xl shadow-black/5 p-12 text-center">
            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">No templates found</p>
            <p className="text-slate-500 text-sm">
              {searchQuery || selectedCategory !== "all" 
                ? "Try adjusting your filters" 
                : "Check back later for new templates"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => {
              const Icon = CATEGORY_ICONS[template.category] || FileText;
              const colorClass = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.General;
              
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-xl shadow-black/5 p-8 hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl ${colorClass} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${colorClass}`}>
                      {template.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {template.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                    {template.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {template.steps.length} steps
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {template.usageCount} uses
                      </span>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      disabled={usingTemplate === template.id || !organizationId}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {usingTemplate === template.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Use Template
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

