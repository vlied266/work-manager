import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

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
  fileName?: string; // File name for better file type detection
}

// Helper function to create a dynamic schema based on fields to extract
function createExtractedDataSchema(fieldsToExtract: string[]) {
  // Ensure we have at least one field
  if (!fieldsToExtract || fieldsToExtract.length === 0) {
    throw new Error("fieldsToExtract must contain at least one field name");
  }
  
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  fieldsToExtract.forEach(field => {
    if (!field || typeof field !== 'string' || field.trim().length === 0) {
      console.warn(`[Schema] Skipping invalid field name: ${field}`);
      return;
    }
    
    // Clean field name (remove spaces, special chars that might break schema)
    const cleanField = field.trim();
    
    // Allow string, number, boolean, null, or undefined
    // Make it optional and nullable to handle missing fields gracefully
    schemaObject[cleanField] = z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
    ]).optional().nullable();
  });
  
  // Ensure we have at least one valid field in the schema
  if (Object.keys(schemaObject).length === 0) {
    throw new Error("No valid fields found in fieldsToExtract array");
  }
  
  return z.object(schemaObject);
}

export async function POST(req: NextRequest) {
  try {
    const body: ParseDocumentRequest = await req.json();
    const { fileUrl, fieldsToExtract, fileType, orgId, fileId, fileName } = body;

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

    // Detect file type from fileName (preferred) or URL if not provided
    const detectedFileType = fileType || (fileName ? detectFileType(fileName) : detectFileType(fileUrl));
    
    let extractedText = "";
    let extractedData: any = null;
    let imageBuffer: Buffer | null = null; // For images and scanned PDFs, we'll pass the buffer directly
    let pdfBuffer: Buffer | null = null; // For PDFs, we need the buffer for Vision API fallback
    let extractedImageFromPdf: Buffer | null = null; // Extracted image from scanned PDF
    let useVisionForPdf = false; // Flag to indicate if we should use Vision API for PDF

    // Step 1: Extract content based on file type
    switch (detectedFileType) {
      case "pdf": {
        // Strategy: Try text extraction first, then fallback to image extraction for scanned PDFs
        console.log("[PDF Parser] Detected PDF. Checking for text...");
        
        try {
          const pdfResult = await extractTextFromPDF(fileUrl, fileId);
          extractedText = pdfResult.text || "";
          pdfBuffer = pdfResult.buffer || null;
          
          // Strategy A: Use Text (Preferred) - if we have substantial text
          if (extractedText && extractedText.trim().length > 50) {
            console.log(`[PDF Parser] Text found (${extractedText.length} chars). Using Text Mode.`);
            // Will use text-based extraction in Step 2
          } 
          // Strategy B: Fallback to Vision (Scanned PDF) - extract image from PDF
          else {
            console.log(`[PDF Parser] No text found (${extractedText?.length || 0} chars). Scanned PDF detected. Attempting deep image extraction...`);
            
            if (pdfBuffer) {
              // Try to extract the first image from the PDF (recursive search)
              const extractedImg = await extractFirstImageFromPDF(pdfBuffer);
              
              if (extractedImg) {
                console.log(`[PDF Parser] Successfully extracted image from PDF (${extractedImg.length} bytes). Using Vision API...`);
                // Store the extracted image for Vision API
                extractedImageFromPdf = extractedImg;
                useVisionForPdf = true;
                pdfBuffer = null; // Clear PDF buffer since we're using extracted image
              } else {
                // CRITICAL FIX: Stop here. Do not send PDF buffer to Vision.
                console.error(`[PDF Parser] No extractable image found in scanned PDF.`);
                throw new Error("Scanned PDF could not be processed: No text or extractable image found. The PDF may be corrupted or use an unsupported image format.");
              }
            } else {
              console.error(`[PDF Parser] No buffer available for image extraction.`);
              throw new Error("Scanned PDF could not be processed: No buffer available for image extraction.");
            }
          }
        } catch (pdfError: any) {
          console.error(`[PDF Parser] PDF text extraction failed:`, pdfError.message);
          // If we have the buffer, try to extract image
          if (pdfError.buffer) {
            pdfBuffer = pdfError.buffer;
            console.log(`[PDF Parser] Text extraction failed. Attempting deep image extraction from PDF as fallback...`);
            
            const extractedImg = await extractFirstImageFromPDF(pdfBuffer);
            if (extractedImg) {
              console.log(`[PDF Parser] Successfully extracted image from PDF. Using Vision API...`);
              extractedImageFromPdf = extractedImg;
              useVisionForPdf = true;
              pdfBuffer = null;
            } else {
              // CRITICAL FIX: Stop here. Do not send PDF buffer to Vision.
              console.error(`[PDF Parser] No extractable image found in PDF.`);
              throw new Error("PDF could not be processed: Text extraction failed and no extractable image found. The PDF may be corrupted or use an unsupported format.");
            }
          } else {
            throw pdfError; // Re-throw if we don't have a buffer to work with
          }
        }
        break;
      }
      case "excel":
        extractedData = await extractDataFromExcel(fileUrl);
        // For Excel, we'll use the structured data directly
        break;
      case "image":
        // For images, download the file and prepare for Vision API
        imageBuffer = await downloadImageFile(fileUrl, fileId);
        // Skip text extraction - we'll use Vision API directly
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
    } else if (detectedFileType === "image" && imageBuffer) {
      // For images, use Vision API directly with the image buffer
      result = await extractFieldsWithAIFromImage(
        imageBuffer,
        fieldsToExtract,
        fileUrl
      );
    } else if (detectedFileType === "pdf" && useVisionForPdf) {
      // For scanned PDFs, use Vision API
      // Prefer extracted image buffer, fallback to PDF buffer
      const visionBuffer = extractedImageFromPdf || pdfBuffer;
      if (visionBuffer) {
        console.log(`[PDF Parser] Using Vision API for scanned PDF field extraction...`);
        result = await extractFieldsWithAIFromImage(
          visionBuffer,
          fieldsToExtract,
          fileUrl || "document.pdf"
        );
      } else {
        throw new Error("No buffer available for Vision API extraction");
      }
    } else {
      // For text-based PDFs, use AI to extract fields from text
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
 * Recursive helper to find the first image in a PDF resource tree
 * Handles nested Form XObjects (common in scanned PDFs)
 * Returns the raw image buffer (usually JPEG/PNG) or null if no image found
 */
async function extractFirstImageFromPDF(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    console.log(`[PDF Image Extractor] Attempting deep image extraction from PDF (${pdfBuffer.length} bytes)...`);
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    if (pages.length === 0) {
      console.warn(`[PDF Image Extractor] PDF has no pages`);
      return null;
    }
    
    // Iterate through ALL pages, not just the first
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const { XObject } = page.node.normalizedEntries();
      
      if (!XObject) {
        console.log(`[PDF Image Extractor] Page ${pageIndex + 1} has no XObject, skipping...`);
        continue;
      }
      
      const xObjectMap = XObject as any;
      
      // Recursive search function
      const findImageInMap = (map: any): Buffer | null => {
        for (const [name, ref] of map.entries()) {
          try {
            const xObject = pdfDoc.context.lookup(ref) as any;
            
            // Case A: It's an Image
            if (xObject.constructor.name === 'PDFRawStream' && 
                xObject.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) {
              
              // Priority: JPEG (DCTDecode) - directly usable
              const filter = xObject.dict.get(PDFName.of('Filter'));
              if (filter === PDFName.of('DCTDecode')) {
                const imageBuffer = Buffer.from(xObject.contents);
                console.log(`[PDF Image Extractor] Found JPEG image (DCTDecode) on page ${pageIndex + 1}: ${imageBuffer.length} bytes`);
                return imageBuffer;
              }
              
              // Fallback: Return whatever content (might be PNG/JP2)
              if (xObject.contents) {
                const imageBuffer = Buffer.from(xObject.contents);
                console.log(`[PDF Image Extractor] Found image on page ${pageIndex + 1}: ${imageBuffer.length} bytes`);
                return imageBuffer;
              }
            }
            
            // Case B: It's a Form (Container) - Recurse inside!
            if (xObject.constructor.name === 'PDFRawStream' && 
                xObject.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) {
              
              console.log(`[PDF Image Extractor] Found Form XObject on page ${pageIndex + 1}, recursing...`);
              
              const formResources = xObject.dict.get(PDFName.of('Resources'));
              if (formResources) {
                const formResourcesDict = pdfDoc.context.lookup(formResources) as any;
                const formXObjects = formResourcesDict?.get(PDFName.of('XObject'));
                if (formXObjects) {
                  const formXObjectsDict = pdfDoc.context.lookup(formXObjects) as any;
                  const formXObjectMap = formXObjectsDict?.dict || formXObjectsDict;
                  if (formXObjectMap) {
                    const result = findImageInMap(formXObjectMap);
                    if (result) return result;
                  }
                }
              }
            }
          } catch (e: any) {
            // Skip this XObject if we can't process it
            console.warn(`[PDF Image Extractor] Error processing XObject ${name}:`, e.message);
            continue;
          }
        }
        return null;
      };
      
      const image = findImageInMap(xObjectMap);
      if (image) {
        console.log(`[PDF Image Extractor] Successfully extracted image from page ${pageIndex + 1}`);
        return image;
      }
    }
    
    console.warn(`[PDF Image Extractor] No image found in any page of PDF`);
    return null;
  } catch (error: any) {
    console.error(`[PDF Image Extractor] Deep image extraction failed:`, error.message);
    return null;
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
    urlLower.includes(".webp") ||
    urlLower.endsWith(".jpg") ||
    urlLower.endsWith(".jpeg") ||
    urlLower.endsWith(".png") ||
    urlLower.endsWith(".gif") ||
    urlLower.endsWith(".webp")
  ) {
    return "image";
  }
  
  // Default to PDF if uncertain
  return "pdf";
}

/**
 * Extract text from PDF file
 * Returns both the extracted text and the buffer for Vision API fallback
 */
async function extractTextFromPDF(fileUrl: string, fileId?: string): Promise<{ text: string; buffer: Buffer }> {
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

    // Use pdf2json - a pure Node.js PDF parser with no Canvas/DOM dependencies
    try {
      console.log(`[PDF Parser] Using pdf2json for PDF parsing (${buffer.length} bytes)...`);
      
      // Dynamic import to avoid hoisting issues
      const PDFParserModule = await import("pdf2json");
      const PDFParser = PDFParserModule.default || PDFParserModule;
      
      // Helper function to wrap pdf2json in a Promise
      const parsePdfBuffer = (pdfBuffer: Buffer): Promise<string> => {
        return new Promise((resolve, reject) => {
          // Create parser instance - 1 = Text content only
          const pdfParser = new PDFParser(null, 1);
          
          // Set timeout to prevent hanging
          const timeout = setTimeout(() => {
            reject(new Error("PDF parsing timeout after 30 seconds"));
          }, 30000);
          
          pdfParser.on("pdfParser_dataError", (errData: any) => {
            clearTimeout(timeout);
            console.error("[pdf2json] Parse error:", errData.parserError);
            reject(new Error(errData.parserError || "Failed to parse PDF"));
          });
          
          pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            clearTimeout(timeout);
            try {
              // Extract raw text from the PDF structure
              const rawText = pdfParser.getRawTextContent();
              
              if (!rawText || rawText.trim().length === 0) {
                console.warn("[pdf2json] Warning: Extracted text is empty. PDF may be image-based.");
                reject(new Error("PDF appears to be image-based or empty. No text content found."));
                return;
              }
              
              console.log(`[pdf2json] Successfully extracted ${rawText.length} characters`);
              resolve(rawText);
            } catch (e: any) {
              console.error("[pdf2json] Error extracting text:", e);
              reject(e);
            }
          });
          
          // Parse the buffer
          try {
            pdfParser.parseBuffer(pdfBuffer);
          } catch (parseError: any) {
            clearTimeout(timeout);
            console.error("[pdf2json] Buffer parse error:", parseError);
            reject(parseError);
          }
        });
      };
      
      // Execute parsing
      const extractedText = await parsePdfBuffer(buffer);
      
      // Return both text and buffer - caller will decide if text is sufficient
      console.log(`[PDF Parser] pdf2json extracted ${extractedText?.length || 0} characters`);
      return { text: extractedText || "", buffer };
      
    } catch (pdf2jsonError: any) {
      console.error(`[PDF Parser] pdf2json error details:`, {
        message: pdf2jsonError.message,
        stack: pdf2jsonError.stack,
        name: pdf2jsonError.name,
      });
      
      // Return empty text but keep the buffer for Vision API fallback
      // The caller will use Vision API if text is empty
      console.log(`[PDF Parser] pdf2json failed, returning buffer for Vision API fallback...`);
      const errorWithBuffer: any = new Error(`PDF text extraction failed: ${pdf2jsonError.message}`);
      errorWithBuffer.buffer = buffer;
      throw errorWithBuffer;
    }
  } catch (error: any) {
    console.error(`[PDF Parser] Error extracting text from PDF:`, error);
    // If error has buffer, preserve it
    if (error.buffer) {
      throw error;
    }
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
 * Download image file from Google Drive or URL
 * Returns a Buffer ready for base64 encoding
 */
async function downloadImageFile(fileUrl: string, fileId?: string): Promise<Buffer> {
  try {
    let buffer: Buffer;
    
    // CRITICAL: If fileId exists, ALWAYS use Google Drive API - IGNORE fileUrl completely
    if (fileId) {
      console.log(`[Image Parser] fileId detected: ${fileId}. Using Google Drive API for direct download (IGNORING fileUrl: ${fileUrl})`);
      
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
        
        console.log(`[Image Parser] Downloading image ${fileId} using Google Drive API...`);
        
        // Download file using Google Drive API with arraybuffer response
        const fileResponse = await drive.files.get(
          { fileId: fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        
        // Convert arraybuffer to Buffer
        if (fileResponse.data instanceof ArrayBuffer) {
          buffer = Buffer.from(fileResponse.data);
        } else if (Buffer.isBuffer(fileResponse.data)) {
          buffer = fileResponse.data;
        } else {
          buffer = Buffer.from(fileResponse.data as any);
        }
        
        if (buffer.length === 0) {
          throw new Error(`Image file is empty. File ID: ${fileId}`);
        }
        
        console.log(`[Image Parser] Successfully downloaded ${buffer.length} bytes from Google Drive API`);
        return buffer;
      } catch (driveError: any) {
        console.error(`[Image Parser] Google Drive API download failed:`, driveError);
        throw new Error(`Failed to download image from Google Drive API: ${driveError.message}. File ID: ${fileId}`);
      }
    } else {
      // Fallback to direct URL fetch if fileId is not available
      console.log(`[Image Parser] No fileId provided. Falling back to direct URL fetch: ${fileUrl}`);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      
      if (buffer.length === 0) {
        throw new Error(`Image file is empty. URL: ${fileUrl}`);
      }
      
      console.log(`[Image Parser] Successfully downloaded ${buffer.length} bytes from URL`);
      return buffer;
    }
  } catch (error: any) {
    console.error(`[Image Parser] Error downloading image:`, error);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Use AI to extract specific fields from extracted content (for PDF/Excel)
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
    // Validate fieldsToExtract before creating schema
    if (!fieldsToExtract || fieldsToExtract.length === 0) {
      throw new Error("fieldsToExtract array is empty. At least one field is required.");
    }
    
    // Filter out invalid field names
    const validFields = fieldsToExtract.filter(field => 
      field && typeof field === 'string' && field.trim().length > 0
    );
    
    if (validFields.length === 0) {
      throw new Error("No valid field names found in fieldsToExtract array");
    }
    
    console.log(`[AI Extractor] Creating schema for ${validFields.length} fields:`, validFields);
    
    // Create a dynamic schema based on the fields to extract
    const dynamicSchema = createExtractedDataSchema(validFields);
    
    console.log(`[AI Extractor] Schema created successfully. Calling OpenAI...`);
    
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: dynamicSchema,
      prompt,
    });

    console.log(`[AI Extractor] Successfully extracted fields:`, Object.keys(object));
    return object;
  } catch (error: any) {
    console.error(`[AI Extractor] Error extracting fields with AI:`, {
      message: error.message,
      stack: error.stack,
      fieldsToExtract,
      errorType: error.constructor?.name,
    });
    throw new Error(`Failed to extract fields with AI: ${error.message}`);
  }
}

