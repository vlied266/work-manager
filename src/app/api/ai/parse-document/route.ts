import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";

/**
 * AI Document Parser API
 * Extracts structured data from PDF, Excel, or Image files using AI
 * 
 * Supports:
 * - PDF: Uses text extraction + AI parsing
 * - Excel: Converts to JSON + AI parsing
 * - Image: Uses GPT-4o Vision API
 */

interface ParseDocumentRequest {
  fileUrl: string; // URL or path to the file
  fieldsToExtract: string[]; // List of field names to extract (e.g., ["invoiceDate", "amount", "vendor"])
  fileType?: "pdf" | "excel" | "image"; // Optional file type hint
  orgId?: string; // Organization ID for plan limits
  fileId?: string; // Google Drive file ID if available
}

// Schema for extracted data
const ExtractedDataSchema = z.record(z.string(), z.any());

export async function POST(req: NextRequest) {
  try {
    const body: ParseDocumentRequest = await req.json();
    const { fileUrl, fieldsToExtract, fileType, orgId, fileId } = body;

    if (!fileUrl || !fieldsToExtract || fieldsToExtract.length === 0) {
      return NextResponse.json(
        { error: "fileUrl and fieldsToExtract are required" },
        { status: 400 }
      );
    }

    // Check AI plan limit (if orgId provided)
    if (orgId) {
      try {
        const { getAdminDb } = await import("@/lib/firebase-admin");
        const { Timestamp } = await import("firebase-admin/firestore");
        const db = getAdminDb();
        const orgDoc = await db.collection("organizations").doc(orgId).get();
        
        if (orgDoc.exists) {
          const orgData = orgDoc.data();
          const plan = (orgData?.plan || "FREE").toUpperCase() as "FREE" | "PRO" | "ENTERPRISE";
          
          // FREE plan has no AI access
          if (plan === "FREE") {
            return NextResponse.json(
              {
                error: "PLAN_LIMIT",
                message: "AI Document Parser is not available on the Free plan. Please upgrade to Pro or Enterprise.",
                resource: "aiGenerations",
              },
              { status: 403 }
            );
          }

          // PRO plan: Check monthly AI generation limit (1000 per month)
          if (plan === "PRO") {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

            const monthlyAiGenerationsQuery = await db
              .collection("ai_usage_logs")
              .where("organizationId", "==", orgId)
              .where("timestamp", ">=", startOfMonthTimestamp)
              .get();

            const monthlyAiCount = monthlyAiGenerationsQuery.size;

            if (monthlyAiCount >= 1000) {
              return NextResponse.json(
                {
                  error: "LIMIT_REACHED",
                  message: "You have reached the Pro plan limit of 1000 AI generations per month. Please upgrade to Enterprise for unlimited AI.",
                  limit: 1000,
                  currentUsage: monthlyAiCount,
                  resource: "aiGenerations",
                },
                { status: 403 }
              );
            }
          }

          // Log AI usage
          await db.collection("ai_usage_logs").add({
            organizationId: orgId,
            timestamp: Timestamp.now(),
            type: "document_parse",
            resource: "aiGenerations",
          });
        }
      } catch (orgError) {
        console.error("Error checking organization plan:", orgError);
        // Continue execution if org check fails (fail open for now)
      }
    }

    // Detect file type from URL if not provided
    const detectedFileType = fileType || detectFileType(fileUrl);
    
    let extractedText = "";
    let extractedData: any = null;

    // Step 1: Extract content based on file type
    switch (detectedFileType) {
      case "pdf":
        extractedText = await extractTextFromPDF(fileUrl, fileId);
        break;
      case "excel":
        extractedData = await extractDataFromExcel(fileUrl);
        // For Excel, we'll use the structured data directly
        break;
      case "image":
        // For images, we'll use Vision API directly
        extractedText = await extractTextFromImage(fileUrl);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported file type: ${detectedFileType}. Supported types: pdf, excel, image` },
          { status: 400 }
        );
    }

    // Step 2: Use AI to extract structured data
    let result: Record<string, any>;

    if (detectedFileType === "excel" && extractedData) {
      // For Excel, we already have structured data, but we'll use AI to map it to requested fields
      result = await extractFieldsWithAI(
        JSON.stringify(extractedData),
        fieldsToExtract,
        "excel"
      );
    } else {
      // For PDF and Image, use AI to extract fields from text
      result = await extractFieldsWithAI(
        extractedText,
        fieldsToExtract,
        detectedFileType
      );
    }

    return NextResponse.json({
      success: true,
      extractedData: result,
      fileType: detectedFileType,
      fieldsExtracted: fieldsToExtract,
    });
  } catch (error: any) {
    console.error("Error parsing document:", error);
    return NextResponse.json(
      {
        error: "Failed to parse document",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Detect file type from URL or file extension
 */
function detectFileType(fileUrl: string): "pdf" | "excel" | "image" {
  const urlLower = fileUrl.toLowerCase();
  
  if (urlLower.includes(".pdf") || urlLower.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    urlLower.includes(".xlsx") ||
    urlLower.includes(".xls") ||
    urlLower.endsWith(".xlsx") ||
    urlLower.endsWith(".xls")
  ) {
    return "excel";
  }
  if (
    urlLower.includes(".jpg") ||
    urlLower.includes(".jpeg") ||
    urlLower.includes(".png") ||
    urlLower.includes(".gif") ||
    urlLower.endsWith(".jpg") ||
    urlLower.endsWith(".jpeg") ||
    urlLower.endsWith(".png") ||
    urlLower.endsWith(".gif")
  ) {
    return "image";
  }
  
  // Default to PDF if uncertain
  return "pdf";
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(fileUrl: string, fileId?: string): Promise<string> {
  try {
    let buffer: Buffer;
    
    // If we have a Google Drive file ID, use Google Drive API for direct download
    if (fileId && fileUrl.includes('drive.google.com')) {
      try {
        console.log(`[PDF Parser] Using Google Drive API to download file: ${fileId}`);
        const { google } = await import("googleapis");
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'https://theatomicwork.com'
        );
        
        if (process.env.GOOGLE_REFRESH_TOKEN) {
          oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
          });
          
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          
          // Get file as stream
          const fileStream = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
          );
          
          // Convert stream to buffer
          const chunks: Buffer[] = [];
          for await (const chunk of fileStream.data) {
            chunks.push(Buffer.from(chunk));
          }
          buffer = Buffer.concat(chunks);
          
          if (buffer.length === 0) {
            throw new Error(`PDF file is empty. File ID: ${fileId}`);
          }
          
          console.log(`[PDF Parser] File size: ${buffer.length} bytes (from Google Drive API)`);
        } else {
          throw new Error("GOOGLE_REFRESH_TOKEN not configured");
        }
      } catch (driveError: any) {
        console.warn(`[PDF Parser] Google Drive API failed: ${driveError.message}. Falling back to direct URL fetch.`);
        // Fallback to direct fetch
        const response = await fetch(fileUrl);
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error(`[PDF Parser] Failed to fetch PDF: ${response.status} ${response.statusText}`, errorText.substring(0, 200));
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}. URL: ${fileUrl}`);
        }
        
        const contentType = response.headers.get("content-type");
        console.log(`[PDF Parser] Content-Type: ${contentType}`);
        
        // Check if response is HTML (Google Drive download page)
        if (contentType?.includes('text/html')) {
          throw new Error(`Received HTML instead of PDF. This usually means the file requires authentication. File ID: ${fileId || 'unknown'}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        
        if (buffer.length === 0) {
          throw new Error(`PDF file is empty. URL: ${fileUrl}`);
        }
        
        console.log(`[PDF Parser] File size: ${buffer.length} bytes`);
      }
    } else {
      // Direct fetch for non-Google Drive files
      console.log(`[PDF Parser] Attempting to fetch PDF from: ${fileUrl}`);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`[PDF Parser] Failed to fetch PDF: ${response.status} ${response.statusText}`, errorText.substring(0, 200));
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}. URL: ${fileUrl}`);
      }
      
      const contentType = response.headers.get("content-type");
      console.log(`[PDF Parser] Content-Type: ${contentType}`);
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      
      if (buffer.length === 0) {
        throw new Error(`PDF file is empty. URL: ${fileUrl}`);
      }
      
      console.log(`[PDF Parser] File size: ${buffer.length} bytes`);
    }

    // Try to use pdf-parse if available, otherwise use a fallback
    try {
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      const extractedText = pdfData.text || "";
      console.log(`[PDF Parser] Extracted ${extractedText.length} characters from PDF`);
      
      if (extractedText.length === 0) {
        console.warn("[PDF Parser] Warning: PDF appears to be empty or image-based. Trying Vision API fallback...");
        // For image-based PDFs, we need to convert to image first
        // For now, throw an error to indicate the PDF is not parseable
        throw new Error("PDF appears to be image-based or empty. Cannot extract text using pdf-parse.");
      }
      
      return extractedText;
    } catch (pdfParseError: any) {
      // Fallback: Use OpenAI Vision API to extract text from PDF
      // Note: This is a workaround if pdf-parse is not installed or PDF is image-based
      console.warn(`[PDF Parser] pdf-parse error: ${pdfParseError.message}. Using Vision API fallback...`);
      // Note: Vision API requires image format, so we can't use it directly for PDF
      // Instead, we should throw an error or use a different approach
      throw new Error(`Failed to parse PDF: ${pdfParseError.message}. The PDF may be image-based or corrupted.`);
    }
  } catch (error: any) {
    console.error(`[PDF Parser] Error extracting text from PDF:`, error);
    throw new Error(`Failed to extract text from PDF: ${error.message}. URL: ${fileUrl}`);
  }
}

