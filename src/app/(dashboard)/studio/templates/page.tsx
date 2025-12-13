"use client";

import { useState } from "react";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Procedure, AtomicStep } from "@/types/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Users, DollarSign, Wrench, CheckCircle2, Loader2, FileText, TrendingUp, ShoppingCart, Shield, Code, Scale, Megaphone, ClipboardCheck, Calendar, CreditCard, Building2, Package, Truck, AlertTriangle, UserPlus, GraduationCap, BarChart, Receipt, FileCheck, Key, Bug, BookOpen, Target, Image, Stethoscope, Briefcase, GraduationCap as GraduationCapIcon, UtensilsCrossed, Home, Car, Plane, Heart, Music, Paintbrush, Camera, Gamepad2, Hammer, Zap, Factory, Microscope, Beaker, Globe, Mail, Phone, Printer, Scissors, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { TemplateCustomizerModal } from "@/components/templates/TemplateCustomizerModal";
import { TEMPLATES } from "@/data/templates";

// Template definitions (migrated to src/data/templates.ts)

export default function TemplatesPage() {
  const router = useRouter();
  const [organizationId] = useState("default-org"); // TODO: Get from auth context
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customizingTemplate, setCustomizingTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));
  
  // Group templates by category
  const templatesByCategory = categories.reduce((acc, category) => {
    acc[category] = TEMPLATES.filter((t) => t.category === category);
    return acc;
  }, {} as Record<string, typeof TEMPLATES>);

  // Filter templates based on search and category
  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter categories based on search
  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true;
    const categoryTemplates = templatesByCategory[category];
    return categoryTemplates.some((t) => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleUseTemplate = (template: typeof TEMPLATES[0]) => {
    // Open the customization modal instead of directly creating
    setCustomizingTemplate(template);
  };

  const handleConfirmCustomization = async (finalSteps: AtomicStep[]) => {
    if (!customizingTemplate) return;

    setLoadingTemplateId(customizingTemplate.id);
    setCustomizingTemplate(null); // Close modal

    try {
      // Find or create "Uncategorized" process group
      let defaultGroupId: string;
      const defaultGroupQuery = query(
        collection(db, "process_groups"),
        where("organizationId", "==", organizationId),
        where("title", "==", "Uncategorized")
      );
      const defaultGroupSnapshot = await getDocs(defaultGroupQuery);

      if (defaultGroupSnapshot.empty) {
        const groupRef = await addDoc(collection(db, "process_groups"), {
          organizationId,
          title: "Uncategorized",
          description: "Default group for procedures without a specific category",
          icon: "FolderOpen",
          procedureSequence: [],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        defaultGroupId = groupRef.id;
      } else {
        defaultGroupId = defaultGroupSnapshot.docs[0].id;
      }

      // Generate new IDs for steps to avoid conflicts
      const stepIdMap = new Map<string, string>();
      const newSteps = finalSteps.map((step) => {
        const newId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        stepIdMap.set(step.id, newId);
        return {
          ...step,
          id: newId,
        };
      });

      // Update route references to use new step IDs
      const updatedSteps = newSteps.map((step) => {
        if (!step.routes) return step;
        
        const updatedRoutes = { ...step.routes };
        
        // Update defaultNextStepId
        if (updatedRoutes.defaultNextStepId && updatedRoutes.defaultNextStepId !== "COMPLETED") {
          const newDefaultId = stepIdMap.get(updatedRoutes.defaultNextStepId);
          if (newDefaultId) {
            updatedRoutes.defaultNextStepId = newDefaultId;
          }
        }
        
        // Update onSuccessStepId
        if (updatedRoutes.onSuccessStepId) {
          const newSuccessId = stepIdMap.get(updatedRoutes.onSuccessStepId);
          if (newSuccessId) {
            updatedRoutes.onSuccessStepId = newSuccessId;
          }
        }
        
        // Update onFailureStepId
        if (updatedRoutes.onFailureStepId) {
          const newFailureId = stepIdMap.get(updatedRoutes.onFailureStepId);
          if (newFailureId) {
            updatedRoutes.onFailureStepId = newFailureId;
          }
        }
        
        // Update conditions
        if (updatedRoutes.conditions) {
          updatedRoutes.conditions = updatedRoutes.conditions.map((condition) => {
            const newTargetId = stepIdMap.get(condition.targetStepId);
            if (newTargetId) {
              return { ...condition, targetStepId: newTargetId };
            }
            return condition;
          });
        }
        
        return { ...step, routes: updatedRoutes };
      });

      // Create procedure from template
      const docRef = await addDoc(collection(db, "procedures"), {
        organizationId,
        processGroupId: defaultGroupId,
        title: customizingTemplate.title,
        description: customizingTemplate.description,
        isPublished: false, // Start as draft so user can edit
        steps: updatedSteps,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Redirect to designer
      router.push(`/studio/procedure/${docRef.id}`);
    } catch (error) {
      console.error("Error creating procedure from template:", error);
      alert("Failed to create procedure from template. Please try again.");
      setLoadingTemplateId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 relative overflow-hidden font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/30">
        <div className="mx-auto max-w-[1800px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                <Link
                  href="/studio"
                  className="flex items-center gap-1 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1800px] px-6 py-12">
        {/* Hero Title */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-3">
            Template Gallery
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Browse workflows by business type. Start with pre-built templates and customize them.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates by name, description, or business type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-xl text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Business Categories Grid - Show when no category selected or search is active */}
        {(!selectedCategory || searchQuery) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Browse by Business Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCategories.map((category) => {
                const categoryTemplates = templatesByCategory[category];
                const categoryCount = categoryTemplates.length;
                const firstTemplate = categoryTemplates[0];
                const IconComponent = firstTemplate?.icon || Building2;
                
                // Get color for category
                const getCategoryColor = (cat: string) => {
                  const colorMap: Record<string, string> = {
                    "HR": "blue",
                    "Finance": "green",
                    "Operations": "orange",
                    "Sales": "purple",
                    "IT": "indigo",
                    "Legal": "amber",
                    "Marketing": "pink",
                    "Healthcare": "red",
                    "Education": "blue",
                    "Hospitality": "amber",
                    "Transportation": "blue",
                    "Real Estate": "green",
                    "Construction": "orange",
                    "Manufacturing": "slate",
                    "Energy": "yellow",
                    "Research": "purple",
                    "Creative": "pink",
                    "Entertainment": "purple",
                    "Gaming": "indigo",
                  };
                  return colorMap[cat] || "blue";
                };
                
                // Get gradient classes for category color
                const getCategoryGradient = (color: string) => {
                  const gradients: Record<string, string> = {
                    "blue": "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
                    "green": "bg-gradient-to-br from-green-500 to-green-600 text-white",
                    "orange": "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
                    "purple": "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
                    "indigo": "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white",
                    "amber": "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
                    "pink": "bg-gradient-to-br from-pink-500 to-pink-600 text-white",
                    "red": "bg-gradient-to-br from-red-500 to-red-600 text-white",
                    "yellow": "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
                    "slate": "bg-gradient-to-br from-slate-500 to-slate-600 text-white",
                  };
                  return gradients[color] || gradients["blue"];
                };
                
                const categoryColor = getCategoryColor(category);
                
                return (
                  <motion.button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSearchQuery(""); // Clear search when selecting category
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200 p-6 text-left transition-all hover:border-blue-400 hover:shadow-xl"
                  >
                    {/* Category Icon */}
                    <div className="mb-4 flex items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110 ${getCategoryGradient(categoryColor)}`}
                      >
                        <IconComponent className="h-8 w-8" strokeWidth={2} />
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">
                      {category}
                    </h3>
                    
                    {/* Template Count */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      <FileText className="h-4 w-4" />
                      <span className="font-semibold">{categoryCount} {categoryCount === 1 ? 'template' : 'templates'}</span>
                    </div>
                    
                    {/* Hover Arrow */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-5 w-5 text-blue-500" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Category Header */}
        {selectedCategory && !searchQuery && (
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Categories</span>
              </button>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  {selectedCategory} Templates
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {templatesByCategory[selectedCategory]?.length || 0} templates available
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Search Results
            </h2>
            <p className="text-sm text-slate-600">
              Found {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} matching "{searchQuery}"
            </p>
          </div>
        )}


        {/* Templates Grid - Only show when category is selected or search is active */}
        {(selectedCategory || searchQuery) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => {
              const IconComponent = template.icon;
              const isLoading = loadingTemplateId === template.id;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group relative rounded-[2rem] bg-white shadow-xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl"
                >
                  {/* Large Colorful Icon */}
                  <div className="mb-6 flex items-center justify-center">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg ${
                        template.color === "blue"
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                          : template.color === "green"
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                          : template.color === "orange"
                          ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                          : template.color === "purple"
                          ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                          : template.color === "indigo"
                          ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                          : template.color === "amber"
                          ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                          : template.color === "red"
                          ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                          : template.color === "yellow"
                          ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
                          : template.color === "slate"
                          ? "bg-gradient-to-br from-slate-500 to-slate-600 text-white"
                          : "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                      }`}
                    >
                      <IconComponent className="h-10 w-10" strokeWidth={2} />
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="mb-4 flex justify-center">
                    <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {template.category}
                    </span>
                  </div>

                  {/* Template Info */}
                  <h3 className="mb-3 text-xl font-extrabold text-slate-800 tracking-tight text-center">{template.title}</h3>
                  <p className="mb-6 text-sm text-slate-600 text-center leading-relaxed line-clamp-3">{template.description}</p>

                  {/* Steps Count */}
                  <div className="mb-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{template.steps.length} steps</span>
                  </div>

                  {/* Use Template Button */}
                  <button
                    onClick={() => handleUseTemplate(template)}
                    disabled={isLoading}
                    className="w-full rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0071E3] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Use Template
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (selectedCategory || searchQuery) && (
          <div className="py-20 text-center">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
              <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                <Search className="h-16 w-16 text-slate-400 mx-auto" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-base font-extrabold text-slate-800 tracking-tight mb-1">No templates found</p>
            <p className="text-sm text-slate-600">
              {searchQuery 
                ? `No templates match "${searchQuery}". Try a different search term.`
                : "Try selecting a different category or clearing your search."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>

      {/* Template Customizer Modal */}
      {customizingTemplate && (
        <TemplateCustomizerModal
          template={customizingTemplate}
          onClose={() => setCustomizingTemplate(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}
    </div>
  );
}

