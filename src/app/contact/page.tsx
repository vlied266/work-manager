"use client";

import { motion } from "framer-motion";
import { 
  Phone, Calendar, MessageSquare, MapPin, 
  Send, ArrowRight, Sparkles
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const contactCards = [
    {
      icon: Phone,
      title: "Sales",
      subtitle: "Talk to an expert",
      description: "Schedule a demo or discuss your needs with our sales team.",
      action: "Schedule a Call",
      href: "#",
      color: "blue",
    },
    {
      icon: MessageSquare,
      title: "Support",
      subtitle: "Get technical help",
      description: "Get help from our support team or chat with our AI assistant.",
      action: "Start Chat",
      href: "#",
      color: "green",
    },
    {
      icon: MapPin,
      title: "Visit",
      subtitle: "Come see us",
      description: "Visit our office in San Francisco or connect remotely.",
      action: "View Map",
      address: "123 Market St, San Francisco, CA 94105",
      href: "#",
      color: "purple",
    },
  ];

  const colorClasses = {
    blue: {
      bg: "from-blue-50/80 to-blue-100/50",
      icon: "bg-blue-500 text-white",
      button: "bg-blue-500 hover:bg-blue-600",
    },
    green: {
      bg: "from-green-50/80 to-green-100/50",
      icon: "bg-green-500 text-white",
      button: "bg-green-500 hover:bg-green-600",
    },
    purple: {
      bg: "from-purple-50/80 to-purple-100/50",
      icon: "bg-purple-500 text-white",
      button: "bg-purple-500 hover:bg-purple-600",
    },
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
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 mb-6">
              Contact Us
            </h1>
            <p className="text-2xl sm:text-3xl leading-relaxed text-slate-600">
              Have a question? Need support? Our team and AI assistant are here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {contactCards.map((card, i) => {
              const colors = colorClasses[card.color as keyof typeof colorClasses];
              
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`relative rounded-[2.5rem] bg-gradient-to-br ${colors.bg} backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-10 transition-all hover:shadow-2xl hover:scale-[1.02]`}
                >
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${colors.icon} mb-6 shadow-lg`}>
                    <card.icon className="h-8 w-8" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
                    {card.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                    {card.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-base leading-relaxed text-slate-700 mb-6">
                    {card.description}
                  </p>

                  {/* Address (if exists) */}
                  {card.address && (
                    <p className="text-sm text-slate-600 mb-6 font-medium">
                      {card.address}
                    </p>
                  )}

                  {/* Action Button */}
                  <a href={card.href}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full rounded-full ${colors.button} px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg`}
                    >
                      {card.action}
                    </motion.button>
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form - Minimalist Borderless */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12">
              <div className="mb-8">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                  Send us a Message
                </h2>
                <p className="text-lg text-slate-600">
                  We'll get back to you within 24 hours
                </p>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-green-50/80 border border-green-200/50 p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500 text-white mb-4">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-green-900 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-base text-green-700">
                    We'll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 backdrop-blur-sm shadow-inner px-6 py-4 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 backdrop-blur-sm shadow-inner px-6 py-4 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 backdrop-blur-sm shadow-inner px-6 py-4 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Subject"
                    />
                  </div>

                  <div>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 backdrop-blur-sm shadow-inner px-6 py-4 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
                  >
                    <Send className="h-5 w-5" />
                    Send Message
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
