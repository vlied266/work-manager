# 🛡️ STRICT MULTI-TENANCY IMPLEMENTATION

## Overview

This document describes the implementation of **Strict Multi-Tenancy** with complete data isolation between organizations.

## Architecture Components

### 1. Firestore Security Rules (`firestore.rules`)

**Location:** `firestore.rules`

**Features:**
- Organization-scoped access control
- Super admin bypass for `atomicworkos@gmail.com`
- Helper functions for common checks:
  - `isOrgMember(orgId)`: Checks if user belongs to organization
  - `isSuperAdmin()`: Checks if user is super admin
  - `belongsToUserOrg()`: Checks if document belongs to user's org
  - `willBelongToUserOrg()`: Validates new documents will belong to user's org

**Collections Protected:**
- `users` - Users can only access their own org's users
- `organizations` - Users can only read their own organization
- `active_runs` - Runs are scoped to organization
- `procedures` - Procedures are scoped to organization
- `process_groups` - Process groups are scoped to organization
- `teams` - Teams are scoped to organization
- `global_templates` - Read-only for all users, write-only for super admin
- `system/*` - Super admin only
- `system_configs/*` - Super admin only

### 2. Organization Context (`src/contexts/OrganizationContext.tsx`)

**Purpose:** Provides organization context to all dashboard components

**Features:**
- Real-time user profile listening
- Automatic organization ID extraction
- Super admin detection
- Loading states

**Usage:**
```tsx
import { useOrganization } from "@/contexts/OrganizationContext";

function MyComponent() {
  const { organizationId, userProfile, isSuperAdmin, loading } = useOrganization();
  // ...
}
```

### 3. Organization Data Hooks (`src/hooks/useOrgData.ts`)

**Purpose:** Automatically filter Firestore queries by organization

**Hooks:**
- `useOrgQuery(collectionName, constraints?)` - Returns query automatically filtered by orgId
- `useOrgCollection(collectionName)` - Returns collection reference
- `useOrgId()` - Returns current organization ID
- `useIsSuperAdmin()` - Returns super admin status
- `useOrgDataCreator()` - Helper for creating org-scoped documents

**Usage:**
```tsx
import { useOrgQuery } from "@/hooks/useOrgData";

function MyComponent() {
  // Automatically filters by organizationId
  const runsQuery = useOrgQuery("active_runs", [
    where("status", "==", "IN_PROGRESS")
  ]);
  
  // Super admin sees everything, regular users see only their org
}
```

### 4. Refactored Components

**Updated Pages:**
- ✅ `src/app/(dashboard)/dashboard/page.tsx` - Uses `useOrgQuery`
- ✅ `src/app/(dashboard)/inbox/page.tsx` - Uses `useOrgQuery` + `useOrganization`
- ✅ `src/app/(dashboard)/monitor/page.tsx` - Uses `useOrgQuery`
- ✅ `src/app/(dashboard)/history/page.tsx` - Uses `useOrgQuery`
- ✅ `src/app/(dashboard)/analytics/page.tsx` - Uses `useOrgQuery`
- ✅ `src/app/(dashboard)/settings/page.tsx` - Uses `useOrgQuery` + `useOrgDataCreator`

**Layout:**
- ✅ `src/app/(dashboard)/layout.tsx` - Wrapped with `OrganizationProvider`

## How It Works

### For Regular Users:

1. **User logs in** → Firebase Auth token includes `orgId` custom claim
2. **Component renders** → `useOrgQuery` automatically adds `.where("organizationId", "==", orgId)`
3. **Firestore Rules** → Verify `request.auth.token.orgId == resource.data.organizationId`
4. **Result** → User only sees their organization's data

### For Super Admin:

1. **Super admin logs in** → Token includes `role: "super_admin"` claim
2. **Component renders** → `useOrgQuery` returns query WITHOUT org filter
3. **Firestore Rules** → `isSuperAdmin()` returns true, bypasses org checks
4. **Result** → Super admin sees all organizations' data

## Setup Requirements

### 1. Firebase Auth Custom Claims

**Required Claims:**
- `orgId`: User's organization ID (string)
- `role`: User role (`"super_admin"` for backoffice, or regular role)

**Setup:** See `FIREBASE_AUTH_SETUP.md` for detailed instructions.

**Quick Setup (Development):**
```typescript
import { getAdminAuth } from "@/lib/firebase-admin";

const auth = getAdminAuth();
await auth.setCustomUserClaims(userId, {
  orgId: "org_alpha",
  role: "admin",
});
```

### 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Token Refresh

After setting custom claims, users must refresh their ID token:

```typescript
import { auth } from "@/lib/firebase";
await auth.currentUser?.getIdToken(true);
```

## Testing Multi-Tenancy

### Test Scenario 1: Regular User Isolation

1. Login as `admin@alpha.workos.test` (org_alpha)
2. Navigate to Dashboard
3. Verify: Only sees runs from `org_alpha`
4. Login as `admin@beta.workos.test` (org_beta)
5. Navigate to Dashboard
6. Verify: Only sees runs from `org_beta` (different data)

### Test Scenario 2: Super Admin Access

1. Login as `atomicworkos@gmail.com`
2. Navigate to `/backoffice`
3. Verify: Sees all organizations
4. Navigate to Dashboard
5. Verify: Sees all runs from all organizations

### Test Scenario 3: Firestore Rules Enforcement

1. Try to access a document from another organization directly:
   ```javascript
   // Should fail
   await getDoc(doc(db, "active_runs", "run-from-other-org"));
   ```
2. Verify: Firestore rules reject the request

## Security Checklist

- ✅ Firestore Rules enforce organization boundaries
- ✅ Client-side hooks automatically filter by organization
- ✅ Super admin has explicit bypass in rules
- ✅ Custom claims required for proper access
- ✅ Token refresh mechanism documented
- ✅ All dashboard pages use organization-scoped queries
- ✅ Document creation enforces organizationId

## Migration Notes

**Before:** Components manually added `.where("organizationId", "==", orgId)`

**After:** Components use `useOrgQuery()` which automatically adds the filter

**Breaking Changes:** None - existing queries continue to work, but should be migrated to use hooks for consistency.

## Future Enhancements

1. **Team-Level Isolation:** Add team-scoped queries for team members
2. **Audit Logging:** Log all cross-organization access attempts
3. **Organization Switching:** Allow super admin to switch organization context
4. **Data Export:** Ensure exports respect organization boundaries

## Troubleshooting

### Issue: Users see data from other organizations

**Solution:**
1. Verify custom claims are set: `user.getIdTokenResult().then(r => console.log(r.claims))`
2. Check Firestore Rules are deployed: `firebase deploy --only firestore:rules`
3. Verify component uses `useOrgQuery` hook
4. Check browser console for Firestore permission errors

### Issue: Super admin can't see all data

**Solution:**
1. Verify email is exactly `atomicworkos@gmail.com`
2. Check custom claim `role: "super_admin"` is set
3. Refresh ID token: `await user.getIdToken(true)`
4. Verify `useOrgQuery` returns unfiltered query for super admin

### Issue: Firestore Rules errors

**Solution:**
1. Check rules syntax: `firebase deploy --only firestore:rules --dry-run`
2. Verify custom claims in token
3. Check browser console for specific error messages
4. Review Firestore Rules logs in Firebase Console

