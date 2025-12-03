"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import Logo from "@/components/Logo";

export function LandingNavbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" prefetch={false} className="flex items-center gap-3 group">
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
            {!loading && (
              <>
                {user ? (
                  <Link href="/dashboard" prefetch={false}>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 shadow-lg"
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
                        className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100"
                      >
                        Sign In
                      </motion.button>
                    </Link>
                    <Link href="/sign-up" prefetch={false}>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 shadow-lg"
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
      </div>
    </motion.nav>
  );
}

