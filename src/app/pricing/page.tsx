"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "Free",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      period: "forever",
      description: "Perfect for individuals and small teams getting started.",
      features: [
        "Up to 5 team members",
        "10 active processes",
        "Basic workflow builder",
        "Email support",
        "5GB storage",
        "Community access",
      ],
      cta: "Get Started",
      popular: false,
      color: "slate",
    },
    {
      name: "Pro",
      monthlyPrice: "$29",
      yearlyPrice: "$23",
      period: "per month",
      description: "For growing teams that need advanced features and support.",
      features: [
        "Up to 25 team members",
        "Unlimited processes",
        "AI Magic Builder",
        "Advanced workflow builder",
        "Priority email support",
        "100GB storage",
        "API access",
        "Custom integrations",
        "Advanced analytics",
        "Real-time monitoring",
      ],
      cta: "Start 14-day free trial",
      popular: true,
      color: "blue",
    },
    {
      name: "Enterprise",
      monthlyPrice: "Custom",
      yearlyPrice: "Custom",
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
        "On-premise deployment",
      ],
      cta: "Contact Sales",
      popular: false,
      color: "purple",
    },
  ];

  const comparisonFeatures = [
    {
      feature: "Team Members",
      free: "5",
      pro: "25",
      enterprise: "Unlimited",
    },
    {
      feature: "Active Processes",
      free: "10",
      pro: "Unlimited",
      enterprise: "Unlimited",
    },
    {
      feature: "Storage",
      free: "5GB",
      pro: "100GB",
      enterprise: "Unlimited",
    },
    {
      feature: "AI Magic Builder",
      free: "Limited",
      pro: "Unlimited",
      enterprise: "Unlimited",
    },
    {
      feature: "API Access",
      free: "No",
      pro: "Yes",
      enterprise: "Custom",
    },
    {
      feature: "Support",
      free: "Email",
      pro: "Priority Email",
      enterprise: "Dedicated",
    },
    {
      feature: "SSO Integration",
      free: "No",
      pro: "No",
      enterprise: "Yes",
    },
    {
      feature: "Custom SLA",
      free: "No",
      pro: "No",
      enterprise: "Yes",
    },
  ];

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing accordingly.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for Enterprise plans.",
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, the Pro plan comes with a 14-day free trial. No credit card required to start. You can explore all features risk-free.",
    },
    {
      question: "Do you offer discounts for annual plans?",
      answer: "Yes, save 20% when you pay annually. This applies to the Pro plan. Contact us for Enterprise pricing and custom annual agreements.",
    },
    {
      question: "What happens if I exceed my plan limits?",
      answer: "We'll notify you before you reach your limits. You can upgrade your plan instantly or contact us for custom solutions. Your workflows will continue to run.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period. No cancellation fees or penalties.",
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for annual Pro plans. Monthly plans can be cancelled anytime with no refund needed.",
    },
    {
      question: "What's included in Enterprise?",
      answer: "Enterprise includes everything in Pro, plus SSO, custom API limits, dedicated support, custom SLA, white-label options, and on-premise deployment options.",
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.name === "Enterprise") return plan.monthlyPrice;
    return billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getYearlySavings = (plan: typeof plans[0]) => {
    if (plan.name === "Free" || plan.name === "Enterprise") return null;
    const monthly = parseInt(plan.monthlyPrice.replace("$", ""));
    const yearly = parseInt(plan.yearlyPrice.replace("$", ""));
    const savings = ((monthly * 12 - yearly * 12) / (monthly * 12)) * 100;
    return Math.round(savings);
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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
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

      {/* Billing Toggle */}
      <section className="py-8">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <span className={`text-sm font-semibold transition-colors ${billingPeriod === "monthly" ? "text-slate-900" : "text-slate-500"}`}>
              Monthly
            </span>
            
            {/* iOS-style Toggle */}
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <motion.span
                className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                animate={{
                  x: billingPeriod === "monthly" ? 4 : 30,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            </button>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold transition-colors ${billingPeriod === "yearly" ? "text-slate-900" : "text-slate-500"}`}>
                Yearly
              </span>
              <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                Save 20%
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6 items-start">
            {plans.map((plan, i) => {
              const isPro = plan.popular;
              const savings = getYearlySavings(plan);
              
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 transition-all ${
                    isPro
                      ? "lg:scale-105 ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/10"
                      : "hover:shadow-2xl hover:bg-white/80"
                  }`}
                >
                  {/* Most Popular Badge */}
                  {isPro && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </span>
                    </motion.div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mt-4">
                      <span className="text-5xl font-extrabold text-slate-900">
                        {getPrice(plan)}
                      </span>
                      {plan.period && (
                        <span className="text-slate-600 ml-2 text-lg">
                          {plan.period}
                        </span>
                      )}
                      {savings && billingPeriod === "yearly" && (
                        <div className="mt-2">
                          <span className="text-sm text-slate-500 line-through">
                            ${parseInt(plan.monthlyPrice.replace("$", ""))}/mo
                          </span>
                          <span className="ml-2 text-sm font-semibold text-green-600">
                            Save {savings}%
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-sm text-slate-600 leading-6">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 leading-6">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/sign-up"}>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full rounded-full px-6 py-4 text-base font-semibold transition-all shadow-md ${
                        isPro
                          ? "bg-[#007AFF] text-white hover:bg-[#0071E3] hover:shadow-lg"
                          : plan.name === "Enterprise"
                          ? "bg-white/70 backdrop-blur-sm border border-white/60 text-slate-700 hover:bg-white hover:shadow-lg"
                          : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
                      }`}
                    >
                      {plan.cta}
                    </motion.button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
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
              Compare Plans
            </h2>
            <p className="text-xl text-slate-600">
              Detailed comparison of features and limits
            </p>
          </motion.div>

          <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/60">
                    <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Feature
                    </th>
                    <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                      Free
                    </th>
                    <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pro
                    </th>
                    <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {comparisonFeatures.map((item, i) => (
                    <motion.tr
                      key={item.feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`transition-colors ${
                        i % 2 === 0 ? "bg-white/50" : "bg-white/30"
                      } hover:bg-white/70`}
                    >
                      <td className="px-8 py-4 text-sm font-semibold text-slate-900">
                        {item.feature}
                      </td>
                      <td className="px-8 py-4 text-center text-sm text-slate-700">
                        {item.free}
                      </td>
                      <td className="px-8 py-4 text-center text-sm text-slate-700">
                        {item.pro}
                      </td>
                      <td className="px-8 py-4 text-center text-sm text-slate-700">
                        {item.enterprise}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about our pricing
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/50 transition-colors"
                >
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900 pr-8">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-6">
                        <p className="text-base text-slate-600 leading-7">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Our team is here to help. Get in touch and we'll answer any questions.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Contact Sales
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
