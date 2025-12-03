"use client";

import { motion } from "framer-motion";
import { Sparkles, FileText, ShoppingCart, UserCheck, Calendar, Package, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function TemplatesPage() {
  const templates = [
    {
      icon: ShoppingCart,
      title: "E-commerce Order Processing",
      description: "Complete workflow for processing online orders, from payment verification to shipping.",
      category: "E-commerce",
      color: "blue",
      features: ["Payment validation", "Inventory check", "Shipping label generation", "Customer notification"],
      aiPowered: true,
    },
    {
      icon: UserCheck,
      title: "Employee Onboarding",
      description: "Streamline new hire processes with automated document collection and approvals.",
      category: "HR",
      color: "green",
      features: ["Document collection", "Background check", "Equipment setup", "Welcome email"],
      aiPowered: true,
    },
    {
      icon: Calendar,
      title: "Event Management",
      description: "Plan and execute events with automated RSVP tracking and attendee management.",
      category: "Events",
      color: "purple",
      features: ["RSVP collection", "Seat assignment", "Reminder emails", "Check-in process"],
      aiPowered: false,
    },
    {
      icon: Package,
      title: "Invoice Processing",
      description: "Automate invoice approval workflows with multi-level authorization and payment processing.",
      category: "Finance",
      color: "orange",
      features: ["Invoice validation", "Approval routing", "Payment processing", "Record keeping"],
      aiPowered: true,
    },
    {
      icon: FileText,
      title: "Document Review",
      description: "Collaborative document review process with version control and approval tracking.",
      category: "Legal",
      color: "indigo",
      features: ["Version tracking", "Review comments", "Approval workflow", "Finalization"],
      aiPowered: false,
    },
    {
      icon: Zap,
      title: "Customer Support Ticket",
      description: "AI-powered ticket routing and resolution workflow for customer service teams.",
      category: "Support",
      color: "yellow",
      features: ["Smart routing", "Priority assignment", "Response generation", "Resolution tracking"],
      aiPowered: true,
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
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
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">AI-Powered Templates</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Workflow Templates
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Jumpstart your processes with pre-built, AI-enhanced templates. Customize them to fit your needs in minutes.
            </p>
            <p className="mt-4 text-lg text-slate-500">
              Our AI can generate custom workflows from natural language descriptions, or you can start from our curated templates.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, i) => (
              <motion.div
                key={template.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all hover:shadow-2xl hover:bg-white/80"
              >
                {/* AI Badge */}
                {template.aiPowered && (
                  <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    AI-Powered
                  </div>
                )}

                {/* Icon */}
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[template.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <template.icon className="h-8 w-8" />
                </div>

                {/* Category */}
                <div className="mb-3">
                  <span className="inline-flex rounded-full bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/50">
                    {template.category}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {template.title}
                </h3>
                <p className="text-base leading-7 text-slate-600 mb-6">
                  {template.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {template.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg group-hover:shadow-xl"
                  >
                    Use Template
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Builder CTA */}
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
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Can't find what you need?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Our AI can generate a custom workflow from your description. Just tell us what you need, and we'll build it for you.
            </p>
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Try AI Builder
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

