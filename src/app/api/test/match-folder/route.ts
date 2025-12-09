import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Test endpoint to debug folder path matching
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("filePath") || "/Resumes/test-resume.pdf";
    const orgId = searchParams.get("orgId");

    const db = getAdminDb();

    // Find all active Procedures
    let proceduresQuery = db
      .collection("procedures")
      .where("isPublished", "==", true)
      .where("isActive", "==", true)
      .where("trigger.type", "==", "ON_FILE_CREATED");

    if (orgId) {
      proceduresQuery = proceduresQuery.where("organizationId", "==", orgId);
    }

    const proceduresSnapshot = await proceduresQuery.get();
    const procedures = proceduresSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Test matching logic
    const normalizePath = (path: string) => {
      return path.replace(/^\/+|\/+$/g, '').toLowerCase();
    };

    const extractFolderFromPath = (path: string): string => {
      const lastSlash = path.lastIndexOf('/');
      if (lastSlash === -1) return '';
      return path.substring(0, lastSlash).replace(/^\/+|\/+$/g, '');
    };

    const normalizedFilePath = normalizePath(filePath);
    const fileFolder = normalizePath(extractFolderFromPath(filePath));

    const matches = procedures.map((proc: any) => {
      const configFolderPath = proc.trigger?.config?.folderPath;
      const normalizedConfigPath = configFolderPath ? normalizePath(configFolderPath) : '';

      const doesMatch = configFolderPath && (
        fileFolder === normalizedConfigPath ||
        normalizedFilePath.startsWith(normalizedConfigPath + '/') ||
        filePath.startsWith(configFolderPath + '/') ||
        filePath.startsWith('/' + configFolderPath + '/') ||
        filePath.startsWith(configFolderPath) ||
        filePath.startsWith('/' + configFolderPath) ||
        (configFolderPath.match(/^[a-zA-Z0-9_-]+$/) && filePath.includes(configFolderPath))
      );

      return {
        id: proc.id,
        title: proc.title,
        configFolderPath,
        normalizedConfigPath,
        filePath,
        fileFolder,
        normalizedFilePath,
        doesMatch,
        matchDetails: {
          exactMatch: fileFolder === normalizedConfigPath,
          startsWithNormalized: normalizedFilePath.startsWith(normalizedConfigPath + '/'),
          startsWithOriginal: filePath.startsWith(configFolderPath + '/'),
          startsWithSlash: filePath.startsWith('/' + configFolderPath + '/'),
          startsWithNoSlash: filePath.startsWith(configFolderPath),
          startsWithSlashNoSlash: filePath.startsWith('/' + configFolderPath),
          driveIdMatch: configFolderPath?.match(/^[a-zA-Z0-9_-]+$/) && filePath.includes(configFolderPath || ''),
        },
      };
    });

    return NextResponse.json({
      success: true,
      filePath,
      fileFolder,
      normalizedFilePath,
      procedures: matches,
      matchingProcedures: matches.filter(m => m.doesMatch),
    });
  } catch (error: any) {
    console.error("Error in match-folder test:", error);
    return NextResponse.json(
      {
        error: "Failed to test folder matching",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

