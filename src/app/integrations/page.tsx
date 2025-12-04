"use client";

import { motion } from "framer-motion";
import { 
  Zap, Slack, Github, Chrome, Building2, FileText, 
  CreditCard, Database, Webhook, ArrowRight, CheckCircle2,
  Sparkles
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function IntegrationsPage() {
  const integrations = [
    {
      icon: Slack,
      name: "Slack",
      description: "Get real-time notifications and updates in your Slack channels.",
      category: "Communication",
      status: "Available",
      color: "purple",
    },
    {
      icon: Chrome,
      name: "Google Workspace",
      description: "Connect with Gmail, Google Drive, Calendar, and Sheets.",
      category: "Productivity",
      status: "Available",
      color: "blue",
    },
    {
      icon: Building2,
      name: "Microsoft 365",
      description: "Integrate with Outlook, OneDrive, Teams, and Excel.",
      category: "Productivity",
      status: "Available",
      color: "orange",
    },
    {
      icon: FileText,
      name: "Notion",
      description: "Sync your workflows with Notion databases and pages.",
      category: "Productivity",
      status: "Available",
      color: "gray",
    },
    {
      icon: CreditCard,
      name: "Stripe",
      description: "Process payments and manage subscriptions seamlessly.",
      category: "Payment",
      status: "Available",
      color: "indigo",
    },
    {
      icon: Database,
      name: "Airtable",
      description: "Connect your Airtable bases to automate data workflows.",
      category: "Database",
      status: "Available",
      color: "orange",
    },
    {
      icon: Zap,
      name: "Zapier",
      description: "Connect to 5000+ apps through Zapier's automation platform.",
      category: "Automation",
      status: "Available",
      color: "orange",
    },
    {
      icon: Github,
      name: "GitHub",
      description: "Trigger workflows from GitHub events and pull requests.",
      category: "Development",
      status: "Available",
      color: "gray",
    },
    {
      icon: Webhook,
      name: "Custom Webhooks",
      description: "Build custom integrations with our webhook API.",
      category: "Custom",
      status: "Available",
      color: "blue",
    },
  ];

  const colorClasses = {
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
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
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Powerful Integrations</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Connect Everything
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Integrate Atomic Work with your favorite tools. Our AI-powered integration system makes connecting apps effortless.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integration, i) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all hover:shadow-2xl hover:bg-white/80"
              >
                {/* Icon */}
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[integration.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <integration.icon className="h-8 w-8" />
                </div>

                {/* Category */}
                <div className="mb-3">
                  <span className="inline-flex rounded-full bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/50">
                    {integration.category}
                  </span>
                </div>

                {/* Name & Description */}
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {integration.name}
                </h3>
                <p className="text-base leading-7 text-slate-600 mb-6">
                  {integration.description}
                </p>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">{integration.status}</span>
                  </div>
                  <Link href="/sign-up">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                    >
                      Connect
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
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
              <Webhook className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Build Custom Integrations
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Use our REST API and webhooks to connect Atomic Work with any tool. Our AI can even help generate integration code.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/api">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
                >
                  View API Docs
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-8 py-4 text-base font-semibold text-slate-700 shadow-md transition-all hover:bg-white hover:shadow-lg"
                >
                  Get API Key
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

