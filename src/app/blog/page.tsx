"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  BookOpen, Calendar, User, ArrowRight, 
  Tag, Clock, TrendingUp, Sparkles
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { LandingFooter } from "@/components/layout/landing-footer";

export default function BlogPage() {
  const featuredPost = {
    id: 1,
    title: "How AI is Transforming Workflow Automation",
    excerpt: "Discover how artificial intelligence is revolutionizing the way teams build and execute workflows. Learn about our Magic Builder and how it can generate complete procedures from natural language descriptions.",
    author: "Alex Chen",
    date: "March 15, 2024",
    readTime: "8 min read",
    category: "AI & Automation",
    image: "featured",
    tags: ["AI", "Automation", "Workflow"],
  };

  const blogPosts = [
    {
      id: 2,
      title: "Atomic Tasks: The Foundation of Clear Workflows",
      excerpt: "Learn why breaking down processes into atomic, indivisible tasks leads to better outcomes and clearer communication.",
      author: "Sarah Johnson",
      date: "March 10, 2024",
      readTime: "5 min read",
      category: "Product",
      tags: ["Product", "Workflow"],
    },
    {
      id: 3,
      title: "Building Your First Workflow with Atomic Work",
      excerpt: "A step-by-step guide to creating your first procedure using our visual builder and AI-powered tools.",
      author: "Michael Park",
      date: "March 5, 2024",
      readTime: "6 min read",
      category: "Tutorial",
      tags: ["Tutorial", "Getting Started"],
    },
    {
      id: 4,
      title: "Team Collaboration Best Practices",
      excerpt: "Discover how to effectively assign tasks, manage teams, and track progress across your organization.",
      author: "Emily Rodriguez",
      date: "February 28, 2024",
      readTime: "7 min read",
      category: "Collaboration",
      tags: ["Teams", "Collaboration"],
    },
    {
      id: 5,
      title: "The Future of Process Management",
      excerpt: "Exploring emerging trends in workflow automation and how they're shaping the future of work.",
      author: "Alex Chen",
      date: "February 20, 2024",
      readTime: "9 min read",
      category: "Insights",
      tags: ["Future", "Trends"],
    },
    {
      id: 6,
      title: "API Integration Guide",
      excerpt: "Learn how to integrate Atomic Work with your existing tools and systems using our comprehensive REST API.",
      author: "Sarah Johnson",
      date: "February 15, 2024",
      readTime: "10 min read",
      category: "Technical",
      tags: ["API", "Integration"],
    },
    {
      id: 7,
      title: "Real-Time Monitoring: God-Mode for Operations",
      excerpt: "How real-time process monitoring helps teams identify bottlenecks and intervene before deadlines are missed.",
      author: "Michael Park",
      date: "February 10, 2024",
      readTime: "6 min read",
      category: "Operations",
      tags: ["Monitoring", "Operations"],
    },
  ];

  const categories = [
    { name: "All", count: 7, active: true },
    { name: "AI & Automation", count: 1 },
    { name: "Product", count: 1 },
    { name: "Tutorial", count: 1 },
    { name: "Collaboration", count: 1 },
    { name: "Technical", count: 1 },
  ];

  const colorClasses = {
    "AI & Automation": "bg-purple-100/70 text-purple-700 border-purple-200/50",
    "Product": "bg-blue-100/70 text-blue-700 border-blue-200/50",
    "Tutorial": "bg-green-100/70 text-green-700 border-green-200/50",
    "Collaboration": "bg-orange-100/70 text-orange-700 border-orange-200/50",
    "Insights": "bg-pink-100/70 text-pink-700 border-pink-200/50",
    "Technical": "bg-indigo-100/70 text-indigo-700 border-indigo-200/50",
    "Operations": "bg-cyan-100/70 text-cyan-700 border-cyan-200/50",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-cyan-50/40">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 sm:py-40 lg:py-48">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-200 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 px-4 py-2 mb-6">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Blog & Insights</span>
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 mb-6">
              Blog
            </h1>
            <p className="text-2xl sm:text-3xl leading-relaxed text-slate-600 max-w-3xl mx-auto">
              Insights, tutorials, and stories about workflow automation, AI, and the future of work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {categories.map((category) => (
              <button
                key={category.name}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  category.active
                    ? "bg-[#007AFF] text-white shadow-lg shadow-blue-500/20"
                    : "bg-white/70 backdrop-blur-sm border border-white/60 text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                {category.name}
                {category.count > 0 && (
                  <span className={`ml-2 ${category.active ? "opacity-80" : "opacity-60"}`}>
                    ({category.count})
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Featured
              </span>
            </div>
            <Link href={`/blog/${featuredPost.id}`} prefetch={false}>
              <div className="group relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.01] cursor-pointer">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Image Placeholder */}
                  <div className="relative h-64 lg:h-auto bg-gradient-to-br from-blue-100/50 via-purple-100/50 to-pink-100/50 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-24 w-24 text-blue-600/30" />
                    </div>
                    <div className="absolute top-6 left-6">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${colorClasses[featuredPost.category as keyof typeof colorClasses] || "bg-slate-100/70 text-slate-700 border-slate-200/50"}`}>
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-10 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{featuredPost.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-lg leading-relaxed text-slate-600 mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {featuredPost.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{featuredPost.author}</div>
                          <div className="text-xs text-slate-500">Author</div>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="inline-flex items-center gap-2 text-blue-600 font-semibold"
                      >
                        <span>Read more</span>
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 pb-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Latest Articles
            </h2>
            <p className="text-xl text-slate-600">
              Explore our latest insights and tutorials
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/blog/${post.id}`} prefetch={false}>
                  <div className="group relative h-full rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 overflow-hidden transition-all hover:shadow-2xl hover:bg-white/80 cursor-pointer">
                    {/* Image Placeholder */}
                    <div className="relative h-48 bg-gradient-to-br from-slate-100/50 via-blue-100/30 to-purple-100/30 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-slate-400/30" />
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${colorClasses[post.category as keyof typeof colorClasses] || "bg-slate-100/70 text-slate-700 border-slate-200/50"}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-base leading-relaxed text-slate-600 mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            {post.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{post.author}</span>
                        </div>
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="inline-flex items-center gap-1 text-blue-600 font-semibold text-sm"
                        >
                          <span>Read</span>
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center rounded-[2.5rem] bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 p-12"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-xl">
              <TrendingUp className="h-10 w-10" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Get the latest articles, tutorials, and insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full border-0 bg-white/70 backdrop-blur-sm shadow-inner px-6 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0071E3] hover:shadow-xl"
              >
                Subscribe
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

