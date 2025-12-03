"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, Search, FileText, Code, 
  ArrowRight, Sparkles, Zap, Users, Settings
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";
import TableOfContents from "@/components/documentation/table-of-contents";
import Link from "next/link";

export default function DocumentationPage() {
  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      content: [
        "Welcome to WorkOS! This guide will help you get started with building your first workflow. WorkOS is a platform that transforms complex processes into atomic, executable tasks.",
        "To begin, create an account and set up your organization. Once you're logged in, you can start building procedures using our visual builder or our AI-powered Magic Builder.",
        "Our AI features can generate entire workflows from natural language descriptions. Simply describe what you want to accomplish, and our AI will create a complete procedure with all the necessary steps.",
      ],
      subsections: [
        {
          id: "introduction",
          title: "Introduction to WorkOS",
          content: [
            "WorkOS is built on the principle of atomic tasks—breaking down complex processes into indivisible, manageable units. Each task is clear, executable, and measurable.",
            "Our platform supports 16 predefined atomic actions, including Input, Compare, Authorize, Validate, and more. These actions can be combined to create powerful workflows.",
            "WorkOS also includes AI-powered features that can automatically generate procedures from natural language descriptions, making it easy to get started even if you're not familiar with workflow design.",
          ],
        },
        {
          id: "creating-first-procedure",
          title: "Creating Your First Procedure",
          content: [
            "To create your first procedure, navigate to the Studio and click 'Create Procedure'. You can either build it manually using the drag-and-drop builder or use our AI Magic Builder.",
            "With the Magic Builder, simply describe your process in plain English. For example: 'Create a process for employee onboarding that collects personal information, verifies documents, and sends a welcome email.'",
            "The AI will generate a complete procedure with all necessary steps. You can then customize it, add additional steps, or modify existing ones to fit your exact needs.",
          ],
        },
        {
          id: "understanding-atomic-tasks",
          title: "Understanding Atomic Tasks",
          content: [
            "Atomic tasks are the building blocks of WorkOS. Each task represents a single, indivisible action that must be completed before moving to the next step.",
            "Tasks can be configured with specific requirements, validation rules, and assignment logic. This ensures that every step is clear and executable.",
            "When a task is completed, the workflow automatically moves to the next step. This creates a clear, linear progression through your process.",
          ],
        },
      ],
    },
    {
      id: "ai-features",
      title: "AI Features",
      content: [
        "WorkOS includes powerful AI features that can automate workflow creation and provide intelligent suggestions. Our AI is trained on thousands of workflows and can generate procedures that follow best practices.",
        "The AI Magic Builder can create complete procedures from natural language descriptions. Simply describe what you want to accomplish, and the AI will generate a workflow with all necessary steps.",
        "Our AI can also provide suggestions for improving existing workflows, identifying potential bottlenecks, and optimizing task assignments.",
      ],
      subsections: [
        {
          id: "ai-procedure-builder",
          title: "AI Procedure Builder",
          content: [
            "The AI Procedure Builder is our most powerful feature. It can generate complete workflows from simple text descriptions, saving you hours of manual work.",
            "To use the AI Builder, navigate to the Studio and click 'Magic Builder'. Enter a description of your process, and the AI will generate a complete procedure with all necessary steps.",
            "The AI considers best practices, common patterns, and your organization's existing workflows when generating new procedures. This ensures that generated workflows are both functional and optimized.",
          ],
        },
        {
          id: "natural-language-processing",
          title: "Natural Language Processing",
          content: [
            "Our AI uses advanced natural language processing to understand your descriptions and convert them into structured workflows. It can understand complex requirements and generate appropriate task sequences.",
            "The AI can identify key actions, required inputs, decision points, and approval steps from your description. It then creates a workflow that implements these requirements.",
            "You can refine the generated workflow by providing additional context or making manual adjustments. The AI learns from your feedback to improve future suggestions.",
          ],
        },
      ],
    },
    {
      id: "api-reference",
      title: "API Reference",
      content: [
        "WorkOS provides a comprehensive REST API that allows you to integrate our platform with your existing tools and systems. The API is designed to be simple, consistent, and powerful.",
        "All API requests require authentication using an API key. You can generate API keys from your organization settings. Keep your API keys secure and never share them publicly.",
        "The API follows RESTful principles and uses standard HTTP methods. Responses are returned in JSON format, and errors follow a consistent structure.",
      ],
      subsections: [
        {
          id: "authentication",
          title: "Authentication",
          content: [
            "All API requests must include an API key in the Authorization header. The API key should be prefixed with 'Bearer'.",
            "You can generate API keys from your organization settings. Each key has specific permissions and can be revoked at any time.",
            "API keys are scoped to your organization and can only access resources that belong to your organization. This ensures that your data remains secure.",
          ],
        },
        {
          id: "procedures-api",
          title: "Procedures API",
          content: [
            "The Procedures API allows you to create, read, update, and delete procedures programmatically. You can also list all procedures in your organization and filter them by various criteria.",
            "When creating a procedure via API, you must provide all required fields, including the procedure name, description, and steps. Steps must be defined using our atomic action format.",
            "You can also start procedure runs via the API, which allows you to trigger workflows programmatically from your own applications.",
          ],
        },
      ],
    },
    {
      id: "team-collaboration",
      title: "Team Collaboration",
      content: [
        "WorkOS is designed for team collaboration. You can create teams, assign tasks to specific users or teams, and track progress across your organization.",
        "Tasks can be assigned to individuals, teams, or set up as a queue where any team member can claim them. This flexibility allows you to model various workflow patterns.",
        "All team members receive notifications when tasks are assigned to them, when tasks are completed, or when comments are added to workflows.",
      ],
      subsections: [
        {
          id: "creating-teams",
          title: "Creating Teams",
          content: [
            "Teams allow you to group users together and assign tasks to entire teams rather than individuals. This is useful for processes where any team member can handle a task.",
            "To create a team, navigate to Settings > Teams and click 'Create Team'. Add team members and configure team settings such as default assignments and notification preferences.",
            "Teams can be used in task assignments, allowing you to create workflows where tasks are assigned to teams rather than specific individuals.",
          ],
        },
        {
          id: "task-assignments",
          title: "Task Assignments",
          content: [
            "Tasks can be assigned in three ways: to the process starter, to a specific user, or to a team queue. The assignment type is configured when creating or editing a procedure step.",
            "When a task is assigned to a team queue, any member of that team can claim the task. This is useful for processes where multiple people can handle the same type of task.",
            "You can also configure automatic assignments based on workload, skills, or other criteria. This ensures that tasks are distributed efficiently across your team.",
          ],
        },
      ],
    },
  ];

  const headings = sections.flatMap((section) => [
    { id: section.id, title: section.title, level: 1 },
    ...(section.subsections?.map((sub) => ({
      id: sub.id,
      title: sub.title,
      level: 2,
    })) || []),
  ]);

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
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Complete Documentation</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
              Documentation
            </h1>
            <p className="text-xl leading-relaxed text-slate-600 mb-6">
              Everything you need to master WorkOS. From basics to advanced features, including our AI-powered tools.
            </p>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative max-w-2xl mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 pl-12 pr-6 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </motion.div>
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
                      <div className="space-y-6 mb-8">
                        {section.content.map((paragraph, j) => (
                          <p
                            key={j}
                            className="text-lg leading-loose text-slate-600"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {/* Subsections */}
                      {section.subsections && (
                        <div className="space-y-12 mt-12">
                          {section.subsections.map((subsection, j) => (
                            <div key={subsection.id} id={subsection.id} className="scroll-mt-24">
                              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
                                {subsection.title}
                              </h3>
                              <div className="space-y-6">
                                {subsection.content.map((paragraph, k) => (
                                  <p
                                    key={k}
                                    className="text-lg leading-loose text-slate-600"
                                  >
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.section>
                  ))}
                </div>
              </article>
            </main>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
