import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { resolveConfig } from "@/lib/engine/resolver";

export async function POST(req: NextRequest) {
  try {
    const { step, runLogs, procedureSteps, orgId } = await req.json();

    if (!step || !step.config || !step.config.collectionName) {
      return NextResponse.json(
        { error: "Missing required fields: step.config.collectionName" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const collectionName = step.config.collectionName;

    // Find the collection by name
    const collectionsSnapshot = await db
      .collection("collections")
      .where("orgId", "==", orgId)
      .where("name", "==", collectionName)
      .get();

    if (collectionsSnapshot.empty) {
      return NextResponse.json(
        { error: `Collection "${collectionName}" not found` },
        { status: 404 }
      );
    }

    const collectionDoc = collectionsSnapshot.docs[0];
    const collectionData = collectionDoc.data();
    const collectionId = collectionDoc.id;

    // Resolve variables in the data object
    const rawData = step.config.data || {};
    const resolvedConfig = resolveConfig(rawData, runLogs || [], procedureSteps || []);
    const resolvedData = resolvedConfig.resolved || rawData;

    // Validate that resolved data matches collection fields (optional, but helpful)
    const collectionFields = collectionData.fields || [];
    const fieldKeys = collectionFields.map((f: any) => f.key);

    // Create the record
    const now = Timestamp.now();
    const recordData = {
      collectionId,
      data: resolvedData,
      createdAt: now,
      updatedAt: now,
    };

    const recordRef = await db.collection("records").add(recordData);

    return NextResponse.json({
      success: true,
      recordId: recordRef.id,
      collectionId,
      collectionName,
      data: resolvedData,
      createdAt: recordData.createdAt.toDate(),
    });
  } catch (error: any) {
    console.error("Error executing DB_INSERT:", error);
    return NextResponse.json(
      { error: "Failed to insert record", details: error.message },
      { status: 500 }
    );
  }
}

