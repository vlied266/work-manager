"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Zap, Users, Layers, Bot, BarChart3, Shield, 
  Workflow, CheckCircle2, ArrowRight, Sparkles,
  Lock, Globe, Clock, Target, TrendingUp, Cpu
} from "lucide-react";
import Logo from "@/components/Logo";

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Zap,
      title: "Atomic Tasks",
      description: "Break down complex processes into indivisible, manageable units. Each task is atomic—simple, clear, and executable.",
      color: "blue",
      details: [
        "16 predefined atomic actions",
        "Custom task configurations",
        "Reusable task templates",
        "Real-time execution tracking"
      ]
    },
    {
      icon: Layers,
      title: "Drag & Drop Builder",
      description: "Create workflows visually. No coding required. Drag atomic tasks, connect them, and build powerful processes.",
      color: "purple",
      details: [
        "Visual workflow designer",
        "Intuitive drag-and-drop interface",
        "Real-time preview",
        "Template library with 30+ workflows"
      ]
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Assign tasks to teams or individuals. Track progress, manage roles, and ensure accountability across your organization.",
      color: "green",
      details: [
        "Role-based access control",
        "Team assignments",
        "User permissions",
        "Activity tracking"
      ]
    },
    {
      icon: Bot,
      title: "Smart Automation",
      description: "Automate data piping between steps. Compare values automatically. Validate inputs. Let the system do the heavy lifting.",
      color: "orange",
      details: [
        "Data piping between steps",
        "Auto-comparison logic",
        "Input validation",
        "Conditional routing"
      ]
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track productivity, monitor performance, and gain insights into your team's workflow efficiency.",
      color: "indigo",
      details: [
        "Performance dashboards",
        "Task completion metrics",
        "Team productivity insights",
        "Custom reports"
      ]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with encryption, audit logs, and compliance features to keep your data safe.",
      color: "red",
      details: [
        "End-to-end encryption",
        "Audit logs",
        "GDPR compliance",
        "SSO integration"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: Workflow,
      title: "Process Orchestration",
      description: "Chain multiple procedures together to create complex business workflows."
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and track goals for your processes with real-time progress monitoring."
    },
    {
      icon: Clock,
      title: "Scheduling",
      description: "Schedule processes to run automatically at specific times or intervals."
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Support for multiple languages and time zones for global teams."
    },
    {
      icon: Lock,
      title: "Data Privacy",
      description: "Full control over your data with privacy settings and data retention policies."
    },
    {
      icon: Cpu,
      title: "API Access",
      description: "Integrate with your existing tools using our comprehensive REST API."
    }
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm"
      >
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <Logo size="small" />
              </motion.div>
              <div>
                <span className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  WorkOS
                </span>
                <div className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                  Atomic Engine
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 shadow-lg"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900">
              Powerful Features for
              <br />
              <span className="text-slate-600">Modern Teams</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Everything you need to transform complex processes into atomic, manageable workflows.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {mainFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-10 transition-all hover:border-slate-300 hover:shadow-lg"
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[feature.color as keyof typeof colorClasses]} mb-8`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-base leading-7 text-slate-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 sm:py-24 lg:py-32 bg-slate-50">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              And So Much More
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Additional features to help you work smarter, not harder.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Ready to get started?
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Start building your workflows today. No credit card required.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 shadow-lg"
                >
                  Start for Free
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2">
              <Logo size="small" />
              <span className="text-lg font-semibold text-slate-900">WorkOS</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <Link href="/features" className="hover:text-slate-900 transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="hover:text-slate-900 transition-colors">
                About
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} WorkOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

