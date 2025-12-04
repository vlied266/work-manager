"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Download, FileText, Image, Video, 
  ArrowRight, Sparkles, CheckCircle2
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";

export default function PressKitPage() {
  const assets = [
    {
      icon: Image,
      title: "Logo & Brand Assets",
      description: "High-resolution logos in various formats and color variations",
      files: ["Logo (PNG)", "Logo (SVG)", "Icon (PNG)", "Brand Guidelines"],
      color: "blue",
    },
    {
      icon: FileText,
      title: "Press Releases",
      description: "Latest news and announcements about Atomic Work",
      files: ["Product Launches", "Funding Announcements", "Partnership News"],
      color: "green",
    },
    {
      icon: Image,
      title: "Screenshots",
      description: "Product screenshots for articles and reviews",
      files: ["Dashboard", "Studio", "Workflow Builder", "AI Features"],
      color: "purple",
    },
    {
      icon: Video,
      title: "Video Assets",
      description: "Product demos and promotional videos",
      files: ["Product Demo", "AI Feature Showcase", "Customer Testimonials"],
      color: "orange",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
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
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Media Resources</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Press Kit
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Everything you need to write about Atomic Work. Download assets, press releases, and learn about our AI-powered platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                About Atomic Work
              </h2>
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-600 leading-8 mb-6">
                Atomic Work is a workflow automation platform that transforms complex business processes into atomic, manageable tasks. 
                Our AI-powered builder allows users to generate complete workflows from natural language descriptions, making 
                automation accessible to everyone—no coding required.
              </p>
              <p className="text-lg text-slate-600 leading-8 mb-6">
                Key features include:
              </p>
              <ul className="space-y-2 text-base text-slate-600 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>AI-Powered Workflow Generation:</strong> Describe what you need, and our AI creates the workflow</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Visual Builder:</strong> Drag-and-drop interface for creating and editing workflows</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Team Collaboration:</strong> Assign tasks, track progress, and communicate in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Enterprise Security:</strong> Bank-level encryption, GDPR compliance, and audit logs</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Assets Grid */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Download Assets
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need for articles, reviews, and coverage
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {assets.map((asset, i) => (
              <motion.div
                key={asset.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all hover:shadow-2xl hover:bg-white/80"
              >
                {/* Icon */}
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[asset.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <asset.icon className="h-8 w-8" />
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {asset.title}
                </h3>
                <p className="text-base leading-7 text-slate-600 mb-6">
                  {asset.description}
                </p>

                {/* Files */}
                <ul className="space-y-2 mb-6">
                  {asset.files.map((file, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{file}</span>
                    </li>
                  ))}
                </ul>

                {/* Download Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  Download
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-xl">
              <FileText className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Need More Information?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              For press inquiries, interviews, or additional assets, please contact our press team.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Contact Press Team
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

