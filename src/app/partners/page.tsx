"use client";

import { motion } from "framer-motion";
import { 
  Handshake, Users, TrendingUp, ArrowRight, 
  Sparkles, CheckCircle2, Zap
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import Link from "next/link";

export default function PartnersPage() {
  const partnerTypes = [
    {
      icon: Users,
      title: "Integration Partners",
      description: "Connect Atomic Work with your platform. We provide APIs, documentation, and AI-powered code generation to make integration seamless.",
      benefits: [
        "API access and documentation",
        "AI code generation assistance",
        "Co-marketing opportunities",
        "Technical support",
      ],
      color: "blue",
    },
    {
      icon: TrendingUp,
      title: "Reseller Partners",
      description: "Sell Atomic Work to your customers. Earn competitive commissions and provide value-added services with our AI features.",
      benefits: [
        "Competitive commission rates",
        "Sales enablement resources",
        "Dedicated partner support",
        "Marketing materials",
      ],
      color: "green",
    },
    {
      icon: Zap,
      title: "Technology Partners",
      description: "Build complementary solutions. Integrate your AI tools, services, or platforms with Atomic Work workflows.",
      benefits: [
        "Technical integration support",
        "Joint product development",
        "Go-to-market collaboration",
        "Early access to features",
      ],
      color: "purple",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
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
              <Handshake className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Partner Program</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Partner with Atomic Work
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Grow your business by partnering with Atomic Work. Leverage our AI-powered platform to deliver more value to your customers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {partnerTypes.map((type, i) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all hover:shadow-2xl hover:bg-white/80"
              >
                {/* Icon */}
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[type.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <type.icon className="h-8 w-8" />
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">
                  {type.title}
                </h3>
                <p className="text-base leading-7 text-slate-600 mb-6">
                  {type.description}
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  {type.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href="/contact">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0071E3] hover:shadow-lg"
                  >
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Partner */}
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
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Why Partner with Atomic Work?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Join a growing ecosystem of partners leveraging AI-powered workflow automation. Our platform makes it easy to integrate, sell, and build with Atomic Work.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Become a Partner
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

