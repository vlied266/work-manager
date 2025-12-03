"use client";

import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import TableOfContents from "@/components/documentation/table-of-contents";
import Link from "next/link";

export default function TermsOfServicePage() {
  const sections = [
    {
      id: "acceptance-of-terms",
      title: "Acceptance of Terms",
      content: [
        "By accessing or using WorkOS, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you disagree with any part of these terms, you may not access the service.",
        "These terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content.",
        "If you are using WorkOS on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these terms.",
      ],
    },
    {
      id: "use-of-service",
      title: "Use of Service",
      content: [
        "You may use WorkOS for lawful purposes only. You agree not to use the service in any way that violates applicable laws or regulations, or infringes on the rights of others.",
        "You agree not to use the service to transmit, distribute, store, or destroy material that violates any applicable law or regulation, infringes on intellectual property rights, or is defamatory, obscene, or otherwise objectionable.",
        "You are responsible for all activities that occur under your account, regardless of whether you authorized such activities. You must immediately notify us of any unauthorized use of your account.",
      ],
    },
    {
      id: "ai-generated-content",
      title: "AI-Generated Content",
      content: [
        "Our AI features generate workflows and code based on your input. While we strive for accuracy, AI-generated content may contain errors, inaccuracies, or may not be suitable for your specific use case.",
        "You are solely responsible for reviewing and validating all AI-generated content before use. You acknowledge that AI-generated content is provided 'as is' without warranties of any kind.",
        "We do not guarantee that AI-generated content will be error-free, secure, or meet your requirements. You use AI-generated content at your own risk.",
      ],
    },
    {
      id: "user-accounts",
      title: "User Accounts",
      content: [
        "You are responsible for maintaining the security of your account and password. WorkOS cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.",
        "You agree to notify us immediately of any unauthorized access or use of your account. We reserve the right to suspend or terminate your account if we suspect unauthorized access.",
        "You may not share your account credentials with others or allow others to access your account. Each user must have their own account.",
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      content: [
        "WorkOS and its original content, features, and functionality are owned by WorkOS and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.",
        "You may not copy, modify, distribute, sell, or lease any part of our service or included software, nor may you reverse engineer or attempt to extract the source code of that software.",
        "Our trademarks, service marks, and logos may not be used in connection with any product or service without our prior written consent.",
      ],
    },
    {
      id: "user-content",
      title: "User Content",
      content: [
        "You retain ownership of any content you create using WorkOS. By using our service, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and process your content as necessary to provide the service.",
        "You represent and warrant that you have all rights necessary to grant us the license described above. You will not upload content that infringes on the rights of others.",
        "We reserve the right to remove or refuse to process any content that violates these terms or that we determine is harmful, offensive, or otherwise objectionable.",
      ],
    },
    {
      id: "prohibited-uses",
      title: "Prohibited Uses",
      content: [
        "You may not use WorkOS to: violate any laws, infringe on intellectual property rights, transmit harmful code, spam, or engage in any activity that disrupts the service or harms other users.",
        "You may not attempt to gain unauthorized access to any portion of the service, other accounts, computer systems, or networks connected to the service.",
        "You may not use the service to build a competitive product or service, or to copy features, functions, or graphics of the service.",
      ],
    },
    {
      id: "service-availability",
      title: "Service Availability",
      content: [
        "We strive to maintain high availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications that temporarily affect service availability.",
        "We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation.",
        "We do not guarantee that the service will be available at all times or that it will be free from errors, defects, or interruptions.",
      ],
    },
    {
      id: "limitation-of-liability",
      title: "Limitation of Liability",
      content: [
        "To the maximum extent permitted by law, WorkOS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.",
        "Our total liability for any claims arising out of or relating to these terms or the service shall not exceed the amount you paid us in the twelve months preceding the claim.",
        "Some jurisdictions do not allow the exclusion or limitation of liability for consequential or incidental damages, so the above limitation may not apply to you.",
      ],
    },
    {
      id: "termination",
      title: "Termination",
      content: [
        "We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.",
        "Upon termination, your right to use the service will immediately cease. We may delete your account and all associated data, and we will not be liable for any loss of data resulting from termination.",
        "You may terminate your account at any time by contacting us or through your account settings. Upon termination, you remain responsible for any charges incurred prior to termination.",
      ],
    },
    {
      id: "changes-to-terms",
      title: "Changes to Terms",
      content: [
        "We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page and updating the 'Last Updated' date.",
        "Your continued use of the service after changes become effective constitutes acceptance of the new terms. If you do not agree with the changes, you must discontinue use of the service.",
        "We encourage you to review these terms periodically to stay informed about how we are protecting your rights and our service.",
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
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Legal Terms</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-xl leading-relaxed text-slate-600 mb-4">
              Please read these terms carefully before using WorkOS. By using our service, you agree to these terms.
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
              <FileText className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Questions About Terms?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              If you have questions about these terms, please contact us for clarification.
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
