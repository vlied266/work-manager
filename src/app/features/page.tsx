"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Zap, Sparkles, Eye, Rocket, Shield, Lock, 
  Code, Moon, ArrowRight, CheckCircle2, Layers
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Logo from "@/components/Logo";

export default function FeaturesPage() {
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
      id: "ai",
      title: "AI Magic Builder",
      headline: "Type, Don't Click.",
      description: "Don't start from scratch. Just describe your process in plain English, and our Magic Builder constructs the entire workflow instantly.",
      icon: Sparkles,
      color: "purple",
      imageSide: "right",
      details: [
        "Natural language to workflow",
        "Instant procedure generation",
        "Smart suggestions and refinements",
        "Prompt-to-Process capability"
      ]
    },
    {
      id: "monitor",
      title: "Real-Time Monitor",
      headline: "God-Mode for Operations.",
      description: "Track every active run in real-time. See exactly which step a process is on, identify bottlenecks instantly, and intervene before deadlines are missed.",
      icon: Eye,
      color: "green",
      imageSide: "left",
      details: [
        "Live process tracking",
        "Bottleneck identification",
        "Instant intervention tools",
        "Complete visibility"
      ]
    },
    {
      id: "templates",
      title: "Template Library",
      headline: "Day One Value.",
      description: "Launch professional workflows for HR, Finance, and Ops in seconds using our pre-built, industry-standard template library.",
      icon: Rocket,
      color: "orange",
      imageSide: "right",
      details: [
        "30+ industry templates",
        "One-click deployment",
        "Fully customizable",
        "AI-enhanced suggestions"
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
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      gradient: "from-blue-50/50 to-blue-100/30",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
      gradient: "from-purple-50/50 to-purple-100/30",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-200",
      gradient: "from-green-50/50 to-green-100/30",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200",
      gradient: "from-orange-50/50 to-orange-100/30",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-200",
      gradient: "from-indigo-50/50 to-indigo-100/30",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40 relative overflow-hidden">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 sm:py-40 lg:py-48">
        {/* Continuous Mesh Gradient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* Floating 3D Element */}
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
                className="relative"
              >
                <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/40 shadow-2xl flex items-center justify-center">
                  <Logo size="medium" />
                </div>
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-2xl -z-10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 mb-6">
              Workflow, Reimagined.
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 max-w-2xl mx-auto">
              Four core pillars that transform how teams build and execute processes.
            </p>
          </motion.div>
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
            {/* Continuous Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40" />
            
            <div className="relative mx-auto max-w-[1600px] px-6">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${
                  isEven ? "" : "lg:grid-flow-dense"
                }`}
              >
                {/* Image/Mockup Side */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className={`relative ${isEven ? "" : "lg:col-start-2"}`}
                >
                  {/* Glass Container with 3D Tilt */}
                  <motion.div
                    whileHover={{ rotateY: 5, rotateX: -2 }}
                    transition={{ duration: 0.3 }}
                    className="relative perspective-1000"
                    style={{ perspective: "1000px" }}
                  >
                    <div className="relative rounded-[3rem] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/10 p-8 transform-gpu">
                      {/* Mockup Content */}
                      <div className={`relative rounded-2xl ${colors.bg} p-12 min-h-[400px] flex items-center justify-center overflow-hidden`}>
                        {/* Animated Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent" />
                        </div>
                        
                        {/* Feature Icon Large */}
                        <div className={`relative z-10 flex flex-col items-center gap-6`}>
                          <div className={`flex h-24 w-24 items-center justify-center rounded-3xl ${colors.bg} ${colors.text} shadow-xl`}>
                            <feature.icon className="h-12 w-12" />
                          </div>
                          
                          {/* Animated Elements based on feature */}
                          {feature.id === "atomic" && (
                            <div className="relative w-32 h-32">
                              {/* Atomic Structure */}
                              <motion.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-400 rounded-full"
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
                          
                          {feature.id === "ai" && (
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, 0],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles className="h-16 w-16 text-purple-600" />
                            </motion.div>
                          )}
                          
                          {feature.id === "monitor" && (
                            <div className="relative">
                              <Eye className="h-16 w-16 text-green-600" />
                              {[0, 1].map((i) => (
                                <motion.div
                                  key={i}
                                  className="absolute inset-0 rounded-full border-2 border-green-400"
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
                          
                          {feature.id === "templates" && (
                            <motion.div
                              animate={{
                                y: [0, -10, 0],
                                rotate: [0, 10, 0],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Rocket className="h-16 w-16 text-orange-600" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      {/* Glass Reflection Effect */}
                      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
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
                    {/* Icon */}
                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} mb-6 shadow-lg`}>
                      <feature.icon className="h-8 w-8" />
                    </div>

                    {/* Title */}
                    <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
                      {feature.headline}
                    </h2>

                    {/* Description */}
                    <p className="text-xl leading-8 text-slate-600 mb-8">
                      {feature.description}
                    </p>

                    {/* Details List */}
                    <ul className="space-y-3 mb-8">
                      {feature.details.map((detail, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                          className="flex items-start gap-3 text-base text-slate-700"
                        >
                          <CheckCircle2 className={`h-5 w-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                          <span>{detail}</span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* Learn More Link */}
                    <Link href="/sign-up">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`inline-flex items-center gap-2 rounded-full ${colors.bg} ${colors.text} px-6 py-3 text-sm font-semibold border ${colors.border} shadow-md transition-all hover:shadow-lg`}
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
        {/* Continuous Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40" />
        
        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
              And So Much More
            </h2>
            <p className="text-xl text-slate-600">
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
                  className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all hover:shadow-2xl hover:bg-white/80"
                >
                  {/* Icon */}
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} mb-6 shadow-lg`}>
                    <feature.icon className="h-8 w-8" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base leading-7 text-slate-600">
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
        {/* Continuous Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40" />
        
        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/5 p-12"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Start building your workflows today. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
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
