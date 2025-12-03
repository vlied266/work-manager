"use client";

import { motion } from "framer-motion";
import { 
  Activity, CheckCircle2, AlertCircle, 
  Clock, ArrowRight, Sparkles
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";

export default function StatusPage() {
  const services = [
    {
      name: "API",
      status: "operational",
      uptime: "99.99%",
      lastIncident: "30 days ago",
    },
    {
      name: "Dashboard",
      status: "operational",
      uptime: "99.98%",
      lastIncident: "45 days ago",
    },
    {
      name: "Studio (Workflow Builder)",
      status: "operational",
      uptime: "99.97%",
      lastIncident: "60 days ago",
    },
    {
      name: "AI Services",
      status: "operational",
      uptime: "99.95%",
      lastIncident: "15 days ago",
    },
    {
      name: "Authentication",
      status: "operational",
      uptime: "99.99%",
      lastIncident: "90 days ago",
    },
    {
      name: "Webhooks",
      status: "operational",
      uptime: "99.96%",
      lastIncident: "20 days ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-700 border-green-200";
      case "degraded":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "down":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return CheckCircle2;
      case "degraded":
        return AlertCircle;
      case "down":
        return AlertCircle;
      default:
        return Clock;
    }
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
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50/80 backdrop-blur-sm border border-green-200/50 px-4 py-2 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-900">All Systems Operational</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
              System Status
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl">
              Real-time status of all WorkOS services, including our AI-powered features.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Status */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Service Status
            </h2>
            <p className="text-xl text-slate-600">
              Current status of all WorkOS services
            </p>
          </motion.div>

          <div className="space-y-4">
            {services.map((service, i) => {
              const StatusIcon = getStatusIcon(service.status);
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                        <Activity className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-1">
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Uptime: {service.uptime}</span>
                          <span>•</span>
                          <span>Last incident: {service.lastIncident}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${getStatusColor(service.status)}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="capitalize">{service.status}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Incident History */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                <Clock className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Recent Incidents
              </h2>
            </div>
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900 mb-2">
                No recent incidents
              </p>
              <p className="text-sm text-slate-600">
                All systems are running smoothly. We'll post updates here if any issues occur.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-xl">
              <Activity className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Subscribe to status updates and get notified about incidents and maintenance.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
            >
              Subscribe to Updates
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

