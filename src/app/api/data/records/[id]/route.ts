import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// GET - Get a single record
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const doc = await db.collection("records").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      collectionId: data.collectionId,
      data: data.data || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  } catch (error: any) {
    console.error("Error fetching record:", error);
    return NextResponse.json(
      { error: "Failed to fetch record", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a record
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { data } = body;

    const db = getAdminDb();
    const docRef = db.collection("records").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    if (data === undefined || typeof data !== "object") {
      return NextResponse.json(
        { error: "data is required and must be an object" },
        { status: 400 }
      );
    }

    await docRef.update({
      data,
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data()!;

    return NextResponse.json({
      id: updatedDoc.id,
      collectionId: updatedData.collectionId,
      data: updatedData.data || {},
      createdAt: updatedData.createdAt?.toDate() || new Date(),
      updatedAt: updatedData.updatedAt?.toDate() || new Date(),
    });
  } catch (error: any) {
    console.error("Error updating record:", error);
    return NextResponse.json(
      { error: "Failed to update record", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const docRef = db.collection("records").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { error: "Failed to delete record", details: error.message },
      { status: 500 }
    );
  }
}

