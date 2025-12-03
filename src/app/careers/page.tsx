"use client";

import { motion } from "framer-motion";
import { 
  Briefcase, MapPin, Clock, ArrowRight, 
  Sparkles, Users, Heart, Zap
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function CareersPage() {
  const openPositions = [
    {
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Build the next generation of workflow automation tools with AI integration.",
    },
    {
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Develop and improve our AI-powered workflow generation and code assistance features.",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Design beautiful, intuitive interfaces for our workflow builder and AI tools.",
    },
    {
      title: "Developer Advocate",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      description: "Help developers discover and adopt WorkOS through content, events, and community.",
    },
    {
      title: "Customer Success Manager",
      department: "Sales",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Help customers succeed with WorkOS and maximize the value of our AI features.",
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance",
    },
    {
      icon: Zap,
      title: "Flexible Work",
      description: "Remote-first with flexible hours and unlimited PTO",
    },
    {
      icon: Users,
      title: "Team Culture",
      description: "Collaborative environment with regular team events",
    },
    {
      icon: Sparkles,
      title: "AI Innovation",
      description: "Work on cutting-edge AI features that shape the future",
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
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Join Our Team</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Careers at WorkOS
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Build the future of workflow automation. Help us create AI-powered tools that transform how teams work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
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
              Why Work at WorkOS?
            </h2>
            <p className="text-xl text-slate-600">
              We offer competitive benefits and the opportunity to work on cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
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

      {/* Open Positions */}
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
              Open Positions
            </h2>
            <p className="text-xl text-slate-600">
              Join us in building the future of workflow automation
            </p>
          </motion.div>

          <div className="space-y-6">
            {openPositions.map((position, i) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -2 }}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-8 hover:shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {position.title}
                      </h3>
                      <span className="inline-flex rounded-full bg-blue-100/70 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200/50">
                        {position.department}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{position.type}</span>
                      </div>
                    </div>
                    <p className="text-base text-slate-600">
                      {position.description}
                    </p>
                  </div>
                  <Link href="/sign-up">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                    >
                      Apply Now
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </Link>
                </div>
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
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Don't See a Role That Fits?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Get in Touch
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

