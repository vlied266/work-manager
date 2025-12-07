import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface GoogleFile {
  id: string;
  name: string;
  webViewLink: string;
  mimeType?: string;
}

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
 * Get Google Drive files
 */
async function getDriveFiles(accessToken: string, type?: string): Promise<GoogleFile[]> {
  let query = "trashed = false";
  
  if (type === 'spreadsheets') {
    query += " and mimeType = 'application/vnd.google-apps.spreadsheet'";
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,mimeType)&orderBy=name`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    const errorData = await response.json();
    throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.files || [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined; // 'spreadsheets' or undefined for all files

    console.log("🟡 [STEP 1] Fetching Google integration from Firestore...");

    // Get the first Google integration from Firestore
    // In a real app, you'd get this based on the logged-in user's email
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

    console.log(`🟡 [STEP 2] Found integration for: ${email}. Fetching files...`);

    let accessToken = access_token;
    let needsUpdate = false;

    try {
      // Try to fetch files with current access token
      const files = await getDriveFiles(accessToken, type);
      console.log(`✅ [SUCCESS] Retrieved ${files.length} files from Google Drive`);

      return NextResponse.json({
        files: files.map((file: any) => ({
          id: file.id,
          name: file.name,
          webViewLink: file.webViewLink,
          mimeType: file.mimeType,
        })),
      });
    } catch (error: any) {
      // If token expired, refresh it
      if (error.message === 'TOKEN_EXPIRED' && refresh_token) {
        console.log("🟡 [STEP 3] Access token expired. Refreshing...");

        try {
          const newTokenData = await refreshAccessToken(refresh_token);
          accessToken = newTokenData.access_token;
          needsUpdate = true;

          console.log("✅ [SUCCESS] Token refreshed. Retrying file fetch...");

          // Retry the request with new token
          const files = await getDriveFiles(accessToken, type);
          console.log(`✅ [SUCCESS] Retrieved ${files.length} files from Google Drive`);

          // Update the access token in Firestore
          await integrationDoc.ref.update({
            access_token: accessToken,
            updated_at: Timestamp.now(),
          });

          return NextResponse.json({
            files: files.map((file: any) => ({
              id: file.id,
              name: file.name,
              webViewLink: file.webViewLink,
              mimeType: file.mimeType,
            })),
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
        console.error("❌ [ERROR] Failed to fetch files:", error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch files from Google Drive' },
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

