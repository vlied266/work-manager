import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface CollectionField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  options?: string[]; // For select type
}

export interface Collection {
  id: string;
  orgId: string;
  name: string;
  fields: CollectionField[];
  createdAt: Date;
  updatedAt: Date;
}

// GET - List all collections for an organization
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const collectionsSnapshot = await db
      .collection("collections")
      .where("orgId", "==", orgId)
      .get();

    // Sort client-side to avoid Firestore index requirement
    const collectionsArray = collectionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    
    // Sort by createdAt descending
    collectionsArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ collections: collectionsArray });
  } catch (error: any) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new collection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, name, fields } = body;

    if (!orgId || !name || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, name, fields" },
        { status: 400 }
      );
    }

    // Validate fields
    for (const field of fields) {
      if (!field.key || !field.label || !field.type) {
        return NextResponse.json(
          { error: "Each field must have key, label, and type" },
          { status: 400 }
        );
      }
      if (!["text", "number", "date", "boolean", "select"].includes(field.type)) {
        return NextResponse.json(
          { error: `Invalid field type: ${field.type}` },
          { status: 400 }
        );
      }
    }

    const db = getAdminDb();
    const now = Timestamp.now();

    const collectionData = {
      orgId,
      name,
      fields,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("collections").add(collectionData);

    return NextResponse.json({
      id: docRef.id,
      ...collectionData,
      createdAt: collectionData.createdAt.toDate(),
      updatedAt: collectionData.updatedAt.toDate(),
    });
  } catch (error: any) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection", details: error.message },
      { status: 500 }
    );
  }
}

