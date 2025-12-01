"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationBadge } from "@/hooks/use-notification-badge";

// Manager-only links (ADMIN and LEAD)
const managerLinks = [
  { href: "/manager", label: "Manager Dashboard", roles: ["ADMIN", "LEAD"] },
  { href: "/processes", label: "Process Builder", roles: ["ADMIN", "LEAD"] },
  { href: "/design", label: "Procedure Designer", roles: ["ADMIN", "LEAD"] },
  { href: "/flags", label: "Flag Review", roles: ["ADMIN", "LEAD"] },
  { href: "/analytics", label: "Analytics", roles: ["ADMIN", "LEAD"] },
  { href: "/settings", label: "Org Settings", roles: ["ADMIN", "LEAD"] },
  { href: "/admin/seed", label: "Seed Data", roles: ["ADMIN"] },
];

// User links (all roles)
const userLinks = [
  { href: "/dashboard", label: "My Dashboard", roles: ["ADMIN", "LEAD", "OPERATOR"] },
  { href: "/inbox", label: "Work Inbox", roles: ["ADMIN", "LEAD", "OPERATOR"] },
  { href: "/history", label: "Audit History", roles: ["ADMIN", "LEAD", "OPERATOR"] },
  { href: "/notifications", label: "Notifications", roles: ["ADMIN", "LEAD", "OPERATOR"] },
  { href: "/profile", label: "Profile", roles: ["ADMIN", "LEAD", "OPERATOR"] },
];

// Common links (all roles)
const commonLinks = [
  { href: "/docs", label: "Docs", roles: ["ADMIN", "LEAD", "OPERATOR"] },
  { href: "/billing", label: "Billing", roles: ["ADMIN", "LEAD", "OPERATOR"] },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile, loading, signOut } = useAuth();
  const { unreadCount } = useNotificationBadge();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/sign-in");
    }
  }, [firebaseUser, loading, router]);

  useEffect(() => {
    if (!loading && profile && !profile.organizationId) {
      router.replace("/onboarding");
    }
  }, [loading, profile, router]);

  if (loading || !firebaseUser || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <p className="text-muted">Loading workspace…</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  // Filter links based on user role
  const isManager = profile.role === "ADMIN" || profile.role === "LEAD";
  const allLinks = [
    ...userLinks.filter(link => link.roles.includes(profile.role)),
    ...(isManager ? managerLinks.filter(link => link.roles.includes(profile.role)) : []),
    ...commonLinks.filter(link => link.roles.includes(profile.role)),
  ];

  return (
    <div className="min-h-screen bg-base-secondary text-ink">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-muted-light bg-base lg:block">
          <div className="sticky top-0 flex h-screen flex-col justify-between px-6 py-8">
            <div className="space-y-8">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">WorkOS</p>
                <h2 className="text-lg font-semibold tracking-tight text-ink">
                  {isManager ? "Manager Workspace" : "My Workspace"}
                </h2>
                <p className="mt-1 text-xs text-muted">{profile.role}</p>
              </div>
              <nav className="space-y-1">
                {allLinks.map((link) => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#1d1d1f] text-white"
                        : "text-ink-secondary hover:bg-base-secondary hover:text-ink"
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.href === "/notifications" && unreadCount > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            active
                              ? "bg-white/30 text-white"
                              : "bg-accent text-white"
                          }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="space-y-3 border-t border-muted-light pt-6">
              <div>
                <p className="text-sm font-medium text-ink">{firebaseUser.displayName || firebaseUser.email}</p>
                <p className="text-xs text-muted">{firebaseUser.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full rounded-xl border border-muted-light bg-base px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-base-secondary"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>
        <main className="min-h-screen bg-base">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

