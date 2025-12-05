"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Zap, Sparkles, Eye, Rocket, Shield, Lock, 
  Code, Moon, ArrowRight, CheckCircle2, Layers,
  Brain, FileSpreadsheet, Calendar, MessageSquare,
  Cpu, Network, Target, TrendingUp
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Logo from "@/components/Logo";

export default function FeaturesPage() {
  const aiFeatures = [
    {
      icon: Sparkles,
      title: "Prompt-to-Process",
      description: "Type 'Onboard a new developer', and watch Atomic generate a complete, 20-step workflow instantly.",
      color: "purple",
    },
    {
      icon: Brain,
      title: "Smart Decomposition",
      description: "AI breaks down vague tasks into atomic, executable actions automatically.",
      color: "blue",
    },
    {
      icon: Target,
      title: "Context Awareness",
      description: "The AI learns from your past workflows to suggest optimizations.",
      color: "cyan",
    },
  ];

  const integrations = [
    {
      icon: FileSpreadsheet,
      title: "Google Sheets",
      description: "Import/Export data instantly. Turn rows into tasks.",
      color: "green",
    },
    {
      icon: Calendar,
      title: "Google Calendar",
      description: "Two-way sync. Never miss a deadline.",
      color: "blue",
    },
    {
      icon: MessageSquare,
      title: "Slack",
      description: "Real-time notifications where your team actually lives.",
      color: "purple",
    },
  ];

  const coreFeatures = [
    {
      id: "atomic",
      title: "Atomic Precision",
      headline: "Eliminate Ambiguity.",
      description: "Stop assigning vague tasks. Break work down into atomic, executable steps (Input, Logic, Action) so everyone knows exactly what to do.",
      icon: Zap,
      color: "blue",
      imageSide: "left",
      details: [
        "16 predefined atomic actions",
        "Visual step-by-step execution",
        "Zero ambiguity in task definition",
        "Real-time validation"
      ]
    },
    {
      id: "monitor",
      title: "Executive Visibility",
      headline: "God-Mode for Operations.",
      description: "Track every active run in real-time. See exactly which step a process is on, identify bottlenecks instantly, and intervene before deadlines are missed.",
      icon: Eye,
      color: "green",
      imageSide: "right",
      details: [
        "Live process tracking",
        "Bottleneck identification",
        "Instant intervention tools",
        "Complete visibility"
      ]
    },
  ];

  const bentoFeatures = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, SSO, and compliance",
      color: "blue",
    },
    {
      icon: Lock,
      title: "Data Privacy",
      description: "GDPR compliant with full data control",
      color: "green",
    },
    {
      icon: Code,
      title: "REST API",
      description: "Integrate with any tool or platform",
      color: "purple",
    },
    {
      icon: Moon,
      title: "Dark Mode",
      description: "Beautiful dark theme for extended use",
      color: "indigo",
    },
  ];

  const colorClasses = {
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
      gradient: "from-blue-500/20 to-blue-600/10",
      glow: "shadow-blue-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/20",
      gradient: "from-purple-500/20 to-purple-600/10",
      glow: "shadow-purple-500/20",
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      border: "border-green-500/20",
      gradient: "from-green-500/20 to-green-600/10",
      glow: "shadow-green-500/20",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      gradient: "from-cyan-500/20 to-cyan-600/10",
      glow: "shadow-cyan-500/20",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
      gradient: "from-orange-500/20 to-orange-600/10",
      glow: "shadow-orange-500/20",
    },
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/20",
      gradient: "from-indigo-500/20 to-indigo-600/10",
      glow: "shadow-indigo-500/20",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 sm:py-40 lg:py-48">
        {/* Dark Background with Neon Accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="inline-flex items-center justify-center mb-8"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Logo size="medium" />
              </motion.div>
            </motion.div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-6">
              Workflow, Reimagined.
            </h1>
            <p className="text-xl sm:text-2xl text-slate-400 max-w-2xl mx-auto">
              Four core pillars that transform how teams build and execute processes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* NEW: AI Engine Hero Section */}
      <section className="relative py-32 sm:py-40 lg:py-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Visual Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-[3rem] bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 p-12">
                <div className="relative z-10 flex flex-col items-center gap-8">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-400/50 shadow-2xl shadow-purple-500/30"
                  >
                    <Brain className="h-16 w-16 text-purple-300" />
                  </motion.div>
                  
                  {/* Animated Neural Network */}
                  <div className="relative w-64 h-64">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full"
                        style={{
                          transformOrigin: "0 80px",
                        }}
                        animate={{
                          rotate: [0, 360],
                          x: [0, Math.cos((i * 2 * Math.PI) / 5) * 80],
                          y: [0, Math.sin((i * 2 * Math.PI) / 5) * 80],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />
              </div>
            </motion.div>

            {/* Content Side */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="max-w-xl">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 mb-6 shadow-lg shadow-purple-500/20 border border-purple-500/30">
                  <Brain className="h-8 w-8" />
                </div>

                <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
                  Built with an AI Cortex.
                </h2>

                <p className="text-xl leading-8 text-slate-300 mb-8">
                  Don't just manage work. Generate it. Our LLM-powered engine understands your goals and builds the roadmap for you.
                </p>

                {/* AI Features Grid */}
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {aiFeatures.map((feature, i) => {
                    const colors = colorClasses[feature.color as keyof typeof colorClasses];
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                        className={`rounded-2xl ${colors.bg} border ${colors.border} p-6 backdrop-blur-sm`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.text} flex-shrink-0`}>
                            <feature.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-400">{feature.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40"
                  >
                    Try AI Builder
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* NEW: Integrations Section */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
              Plays Nice with Your Stack.
            </h2>
            <p className="text-xl text-slate-400">
              Atomic Work isn't an island. It connects your entire ecosystem.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {integrations.map((integration, i) => {
              const colors = colorClasses[integration.color as keyof typeof colorClasses];
              return (
                <motion.div
                  key={integration.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`group relative rounded-[2.5rem] ${colors.bg} border ${colors.border} backdrop-blur-xl p-8 transition-all hover:shadow-2xl ${colors.glow}`}
                >
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} mb-6 shadow-lg border ${colors.border}`}>
                    <integration.icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-2xl font-extrabold tracking-tight text-white mb-3">
                    {integration.title}
                  </h3>

                  <p className="text-base leading-7 text-slate-400">
                    {integration.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features - Zig-Zag Layout */}
      {coreFeatures.map((feature, index) => {
        const colors = colorClasses[feature.color as keyof typeof colorClasses];
        const isEven = index % 2 === 0;
        
        return (
          <section
            key={feature.id}
            className="relative py-32 sm:py-40 lg:py-48 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
            
            <div className="relative mx-auto max-w-[1600px] px-6">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${
                  isEven ? "" : "lg:grid-flow-dense"
                }`}
              >
                {/* Visual Side */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className={`relative ${isEven ? "" : "lg:col-start-2"}`}
                >
                  <motion.div
                    whileHover={{ rotateY: 5, rotateX: -2 }}
                    transition={{ duration: 0.3 }}
                    className="relative perspective-1000"
                    style={{ perspective: "1000px" }}
                  >
                    <div className={`relative rounded-[3rem] ${colors.bg} border ${colors.border} backdrop-blur-2xl p-8 transform-gpu shadow-2xl ${colors.glow}`}>
                      <div className={`relative rounded-2xl ${colors.bg} p-12 min-h-[400px] flex items-center justify-center overflow-hidden border ${colors.border}`}>
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-center gap-6">
                          <div className={`flex h-24 w-24 items-center justify-center rounded-3xl ${colors.bg} ${colors.text} shadow-xl border ${colors.border}`}>
                            <feature.icon className="h-12 w-12" />
                          </div>
                          
                          {feature.id === "atomic" && (
                            <div className="relative w-32 h-32">
                              <motion.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-300 rounded-full"
                                  style={{
                                    transformOrigin: "0 50px",
                                  }}
                                  animate={{
                                    rotate: [0, 360],
                                    x: [0, Math.cos((i * 2 * Math.PI) / 3) * 50],
                                    y: [0, Math.sin((i * 2 * Math.PI) / 3) * 50],
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.3,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          {feature.id === "monitor" && (
                            <div className="relative">
                              <Eye className="h-16 w-16 text-green-400" />
                              {[0, 1].map((i) => (
                                <motion.div
                                  key={i}
                                  className="absolute inset-0 rounded-full border-2 border-green-400/50"
                                  animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.6, 0, 0.6],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.5,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Content Side */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`${isEven ? "" : "lg:col-start-1 lg:row-start-1"}`}
                >
                  <div className="max-w-xl">
                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} mb-6 shadow-lg border ${colors.border}`}>
                      <feature.icon className="h-8 w-8" />
                    </div>

                    <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
                      {feature.headline}
                    </h2>

                    <p className="text-xl leading-8 text-slate-300 mb-8">
                      {feature.description}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {feature.details.map((detail, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                          className="flex items-start gap-3 text-base text-slate-300"
                        >
                          <CheckCircle2 className={`h-5 w-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                          <span>{detail}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <Link href="/sign-up">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`inline-flex items-center gap-2 rounded-full ${colors.bg} ${colors.text} px-6 py-3 text-sm font-semibold border ${colors.border} shadow-lg transition-all hover:shadow-xl`}
                      >
                        Learn more
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Bento Grid Section */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
              And So Much More
            </h2>
            <p className="text-xl text-slate-400">
              Enterprise-grade features built for scale
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {bentoFeatures.map((feature, i) => {
              const colors = colorClasses[feature.color as keyof typeof colorClasses];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`group relative rounded-[2.5rem] ${colors.bg} border ${colors.border} backdrop-blur-xl p-8 transition-all hover:shadow-2xl ${colors.glow}`}
                >
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} mb-6 shadow-lg border ${colors.border}`}>
                    <feature.icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-2xl font-extrabold tracking-tight text-white mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-base leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-800/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 p-12"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
              Ready to go Atomic?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Start building your workflows today. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                >
                  Start for Free
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
