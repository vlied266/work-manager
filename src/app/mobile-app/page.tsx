"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Bell, WifiOff, Zap, ArrowRight, Smartphone, Share2, Plus } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function MobileAppPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                Manage your Workflows, Anywhere.
              </h1>
              <p className="text-xl leading-8 text-slate-600 mb-8">
                Atomic Work is now available on iOS and Android. Track processes, approve requests, and monitor your team from your pocket.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                  onClick={() => {
                    // Trigger PWA install prompt if available
                    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                      // PWA install logic can be added here
                      alert('To install: Tap the share button and select "Add to Home Screen"');
                    }
                  }}
                >
                  <Smartphone className="h-5 w-5" />
                  Install Web App
                </motion.button>
                <Link href="#instructions">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400"
                  >
                    Read Instructions
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Right Side - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              {/* Phone Frame */}
              <div className="relative w-full max-w-sm">
                {/* Phone Container */}
                <div className="relative bg-slate-900 rounded-[3rem] p-4 shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />
                  
                  {/* Screen */}
                  <div className="relative bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19.5] shadow-inner">
                    {/* Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 z-20 flex items-center justify-between px-6">
                      <span className="text-xs font-semibold text-slate-900">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-slate-900" />
                        <div className="w-1 h-1 rounded-full bg-slate-900" />
                        <div className="w-1 h-1 rounded-full bg-slate-900" />
                      </div>
                    </div>
                    
                    {/* Dashboard Preview */}
                    <div className="absolute inset-0 pt-12 bg-gradient-to-br from-blue-50 to-purple-50">
                      <div className="p-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold text-slate-900">My Tasks</h2>
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        
                        {/* Task Cards */}
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                                <div className="h-2 bg-slate-100 rounded w-1/2" />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-blue-500" />
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <div className="h-2 bg-slate-100 rounded w-16" />
                              <div className="h-2 bg-slate-100 rounded w-12" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-[3rem] blur-3xl -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-24 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Why go mobile?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-6">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Real-time Notifications
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Never miss an approval.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 mb-6">
                <WifiOff className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Offline Mode
              </h3>
              <p className="text-slate-600 leading-relaxed">
                View tasks even without internet.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-600 mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Native Experience
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Smooth, full-screen performance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PWA Install Instructions */}
      <section id="instructions" className="py-20 sm:py-24 lg:py-28 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              Install on Your Device
            </h2>
            <p className="text-lg text-slate-600">
              Add Atomic Work to your home screen for quick access
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* iOS Instructions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
                  iOS
                </div>
                <h3 className="text-xl font-bold text-slate-900">iPhone & iPad</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <span className="text-slate-600 pt-0.5">Open Safari and visit atomicwork.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <span className="text-slate-600 pt-0.5">Tap the <Share2 className="inline h-4 w-4" /> Share button at the bottom</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <span className="text-slate-600 pt-0.5">Select <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <span className="text-slate-600 pt-0.5">Tap <strong>"Add"</strong> to confirm</span>
                </li>
              </ol>
            </motion.div>

            {/* Android Instructions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-xl">
                  A
                </div>
                <h3 className="text-xl font-bold text-slate-900">Android</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <span className="text-slate-600 pt-0.5">Open Chrome and visit atomicwork.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <span className="text-slate-600 pt-0.5">Tap the <Plus className="inline h-4 w-4" /> Menu button (three dots)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <span className="text-slate-600 pt-0.5">Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <span className="text-slate-600 pt-0.5">Tap <strong>"Add"</strong> or <strong>"Install"</strong> to confirm</span>
                </li>
              </ol>
            </motion.div>
          </div>

          {/* Desktop Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                💻
              </div>
              <h3 className="text-xl font-bold text-slate-900">Desktop (Chrome, Edge, Safari)</h3>
            </div>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <span className="text-slate-600 pt-0.5">Visit atomicwork.com in your browser</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span className="text-slate-600 pt-0.5">Look for the install icon in the address bar (or use the menu)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span className="text-slate-600 pt-0.5">Click <strong>"Install"</strong> to add to your desktop</span>
              </li>
            </ol>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
              Ready to take your workflows mobile?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Install Atomic Work now and manage your processes from anywhere.
            </p>
            {!user && (
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 transition-all hover:bg-blue-50 shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            )}
            {user && (
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 transition-all hover:bg-blue-50 shadow-xl"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

