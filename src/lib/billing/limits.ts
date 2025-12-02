/**
 * Billing & Subscription Limits Utility
 * Checks if an organization has reached its plan limits
 */

import { Organization } from "@/types/schema";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UsageStats {
  currentUsers: number;
  currentActiveRuns: number;
  currentAiGenerations: number; // This would need to be tracked separately
}

export interface LimitCheckResult {
  allowed: boolean;
  resource: "users" | "activeRuns" | "aiGenerations" | null;
  current: number;
  limit: number;
  message?: string;
}

/**
 * Get plan limits based on plan type
 */
export function getPlanLimits(plan: Organization["plan"]): Organization["limits"] {
  switch (plan) {
    case "FREE":
      return {
        maxUsers: 3,
        maxActiveRuns: 10,
        aiGenerations: 0, // No AI for free plan
      };
    case "PRO":
      return {
        maxUsers: Infinity, // Unlimited
        maxActiveRuns: Infinity, // Unlimited
        aiGenerations: 1000, // 1000 AI generations per month
      };
    case "ENTERPRISE":
      return {
        maxUsers: Infinity,
        maxActiveRuns: Infinity,
        aiGenerations: Infinity, // Unlimited
      };
    default:
      return {
        maxUsers: 3,
        maxActiveRuns: 10,
        aiGenerations: 0,
      };
  }
}

/**
 * Get current usage stats for an organization
 */
export async function getUsageStats(organizationId: string): Promise<UsageStats> {
  // Count users
  const usersQuery = query(
    collection(db, "users"),
    where("organizationId", "==", organizationId)
  );
  const usersSnapshot = await getCountFromServer(usersQuery);
  const currentUsers = usersSnapshot.data().count;

  // Count active runs (IN_PROGRESS or FLAGGED)
  const activeRunsQuery = query(
    collection(db, "active_runs"),
    where("organizationId", "==", organizationId),
    where("status", "in", ["IN_PROGRESS", "FLAGGED"])
  );
  const activeRunsSnapshot = await getCountFromServer(activeRunsQuery);
  const currentActiveRuns = activeRunsSnapshot.data().count;

  // TODO: Track AI generations separately (would need a separate collection or field)
  // For now, return 0
  const currentAiGenerations = 0;

  return {
    currentUsers,
    currentActiveRuns,
    currentAiGenerations,
  };
}

/**
 * Check if an organization can perform a specific action
 */
export async function checkUsageLimit(
  organization: Organization,
  resource: "users" | "activeRuns" | "aiGenerations"
): Promise<LimitCheckResult> {
  const limits = organization.limits || getPlanLimits(organization.plan);
  const usage = await getUsageStats(organization.id);

  let current: number;
  let limit: number;

  switch (resource) {
    case "users":
      current = usage.currentUsers;
      limit = limits.maxUsers;
      break;
    case "activeRuns":
      current = usage.currentActiveRuns;
      limit = limits.maxActiveRuns;
      break;
    case "aiGenerations":
      current = usage.currentAiGenerations;
      limit = limits.aiGenerations;
      break;
  }

  const allowed = limit === Infinity || current < limit;

  return {
    allowed,
    resource: allowed ? null : resource,
    current,
    limit,
    message: allowed
      ? undefined
      : `You've reached your ${organization.plan} plan limit for ${resource}. Upgrade to continue.`,
  };
}

/**
 * Get usage percentage for display
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === Infinity) return 0; // Unlimited
  if (limit === 0) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

