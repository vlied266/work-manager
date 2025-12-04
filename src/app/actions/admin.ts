"use server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Impersonate a user by creating a custom token
 */
export async function impersonateUser(targetUserId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Note: In a real implementation, verify the current user is super admin server-side
    // For now, we'll do client-side verification
    
    let adminAuth;
    try {
      adminAuth = getAdminAuth();
    } catch (initError: any) {
      console.error("Failed to initialize Admin Auth:", initError);
      return {
        success: false,
        error: initError.message || "Failed to initialize Firebase Admin. Please check your FIREBASE_SERVICE_ACCOUNT_KEY in .env.local",
      };
    }
    
    // Create custom token for the target user
    const customToken = await adminAuth.createCustomToken(targetUserId);
    
    return {
      success: true,
      token: customToken,
    };
  } catch (error: any) {
    console.error("Error creating custom token:", error);
    
    // Provide helpful error messages
    let errorMessage = error.message || "Failed to create impersonation token";
    
    if (error.message?.includes("Could not load the default credentials")) {
      errorMessage = "Firebase Admin SDK requires credentials. Please set FIREBASE_SERVICE_ACCOUNT_KEY in your .env.local file. " +
        "Get your service account key from Firebase Console > Project Settings > Service Accounts > Generate New Private Key";
    } else if (error.message?.includes("Invalid FIREBASE_SERVICE_ACCOUNT_KEY")) {
      errorMessage = "Invalid service account key format. Please check your .env.local file.";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update organization status (active/suspended)
 */
export async function updateOrgStatus(
  orgId: string,
  status: "active" | "canceled" | "past_due"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: In production, verify super admin server-side
    const adminDb = getAdminDb();
    
    await adminDb.collection("organizations").doc(orgId).update({
      subscriptionStatus: status,
      updatedAt: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating org status:", error);
    return {
      success: false,
      error: error.message || "Failed to update organization status",
    };
  }
}

/**
 * Update organization plan
 */
export async function updateOrgPlan(
  orgId: string,
  plan: "FREE" | "PRO" | "ENTERPRISE"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: In production, verify super admin server-side
    const adminDb = getAdminDb();
    
    // Import getPlanLimits to update limits
    const { getPlanLimits } = await import("@/lib/billing/limits");
    const limits = getPlanLimits(plan);
    
    await adminDb.collection("organizations").doc(orgId).update({
      plan: plan,
      limits: limits,
      updatedAt: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating org plan:", error);
    return {
      success: false,
      error: error.message || "Failed to update organization plan",
    };
  }
}

