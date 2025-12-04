"use client";

import { motion } from "framer-motion";
import { Cookie, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function CookiePolicyPage() {
  const cookieTypes = [
    {
      name: "Essential Cookies",
      description: "These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.",
      examples: ["Authentication", "Session management", "Security"],
      required: true,
    },
    {
      name: "Analytics Cookies",
      description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.",
      examples: ["Page views", "User behavior", "Performance metrics"],
      required: false,
    },
    {
      name: "Functional Cookies",
      description: "These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.",
      examples: ["Language preferences", "UI settings", "Feature preferences"],
      required: false,
    },
    {
      name: "Marketing Cookies",
      description: "These cookies are used to deliver relevant advertisements and track campaign effectiveness.",
      examples: ["Ad targeting", "Campaign tracking", "Conversion tracking"],
      required: false,
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
              <Cookie className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Cookie Information</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Cookie Policy
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Learn about how we use cookies and similar technologies to provide and improve our services.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cookie Types */}
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
              Types of Cookies We Use
            </h2>
            <p className="text-xl text-slate-600">
              We use different types of cookies for various purposes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cookieTypes.map((cookie, i) => (
              <motion.div
                key={cookie.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                    {cookie.name}
                  </h3>
                  {cookie.required && (
                    <span className="inline-flex rounded-full bg-blue-100/70 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200/50">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-base leading-7 text-slate-600 mb-4">
                  {cookie.description}
                </p>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Examples:</p>
                  <ul className="space-y-1">
                    {cookie.examples.map((example, j) => (
                      <li key={j} className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cookie Management */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white/50 backdrop-blur-sm">
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
                <Cookie className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Managing Cookies
              </h2>
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-600 leading-8 mb-6">
                You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can impact your user experience and parts of our website may no longer be fully accessible.
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">
                Browser Settings
              </h3>
              <p className="text-base text-slate-600 leading-7 mb-6">
                Most browsers allow you to refuse or accept cookies. You can also delete cookies that have already been set. The methods for doing so vary from browser to browser. Please refer to your browser's help menu for instructions.
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">
                Our Cookie Preferences
              </h3>
              <p className="text-base text-slate-600 leading-7 mb-6">
                You can manage your cookie preferences directly in your Atomic Work account settings. This allows you to control which types of cookies we use, except for essential cookies which are required for the service to function.
              </p>
            </div>
          </motion.div>
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
              <Cookie className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Questions About Cookies?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              If you have questions about our use of cookies, please contact us.
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

