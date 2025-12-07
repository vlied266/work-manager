"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import Image from "next/image";

interface IntegrationLogo {
  name: string;
  src: string;
  alt: string;
}

// Inner orbit: 3-4 icons
const innerOrbitLogos: IntegrationLogo[] = [
  { name: "Slack", src: "/integrations/slack.png", alt: "Slack" },
  { name: "Linear", src: "/integrations/linear.png", alt: "Linear" },
  { name: "Notion", src: "/integrations/notion.png", alt: "Notion" },
];

// Outer orbit: rest of the icons
const outerOrbitLogos: IntegrationLogo[] = [
  { name: "Drive", src: "/integrations/drive.png", alt: "Google Drive" },
  { name: "GitHub", src: "/integrations/github.png", alt: "GitHub" },
  { name: "Stripe", src: "/integrations/stripe.png", alt: "Stripe" },
  { name: "Zapier", src: "/integrations/Zapier.png", alt: "Zapier" },
  { name: "AWS", src: "/integrations/AWS.png", alt: "AWS" },
];

export default function IntegrationsSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate positions only on client to avoid hydration mismatch
  const getInnerOrbitPositions = () => {
    return innerOrbitLogos.map((logo, index) => {
      const angle = (index * 360) / innerOrbitLogos.length;
      const radian = (angle * Math.PI) / 180;
      const radius = 140;
      const x = Math.round(radius * Math.cos(radian) * 100) / 100;
      const y = Math.round(radius * Math.sin(radian) * 100) / 100;
      return { logo, x, y };
    });
  };

  const getOuterOrbitPositions = () => {
    return outerOrbitLogos.map((logo, index) => {
      const angle = (index * 360) / outerOrbitLogos.length;
      const radian = (angle * Math.PI) / 180;
      const radius = 210;
      const x = Math.round(radius * Math.cos(radian) * 100) / 100;
      const y = Math.round(radius * Math.sin(radian) * 100) / 100;
      return { logo, x, y };
    });
  };

  const innerPositions = isMounted ? getInnerOrbitPositions() : [];
  const outerPositions = isMounted ? getOuterOrbitPositions() : [];

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-[1600px] px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-4">
            Connect Everything
          </h2>
          <p className="text-xl leading-8 text-slate-600 sm:text-2xl">
            Seamlessly integrate with the tools your team already uses
          </p>
        </motion.div>

        {/* Atomic Orbit Container */}
        <div className="relative flex items-center justify-center min-h-[500px] md:min-h-[600px]">
          {/* Desktop: Orbital Animation */}
          <div className="hidden md:block relative w-full h-full">
            {/* Container for all orbits - centered */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              
              {/* Inner Orbit Circle (dashed line) */}
              <div
                className="absolute border-2 border-dashed border-slate-300/50 rounded-full"
                style={{
                  width: "280px",
                  height: "280px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />

              {/* Outer Orbit Circle (dashed line) */}
              <div
                className="absolute border-2 border-dashed border-slate-300/50 rounded-full"
                style={{
                  width: "420px",
                  height: "420px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />

              {/* Central Logo - Static */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              >
                {/* Pulsing Glow Background */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    background: "radial-gradient(circle, rgba(99, 99, 241, 0.4) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)",
                    filter: "blur(20px)",
                    width: "140px",
                    height: "140px",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                
                {/* Glass Card */}
                <div className="relative w-28 h-28 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl flex items-center justify-center p-3">
                  <Logo size="medium" />
                </div>
              </motion.div>

              {/* Inner Orbit Container */}
              <div
                className="absolute orbit-inner"
                style={{
                  width: "280px",
                  height: "280px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {innerPositions.map(({ logo, x, y }) => {
                  const isSlack = logo.name === "Slack";

                  return (
                    <div
                      key={logo.name}
                      className="absolute"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                    >
                      <div className="relative orbit-counter-rotate">
                        {isSlack ? (
                          <Link 
                            href="/api/integrations/slack/auth"
                            className="block cursor-pointer z-10 relative"
                          >
                            <div className="relative group">
                              {/* Glass Container */}
                              <div className="relative w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg flex items-center justify-center p-2 group-hover:shadow-xl group-hover:border-blue-400 transition-all">
                                <Image
                                  src={logo.src}
                                  alt={logo.alt}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-contain"
                                  unoptimized
                                />
                              </div>
                              
                              {/* Tooltip */}
                              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                                  {logo.name}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="relative group">
                            {/* Glass Container */}
                            <div className="relative w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg flex items-center justify-center p-2 group-hover:shadow-xl transition-shadow">
                              <Image
                                src={logo.src}
                                alt={logo.alt}
                                width={32}
                                height={32}
                                className="w-full h-full object-contain"
                                unoptimized
                              />
                            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                              <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                                {logo.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Outer Orbit Container */}
              <div
                className="absolute orbit-outer"
                style={{
                  width: "420px",
                  height: "420px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {outerPositions.map(({ logo, x, y }) => (
                  <div
                    key={logo.name}
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    <div className="relative orbit-counter-rotate-outer">
                      <div className="relative group">
                        {/* Glass Container */}
                        <div className="relative w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg flex items-center justify-center p-2 group-hover:shadow-xl transition-shadow">
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            width={32}
                            height={32}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                          <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                            {logo.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Grid Layout */}
          <div className="md:hidden w-full">
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
              {/* Center Hub */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="col-span-3 flex justify-center mb-8"
              >
                <div className="relative">
                  {/* Pulsing Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background: "radial-gradient(circle, rgba(99, 99, 241, 0.4) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)",
                      filter: "blur(20px)",
                      width: "120px",
                      height: "120px",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  
                  <div className="relative w-24 h-24 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl flex items-center justify-center p-2">
                    <Logo size="medium" />
                  </div>
                </div>
              </motion.div>

              {/* Integration Logos in Grid */}
              {[...innerOrbitLogos, ...outerOrbitLogos].map((logo, index) => {
                const isSlack = logo.name === "Slack";

                return (
                  <motion.div
                    key={logo.name}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    {isSlack ? (
                      <Link 
                        href="/api/integrations/slack/auth"
                        className="block cursor-pointer"
                      >
                        <div className="relative w-14 h-14 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg flex items-center justify-center p-2 hover:border-blue-400 hover:shadow-xl transition-all">
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            width={32}
                            height={32}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="relative w-14 h-14 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg flex items-center justify-center p-2">
                        <Image
                          src={logo.src}
                          alt={logo.alt}
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="mt-2 text-xs font-medium text-slate-600 text-center">
                      {logo.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
