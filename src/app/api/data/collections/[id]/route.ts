import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { CollectionField } from "../route";

// GET - Get a single collection
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const doc = await db.collection("collections").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  } catch (error: any) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a collection
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, fields } = body;

    const db = getAdminDb();
    const docRef = db.collection("collections").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (fields !== undefined) {
      if (!Array.isArray(fields)) {
        return NextResponse.json(
          { error: "fields must be an array" },
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
      }
      updateData.fields = fields;
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const data = updatedDoc.data()!;

    return NextResponse.json({
      id: updatedDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  } catch (error: any) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a collection
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const docRef = db.collection("collections").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Delete all records in this collection
    const recordsSnapshot = await db
      .collection("records")
      .where("collectionId", "==", id)
      .get();

    const batch = db.batch();
    recordsSnapshot.docs.forEach((recordDoc) => {
      batch.delete(recordDoc.ref);
    });
    await batch.commit();

    // Delete the collection
    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection", details: error.message },
      { status: 500 }
    );
  }
}

