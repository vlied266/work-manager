"use client";

import { motion } from "framer-motion";
import { 
  HelpCircle, MessageCircle, BookOpen, Video, 
  ArrowRight, Search, Sparkles, Zap, CheckCircle2
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function HelpCenterPage() {
  const faqs = [
    {
      question: "How does the AI workflow builder work?",
      answer: "Our AI can generate complete workflows from natural language descriptions. Just describe what you need, and our AI will create a procedure with all the necessary steps, validations, and logic.",
      category: "AI Features",
    },
    {
      question: "Can I customize AI-generated workflows?",
      answer: "Absolutely! AI-generated workflows are fully editable. You can modify steps, add validations, change assignments, and adjust any configuration to fit your exact needs.",
      category: "AI Features",
    },
    {
      question: "How do I assign tasks to team members?",
      answer: "In the Studio, select any step and use the 'Responsibility' section in the Config Panel. You can assign to a specific user, a team queue, or let the process starter handle it.",
      category: "Team Management",
    },
    {
      question: "What are atomic tasks?",
      answer: "Atomic tasks are indivisible, single-purpose actions like collecting input, validating data, or requesting approval. They're the building blocks of all workflows in Atomic Work.",
      category: "Basics",
    },
    {
      question: "How do integrations work?",
      answer: "Atomic Work integrates with popular tools via our API and webhooks. You can also use Zapier to connect with 5000+ apps. Our AI can help generate integration code.",
      category: "Integrations",
    },
    {
      question: "Is my data secure?",
      answer: "Yes! We use end-to-end encryption, follow GDPR compliance, and offer SSO integration. All data is stored securely with regular backups and audit logs.",
      category: "Security",
    },
  ];

  const helpCategories = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Comprehensive guides and tutorials",
      href: "/documentation",
      color: "blue",
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Ask questions and share knowledge",
      href: "/community",
      color: "green",
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      href: "#",
      color: "purple",
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Get help from our AI assistant",
      href: "#",
      color: "yellow",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
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
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">We're Here to Help</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Help Center
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Find answers, get support, and learn how to make the most of Atomic Work and our AI features.
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
              placeholder="Search for help..."
              className="w-full rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 pl-12 pr-6 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </motion.div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {helpCategories.map((category, i) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 text-center transition-all hover:shadow-2xl hover:bg-white/80"
              >
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${colorClasses[category.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <category.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {category.title}
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  {category.description}
                </p>
                <Link href={category.href}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                  >
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
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
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Quick answers to common questions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="inline-flex rounded-full bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/50">
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight text-slate-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-slate-600 leading-6">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
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
              <MessageCircle className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Our support team is here to help. Reach out and we'll get back to you within 24 hours.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Contact Support
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

