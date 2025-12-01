import Link from "next/link";
import { ArrowRight, ShieldCheck, Workflow } from "lucide-react";

const heroStats = [
  { label: "Atomic Steps Designed", value: "4,820+" },
  { label: "Teams Onboarded", value: "128" },
  { label: "Avg. Audit Score", value: "99.2%" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-base">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-32 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium tracking-wide text-muted">
            WorkOS
          </p>
          <h1 className="mb-6 text-5xl font-semibold leading-tight tracking-tight text-ink md:text-6xl lg:text-7xl">
            Remove ambiguity from every business process
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-ink-secondary md:text-2xl">
            Define procedures, assign the right operator, and capture evidence in one
            workspace built for clarity and efficiency.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/design"
              className="apple-button inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-medium text-white"
            >
              Launch Procedure Designer
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-muted-light bg-base px-8 py-3.5 text-base font-medium text-ink transition-colors hover:bg-base-secondary"
            >
              View Platform Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-muted-light bg-base-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 lg:px-20">
          <div className="grid gap-8 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="mb-2 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:px-12 lg:px-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Compliance Card */}
          <div className="apple-card p-10">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Compliance Core
                </p>
                <p className="mt-1 text-xl font-semibold text-ink">Zero-ambiguity runs</p>
              </div>
            </div>
            <p className="mb-8 text-base leading-relaxed text-ink-secondary">
              Every click is logged, every file is versioned, and every task is
              assigned with intent. WorkOS enforces your references, rules, and
              contracts without slowing operators down.
            </p>
          </div>

          {/* Procedure Designer Card */}
          <div className="apple-card p-10">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
                <Workflow className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Build Once
                </p>
                <p className="mt-1 text-xl font-semibold text-ink">Procedure Designer</p>
              </div>
            </div>
            <p className="mb-8 text-base leading-relaxed text-ink-secondary">
              Drag, drop, and annotate atomic steps. Capture instructions, assign
              ownership, require proofs, and branch on outcomes with MIL-spec clarity.
            </p>
            <Link
              href="/design"
              className="inline-flex items-center gap-2 text-base font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Start designing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
