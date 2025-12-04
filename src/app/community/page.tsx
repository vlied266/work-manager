"use client";

import { motion } from "framer-motion";
import { 
  Users, MessageSquare, Github, Twitter, 
  ArrowRight, Sparkles, CheckCircle2, Zap
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function CommunityPage() {
  const platforms = [
    {
      icon: MessageSquare,
      title: "Discord Community",
      description: "Join our Discord server to chat with other users, get help, and share your workflows.",
      members: "2,500+ members",
      href: "#",
      color: "blue",
    },
    {
      icon: Github,
      title: "GitHub",
      description: "Contribute to open-source integrations, report issues, and suggest features.",
      members: "500+ stars",
      href: "#",
      color: "gray",
    },
    {
      icon: Twitter,
      title: "Twitter",
      description: "Follow us for updates, tips, and community highlights.",
      members: "10K+ followers",
      href: "#",
      color: "blue",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
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
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Join the Community</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Community
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Connect with other Atomic Work users, share workflows, get help, and contribute to the future of workflow automation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platforms.map((platform, i) => (
              <motion.a
                key={platform.title}
                href={platform.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all hover:shadow-2xl hover:bg-white/80"
              >
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${colorClasses[platform.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <platform.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {platform.title}
                </h3>
                <p className="text-base leading-7 text-slate-600 mb-4">
                  {platform.description}
                </p>
                <p className="text-sm font-semibold text-slate-700 mb-6">
                  {platform.members}
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#007AFF] group-hover:gap-3 transition-all">
                  Join Now
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
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
              Why Join?
            </h2>
            <p className="text-xl text-slate-600">
              Connect, learn, and grow with the Atomic Work community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI Tips & Tricks",
                description: "Learn how to maximize our AI features",
              },
              {
                icon: Zap,
                title: "Workflow Sharing",
                description: "Share and discover workflow templates",
              },
              {
                icon: MessageSquare,
                title: "Get Help",
                description: "Ask questions and get answers",
              },
              {
                icon: Users,
                title: "Network",
                description: "Connect with other professionals",
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 text-center"
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-lg">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-600 leading-6">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
              <Users className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Ready to Join?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Connect with thousands of users building amazing workflows with AI-powered automation.
            </p>
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
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

