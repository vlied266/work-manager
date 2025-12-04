"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export function LandingFooter() {
  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-blue-400" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:text-blue-600" },
    { icon: Github, href: "#", label: "GitHub", color: "hover:text-slate-900" },
    { icon: Mail, href: "#", label: "Email", color: "hover:text-blue-500" },
  ];

  return (
    <footer className="relative bg-slate-50 border-t border-slate-200/50">
      <div className="mx-auto max-w-[1600px] px-6">
        {/* Pre-Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-16 sm:py-20 text-center border-b border-slate-200/50"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Ready to streamline your workflow?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of teams using Atomic Work to transform their processes into atomic, executable workflows.
          </p>
          <Link href="/sign-up" prefetch={false}>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#0071E3] shadow-lg shadow-blue-500/20"
            >
              Start for Free
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Footer Columns */}
        <div className="py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {/* Col 1: Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/" prefetch={false} className="flex items-center gap-3 mb-6 group">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <Logo size="medium" />
                </motion.div>
                <div>
                  <div className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    Atomic Work
                  </div>
                  <div className="text-xs text-slate-500 font-medium tracking-wider uppercase">
                    Atomic Engine
                  </div>
                </div>
              </Link>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Transform complex processes into atomic tasks. Build workflows in minutes instead of months.
              </p>
              
              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500 border border-slate-200 transition-colors ${social.color}`}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Col 2: Product */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-6">
                Product
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Features", href: "/features" },
                  { name: "Pricing", href: "/pricing" },
                  { name: "Studio", href: "/studio" },
                  { name: "Templates", href: "/templates" },
                  { name: "Integrations", href: "/integrations" },
                  { name: "API", href: "/api" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200 inline-block relative z-10"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Col 3: Company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-6">
                Company
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "About", href: "/about" },
                  { name: "Careers", href: "/careers" },
                  { name: "Blog", href: "/blog" },
                  { name: "Partners", href: "/partners" },
                  { name: "Press Kit", href: "/press-kit" },
                  { name: "Contact", href: "/contact" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200 inline-block relative z-10"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Col 4: Legal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-6">
                Legal
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Privacy Policy", href: "/privacy-policy" },
                  { name: "Terms of Service", href: "/terms-of-service" },
                  { name: "Cookie Policy", href: "/cookie-policy" },
                  { name: "Security", href: "/security" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="py-8 border-t border-slate-200/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              <p>© {new Date().getFullYear()} Atomic Work. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <Link
                href="/privacy-policy"
                prefetch={false}
                className="hover:text-blue-600 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                prefetch={false}
                className="hover:text-blue-600 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookie-policy"
                prefetch={false}
                className="hover:text-blue-600 transition-colors duration-200"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
