import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Admin API: Publish all procedures with ON_FILE_CREATED triggers
 * 
 * This endpoint publishes and activates all procedures with file watcher triggers
 * for a given organization.
 * 
 * Usage:
 *   POST /api/admin/publish-triggers
 *   Body: { orgId: "org-xxxxx" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required in request body" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    console.log(`🔍 Searching for procedures with triggers in org: ${orgId}`);

    // Find all procedures with ON_FILE_CREATED triggers
    const proceduresSnapshot = await db
      .collection("procedures")
      .where("organizationId", "==", orgId)
      .where("trigger.type", "==", "ON_FILE_CREATED")
      .get();

    if (proceduresSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: "No procedures with ON_FILE_CREATED triggers found",
        published: 0,
      });
    }

    console.log(`📊 Found ${proceduresSnapshot.docs.length} procedure(s) with triggers`);

    const results: any[] = [];

    for (const doc of proceduresSnapshot.docs) {
      const data = doc.data();
      const procedureId = doc.id;
      const title = data.title || "Untitled";
      const isPublished = data.isPublished || false;
      const isActive = data.isActive || false;

      try {
        const updates: any = {
          isPublished: true,
          updatedAt: Timestamp.now(),
        };

        // Also activate if not already active
        if (!isActive) {
          updates.isActive = true;
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
      } catch (error: any) {
        console.error(`Error publishing procedure ${procedureId}:`, error);
        results.push({
          id: procedureId,
          title,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Published ${successCount} procedure(s)`,
      total: proceduresSnapshot.docs.length,
      published: successCount,
      failed: failedCount,
      results,
    });
  } catch (error: any) {
    console.error("Error in publish-triggers endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to publish procedures",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

