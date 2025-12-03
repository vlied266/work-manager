"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TableOfContentsProps {
  headings: Array<{ id: string; title: string; level: number }>;
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -35% 0%",
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="pr-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">
          Table of Contents
        </h3>
        <ul className="space-y-2">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            const paddingLeft = heading.level === 1 ? "pl-0" : heading.level === 2 ? "pl-4" : "pl-8";

            return (
              <li key={heading.id}>
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`relative w-full text-left text-sm transition-colors ${paddingLeft} ${
                    isActive
                      ? "text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeSection"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative block py-1">{heading.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

