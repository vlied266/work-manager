/**
 * Script to publish all procedures with ON_FILE_CREATED triggers
 * 
 * Usage:
 *   tsx scripts/publish-triggered-procedures.ts <orgId>
 * 
 * Example:
 *   tsx scripts/publish-triggered-procedures.ts org-zwB7DeYcuSNo2VQihTU7AbC2zw92
 */

import { getAdminDb } from "../src/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

async function publishTriggeredProcedures(orgId: string) {
  const db = getAdminDb();

  console.log(`🔍 Searching for procedures with triggers in org: ${orgId}`);

  // Find all procedures with ON_FILE_CREATED triggers
  const proceduresSnapshot = await db
    .collection("procedures")
    .where("organizationId", "==", orgId)
    .where("trigger.type", "==", "ON_FILE_CREATED")
    .get();

  if (proceduresSnapshot.empty) {
    console.log("❌ No procedures with ON_FILE_CREATED triggers found");
    return;
  }

  console.log(`📊 Found ${proceduresSnapshot.docs.length} procedure(s) with triggers`);

  const results: any[] = [];

  for (const doc of proceduresSnapshot.docs) {
    const data = doc.data();
    const procedureId = doc.id;
    const title = data.title || "Untitled";
    const isPublished = data.isPublished || false;
    const isActive = data.isActive || false;

    console.log(`\n📂 Processing: ${title}`);
    console.log(`   ID: ${procedureId}`);
    console.log(`   Current isPublished: ${isPublished}`);
    console.log(`   Current isActive: ${isActive}`);

    try {
      const updates: any = {
        isPublished: true,
        updatedAt: Timestamp.now(),
      };

      // Also activate if not already active
      if (!isActive) {
        updates.isActive = true;
        console.log(`   ✅ Will also activate (was inactive)`);
      }

      await db.collection("procedures").doc(procedureId).update(updates);

      results.push({
        id: procedureId,
        title,
        success: true,
        wasPublished: isPublished,
        wasActive: isActive,
        nowPublished: true,
        nowActive: !isActive ? true : isActive,
      });

      console.log(`   ✅ Published successfully`);
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        id: procedureId,
        title,
        success: false,
        error: error.message,
      });
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   Total: ${proceduresSnapshot.docs.length}`);
  console.log(`   Success: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);

  return results;
}

// Main execution
const orgId = process.argv[2];

if (!orgId) {
  console.error("❌ Error: Organization ID is required");
  console.log("Usage: tsx scripts/publish-triggered-procedures.ts <orgId>");
  process.exit(1);
}

publishTriggeredProcedures(orgId)
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

