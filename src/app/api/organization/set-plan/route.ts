import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Set Organization Plan API
 * 
 * Updates the plan field for an organization in Firestore
 * 
 * Usage: POST /api/organization/set-plan
 * Body: { orgId: string, plan: "FREE" | "PRO" | "ENTERPRISE" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, plan } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing required parameter: orgId" },
        { status: 400 }
      );
    }

    if (!plan || !["FREE", "PRO", "ENTERPRISE"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be FREE, PRO, or ENTERPRISE" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Verify organization exists
    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update organization plan
    await db.collection("organizations").doc(orgId).update({
      plan: plan,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Organization plan updated to ${plan}`,
      orgId,
      plan,
    });
  } catch (error: any) {
    console.error("Error updating organization plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update organization plan" },
      { status: 500 }
    );
  }
}

