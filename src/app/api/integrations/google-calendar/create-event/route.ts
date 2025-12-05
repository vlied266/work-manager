import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, startTime, duration, accessToken } = body;

    // Validate required fields
    if (!title || !startTime || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields: title, startTime, accessToken" },
        { status: 400 }
      );
    }

    // Validate startTime is a valid date
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid startTime format. Expected ISO 8601 date string." },
        { status: 400 }
      );
    }

    // Calculate end time (default to 1 hour if duration not provided)
    const durationMinutes = duration || 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    // Initialize Google Calendar API client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create calendar event
    const event = {
      summary: title,
      description: description || "",
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    if (!response.data.htmlLink) {
      return NextResponse.json(
        { error: "Event created but no link returned" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        message: "Event added to Google Calendar successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    
    // Handle specific Google API errors
    if (error.code === 401) {
      return NextResponse.json(
        { error: "Invalid or expired access token. Please sign in again." },
        { status: 401 }
      );
    }
    
    if (error.code === 403) {
      return NextResponse.json(
        { error: "Calendar permissions not granted. Please grant calendar access." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create calendar event", details: error.message },
      { status: 500 }
    );
  }
}

