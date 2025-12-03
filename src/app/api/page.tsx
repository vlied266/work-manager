"use client";

import { motion } from "framer-motion";
import { 
  Code, Key, Webhook, BookOpen, Terminal, 
  ArrowRight, Copy, CheckCircle2, Sparkles, Zap
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";
import { useState } from "react";

export default function APIPage() {
  const [copied, setCopied] = useState(false);

  const codeExample = `// Create a new procedure
const response = await fetch('https://api.workos.com/v1/procedures', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Order Processing',
    description: 'Automated order workflow',
    steps: [
      {
        action: 'INPUT',
        title: 'Collect Order Details',
        config: {
          fieldLabel: 'Order Number',
          inputType: 'text'
        }
      }
    ]
  })
});

const procedure = await response.json();`;

  const endpoints = [
    {
      method: "POST",
      path: "/v1/procedures",
      description: "Create a new procedure",
      category: "Procedures",
    },
    {
      method: "GET",
      path: "/v1/procedures",
      description: "List all procedures",
      category: "Procedures",
    },
    {
      method: "GET",
      path: "/v1/procedures/{id}",
      description: "Get procedure details",
      category: "Procedures",
    },
    {
      method: "POST",
      path: "/v1/runs",
      description: "Start a new run",
      category: "Runs",
    },
    {
      method: "GET",
      path: "/v1/runs/{id}",
      description: "Get run status",
      category: "Runs",
    },
    {
      method: "POST",
      path: "/v1/webhooks",
      description: "Create a webhook",
      category: "Webhooks",
    },
  ];

  const features = [
    {
      icon: Code,
      title: "RESTful API",
      description: "Standard REST API with JSON responses. Easy to integrate with any language.",
    },
    {
      icon: Key,
      title: "API Keys",
      description: "Secure authentication using API keys. Generate and manage keys from your dashboard.",
    },
    {
      icon: Webhook,
      title: "Webhooks",
      description: "Receive real-time events when workflows complete or errors occur.",
    },
    {
      icon: Sparkles,
      title: "AI Code Generation",
      description: "Our AI can generate integration code from natural language descriptions.",
    },
  ];

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
              <Code className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Developer API</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              API Documentation
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Build powerful integrations with our REST API. AI-powered code generation makes it even easier.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 text-center"
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-lg">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-6">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Quick Start
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigator.clipboard.writeText(codeExample);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </motion.button>
            </div>
            <div className="rounded-2xl bg-slate-900 p-6 overflow-x-auto">
              <pre className="text-sm text-slate-100 font-mono leading-6">
                <code>{codeExample}</code>
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              API Endpoints
            </h2>
            <p className="text-xl text-slate-600">
              Complete reference for all available endpoints
            </p>
          </motion.div>

          <div className="space-y-4">
            {endpoints.map((endpoint, i) => (
              <motion.div
                key={`${endpoint.method}-${endpoint.path}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        endpoint.method === "GET" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono font-semibold text-slate-900">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-sm text-slate-600">{endpoint.description}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/50">
                    {endpoint.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
              <Key className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Get Your API Key
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Start building integrations today. Our AI can help generate code for your specific use case.
            </p>
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Get Started
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

