import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as Handlebars from "handlebars";
import * as pdf from "html-pdf-node";
import * as fs from "fs";
import * as path from "path";

interface GenerateDocumentRequest {
  templateId: string;
  data: Record<string, any>;
  orgId?: string;
}

/**
 * Document Generator API
 * 
 * Generates PDF documents from HTML templates stored in Firestore.
 * Uses Handlebars for template compilation and html-pdf-node for PDF generation.
 */
export async function POST(req: NextRequest) {
  try {
    const body: GenerateDocumentRequest = await req.json();
    const { templateId, data, orgId } = body;

    if (!templateId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: templateId, data" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // 1. Fetch template from Firestore
    const templateDoc = await db.collection("templates").doc(templateId).get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const templateData = templateDoc.data();
    const htmlContent = templateData?.htmlContent;

    if (!htmlContent) {
      return NextResponse.json(
        { error: "Template has no htmlContent field" },
        { status: 400 }
      );
    }

    // Verify organization match (if orgId provided)
    if (orgId && templateData?.organizationId && templateData.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Template does not belong to this organization" },
        { status: 403 }
      );
    }

    // 2. Compile HTML template with Handlebars
    const template = Handlebars.compile(htmlContent);
    const compiledHtml = template(data);

    // 3. Generate PDF from compiled HTML
    const options = {
      format: "A4",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      type: "pdf",
      quality: "75",
      renderDelay: 1000, // Wait for any dynamic content to load
    };

    const file = { content: compiledHtml };
    const pdfBuffer = await pdf.generatePdf(file, options);

    // 4. Save PDF to public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `document_${templateId}_${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Write PDF buffer to file
    fs.writeFileSync(filePath, pdfBuffer);

    // 5. Generate public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const fileUrl = `${baseUrl}/uploads/${fileName}`;

    // 6. Optionally log the generation (for analytics)
    if (orgId) {
      try {
        await db.collection("document_generations").add({
          organizationId: orgId,
          templateId,
          fileName,
          fileUrl,
          generatedAt: Timestamp.now(),
          dataKeys: Object.keys(data),
        });
      } catch (logError) {
        console.error("Error logging document generation:", logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      message: "Document generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      {
        error: "Failed to generate document",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

