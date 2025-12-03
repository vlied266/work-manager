"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import Logo from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-blue-200 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-purple-200 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <Logo size="medium" />
              </motion.div>
              <div>
                <div className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  WorkOS
                </div>
                <div className="text-xs text-slate-500 font-medium tracking-wider uppercase">
                  Atomic Engine
                </div>
              </div>
            </Link>
            <p className="text-sm text-slate-600 leading-6 mb-6">
              Transform complex processes into atomic tasks. Build workflows in minutes instead of months.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Github, href: "#", label: "GitHub" },
                { icon: Mail, href: "#", label: "Email" },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Product Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Features", href: "/features" },
                { name: "Pricing", href: "/pricing" },
                { name: "Templates", href: "/templates" },
                { name: "Integrations", href: "/integrations" },
                { name: "API", href: "/api" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors relative group"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {[
                { name: "About", href: "/about" },
                { name: "Blog", href: "#", isExternal: true },
                { name: "Careers", href: "/careers" },
                { name: "Partners", href: "/partners" },
                { name: "Press Kit", href: "/press-kit" },
              ].map((item) => (
                <li key={item.name}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors relative group"
                    >
                      {item.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors relative group"
                    >
                      {item.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Documentation", href: "/documentation" },
                { name: "Help Center", href: "/help-center" },
                { name: "Community", href: "/community" },
                { name: "Status", href: "/status" },
                { name: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors relative group"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-8 border-t border-slate-200"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              <p>© {new Date().getFullYear()} WorkOS. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <Link
                href="/privacy-policy"
                prefetch={false}
                className="hover:text-slate-900 transition-colors relative group"
              >
                Privacy Policy
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/terms-of-service"
                prefetch={false}
                className="hover:text-slate-900 transition-colors relative group"
              >
                Terms of Service
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/cookie-policy"
                prefetch={false}
                className="hover:text-slate-900 transition-colors relative group"
              >
                Cookie Policy
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

