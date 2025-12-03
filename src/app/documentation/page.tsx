"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, Search, FileText, Video, Code, 
  ArrowRight, Sparkles, Zap, Users, Settings
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function DocumentationPage() {
  const categories = [
    {
      icon: Zap,
      title: "Getting Started",
      description: "Learn the basics and build your first workflow",
      articles: [
        "Introduction to WorkOS",
        "Creating Your First Procedure",
        "Understanding Atomic Tasks",
        "AI-Powered Workflow Generation",
      ],
      color: "blue",
    },
    {
      icon: FileText,
      title: "Guides",
      description: "Step-by-step tutorials for common tasks",
      articles: [
        "Building Complex Workflows",
        "Team Management & Assignments",
        "Using AI to Generate Procedures",
        "Integration Best Practices",
      ],
      color: "purple",
    },
    {
      icon: Code,
      title: "API Reference",
      description: "Complete API documentation and examples",
      articles: [
        "Authentication",
        "Procedures API",
        "Runs API",
        "Webhooks",
      ],
      color: "green",
    },
    {
      icon: Settings,
      title: "Configuration",
      description: "Settings, permissions, and customization",
      articles: [
        "Organization Settings",
        "User Permissions",
        "Billing & Subscriptions",
        "Security & Compliance",
      ],
      color: "orange",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Working with teams and assignments",
      articles: [
        "Creating Teams",
        "Task Assignments",
        "Notifications & Comments",
        "Activity Tracking",
      ],
      color: "indigo",
    },
    {
      icon: Sparkles,
      title: "AI Features",
      description: "Leverage AI to automate workflow creation",
      articles: [
        "AI Procedure Builder",
        "Natural Language Processing",
        "Smart Suggestions",
        "Code Generation",
      ],
      color: "yellow",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-200 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 px-4 py-2 mb-6">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Complete Documentation</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Documentation
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Everything you need to master WorkOS. From basics to advanced features, including our AI-powered tools.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 pl-12 pr-6 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, i) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all hover:shadow-2xl hover:bg-white/80"
              >
                {/* Icon */}
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[category.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <category.icon className="h-8 w-8" />
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {category.title}
                </h3>
                <p className="text-base leading-7 text-slate-600 mb-6">
                  {category.description}
                </p>

                {/* Articles */}
                <ul className="space-y-2 mb-6">
                  {category.articles.map((article, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      <span>{article}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                  >
                    Read More
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-xl">
              <Video className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Video Tutorials
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Watch step-by-step video guides to master WorkOS. Learn how to use AI to generate workflows automatically.
            </p>
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Watch Tutorials
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