/**
 * Extract data from Excel file
 */
async function extractDataFromExcel(fileUrl: string): Promise<any[]> {
  try {
    // Fetch the Excel file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to use xlsx if available
    try {
      const XLSX = require("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData;
    } catch (xlsxError) {
      // Fallback: Return empty array and let AI handle it
      console.warn("xlsx not available, returning empty data");
      return [];
    }
  } catch (error: any) {
    throw new Error(`Failed to extract data from Excel: ${error.message}`);
  }
}

/**
 * Extract text from Image using GPT-4o Vision API
 */
async function extractTextFromImage(fileUrl: string): Promise<string> {
  try {
    console.log(`[Image Parser] Extracting text from image: ${fileUrl}`);
    
    // Use OpenAI Vision API to extract text from image
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text content from this image. Return the text exactly as it appears, preserving structure and formatting where possible.",
            },
            {
              type: "image",
              image: fileUrl,
            },
          ],
        },
      ],
      maxTokens: 4000,
    });

    console.log(`[Image Parser] Extracted ${text.length} characters from image`);
    return text || "";
  } catch (error: any) {
    console.error(`[Image Parser] Error extracting text from image:`, error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

/**
 * Use AI to extract specific fields from extracted content
 */
async function extractFieldsWithAI(
  content: string,
  fieldsToExtract: string[],
  fileType: string
): Promise<Record<string, any>> {
  console.log(`[AI Extractor] Extracting ${fieldsToExtract.length} fields from ${fileType} content (${content.length} chars)`);
  
  if (!content || content.trim().length === 0) {
    console.warn("[AI Extractor] Warning: Content is empty. AI may not be able to extract fields.");
    // Return null values for all fields
    const emptyResult: Record<string, any> = {};
    fieldsToExtract.forEach(field => {
      emptyResult[field] = null;
    });
    return emptyResult;
  }
  
  const prompt = `You are a data extraction specialist. Extract the following fields from the provided ${fileType} content and return them as a JSON object.

Fields to extract:
${fieldsToExtract.map((field) => `- ${field}`).join("\n")}

Content:
${content.substring(0, 8000)}${content.length > 8000 ? "\n... (truncated)" : ""}

Return a JSON object with the extracted fields. If a field is not found, use null as the value. Use appropriate data types (strings, numbers, dates, booleans) based on the content.`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ExtractedDataSchema,
      prompt,
    });

    console.log(`[AI Extractor] Successfully extracted fields:`, Object.keys(object));
    return object;
  } catch (error: any) {
    console.error(`[AI Extractor] Error extracting fields with AI:`, error);
    throw new Error(`Failed to extract fields with AI: ${error.message}`);
  }
}

