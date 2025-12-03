"use client";

import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing or using WorkOS, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.",
    },
    {
      title: "Use of Service",
      content: "You may use WorkOS for lawful purposes only. You agree not to use the service in any way that violates applicable laws or regulations, or infringes on the rights of others.",
    },
    {
      title: "AI-Generated Content",
      content: "Our AI features generate workflows and code based on your input. While we strive for accuracy, AI-generated content may contain errors. You are responsible for reviewing and validating all AI-generated content before use.",
    },
    {
      title: "User Accounts",
      content: "You are responsible for maintaining the security of your account and password. You agree to notify us immediately of any unauthorized access or use of your account.",
    },
    {
      title: "Intellectual Property",
      content: "WorkOS and its original content, features, and functionality are owned by WorkOS and are protected by international copyright, trademark, and other intellectual property laws.",
    },
    {
      title: "User Content",
      content: "You retain ownership of any content you create using WorkOS. By using our service, you grant us a license to use, store, and process your content as necessary to provide the service.",
    },
    {
      title: "Prohibited Uses",
      content: "You may not use WorkOS to: violate any laws, infringe on intellectual property rights, transmit harmful code, spam, or engage in any activity that disrupts the service or harms other users.",
    },
    {
      title: "Service Availability",
      content: "We strive to maintain high availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications that temporarily affect service availability.",
    },
    {
      title: "Limitation of Liability",
      content: "To the maximum extent permitted by law, WorkOS shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.",
    },
    {
      title: "Termination",
      content: "We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users.",
    },
    {
      title: "Changes to Terms",
      content: "We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the service after changes constitutes acceptance of the new terms.",
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
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Legal Terms</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Terms of Service
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Please read these terms carefully before using WorkOS. By using our service, you agree to these terms.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-8"
              >
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">
                  {section.title}
                </h2>
                <p className="text-base leading-7 text-slate-600">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
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
              <FileText className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Questions About Terms?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              If you have questions about these terms, please contact us for clarification.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Contact Us
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

