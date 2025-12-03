"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { Sparkles, Zap, Users, Layers, ArrowRight, Check, Circle, Move, Bot, BarChart3, TrendingUp, Activity, Github, Twitter, Linkedin, Mail, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import HeroAnimation from "@/components/HeroAnimation";
import Logo from "@/components/Logo";

export default function LandingPage() {
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
            {/* Logo */}
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

            {/* Navigation Links (Hidden on mobile, shown on desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/features"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {!loading && (
                <>
                  {user ? (
                    <Link href="/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 shadow-lg hover:shadow-xl"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Go to Dashboard
                      </motion.button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/sign-in">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
                        >
                          Sign In
                        </motion.button>
                      </Link>
                      <Link href="/sign-up">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 shadow-lg hover:shadow-xl"
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

      {/* Hero Section - Unified Container */}
      <section className="relative overflow-visible bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        {/* Unified Container with Shared Background */}
        <div className="mx-auto max-w-[1600px] px-6 py-8 sm:py-12 lg:py-16 relative">
          {/* Shared Background Container - Completely Transparent to Match Hero Background */}
          <div className="relative overflow-visible p-8 sm:p-12 lg:p-16" style={{ background: 'transparent' }}>
            {/* Premium Animated Color Orbs with Glassmorphism */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Main Cyan/Teal Orb - Top Left - Premium */}
              <motion.div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: '800px',
                  height: '800px',
                  background: 'radial-gradient(circle, rgba(79, 240, 183, 0.6) 0%, rgba(6, 182, 212, 0.4) 25%, rgba(14, 165, 233, 0.2) 50%, transparent 75%)',
                  top: '-30%',
                  left: '-20%',
                  filter: 'blur(80px)',
                }}
                animate={{
                  x: [0, 60, 0],
                  y: [0, 40, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.7, 0.5],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Main Purple/Pink Orb - Bottom Right - Premium */}
              <motion.div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: '800px',
                  height: '800px',
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(168, 85, 247, 0.4) 25%, rgba(192, 132, 252, 0.2) 50%, transparent 75%)',
                  bottom: '-30%',
                  right: '-20%',
                  filter: 'blur(80px)',
                }}
                animate={{
                  x: [0, -60, 0],
                  y: [0, -40, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.7, 0.5],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3,
                }}
              />
              
              {/* Blue Accent - Top Right - Premium */}
              <motion.div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: '600px',
                  height: '600px',
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.3) 30%, rgba(29, 78, 216, 0.15) 60%, transparent 80%)',
                  top: '0%',
                  right: '5%',
                  filter: 'blur(70px)',
                }}
                animate={{
                  x: [0, -40, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.25, 1],
                  opacity: [0.4, 0.6, 0.4],
                  rotate: [0, -90, 0],
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                }}
              />
              
              {/* Purple Accent - Bottom Center - Premium */}
              <motion.div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: '550px',
                  height: '550px',
                  background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(139, 92, 246, 0.3) 30%, rgba(124, 58, 237, 0.15) 60%, transparent 80%)',
                  bottom: '-10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  filter: 'blur(70px)',
                }}
                animate={{
                  x: [0, 35, 0],
                  y: [0, -25, 0],
                  scale: [1, 1.22, 1],
                  opacity: [0.4, 0.6, 0.4],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 13,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.8,
                }}
              />
              
              {/* Cyan Accent - Top Center - Premium */}
              <motion.div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: '500px',
                  height: '500px',
                  background: 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(79, 240, 183, 0.3) 30%, rgba(34, 211, 238, 0.15) 60%, transparent 80%)',
                  top: '10%',
                  left: '30%',
                  filter: 'blur(65px)',
                }}
                animate={{
                  x: [0, -35, 0],
                  y: [0, 35, 0],
                  scale: [1, 1.3, 1],
                  opacity: [0.35, 0.55, 0.35],
                  rotate: [0, -180, 0],
                }}
                transition={{
                  duration: 16,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
              />

              {/* Pink Accent - Center Left - New */}
              <motion.div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: '450px',
                  height: '450px',
                  background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(219, 39, 119, 0.25) 35%, rgba(190, 24, 93, 0.15) 60%, transparent 80%)',
                  top: '50%',
                  left: '10%',
                  transform: 'translateY(-50%)',
                  filter: 'blur(60px)',
                }}
                animate={{
                  x: [0, 30, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.18, 1],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [0, 120, 0],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2,
                }}
              />

              {/* Enhanced Floating Bubbles with Varied Sizes */}
              {[...Array(10)].map((_, i) => {
                const colors = [
                  'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.15) 50%, transparent 70%)',
                  'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 70%)',
                  'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(79, 240, 183, 0.15) 50%, transparent 70%)',
                  'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.15) 50%, transparent 70%)',
                ];
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full blur-2xl"
                    style={{
                      width: `${120 + i * 25}px`,
                      height: `${120 + i * 25}px`,
                      background: colors[i % colors.length],
                      top: `${5 + (i * 9) % 80}%`,
                      left: `${8 + (i * 11) % 75}%`,
                      filter: 'blur(50px)',
                    }}
                    animate={{
                      x: [0, Math.sin(i) * 35, 0],
                      y: [0, Math.cos(i) * 35, 0],
                      scale: [1, 1.15, 1],
                      opacity: [0.25, 0.45, 0.25],
                      rotate: [0, 360, 0],
                    }}
                    transition={{
                      duration: 10 + i * 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    }}
                  />
                );
              })}

              {/* Glowing Particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: `${4 + (i % 3) * 2}px`,
                    height: `${4 + (i % 3) * 2}px`,
                    background: i % 4 === 0 
                      ? 'rgba(59, 130, 246, 0.8)'
                      : i % 4 === 1
                      ? 'rgba(139, 92, 246, 0.8)'
                      : i % 4 === 2
                      ? 'rgba(6, 182, 212, 0.8)'
                      : 'rgba(236, 72, 153, 0.8)',
                    top: `${10 + (i * 6) % 85}%`,
                    left: `${5 + (i * 7) % 90}%`,
                    boxShadow: `0 0 ${8 + i * 2}px currentColor`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 3 + (i % 3) * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Content Grid - Text and Sphere in same container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
              {/* Left Column: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight"
                >
                  Your workflows,{" "}
                  <br />
                  <span className="text-slate-600">Atomic Ready.</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl leading-8 text-slate-600 sm:text-2xl"
                >
                  Transform complex processes into atomic tasks. Build workflows in minutes instead of months.
                </motion.p>
                
                {/* Buttons - Moved here */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4"
                >
                  {!loading && (
                    <>
                      {user ? (
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-slate-800 shadow-lg"
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          Go to Dashboard
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      ) : (
                        <>
                          <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-slate-800 shadow-lg"
                          >
                            Start for Free
                            <ArrowRight className="h-5 w-5" />
                          </Link>
                          <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50"
                          >
                            Sign In
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex items-center gap-6 pt-2"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-slate-600">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-slate-600">14-day free trial</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Atomic Structure */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full"
                style={{ 
                  margin: 0, 
                  padding: 0, 
                  background: 'transparent',
                  backgroundColor: 'transparent',
                }}
              >
                <HeroAnimation />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Box Style) */}
      <section className="relative overflow-visible bg-white">
        <div className="mx-auto max-w-[1600px] px-6 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900"
            >
              Built for Modern Teams
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl"
            >
              Everything you need to manage complex workflows
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1: Atomic Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-slate-200 bg-white p-10 transition-all hover:border-blue-300 hover:shadow-lg overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/0 group-hover:from-blue-50/30 group-hover:via-blue-50/20 group-hover:to-blue-50/10 transition-all duration-500"
                initial={false}
              />
              
              {/* Icon Container with Atomic Animation */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-8">
                {/* Atomic Structure: Central nucleus with orbiting electrons */}
                <div className="relative w-12 h-12">
                  {/* Central Nucleus */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Orbiting Electrons */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full"
                      style={{
                        transformOrigin: "0 20px",
                      }}
                      animate={{
                        rotate: [0, 360],
                        x: [0, Math.cos((i * 2 * Math.PI) / 3) * 20],
                        y: [0, Math.sin((i * 2 * Math.PI) / 3) * 20],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <h3 className="relative text-2xl font-semibold text-slate-900">Atomic Tasks</h3>
              <p className="relative mt-4 text-base leading-7 text-slate-600">
                Break down complex processes into indivisible, manageable units. Each task is atomic—simple, clear, and executable.
              </p>
            </motion.div>

            {/* Feature 2: Drag & Drop Builder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-slate-200 bg-white p-10 transition-all hover:border-purple-300 hover:shadow-lg overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 group-hover:from-purple-50/30 group-hover:via-purple-50/20 group-hover:to-purple-50/10 transition-all duration-500"
                initial={false}
              />
              
              {/* Icon Container with Drag & Drop Animation */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-8">
                <div className="relative w-12 h-12">
                  {/* Base Layer */}
                  <motion.div
                    className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-purple-200/50"
                    animate={{
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Dragging Layer */}
                  <motion.div
                    className="absolute top-0 left-0 w-6 h-6 rounded-lg bg-purple-600 shadow-lg"
                    animate={{
                      x: [0, 8, 0],
                      y: [0, -8, 0],
                      rotate: [0, 5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Drop Target Indicator */}
                  <motion.div
                    className="absolute bottom-0 right-0 w-4 h-4 rounded border-2 border-dashed border-purple-400"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />
                </div>
              </div>
              
              <h3 className="relative text-2xl font-semibold text-slate-900">Drag & Drop Builder</h3>
              <p className="relative mt-4 text-base leading-7 text-slate-600">
                Create workflows visually. No coding required. Drag atomic tasks, connect them, and build powerful processes.
              </p>
            </motion.div>

            {/* Feature 3: Team Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-slate-200 bg-white p-10 transition-all hover:border-green-300 hover:shadow-lg overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-green-50/0 to-green-50/0 group-hover:from-green-50/30 group-hover:via-green-50/20 group-hover:to-green-50/10 transition-all duration-500"
                initial={false}
              />
              
              {/* Icon Container with Team Animation */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600 mb-8">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  {/* Team Members as Circles */}
                  {[
                    { x: 0, y: -8, delay: 0 },
                    { x: -8, y: 4, delay: 0.2 },
                    { x: 8, y: 4, delay: 0.4 },
                  ].map((member, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-4 h-4 bg-green-600 rounded-full"
                      style={{
                        x: member.x,
                        y: member.y,
                      }}
                      animate={{
                        y: [member.y, member.y - 2, member.y],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: member.delay,
                      }}
                    />
                  ))}
                  
                  {/* Connection Lines (appear on hover) */}
                  <motion.svg
                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-30 transition-opacity"
                    viewBox="0 0 48 48"
                  >
                    <motion.line
                      x1="24"
                      y1="16"
                      x2="16"
                      y2="28"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileHover={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.line
                      x1="24"
                      y1="16"
                      x2="32"
                      y2="28"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileHover={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                    <motion.line
                      x1="16"
                      y1="28"
                      x2="32"
                      y2="28"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileHover={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </motion.svg>
                </div>
              </div>
              
              <h3 className="relative text-2xl font-semibold text-slate-900">Team Management</h3>
              <p className="relative mt-4 text-base leading-7 text-slate-600">
                Assign tasks to teams or individuals. Track progress, manage roles, and ensure accountability across your organization.
              </p>
            </motion.div>
          </div>

          {/* Additional Features */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Smart Automation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-slate-200 bg-white p-10 transition-all hover:border-orange-300 hover:shadow-lg overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-orange-50/0 via-orange-50/0 to-orange-50/0 group-hover:from-orange-50/30 group-hover:via-orange-50/20 group-hover:to-orange-50/10 transition-all duration-500"
                initial={false}
              />
              
              {/* Icon Container with Automation Animation */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-8">
                <div className="relative w-12 h-12">
                  {/* Bot Icon */}
                  <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6" />
                  
                  {/* Pulsing Rings (Automation Activity) */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-400"
                      style={{
                        width: 12 + i * 8,
                        height: 12 + i * 8,
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                  
                  {/* Data Flow Lines */}
                  <motion.svg
                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"
                    viewBox="0 0 48 48"
                  >
                    {/* Horizontal Flow */}
                    <motion.path
                      d="M 8 24 L 40 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileHover={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8 }}
                    />
                    {/* Vertical Flow */}
                    <motion.path
                      d="M 24 8 L 24 40"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileHover={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                    {/* Diagonal Flows */}
                    <motion.path
                      d="M 12 12 L 36 36"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileHover={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                    <motion.path
                      d="M 36 12 L 12 36"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileHover={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    />
                  </motion.svg>
                </div>
              </div>
              
              <h3 className="relative text-2xl font-semibold text-slate-900">Smart Automation</h3>
              <p className="relative mt-4 text-base leading-7 text-slate-600">
                Automate data piping between steps. Compare values automatically. Validate inputs. Let the system do the heavy lifting.
              </p>
              
              {/* Animated Feature Pills */}
              <div className="relative mt-6 flex flex-wrap gap-2">
                {["Auto-Compare", "Data Piping", "Validation"].map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 border border-orange-200"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Real-Time Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-slate-200 bg-white p-10 transition-all hover:border-indigo-300 hover:shadow-lg overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/30 group-hover:via-indigo-50/20 group-hover:to-indigo-50/10 transition-all duration-500"
                initial={false}
              />
              
              {/* Icon Container with Analytics Animation */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-8">
                <div className="relative w-12 h-12">
                  {/* Chart Icon */}
                  <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6" />
                  
                  {/* Animated Chart Bars */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
                    {[0.3, 0.6, 0.9, 0.5, 0.8].map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-indigo-500 rounded-t"
                        style={{ height: `${height * 100}%` }}
                        animate={{
                          height: [
                            `${height * 100}%`,
                            `${(height + 0.2) * 100}%`,
                            `${height * 100}%`,
                          ],
                        }}
                        transition={{
                          duration: 1.5 + i * 0.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Trending Up Arrow */}
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </motion.div>
                  
                  {/* Activity Indicator Dots */}
                  <div className="absolute -bottom-1 -left-1 flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full bg-indigo-400"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <h3 className="relative text-2xl font-semibold text-slate-900">Real-Time Analytics</h3>
              <p className="relative mt-4 text-base leading-7 text-slate-600">
                Track productivity, monitor performance, and gain insights into your team's workflow efficiency.
              </p>
              
              {/* Animated Stats Preview */}
              <div className="relative mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Tasks", value: "98%", colorClass: "text-indigo-600" },
                  { label: "Speed", value: "2.4x", colorClass: "text-green-600" },
                  { label: "Quality", value: "A+", colorClass: "text-blue-600" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className={`text-lg font-bold ${stat.colorClass}`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/50">
        {/* Premium Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Premium Blue Orb - Top Left */}
          <motion.div
            className="absolute rounded-full blur-3xl"
            style={{
              width: '900px',
              height: '900px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.3) 25%, rgba(29, 78, 216, 0.15) 50%, transparent 75%)',
              top: '-30%',
              left: '-20%',
              filter: 'blur(90px)',
            }}
            animate={{
              x: [0, 70, 0],
              y: [0, 50, 0],
              scale: [1, 1.25, 1],
              opacity: [0.4, 0.6, 0.4],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Premium Purple Orb - Bottom Right */}
          <motion.div
            className="absolute rounded-full blur-3xl"
            style={{
              width: '900px',
              height: '900px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(168, 85, 247, 0.3) 25%, rgba(192, 132, 252, 0.15) 50%, transparent 75%)',
              bottom: '-30%',
              right: '-20%',
              filter: 'blur(90px)',
            }}
            animate={{
              x: [0, -70, 0],
              y: [0, -50, 0],
              scale: [1, 1.25, 1],
              opacity: [0.4, 0.6, 0.4],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3.5,
            }}
          />

          {/* Premium Cyan Accent - Center */}
          <motion.div
            className="absolute rounded-full blur-3xl"
            style={{
              width: '650px',
              height: '650px',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(79, 240, 183, 0.25) 30%, rgba(34, 211, 238, 0.12) 60%, transparent 80%)',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(75px)',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 360, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
          />

          {/* Pink Accent - Top Right */}
          <motion.div
            className="absolute rounded-full blur-3xl"
            style={{
              width: '550px',
              height: '550px',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(219, 39, 119, 0.25) 35%, rgba(190, 24, 93, 0.15) 60%, transparent 80%)',
              top: '10%',
              right: '15%',
              filter: 'blur(70px)',
            }}
            animate={{
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1],
              opacity: [0.35, 0.55, 0.35],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          {/* Enhanced Floating Particles with More Variety */}
          {[...Array(12)].map((_, i) => {
            const colors = [
              'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.12) 50%, transparent 70%)',
              'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.12) 50%, transparent 70%)',
              'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(79, 240, 183, 0.12) 50%, transparent 70%)',
              'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(219, 39, 119, 0.12) 50%, transparent 70%)',
            ];
            return (
              <motion.div
                key={i}
                className="absolute rounded-full blur-2xl"
                style={{
                  width: `${110 + i * 22}px`,
                  height: `${110 + i * 22}px`,
                  background: colors[i % colors.length],
                  top: `${15 + (i * 7) % 75}%`,
                  left: `${8 + (i * 9) % 80}%`,
                  filter: 'blur(55px)',
                }}
                animate={{
                  x: [0, Math.sin(i) * 40, 0],
                  y: [0, Math.cos(i) * 40, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                  rotate: [0, 360, 0],
                }}
                transition={{
                  duration: 11 + i * 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.35,
                }}
              />
            );
          })}

          {/* Glowing Star Particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${3 + (i % 4) * 1.5}px`,
                height: `${3 + (i % 4) * 1.5}px`,
                background: i % 5 === 0 
                  ? 'rgba(59, 130, 246, 0.9)'
                  : i % 5 === 1
                  ? 'rgba(139, 92, 246, 0.9)'
                  : i % 5 === 2
                  ? 'rgba(6, 182, 212, 0.9)'
                  : i % 5 === 3
                  ? 'rgba(236, 72, 153, 0.9)'
                  : 'rgba(79, 240, 183, 0.9)',
                top: `${5 + (i * 4.5) % 90}%`,
                left: `${3 + (i * 4.7) % 95}%`,
                boxShadow: `0 0 ${10 + (i % 3) * 3}px currentColor, 0 0 ${20 + (i % 3) * 5}px currentColor`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 4 + (i % 4) * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6 py-20 sm:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 mb-8"
            >
              <Sparkles className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Join 10,000+ teams</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight"
            >
              Ready to transform{" "}
              <span className="relative inline-block">
                <span className="relative z-10">your workflows</span>
                <motion.span
                  className="absolute bottom-2 left-0 right-0 h-4 bg-blue-200/40 -z-0"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  style={{ originX: 0 }}
                />
              </span>
              ?
            </motion.h2>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 text-xl leading-8 text-slate-600 sm:text-2xl max-w-2xl mx-auto"
            >
              Join teams that are already using WorkOS to eliminate ambiguity and boost productivity.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {!loading && (
                <>
                  {user ? (
                    <Link href="/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative inline-flex items-center gap-3 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 shadow-xl overflow-hidden"
                      >
                        {/* Shimmer Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "linear",
                          }}
                        />
                        <LayoutDashboard className="h-5 w-5 relative z-10" />
                        <span className="relative z-10">Go to Dashboard</span>
                        <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/sign-up">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative inline-flex items-center gap-3 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 shadow-xl overflow-hidden"
                        >
                          {/* Shimmer Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: ['-100%', '100%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: "linear",
                            }}
                          />
                          <span className="relative z-10">Start for Free</span>
                          <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-1" />
                        </motion.button>
                      </Link>
                      
                      <Link href="/sign-in">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 shadow-sm"
                        >
                          Sign In
                        </motion.button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600"
            >
              {[
                { icon: Check, text: "No credit card required", color: "text-green-600" },
                { icon: Check, text: "14-day free trial", color: "text-green-600" },
                { icon: Check, text: "Cancel anytime", color: "text-green-600" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 1 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Social Proof Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 border-t border-slate-200"
            >
              {[
                { value: "10K+", label: "Active Teams", icon: Users },
                { value: "98%", label: "Satisfaction", icon: Sparkles },
                { value: "24/7", label: "Support", icon: Activity },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-slate-400" />
                    <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-purple-200 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6 py-16 sm:py-20">
          {/* Main Footer Content */}
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
                  { name: "Blog", href: "#" },
                  { name: "Careers", href: "/careers" },
                  { name: "Partners", href: "/partners" },
                  { name: "Press Kit", href: "/press-kit" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors relative group"
                    >
                      {item.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
                    </Link>
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
                  className="hover:text-slate-900 transition-colors relative group"
                >
                  Privacy Policy
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
                </Link>
                <Link
                  href="/terms-of-service"
                  className="hover:text-slate-900 transition-colors relative group"
                >
                  Terms of Service
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
                </Link>
                <Link
                  href="/cookie-policy"
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
    </div>
  );
}
