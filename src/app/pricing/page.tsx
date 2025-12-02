"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      description: "Perfect for individuals and small teams getting started.",
      features: [
        "Up to 5 team members",
        "10 active processes",
        "Basic workflow builder",
        "Email support",
        "5GB storage",
        "Community access"
      ],
      cta: "Start Free",
      popular: false,
      color: "slate"
    },
    {
      name: "Professional",
      price: "$29",
      period: "per month",
      description: "For growing teams that need advanced features and support.",
      features: [
        "Up to 25 team members",
        "Unlimited processes",
        "Advanced workflow builder",
        "Priority email support",
        "100GB storage",
        "API access",
        "Custom integrations",
        "Advanced analytics"
      ],
      cta: "Start Free Trial",
      popular: true,
      color: "blue"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with custom requirements.",
      features: [
        "Unlimited team members",
        "Unlimited processes",
        "White-label options",
        "Dedicated support",
        "Unlimited storage",
        "Custom API limits",
        "SSO integration",
        "Advanced security",
        "Custom SLA",
        "On-premise deployment"
      ],
      cta: "Contact Sales",
      popular: false,
      color: "purple"
    }
  ];

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, all paid plans come with a 14-day free trial. No credit card required."
    },
    {
      question: "Do you offer discounts for annual plans?",
      answer: "Yes, save 20% when you pay annually. Contact us for Enterprise pricing."
    },
    {
      question: "What happens if I exceed my plan limits?",
      answer: "We'll notify you before you reach your limits. You can upgrade your plan or contact us for custom solutions."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period."
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
              Simple, Transparent
              <br />
              <span className="text-slate-600">Pricing</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Choose the plan that's right for your team. Start free, upgrade anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl border-2 p-10 transition-all ${
                  plan.popular
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-xl scale-105"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-slate-600 ml-2">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        plan.popular ? "text-blue-600" : "text-green-600"
                      }`} />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === "Enterprise" ? "/contact" : "/sign-up"}>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full rounded-xl px-6 py-4 text-base font-semibold transition-all ${
                      plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Everything you need to know about our pricing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-slate-600">{faq.answer}</p>
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
              Still have questions?
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Our team is here to help. Get in touch and we'll answer any questions.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 shadow-lg"
                >
                  Contact Sales
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

