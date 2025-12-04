/**
 * Firebase Admin SDK initialization
 * Used for server-side operations like creating custom tokens
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        console.log("✅ Firebase Admin initialized with service account key");
      } catch (parseError) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", parseError);
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY format. Please check your .env.local file.");
      }
    } else {
      // Try to use default credentials (if running on Firebase or with gcloud auth)
      try {
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "work-flow-manager-b0e0e",
        });
        console.log("✅ Firebase Admin initialized with default credentials");
      } catch (defaultError: any) {
        console.error("❌ Failed to initialize Firebase Admin with default credentials:", defaultError);
        throw new Error(
          "Firebase Admin SDK requires credentials. Please set FIREBASE_SERVICE_ACCOUNT_KEY in your .env.local file. " +
          "Get your service account key from Firebase Console > Project Settings > Service Accounts > Generate New Private Key"
        );
      }
    }
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }

  return adminApp;
}

export function getAdminAuth(): Auth {
  if (adminAuth) {
    return adminAuth;
  }
  adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}

/**
 * Verify that the current user is the super admin
 */
export async function verifySuperAdmin(userEmail: string | null | undefined): Promise<boolean> {
  const OWNER_EMAIL = "atomicworkos@gmail.com";
  return userEmail === OWNER_EMAIL;
}

