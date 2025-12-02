"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Target, Users, Zap, Heart } from "lucide-react";
import Logo from "@/components/Logo";

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "We're on a mission to eliminate ambiguity in work. Every feature we build serves this purpose."
    },
    {
      icon: Zap,
      title: "Innovation First",
      description: "We push boundaries and challenge the status quo. Innovation is at the heart of everything we do."
    },
    {
      icon: Users,
      title: "Customer-Centric",
      description: "Our customers are our partners. We build with them, not just for them."
    },
    {
      icon: Heart,
      title: "Transparency",
      description: "We believe in open communication, honest feedback, and building trust through transparency."
    }
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      bio: "Former product lead at major tech companies. Passionate about making work more efficient."
    },
    {
      name: "Sarah Johnson",
      role: "Head of Engineering",
      bio: "10+ years building scalable systems. Loves solving complex problems with elegant solutions."
    },
    {
      name: "Michael Park",
      role: "Head of Design",
      bio: "Designer with a focus on user experience. Believes great design should be invisible."
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Customer Success",
      bio: "Dedicated to helping teams succeed. Customer happiness is her top priority."
    }
  ];

  const milestones = [
    {
      year: "2024",
      title: "Company Founded",
      description: "WorkOS was born from a simple idea: work should be atomic, clear, and executable."
    },
    {
      year: "2024",
      title: "First Customers",
      description: "We launched with 10 beta customers who helped shape our product."
    },
    {
      year: "2024",
      title: "10,000+ Teams",
      description: "We reached a major milestone with over 10,000 teams using WorkOS."
    },
    {
      year: "2025",
      title: "The Future",
      description: "We're just getting started. Big things are coming."
    }
  ];

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
              About WorkOS
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              We're building the operating system for work. Our mission is to eliminate ambiguity and make every process atomic, clear, and executable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-lg text-slate-600">
                <p>
                  WorkOS was founded in 2024 with a simple but powerful idea: work should be broken down into atomic, indivisible tasks that are clear, executable, and measurable.
                </p>
                <p>
                  We noticed that teams were struggling with complex processes, unclear workflows, and a lack of visibility into what was actually happening. Traditional project management tools weren't solving the fundamental problem.
                </p>
                <p>
                  So we built WorkOS—a platform that transforms complex processes into atomic tasks. We believe that when work is atomic, it becomes manageable, trackable, and ultimately, more successful.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">10,000+</div>
                  <div className="text-sm text-slate-600">Teams Trust WorkOS</div>
                </div>
              </div>
              <div className="space-y-4 text-sm text-slate-600">
                <p>From startups to enterprises, teams around the world are using WorkOS to transform their workflows.</p>
                <p>We're proud to be part of their journey toward more efficient, transparent, and successful work.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
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
              Our Values
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              The principles that guide everything we do.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-600 mx-auto mb-4">
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Meet the Team
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              The people building the future of work.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
              >
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{member.role}</p>
                <p className="text-xs text-slate-500">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
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
              Our Journey
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Key milestones in our growth.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-8">
            {milestones.map((milestone, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">
                    {milestone.year.slice(-2)}
                  </div>
                </div>
                <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{milestone.title}</h3>
                  <p className="text-sm text-slate-600">{milestone.description}</p>
                </div>
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
              Join Us on This Journey
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Be part of the future of work. Start using WorkOS today.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 shadow-lg"
                >
                  Get Started
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

