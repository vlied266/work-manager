import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spreadsheetId, range, accessToken } = body;

    // Validate required fields
    if (!spreadsheetId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields: spreadsheetId, accessToken" },
        { status: 400 }
      );
    }

    // Default range to A1 if not provided (for MVP testing)
    const targetRange = range || "A1";

    // Initialize Google Sheets API client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Fetch data from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: targetRange,
    });

    const values = response.data.values || [];

    // If no data, return empty array
    if (values.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          range: targetRange,
          message: "No data found in the specified range",
        },
        { status: 200 }
      );
    }

    // Transform data into a more usable format
    // First row as headers (if available)
    const headers = values[0] || [];
    const rows = values.slice(1).map((row) => {
      const rowObj: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowObj[header as string] = row[index] || "";
      });
      return rowObj;
    });

    // If no headers, return raw data
    const formattedData = headers.length > 0 ? rows : values;

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        rawValues: values,
        range: targetRange,
        headers: headers.length > 0 ? headers : null,
        rowCount: values.length,
        message: "Data fetched successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching Google Sheets data:", error);
    
    // Handle specific Google API errors
    if (error.code === 401) {
      return NextResponse.json(
        { error: "Invalid or expired access token. Please sign in again." },
        { status: 401 }
      );
    }
    
    if (error.code === 403) {
      return NextResponse.json(
        { error: "Sheets permissions not granted or spreadsheet is not accessible. Please grant access and ensure the sheet is shared with your account." },
        { status: 403 }
      );
    }

    if (error.code === 400) {
      return NextResponse.json(
        { error: "Invalid spreadsheet ID or range. Please check the URL and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets", details: error.message },
      { status: 500 }
    );
  }
}

