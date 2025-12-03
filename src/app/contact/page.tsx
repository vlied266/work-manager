"use client";

import { motion } from "framer-motion";
import { 
  Mail, MessageSquare, Phone, MapPin, 
  Send, ArrowRight, Sparkles, CheckCircle2
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
    // Handle form submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "Send us an email anytime",
      value: "support@workos.com",
      href: "mailto:support@workos.com",
      color: "blue",
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our AI assistant",
      value: "Available 24/7",
      href: "#",
      color: "green",
    },
    {
      icon: Phone,
      title: "Phone",
      description: "Call us during business hours",
      value: "+1 (555) 123-4567",
      href: "tel:+15551234567",
      color: "purple",
    },
    {
      icon: MapPin,
      title: "Office",
      description: "Visit us in person",
      value: "San Francisco, CA",
      href: "#",
      color: "orange",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
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
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Get in Touch</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              Contact Us
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Have a question? Need support? Our team and AI assistant are here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, i) => (
              <motion.a
                key={method.title}
                href={method.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-8 text-center transition-all hover:shadow-2xl hover:bg-white/80"
              >
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${colorClasses[method.color as keyof typeof colorClasses]} mb-6 shadow-lg`}>
                  <method.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  {method.description}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {method.value}
                </p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-10"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                  <Send className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Send us a Message
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    We'll get back to you within 24 hours
                  </p>
                </div>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-green-50/80 border border-green-200/50 p-8 text-center"
                >
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-extrabold text-green-900 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-sm text-green-700">
                    We'll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border-0 bg-white/50 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                      placeholder="Tell us more..."
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
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-10">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-lg">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">
                  AI-Powered Support
                </h3>
                <p className="text-base text-slate-600 leading-7 mb-6">
                  Our AI assistant can help answer questions, generate code examples, and guide you through common tasks. Available 24/7.
                </p>
                <button className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 px-6 py-3 text-sm font-semibold text-slate-700 shadow-md transition-all hover:bg-white hover:shadow-lg">
                  Chat with AI
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-10">
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">
                  Response Times
                </h3>
                <ul className="space-y-4">
                  {[
                    { label: "General Inquiries", time: "24 hours" },
                    { label: "Technical Support", time: "12 hours" },
                    { label: "Enterprise Support", time: "2 hours" },
                    { label: "AI Assistant", time: "Instant" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

