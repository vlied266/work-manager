"use client";

import { motion } from "framer-motion";
import { 
  Briefcase, ArrowRight, Target, Zap, 
  Heart, Users, MapPin, Clock
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function CareersPage() {
  const values = [
    {
      icon: Target,
      title: "Autonomy",
      description: "Own your work. Make decisions. Ship fast.",
      color: "blue",
    },
    {
      icon: Zap,
      title: "Mastery",
      description: "Work on cutting-edge AI and build skills that matter.",
      color: "purple",
    },
    {
      icon: Heart,
      title: "Purpose",
      description: "Build products that transform how teams work.",
      color: "pink",
    },
    {
      icon: Users,
      title: "Balance",
      description: "Remote-first, flexible hours, unlimited PTO.",
      color: "green",
    },
  ];

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
      description: "Help developers discover and adopt Atomic Work through content, events, and community.",
    },
    {
      title: "Customer Success Manager",
      department: "Sales",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Help customers succeed with Atomic Work and maximize the value of our AI features.",
    },
  ];

  const colorClasses = {
    blue: "from-blue-50/80 to-blue-100/50 text-blue-600",
    purple: "from-purple-50/80 to-purple-100/50 text-purple-600",
    pink: "from-pink-50/80 to-pink-100/50 text-pink-600",
    green: "from-green-50/80 to-green-100/50 text-green-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 sm:py-40 lg:py-48">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-200 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 mb-6">
              Do the best work
              <br />
              <span className="text-slate-600">of your life.</span>
            </h1>
            <p className="text-2xl sm:text-3xl leading-relaxed text-slate-600 max-w-3xl mx-auto">
              Build the future of workflow automation. Help us create AI-powered tools that transform how teams work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-32 sm:py-40 lg:py-48">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Our Values
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              What We Stand For
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative rounded-[2.5rem] bg-gradient-to-br ${colorClasses[value.color as keyof typeof colorClasses]} backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-10 text-center transition-all hover:shadow-2xl hover:scale-[1.02]`}
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg mb-6">
                  <value.icon className="h-10 w-10" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">
                  {value.title}
                </h3>

                {/* Description */}
                <p className="text-base leading-relaxed text-slate-700">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles - Clean List */}
      <section className="py-32 sm:py-40 lg:py-48">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Open Positions
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Join Our Team
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl">
              We're looking for talented people who share our passion for building great products.
            </p>
          </motion.div>

          <div className="space-y-4">
            {openPositions.map((position, i) => (
              <Link key={position.title} href="/sign-up">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  whileHover={{ x: 8 }}
                  className="group relative rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-8 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                          {position.title}
                        </h3>
                        <span className="inline-flex rounded-full bg-blue-100/70 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200/50">
                          {position.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{position.type}</span>
                        </div>
                      </div>
                      <p className="text-base leading-relaxed text-slate-700">
                        {position.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="inline-flex items-center gap-2 text-blue-600 font-semibold"
                      >
                        <span>Learn more</span>
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 sm:py-40 lg:py-48">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-xl">
              <Briefcase className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
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
