import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Webhook Simulation API
 * 
 * Simulates external webhook events (e.g., Google Drive file upload notification)
 * This is a development/testing endpoint to manually trigger automated workflows
 * 
 * In production, this would be replaced by actual webhook endpoints that receive
 * real-time notifications from external services (Google Drive, Dropbox, etc.)
 */

interface SimulationRequest {
  eventType: "FILE_CREATED" | "FILE_UPDATED" | "FILE_DELETED";
  filePath: string; // e.g., "/Resumes/john-doe-resume.pdf"
  provider?: "google_drive" | "dropbox" | "local";
  orgId?: string; // Optional: filter by organization
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    [key: string]: any;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: SimulationRequest = await req.json();
    const { eventType, filePath, provider = "local", orgId, metadata } = body;

    if (!eventType || !filePath) {
      return NextResponse.json(
        { error: "eventType and filePath are required" },
        { status: 400 }
      );
    }

    // Only FILE_CREATED events trigger workflows
    if (eventType !== "FILE_CREATED") {
      return NextResponse.json({
        success: true,
        message: `Event type "${eventType}" does not trigger workflows. Only FILE_CREATED events trigger workflows.`,
        runsCreated: [],
      });
    }

    // Call the trigger API to create runs for matching active procedures
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const triggerResponse = await fetch(`${baseUrl}/api/runs/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath,
        orgId,
        fileUrl: metadata?.fileUrl || metadata?.url, // Support fileUrl from metadata
      }),
    });

    if (!triggerResponse.ok) {
      const errorData = await triggerResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to trigger workflows",
          details: errorData.error || errorData.details || "Unknown error",
        },
        { status: triggerResponse.status }
      );
    }

    const triggerResult = await triggerResponse.json();

    return NextResponse.json({
      success: true,
      message: `Simulated ${eventType} event for file: ${filePath}`,
      eventType,
      filePath,
      provider,
      metadata,
      triggerResult,
      runsCreated: triggerResult.runsCreated || [],
      note: "This is a simulation endpoint. In production, real webhooks would call /api/runs/trigger directly.",
    });
  } catch (error: any) {
    console.error("Error simulating webhook event:", error);
    return NextResponse.json(
      {
        error: "Failed to simulate webhook event",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list active procedures that would respond to a given file path
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("filePath");
    const orgId = searchParams.get("orgId");

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath query parameter is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Find all active procedures that would match this file path
    let proceduresQuery = db
      .collection("procedures")
      .where("isPublished", "==", true)
      .where("isActive", "==", true)
      .where("trigger.type", "==", "ON_FILE_CREATED");

    if (orgId) {
      proceduresQuery = proceduresQuery.where("organizationId", "==", orgId);
    }

    const proceduresSnapshot = await proceduresQuery.get();

    // Extract folder path from file path
    const lastSlashIndex = filePath.lastIndexOf("/");
    const folderPath = lastSlashIndex === -1 ? "/" : filePath.substring(0, lastSlashIndex);

    const matchingProcedures = proceduresSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        const triggerConfig = data.trigger?.config;
        const procedureFolderPath = triggerConfig?.folderPath;

        // Check if the file path matches the procedure's folder path
        const matches = procedureFolderPath && filePath.startsWith(procedureFolderPath);

        return {
          id: doc.id,
          title: data.title,
          organizationId: data.organizationId,
          trigger: data.trigger,
          matches,
          folderPath: procedureFolderPath,
        };
      })
      .filter((p) => p.matches);

    return NextResponse.json({
      success: true,
      filePath,
      folderPath,
      matchingProcedures,
      count: matchingProcedures.length,
      message: `Found ${matchingProcedures.length} active procedure(s) that would respond to this file.`,
    });
  } catch (error: any) {
    console.error("Error fetching matching procedures:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch matching procedures",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

