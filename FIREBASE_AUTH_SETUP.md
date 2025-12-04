# 🔐 Firebase Auth Custom Claims Setup

## Overview

To enable **Strict Multi-Tenancy** with Firestore Security Rules, we need to set custom claims on Firebase Auth tokens. These claims include:
- `orgId`: The user's organization ID
- `role`: User role (for super admin: `super_admin`)

## Setup Instructions

### Option 1: Cloud Function (Recommended)

Create a Cloud Function that sets custom claims when a user is created or their profile is updated:

```typescript
// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const setCustomClaims = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const userData = change.after.exists ? change.after.data() : null;

    if (!userData) {
      // User deleted, remove custom claims
      await admin.auth().setCustomUserClaims(userId, null);
      return;
    }

    const customClaims: any = {
      orgId: userData.organizationId || null,
    };

    // Check if user is super admin
    if (userData.email === "atomicworkos@gmail.com") {
      customClaims.role = "super_admin";
    }

    await admin.auth().setCustomUserClaims(userId, customClaims);
    console.log(`Set custom claims for user ${userId}:`, customClaims);
  });
```

### Option 2: Server-Side Script

Create a script to set custom claims for existing users:

```typescript
// scripts/set-custom-claims.ts
import { getAdminAuth, getAdminDb } from "../src/lib/firebase-admin";

const auth = getAdminAuth();
const db = getAdminDb();

async function setCustomClaimsForAllUsers() {
  const usersSnapshot = await db.collection("users").get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userData.uid || userDoc.id;
    
    const customClaims: any = {
      orgId: userData.organizationId || null,
    };

    if (userData.email === "atomicworkos@gmail.com") {
      customClaims.role = "super_admin";
    }

    try {
      await auth.setCustomUserClaims(userId, customClaims);
      console.log(`✓ Set claims for ${userData.email}`);
    } catch (error) {
      console.error(`✗ Failed for ${userData.email}:`, error);
    }
  }
}

setCustomClaimsForAllUsers();
```

### Option 3: Manual Setup (Development Only)

For development, you can manually set claims using Firebase Admin SDK:

```typescript
// In your seed script or a one-time script
import { getAdminAuth } from "../src/lib/firebase-admin";

const auth = getAdminAuth();

// Set claims for a specific user
await auth.setCustomUserClaims(userId, {
  orgId: "org_alpha",
  role: "admin", // or "super_admin" for backoffice
});
```

## Client-Side Token Refresh

After setting custom claims, users need to refresh their ID token:

```typescript
// In your sign-in flow or after profile update
import { auth } from "@/lib/firebase";

// Force token refresh to get new claims
await auth.currentUser?.getIdToken(true);
```

## Verification

To verify custom claims are set correctly:

1. **In Browser Console:**
```javascript
firebase.auth().currentUser.getIdTokenResult().then((tokenResult) => {
  console.log("Custom Claims:", tokenResult.claims);
});
```

2. **Expected Output:**
```json
{
  "orgId": "org_alpha",
  "role": "admin",
  "email": "user@example.com",
  ...
}
```

## Important Notes

1. **Token Refresh Required**: Custom claims are included in ID tokens. Users must refresh their token after claims are updated.

2. **Super Admin**: The email `atomicworkos@gmail.com` automatically gets `role: "super_admin"` claim.

3. **Security**: Custom claims are verified server-side by Firestore Security Rules. Never trust client-side claims alone.

4. **Performance**: Custom claims are cached in ID tokens (1 hour default). Updates may take up to 1 hour to propagate unless tokens are refreshed.

## Troubleshooting

### Claims Not Appearing
- Ensure user has refreshed their ID token: `await user.getIdToken(true)`
- Check Firebase Console > Authentication > Users > Custom Claims
- Verify the Cloud Function is deployed and running

### Rules Not Working
- Check Firestore Rules syntax: `firebase deploy --only firestore:rules`
- Verify custom claims in token: `user.getIdTokenResult().then(r => console.log(r.claims))`
- Check browser console for Firestore permission errors

### Super Admin Not Working
- Verify email matches exactly: `atomicworkos@gmail.com`
- Ensure custom claim `role: "super_admin"` is set
- Refresh ID token after setting claims

