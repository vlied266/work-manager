"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import TableOfContents from "@/components/documentation/table-of-contents";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: "information-we-collect",
      title: "Information We Collect",
      content: [
        "We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This includes your name, email address, organization information, and workflow data.",
        "We also collect usage data and analytics to improve our services. This includes information about how you interact with our platform, features you use, and performance metrics.",
        "When you use our AI-powered features, we may process your workflow data to generate procedures and provide suggestions. This processing is done securely and in accordance with this privacy policy.",
      ],
    },
    {
      id: "how-we-use",
      title: "How We Use Your Information",
      content: [
        "We use your information to provide, maintain, and improve our services, including our AI-powered features. This includes generating workflows, providing code suggestions, and optimizing our AI models.",
        "We use your information to communicate with you, process transactions, and ensure security. We may send you service-related notifications, updates, and promotional communications.",
        "We do not sell your personal information to third parties. We may share your information only as described in this policy or with your explicit consent.",
      ],
    },
    {
      id: "data-security",
      title: "Data Security",
      content: [
        "We implement industry-standard security measures to protect your data, including encryption, secure servers, and access controls. All data is encrypted in transit and at rest.",
        "We regularly review and update our security practices to address emerging threats. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
        "You are responsible for maintaining the security of your account credentials. We recommend using strong passwords and enabling two-factor authentication when available.",
      ],
    },
    {
      id: "ai-machine-learning",
      title: "AI and Machine Learning",
      content: [
        "Our AI features process your workflow data to generate procedures and provide suggestions. This processing is done securely and in accordance with this privacy policy.",
        "We may use anonymized data to improve our AI models. This data is stripped of personally identifiable information before being used for model training.",
        "You can opt out of certain AI processing activities through your account settings. However, this may limit the functionality of some features.",
      ],
    },
    {
      id: "your-rights",
      title: "Your Rights",
      content: [
        "You have the right to access, update, or delete your personal information at any time. You can do this through your account settings or by contacting us directly.",
        "You can also opt out of certain data processing activities, including marketing communications and AI model training. These preferences can be managed in your account settings.",
        "If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR), including the right to data portability and the right to object to processing.",
      ],
    },
    {
      id: "cookies-tracking",
      title: "Cookies and Tracking",
      content: [
        "We use cookies and similar technologies to provide and improve our services. Cookies help us remember your preferences, authenticate your sessions, and analyze usage patterns.",
        "You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our service.",
        "We also use analytics tools to understand how our service is used. These tools may use cookies or similar technologies. See our Cookie Policy for more details.",
      ],
    },
    {
      id: "third-party-services",
      title: "Third-Party Services",
      content: [
        "We may use third-party services for analytics, payment processing, and other functions. These services have their own privacy policies governing the use of your information.",
        "When you integrate third-party services with WorkOS, you are subject to both our privacy policy and the privacy policies of those third-party services.",
        "We carefully select our third-party partners and require them to maintain appropriate security measures. However, we are not responsible for the privacy practices of third-party services.",
      ],
    },
    {
      id: "changes-to-policy",
      title: "Changes to This Policy",
      content: [
        "We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.",
        "We will notify you of any material changes by posting the new policy on this page and updating the 'Last Updated' date. We may also notify you via email or through our service.",
        "Your continued use of our service after changes become effective constitutes acceptance of the updated policy. If you do not agree with the changes, you may discontinue use of our service.",
      ],
    },
  ];

  const headings = sections.map((section) => ({
    id: section.id,
    title: section.title,
    level: 1,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 px-4 py-2 mb-6">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Privacy & Security</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl leading-relaxed text-slate-600 mb-4">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-slate-500">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content with TOC */}
      <section className="py-12">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-16">
            {/* Left Sidebar - TOC */}
            <aside className="hidden lg:block">
              <TableOfContents headings={headings} />
            </aside>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto lg:mx-0">
              <article className="prose prose-slate max-w-none">
                <div className="space-y-16">
                  {sections.map((section, i) => (
                    <motion.section
                      key={section.id}
                      id={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="scroll-mt-24"
                    >
                      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-6">
                        {section.title}
                      </h2>
                      <div className="space-y-6">
                        {section.content.map((paragraph, j) => (
                          <p
                            key={j}
                            className="text-lg leading-loose text-slate-600"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              </article>
            </main>
          </div>
        </div>
      </section>

      {/* Contact */}
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
              <Shield className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              If you have questions about this privacy policy or our data practices, please contact us.
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Contact Us
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
