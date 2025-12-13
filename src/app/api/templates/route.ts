import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface DocumentTemplate {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET - List all templates for an organization
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
    const templatesSnapshot = await db
      .collection("document_templates")
      .where("orgId", "==", orgId)
      .get();

    const templates = templatesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    // Sort by createdAt descending
    templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload a new template
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const orgId = formData.get("orgId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only .docx files are supported" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "templates");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = join(uploadsDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // File URL (relative to public folder)
    const fileUrl = `/uploads/templates/${fileName}`;

    // Save template metadata to Firestore
    const db = getAdminDb();
    const now = Timestamp.now();

    const templateData = {
      name: name.trim(),
      fileName: file.name,
      fileUrl,
      orgId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("document_templates").add(templateData);

    return NextResponse.json({
      id: docRef.id,
      ...templateData,
      createdAt: templateData.createdAt.toDate(),
      updatedAt: templateData.updatedAt.toDate(),
    });
  } catch (error: any) {
    console.error("Error uploading template:", error);
    return NextResponse.json(
      { error: "Failed to upload template", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("id");
    const orgId = searchParams.get("orgId");

    if (!templateId || !orgId) {
      return NextResponse.json(
        { error: "Template ID and orgId are required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const templateDoc = await db.collection("document_templates").doc(templateId).get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const templateData = templateDoc.data();
    if (templateData?.orgId !== orgId) {
      return NextResponse.json(
        { error: "Template does not belong to this organization" },
        { status: 403 }
      );
    }

    // Delete file from disk (optional - can be done later via cleanup job)
    // For now, just delete the database record

    await db.collection("document_templates").doc(templateId).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template", details: error.message },
      { status: 500 }
    );
  }
}

