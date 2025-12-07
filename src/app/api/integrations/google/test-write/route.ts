import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Refresh Google OAuth access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to refresh token: ${errorData.error || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Append a row to Google Sheet
 */
async function appendToSheet(
  accessToken: string,
  sheetId: string,
  values: string[][]
): Promise<{ updatedRange: string; updatedRows: number; updatedColumns: number }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: values,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    const errorData = await response.json();
    throw new Error(`Google Sheets API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    updatedRange: data.updates?.updatedRange || 'Unknown',
    updatedRows: data.updates?.updatedRows || 0,
    updatedColumns: data.updates?.updatedColumns || 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Missing sheetId parameter. Usage: /api/integrations/google/test-write?sheetId=YOUR_SHEET_ID' },
        { status: 400 }
      );
    }

    console.log("🟡 [STEP 1] Fetching Google integration from Firestore...");

    // Get the first Google integration from Firestore
    const db = getAdminDb();
    const integrationsRef = db.collection('integrations');
    const snapshot = await integrationsRef.where('email', '!=', null).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'No Google integration found. Please connect your Google account first.' },
        { status: 404 }
      );
    }

    const integrationDoc = snapshot.docs[0];
    const integrationData = integrationDoc.data();
    const { access_token, refresh_token, email } = integrationData;

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token found in integration' },
        { status: 400 }
      );
    }

    console.log(`🟡 [STEP 2] Found integration for: ${email}. Writing to sheet: ${sheetId}...`);

    // Prepare test data
    const testValues = [
      [
        'Atomic Work',
        'Test Run',
        '✅ It Works!',
        new Date().toISOString(),
      ],
    ];

    let accessToken = access_token;
    let needsUpdate = false;

    try {
      // Try to write to sheet with current access token
      const result = await appendToSheet(accessToken, sheetId, testValues);
      console.log(`✅ [SUCCESS] Row appended to sheet. Range: ${result.updatedRange}`);

      return NextResponse.json({
        success: true,
        message: 'Row successfully appended to Google Sheet',
        updatedRange: result.updatedRange,
        updatedRows: result.updatedRows,
        updatedColumns: result.updatedColumns,
        sheetId: sheetId,
      });
    } catch (error: any) {
      // If token expired, refresh it
      if (error.message === 'TOKEN_EXPIRED' && refresh_token) {
        console.log("🟡 [STEP 3] Access token expired. Refreshing...");

        try {
          const newTokenData = await refreshAccessToken(refresh_token);
          accessToken = newTokenData.access_token;
          needsUpdate = true;

          console.log("✅ [SUCCESS] Token refreshed. Retrying write operation...");

          // Retry the write with new token
          const result = await appendToSheet(accessToken, sheetId, testValues);
          console.log(`✅ [SUCCESS] Row appended to sheet. Range: ${result.updatedRange}`);

          // Update the access token in Firestore
          await integrationDoc.ref.update({
            access_token: accessToken,
            updated_at: Timestamp.now(),
          });

          return NextResponse.json({
            success: true,
            message: 'Row successfully appended to Google Sheet (token was refreshed)',
            updatedRange: result.updatedRange,
            updatedRows: result.updatedRows,
            updatedColumns: result.updatedColumns,
            sheetId: sheetId,
          });
        } catch (refreshError: any) {
          console.error("❌ [ERROR] Failed to refresh token:", refreshError);
          return NextResponse.json(
            { error: 'Failed to refresh access token. Please reconnect your Google account.' },
            { status: 401 }
          );
        }
      } else {
        // Other errors
        console.error("❌ [ERROR] Failed to write to sheet:", error);
        return NextResponse.json(
          { 
            error: error.message || 'Failed to write to Google Sheet',
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

  } catch (error: any) {
    console.error("❌ [ERROR] Server error:", error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

