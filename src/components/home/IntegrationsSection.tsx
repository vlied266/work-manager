"use client";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Folder, 
  FileText, 
  Github, 
  CreditCard, 
  GitBranch,
  Zap,
  Cloud
} from "lucide-react";
import Logo from "@/components/Logo";

interface SatelliteIcon {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  color: string;
  position: { top?: string; right?: string; bottom?: string; left?: string };
  delay: number;
  duration?: number;
}

const satellites: SatelliteIcon[] = [
  {
    icon: MessageSquare,
    name: "Slack",
    color: "text-purple-600",
    position: { top: "10%", right: "15%" },
    delay: 0,
  },
  {
    icon: Folder,
    name: "Drive",
    color: "text-blue-600",
    position: { top: "20%", left: "10%" },
    delay: 0.3,
  },
  {
    icon: FileText,
    name: "Notion",
    color: "text-slate-800",
    position: { top: "50%", left: "5%" },
    delay: 0.6,
  },
  {
    icon: Github,
    name: "GitHub",
    color: "text-slate-900",
    position: { bottom: "20%", left: "15%" },
    delay: 0.9,
  },
  {
    icon: CreditCard,
    name: "Stripe",
    color: "text-indigo-600",
    position: { bottom: "10%", right: "20%" },
    delay: 1.2,
  },
  {
    icon: GitBranch,
    name: "Linear",
    color: "text-blue-500",
    position: { top: "50%", right: "5%" },
    delay: 1.5,
  },
  {
    icon: Zap,
    name: "Zapier",
    color: "text-orange-500",
    position: { top: "5%", left: "50%" },
    delay: 1.8,
  },
  {
    icon: Cloud,
    name: "AWS",
    color: "text-orange-600",
    position: { bottom: "5%", left: "50%" },
    delay: 2.1,
  },
].map((sat, index) => ({
  ...sat,
  duration: 2 + (index % 3) * 0.3, // Use index-based duration instead of Math.random()
}));

export default function IntegrationsSection() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
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

        {/* Gravity Orbit Container */}
        <div className="relative flex items-center justify-center min-h-[500px] md:min-h-[600px]">
          {/* Desktop: Absolute positioned satellites */}
          <div className="hidden md:block relative w-full h-full">
            {/* Central Hub - Atomic Work */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
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
                  width: "120px",
                  height: "120px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              
              {/* Glass Card */}
              <div className="relative w-24 h-24 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl flex items-center justify-center p-2">
                <Logo size="medium" />
              </div>
            </motion.div>

            {/* Satellite Icons */}
            {satellites.map((satellite, index) => {
              const Icon = satellite.icon;
              return (
                <motion.div
                  key={satellite.name}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="absolute"
                  style={{
                    ...satellite.position,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: satellite.duration || 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: satellite.delay,
                  }}
                >
                  <div className="relative group">
                    {/* Icon Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: satellite.delay,
                      }}
                      style={{
                        background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
                        filter: "blur(10px)",
                      }}
                    />
                    
                    {/* Icon Container */}
                    <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center group-hover:shadow-xl transition-shadow">
                      <Icon className={`h-8 w-8 ${satellite.color}`} />
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                        {satellite.name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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

              {/* Satellite Icons in Grid */}
              {satellites.map((satellite, index) => {
                const Icon = satellite.icon;
                return (
                  <motion.div
                    key={satellite.name}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: satellite.duration || 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: satellite.delay * 0.5,
                    }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative group">
                      {/* Icon Glow */}
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.2, 0.3, 0.2],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: satellite.delay * 0.5,
                        }}
                        style={{
                          background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
                          filter: "blur(8px)",
                        }}
                      />
                      
                      <div className="relative w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center">
                        <Icon className={`h-7 w-7 ${satellite.color}`} />
                      </div>
                    </div>
                    <span className="mt-2 text-xs font-medium text-slate-600">
                      {satellite.name}
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
