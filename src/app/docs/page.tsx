"use client";

import Link from "next/link";

const sections = [
  {
    title: "01 · Processes",
    body: "A process is the highest-order playbook. It sequences multiple procedures to achieve an outcome (e.g., Client Onboarding). Each organization can have unlimited processes tailored to teams.",
  },
  {
    title: "02 · Procedures",
    body: "Procedures describe how a single domain task is executed. They contain strictly ordered Basic Tasks plus assignment rules, digital actions, and proof requirements.",
  },
  {
    title: "03 · Basic Tasks",
    body: "The atomic steps operators follow. Basic Tasks enforce the lifecycle (IMPORT → REPORT), capture evidence, and log every decision for audit.",
  },
  {
    title: "04 · Flag Loop",
    body: "Flags surface any discrepancy (mismatch, incomplete proof) so leads can review, resolve, or reopen runs. Nothing slips by quietly.",
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-base px-6 py-16 text-ink lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="rounded-3xl bg-white/90 p-10 shadow-glass ring-1 ring-white/60 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">Playbook</p>
          <h1 className="mt-4 text-4xl font-semibold text-ink">Mastering the WorkOS hierarchy</h1>
          <p className="mt-3 text-muted">
            Define ambiguity-free processes, assign accountability, and audit everything from a single glass workspace.
          </p>
          <div className="mt-6 inline-flex gap-3">
            <Link href="/processes" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-subtle">
              Build a process
            </Link>
            <Link href="/design" className="rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold text-ink">
              Design procedures
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-subtle backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-muted">{section.title}</p>
              <p className="mt-3 text-sm text-muted">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-subtle">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">FAQs</p>
          <div className="mt-6 space-y-4 text-sm text-muted">
            <div>
              <p className="font-semibold text-ink">How do I share a process with my team?</p>
              <p>Create the process, then “Start Process” and assign the generated run to the operator you&apos;re targeting.</p>
            </div>
            <div>
              <p className="font-semibold text-ink">Can I reuse the same procedure in multiple processes?</p>
              <p>Yes. Procedures are modular; processes simply define ordering and ownership.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

