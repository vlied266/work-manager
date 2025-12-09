import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface Record {
  id: string;
  collectionId: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// GET - List all records for a collection
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json(
        { error: "collectionId is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const recordsSnapshot = await db
      .collection("records")
      .where("collectionId", "==", collectionId)
      .get();
    
    // Sort client-side to avoid Firestore index requirement
    const recordsArray = recordsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        collectionId: data.collectionId,
        data: data.data || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    
    // Sort by createdAt descending
    recordsArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ records: recordsArray });
  } catch (error: any) {
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collectionId, data } = body;

    if (!collectionId || !data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Missing required fields: collectionId, data" },
        { status: 400 }
      );
    }

    // Verify collection exists
    const db = getAdminDb();
    const collectionDoc = await db.collection("collections").doc(collectionId).get();

    if (!collectionDoc.exists) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const now = Timestamp.now();

    const recordData = {
      collectionId,
      data,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("records").add(recordData);

    return NextResponse.json({
      id: docRef.id,
      ...recordData,
      createdAt: recordData.createdAt.toDate(),
      updatedAt: recordData.updatedAt.toDate(),
    });
  } catch (error: any) {
    console.error("Error creating record:", error);
    return NextResponse.json(
      { error: "Failed to create record", details: error.message },
      { status: 500 }
    );
  }
}

