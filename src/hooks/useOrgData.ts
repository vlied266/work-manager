"use client";

import { useMemo } from "react";
import { 
  collection, 
  query, 
  where, 
  QueryConstraint,
  CollectionReference,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useOrganization } from "@/contexts/OrganizationContext";

/**
 * Hook to automatically filter Firestore queries by organization
 * 
 * Usage:
 *   const usersQuery = useOrgQuery('users');
 *   const runsQuery = useOrgQuery('active_runs', [where('status', '==', 'IN_PROGRESS')]);
 */
export function useOrgQuery<T = DocumentData>(
  collectionName: string,
  additionalConstraints: QueryConstraint[] = []
): Query<T> | null {
  const { organizationId, isSuperAdmin, loading } = useOrganization();

  return useMemo(() => {
    // Don't create query if still loading
    if (loading) {
      return null;
    }

    // Super admin can see everything (no org filter)
    if (isSuperAdmin) {
      if (additionalConstraints.length === 0) {
        return query(collection(db, collectionName)) as Query<T>;
      }
      return query(collection(db, collectionName), ...additionalConstraints) as Query<T>;
    }

    // Regular users: MUST filter by organizationId
    if (!organizationId) {
      console.warn(`useOrgQuery: No organizationId found for collection ${collectionName}`);
      return null;
    }

    const constraints: QueryConstraint[] = [
      where("organizationId", "==", organizationId),
      ...additionalConstraints,
    ];

    return query(collection(db, collectionName), ...constraints) as Query<T>;
  }, [collectionName, organizationId, isSuperAdmin, loading, JSON.stringify(additionalConstraints)]);
}

/**
 * Hook to get a collection reference with automatic org filtering
 * 
 * Usage:
 *   const usersRef = useOrgCollection('users');
 */
export function useOrgCollection(collectionName: string): CollectionReference | null {
  const { organizationId, isSuperAdmin, loading } = useOrganization();

  return useMemo(() => {
    if (loading) {
      return null;
    }

    // Super admin can access all collections
    if (isSuperAdmin) {
      return collection(db, collectionName);
    }

    // Regular users: Return collection reference (filtering happens in queries)
    if (!organizationId) {
      console.warn(`useOrgCollection: No organizationId found for collection ${collectionName}`);
      return null;
    }

    return collection(db, collectionName);
  }, [collectionName, organizationId, isSuperAdmin, loading]);
}

/**
 * Hook to get the current organization ID
 * 
 * Usage:
 *   const orgId = useOrgId();
 */
export function useOrgId(): string | null {
  const { organizationId } = useOrganization();
  return organizationId;
}

/**
 * Hook to check if user is super admin
 * 
 * Usage:
 *   const isSuperAdmin = useIsSuperAdmin();
 */
export function useIsSuperAdmin(): boolean {
  const { isSuperAdmin } = useOrganization();
  return isSuperAdmin;
}

/**
 * Helper function to create organization-scoped data
 * Ensures organizationId is set when creating documents
 */
export function useOrgDataCreator() {
  const { organizationId, isSuperAdmin } = useOrganization();

  return useMemo(() => {
    return {
      organizationId: organizationId || undefined,
      isSuperAdmin,
      // Helper to ensure orgId is set in document data
      ensureOrgId: <T extends { organizationId?: string }>(data: T): T => {
        if (isSuperAdmin) {
          // Super admin can create without orgId (for system data)
          return data;
        }
        if (!organizationId) {
          throw new Error("Cannot create document: No organizationId found");
        }
        return {
          ...data,
          organizationId,
        };
      },
    };
  }, [organizationId, isSuperAdmin]);
}