/**
 * Use AI Vision API to extract specific fields directly from image
 * This bypasses text extraction and uses Vision API with structured output
 * Uses raw OpenAI API with image_url format for explicit control
 */
async function extractFieldsWithAIFromImage(
  imageBuffer: Buffer,
  fieldsToExtract: string[],
  fileUrl: string
): Promise<Record<string, any>> {
  console.log(`[AI Vision Extractor] Extracting ${fieldsToExtract.length} fields directly from image (${imageBuffer.length} bytes)`);
  
  try {
    // Validate fieldsToExtract before creating schema
    if (!fieldsToExtract || fieldsToExtract.length === 0) {
      throw new Error("fieldsToExtract array is empty. At least one field is required.");
    }
    
    // Filter out invalid field names
    const validFields = fieldsToExtract.filter(field => 
      field && typeof field === 'string' && field.trim().length > 0
    );
    
    if (validFields.length === 0) {
      throw new Error("No valid field names found in fieldsToExtract array");
    }
    
    console.log(`[AI Vision Extractor] Processing ${validFields.length} fields:`, validFields);
    
    // Determine MIME type from file extension
    const urlLower = fileUrl.toLowerCase();
    let mimeType = 'image/jpeg'; // Default
    if (urlLower.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (urlLower.endsWith('.webp')) {
      mimeType = 'image/webp';
    } else if (urlLower.endsWith('.gif')) {
      mimeType = 'image/gif';
    }
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    // Build the prompt
    const prompt = `You are a data extraction specialist. Analyze this image and extract the following fields. Return a JSON object with the extracted fields.

Fields to extract:
${validFields.map((field) => `- ${field}`).join("\n")}

Return a JSON object with the extracted fields. If a field is not found, use null as the value. Use appropriate data types (strings, numbers, dates, booleans) based on the content.`;
    
    console.log(`[AI Vision Extractor] Calling OpenAI Vision API with ${mimeType} image...`);
    
    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Create the schema definition for response_format
    const schemaDefinition: any = {
      type: "object",
      properties: {},
      required: [],
    };
    
    validFields.forEach(field => {
      schemaDefinition.properties[field] = {
        type: ["string", "number", "boolean", "null"],
        description: `Extracted value for ${field}`,
      };
    });
    
    // Use raw OpenAI API with image_url format
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o", // Must use a vision-capable model
      messages: [
        {
          role: "system",
          content: "You are an AI data extraction assistant. Extract structured data from images and return valid JSON objects.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "extracted_data",
          description: "Extracted data fields from the image",
          schema: schemaDefinition,
          strict: false, // Allow null values for missing fields
        },
      },
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("OpenAI Vision API returned empty response");
    }
    
    // Parse the JSON response
    let extractedData: Record<string, any>;
    try {
      extractedData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error(`[AI Vision Extractor] Failed to parse JSON response:`, responseContent);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`);
    }
    
    // Ensure all fields are present (set to null if missing)
    validFields.forEach(field => {
      if (!(field in extractedData)) {
        extractedData[field] = null;
      }
    });

    console.log(`[AI Vision Extractor] Successfully extracted fields:`, Object.keys(extractedData));
    return extractedData;
  } catch (error: any) {
    console.error(`[AI Vision Extractor] Error extracting fields from image:`, {
      message: error.message,
      stack: error.stack,
      fieldsToExtract,
      errorType: error.constructor?.name,
    });
    throw new Error(`Failed to extract fields from image: ${error.message}`);
  }
}

