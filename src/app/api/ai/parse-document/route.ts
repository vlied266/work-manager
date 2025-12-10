/* eslint-disable */
// --- POLYFILLS FOR SERVER-SIDE PDF PARSING ---
// pdf-parse (via pdfjs-dist) relies on browser-native APIs that don't exist in Node.js
// These polyfills mock the required browser APIs to prevent crashes

// 1. Fix "r is not a function" (Missing Promise.withResolvers)
// This must be defined on Promise prototype, not just as a static method
if (typeof Promise.withResolvers === 'undefined') {
  // @ts-ignore
  Promise.withResolvers = function () {
    let resolve: any, reject: any;
    const promise = new Promise((res, rej) => { 
      resolve = res; 
      reject = rej; 
    });
    return { promise, resolve, reject };
  };
}

// Also ensure it's available on the global Promise object
if (typeof global !== 'undefined' && typeof global.Promise !== 'undefined') {
  if (typeof global.Promise.withResolvers === 'undefined') {
    // @ts-ignore
    global.Promise.withResolvers = Promise.withResolvers;
  }
}

// 2. Fix Canvas/DOM Dependencies
if (typeof global !== 'undefined' && !global.DOMMatrix) {
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix {
    m11: number;
    m12: number;
    m21: number;
    m22: number;
    m41: number;
    m42: number;
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;

    constructor() {
      this.m11 = 1;
      this.m12 = 0;
      this.m21 = 0;
      this.m22 = 1;
      this.m41 = 0;
      this.m42 = 0;
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  };
}

if (typeof global !== 'undefined' && !global.ImageData) {
  // @ts-ignore
  global.ImageData = class ImageData {
    width?: number;
    height?: number;
    data: Uint8ClampedArray;

    constructor(width?: number, height?: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray((width || 0) * (height || 0) * 4);
    }
  };
}

if (typeof global !== 'undefined' && !global.Path2D) {
  // @ts-ignore
  global.Path2D = class Path2D {
    constructor() {
      // Minimal implementation - pdf-parse just needs the class to exist
    }
  };
}

if (typeof global !== 'undefined' && !global.CanvasPattern) {
  // @ts-ignore
  global.CanvasPattern = class CanvasPattern {
    constructor() {
      // Minimal implementation
    }
  };
}

// 3. Mock Canvas to prevent @napi-rs/canvas requirement
if (typeof global !== 'undefined' && !global.HTMLCanvasElement) {
  // @ts-ignore
  global.HTMLCanvasElement = class HTMLCanvasElement {
    getContext() {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(0) }),
        putImageData: () => {},
        createImageData: () => ({ data: new Uint8ClampedArray(0) }),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        clip: () => {},
        fill: () => {},
        stroke: () => {},
      };
    }
  };
}
// ---------------------------------------------

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
    
    // CRITICAL: If fileId exists, ALWAYS use Google Drive API - IGNORE fileUrl completely
    if (fileId) {
      console.log(`[PDF Parser] fileId detected: ${fileId}. Using Google Drive API for direct download (IGNORING fileUrl: ${fileUrl})`);
      
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        throw new Error("Google Drive API credentials not configured. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are required.");
      }
      
      try {
        const { google } = await import("googleapis");
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'https://theatomicwork.com'
        );
        
        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        console.log(`[PDF Parser] Downloading file ${fileId} using Google Drive API...`);
        console.log(`[PDF Parser] Google API credentials check: CLIENT_ID=${!!process.env.GOOGLE_CLIENT_ID}, CLIENT_SECRET=${!!process.env.GOOGLE_CLIENT_SECRET}, REFRESH_TOKEN=${!!process.env.GOOGLE_REFRESH_TOKEN}`);
        
        // Download file using Google Drive API with arraybuffer response
        const fileResponse = await drive.files.get(
          { fileId: fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        
        console.log(`[PDF Parser] Google Drive API response received. Data type: ${typeof fileResponse.data}, Is ArrayBuffer: ${fileResponse.data instanceof ArrayBuffer}`);
        
        // Convert arraybuffer to Buffer
        // Handle both ArrayBuffer and Buffer types
        if (fileResponse.data instanceof ArrayBuffer) {
          buffer = Buffer.from(fileResponse.data);
        } else if (Buffer.isBuffer(fileResponse.data)) {
          buffer = fileResponse.data;
        } else {
          // Fallback: try to convert whatever we got
          buffer = Buffer.from(fileResponse.data as any);
        }
        
        console.log(`[PDF Parser] Buffer created. Length: ${buffer.length} bytes, First 10 bytes: ${buffer.slice(0, 10).toString('hex')}`);
        
        if (buffer.length === 0) {
          throw new Error(`PDF file is empty. File ID: ${fileId}`);
        }
        
        // Verify it's actually a PDF by checking the PDF magic bytes
        const pdfMagicBytes = buffer.slice(0, 4).toString('ascii');
        if (pdfMagicBytes !== '%PDF') {
          console.warn(`[PDF Parser] Warning: File does not start with PDF magic bytes. Got: ${pdfMagicBytes}. First 50 bytes: ${buffer.slice(0, 50).toString('ascii')}`);
          // Don't throw here - let pdf-parse handle it
        } else {
          console.log(`[PDF Parser] ✓ PDF magic bytes verified: ${pdfMagicBytes}`);
        }
        
        console.log(`[PDF Parser] Successfully downloaded ${buffer.length} bytes from Google Drive API`);
      } catch (driveError: any) {
        console.error(`[PDF Parser] Google Drive API download failed:`, driveError);
        throw new Error(`Failed to download file from Google Drive API: ${driveError.message}. File ID: ${fileId}`);
      }
    } else {
      // ONLY use fetch() if fileId is NOT available
      console.log(`[PDF Parser] No fileId provided. Falling back to direct URL fetch: ${fileUrl}`);
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
        throw new Error(`Received HTML instead of PDF. This usually means the file requires authentication. Please provide fileId for Google Drive files.`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      
      if (buffer.length === 0) {
        throw new Error(`PDF file is empty. URL: ${fileUrl}`);
      }
      
      console.log(`[PDF Parser] File size: ${buffer.length} bytes`);
    }

    // Try to use pdf-parse if available, otherwise use a fallback
    try {
      // Ensure polyfills are loaded before requiring pdf-parse
      // pdf-parse is loaded dynamically to ensure polyfills are in place
      console.log(`[PDF Parser] Loading pdf-parse module...`);
      const pdfParse = require("pdf-parse");
      console.log(`[PDF Parser] pdf-parse module loaded successfully`);
      
      console.log(`[PDF Parser] Parsing PDF buffer (${buffer.length} bytes)...`);
      const pdfData = await pdfParse(buffer);
      const extractedText = pdfData.text || "";
      console.log(`[PDF Parser] Extracted ${extractedText.length} characters from PDF`);
      
      if (extractedText.length === 0) {
        console.warn("[PDF Parser] Warning: PDF appears to be empty or image-based.");
        // For image-based PDFs, we can't extract text directly
        // Return empty string and let AI handle it with Vision API if needed
        throw new Error("PDF appears to be image-based or empty. Cannot extract text using pdf-parse.");
      }
      
      return extractedText;
    } catch (pdfParseError: any) {
      console.error(`[PDF Parser] pdf-parse error details:`, {
        message: pdfParseError.message,
        stack: pdfParseError.stack,
        name: pdfParseError.name,
      });
      
      // Check if it's a canvas-related error
      if (pdfParseError.message.includes('r is not a function') || 
          pdfParseError.message.includes('@napi-rs/canvas') ||
          pdfParseError.message.includes('canvas')) {
        console.error(`[PDF Parser] Canvas-related error detected. Falling back to OpenAI Vision API for PDF extraction...`);
        
        // Fallback: Use OpenAI Vision API to extract text from PDF
        // Note: Vision API doesn't support PDF directly, so we'll use a workaround
        // by sending the PDF as a document and asking GPT-4o to extract text
        try {
          console.log(`[PDF Parser] Attempting OpenAI API fallback for PDF (${buffer.length} bytes)...`);
          
          // Convert PDF buffer to base64
          const base64 = buffer.toString('base64');
          
          // Use OpenAI's chat completion with document understanding
          // We'll send the PDF as base64 and ask GPT-4o to extract text
          const visionResult = await generateText({
            model: openai("gpt-4o"),
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract all text content from this PDF document. Return only the raw extracted text, preserving line breaks and structure. Do not add any explanations or formatting."
                  },
                  {
                    type: "image",
                    image: `data:application/pdf;base64,${base64}`,
                  }
                ]
              }
            ],
            maxTokens: 4000,
          });
          
          const extractedText = visionResult.text || "";
          console.log(`[PDF Parser] OpenAI API fallback extracted ${extractedText.length} characters from PDF`);
          
          if (extractedText.length === 0) {
            throw new Error("OpenAI API returned empty text from PDF");
          }
          
          return extractedText;
        } catch (visionError: any) {
          console.error(`[PDF Parser] OpenAI API fallback also failed:`, visionError);
          // If Vision API also fails, throw the original error
          throw new Error(`Failed to parse PDF: ${pdfParseError.message}. OpenAI API fallback also failed: ${visionError.message}`);
        }
      }
      
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

