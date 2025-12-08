/**
 * Script to set organization plan in Firestore
 * 
 * Usage: npx tsx scripts/set-org-plan.ts <orgId> <plan>
 * Example: npx tsx scripts/set-org-plan.ts org-xxx ENTERPRISE
 */

import { getAdminDb } from "../src/lib/firebase-admin";

async function setOrganizationPlan(orgId: string, plan: "FREE" | "PRO" | "ENTERPRISE") {
  try {
    const db = getAdminDb();
    
    console.log(`\n🔧 Setting organization plan...`);
    console.log(`   Organization ID: ${orgId}`);
    console.log(`   Plan: ${plan}\n`);

    // Check if organization exists
    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      console.error(`❌ Organization not found: ${orgId}`);
      process.exit(1);
    }

    const orgData = orgDoc.data();
    console.log(`📋 Current organization data:`);
    console.log(`   Name: ${orgData?.name || "N/A"}`);
    console.log(`   Current Plan: ${orgData?.plan || "Not set"}\n`);

    // Update organization plan
    await db.collection("organizations").doc(orgId).update({
      plan: plan,
      updatedAt: new Date(),
    });

    console.log(`✅ Successfully updated organization plan to: ${plan}\n`);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error updating organization plan:", error.message);
    process.exit(1);
  }
}

// Get command line arguments
const orgId = process.argv[2];
const plan = process.argv[3] as "FREE" | "PRO" | "ENTERPRISE";

if (!orgId) {
  console.error("❌ Missing organization ID");
  console.error("Usage: npx tsx scripts/set-org-plan.ts <orgId> <plan>");
  console.error("Example: npx tsx scripts/set-org-plan.ts org-xxx ENTERPRISE");
  process.exit(1);
}

if (!plan || !["FREE", "PRO", "ENTERPRISE"].includes(plan)) {
  console.error("❌ Invalid plan. Must be FREE, PRO, or ENTERPRISE");
  process.exit(1);
}

setOrganizationPlan(orgId, plan);

