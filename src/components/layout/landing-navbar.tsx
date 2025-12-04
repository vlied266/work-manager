"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Menu, X } from "lucide-react";
import Logo from "@/components/Logo";

export function LandingNavbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/20"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link href="/" prefetch={false} className="flex items-center gap-3 group z-50">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0"
            >
              <Logo size="small" />
            </motion.div>
            <div>
              <span className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                Atomic Work
              </span>
              <div className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Atomic Engine
              </div>
            </div>
          </Link>

          {/* Center: Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                prefetch={false}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Right: Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <Link href="/dashboard" prefetch={false}>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0071E3] shadow-lg shadow-blue-500/20"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </motion.button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in" prefetch={false}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
                      >
                        Sign In
                      </motion.button>
                    </Link>
                    <Link href="/sign-up" prefetch={false}>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-full bg-[#007AFF] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0071E3] shadow-lg shadow-blue-500/20"
                      >
                        Get Started
                      </motion.button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-colors z-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pb-4 border-t border-white/20"
            >
              <div className="flex flex-col gap-4 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-slate-600 hover:text-slate-900 transition-colors py-2"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-white/20 flex flex-col gap-3">
                  {!loading && (
                    <>
                      {user ? (
                        <Link href="/dashboard" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0071E3] shadow-lg shadow-blue-500/20"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Go to Dashboard
                          </motion.button>
                        </Link>
                      ) : (
                        <>
                          <Link href="/sign-in" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              className="w-full text-base font-medium text-slate-600 hover:text-slate-900 transition-colors py-2"
                            >
                              Sign In
                            </motion.button>
                          </Link>
                          <Link href="/sign-up" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              className="w-full rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0071E3] shadow-lg shadow-blue-500/20"
                            >
                              Get Started
                            </motion.button>
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
