"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This includes your name, email address, organization information, and workflow data. We also collect usage data and analytics to improve our services.",
    },
    {
      title: "How We Use Your Information",
      content: "We use your information to provide, maintain, and improve our services, including our AI-powered features. We also use it to communicate with you, process transactions, and ensure security. We do not sell your personal information to third parties.",
    },
    {
      title: "Data Security",
      content: "We implement industry-standard security measures to protect your data, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.",
    },
    {
      title: "AI and Machine Learning",
      content: "Our AI features process your workflow data to generate procedures and provide suggestions. This processing is done securely and in accordance with this privacy policy. We may use anonymized data to improve our AI models.",
    },
    {
      title: "Your Rights",
      content: "You have the right to access, update, or delete your personal information. You can also opt out of certain data processing activities. Contact us to exercise these rights.",
    },
    {
      title: "Cookies and Tracking",
      content: "We use cookies and similar technologies to provide and improve our services. You can control cookies through your browser settings. See our Cookie Policy for more details.",
    },
    {
      title: "Third-Party Services",
      content: "We may use third-party services for analytics, payment processing, and other functions. These services have their own privacy policies governing the use of your information.",
    },
    {
      title: "Changes to This Policy",
      content: "We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the 'Last Updated' date.",
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
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Privacy & Security</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Privacy Policy
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
              <Shield className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              If you have questions about this privacy policy or our data practices, please contact us.
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

