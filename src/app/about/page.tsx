"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";

export default function AboutPage() {
  const stats = [
    {
      number: "10,000+",
      label: "Active Users",
      icon: Users,
      color: "blue",
    },
    {
      number: "500K+",
      label: "Processes Run",
      icon: Zap,
      color: "purple",
    },
    {
      number: "99.9%",
      label: "Uptime",
      icon: TrendingUp,
      color: "green",
    },
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      avatar: "AC",
      bio: "Former product lead at major tech companies. Passionate about making work more efficient.",
    },
    {
      name: "Sarah Johnson",
      role: "Head of Engineering",
      avatar: "SJ",
      bio: "10+ years building scalable systems. Loves solving complex problems with elegant solutions.",
    },
    {
      name: "Michael Park",
      role: "Head of Design",
      avatar: "MP",
      bio: "Designer with a focus on user experience. Believes great design should be invisible.",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Customer Success",
      avatar: "ER",
      bio: "Dedicated to helping teams succeed. Customer happiness is her top priority.",
    },
  ];

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
              About Atomic Work
            </h1>
            <p className="text-2xl sm:text-3xl leading-relaxed text-slate-600 max-w-3xl mx-auto">
              We're building the operating system for work. Our mission is to eliminate ambiguity and make every process atomic, clear, and executable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section - Editorial Style */}
      <section className="py-32 sm:py-40 lg:py-48">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Text Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-block">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Our Story
                </span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Why we built Atomic Work?
              </h2>
              <div className="space-y-6 text-lg sm:text-xl leading-relaxed text-slate-700">
                <p>
                  Atomic Work was founded in 2024 with a simple but powerful idea: work should be broken down into atomic, indivisible tasks that are clear, executable, and measurable.
                </p>
                <p>
                  We noticed that teams were struggling with complex processes, unclear workflows, and a lack of visibility into what was actually happening. Traditional project management tools weren't solving the fundamental problem.
                </p>
                <p>
                  So we built Atomic Work—a platform that transforms complex processes into atomic tasks. We believe that when work is atomic, it becomes manageable, trackable, and ultimately, more successful.
                </p>
              </div>
            </motion.div>

            {/* Image Side - Placeholder for candid photo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-[3rem] bg-gradient-to-br from-blue-100/50 via-purple-100/50 to-pink-100/50 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/10 overflow-hidden aspect-[4/3]">
                {/* Placeholder for candid photo - Whiteboard/Team working illustration */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center h-32 w-32 rounded-full bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl">
                      <Users className="h-16 w-16 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-48 bg-white/60 rounded-full mx-auto" />
                      <div className="h-2 w-40 bg-white/40 rounded-full mx-auto" />
                      <div className="h-2 w-36 bg-white/40 rounded-full mx-auto" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 italic">
                      Team collaborating on workflow design
                    </p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-8 right-8 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl" />
                <div className="absolute bottom-8 left-8 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Row - Floating in Space */}
      <section className="py-32 sm:py-40 lg:py-48">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {stats.map((stat, i) => {
              const colorClasses = {
                blue: "from-blue-500/20 to-blue-600/20 text-blue-600",
                purple: "from-purple-500/20 to-purple-600/20 text-purple-600",
                green: "from-green-500/20 to-green-600/20 text-green-600",
              };

              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                  className="relative"
                >
                  <div className="relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12 text-center">
                    {/* Floating Icon */}
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3,
                      }}
                      className={`inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} mb-6 shadow-lg`}
                    >
                      <stat.icon className="h-10 w-10" />
                    </motion.div>

                    {/* Big Number */}
                    <motion.div
                      initial={{ scale: 0.8 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-6xl sm:text-7xl font-extrabold text-slate-900 mb-4"
                    >
                      {stat.number}
                    </motion.div>

                    {/* Label */}
                    <div className="text-lg font-semibold text-slate-600 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section - Circular Avatars with Glass Tags */}
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
                The Team
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Meet the People
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              The people building the future of work.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative group"
              >
                {/* Circular Avatar */}
                <div className="relative mb-8 flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl ring-4 ring-white/60 overflow-hidden"
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-extrabold">
                      {member.avatar}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/50 to-purple-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </div>

                {/* Glass-Frosted Name Tag */}
                <div className="relative">
                  <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-6 text-center">
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
                      {member.name}
                    </h3>
                    <p className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wider">
                      {member.role}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 sm:py-40 lg:py-48">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Join Us on This Journey
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Be part of the future of work. Start using Atomic Work today.
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
