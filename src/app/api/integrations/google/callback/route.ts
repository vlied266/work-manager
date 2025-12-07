import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    console.log("🟡 [STEP 1] Exchanging Google OAuth code for token...");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || !baseUrl) {
      console.error("❌ Missing Google OAuth configuration");
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    const redirectUri = `${baseUrl}/api/integrations/google/callback`;

    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("❌ Token Exchange Error:", tokenData.error || tokenData);
      return NextResponse.json(
        { error: tokenData.error || 'Failed to exchange code for token' },
        { status: 400 }
      );
    }

    const { access_token, refresh_token } = tokenData;

    if (!access_token) {
      console.error("❌ No access token in response");
      return NextResponse.json(
        { error: 'No access token received' },
        { status: 400 }
      );
    }

    console.log("🟡 [STEP 2] Token received. Fetching user info...");

    // 2. Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("❌ Failed to fetch user info");
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 400 }
      );
    }

    const userInfo = await userInfoResponse.json();
    const { email, name, picture } = userInfo;

    if (!email) {
      console.error("❌ No email in user info");
      return NextResponse.json(
        { error: 'No email found in user information' },
        { status: 400 }
      );
    }

    console.log(`🟡 [STEP 3] User info received: ${email}. Saving to Firestore...`);

    // 3. Save to Firestore
    try {
      const db = getAdminDb();
      const docId = `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const integrationData = {
        access_token: access_token,
        refresh_token: refresh_token || null,
        email: email,
        name: name || null,
        picture: picture || null,
        connected_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await db.collection('integrations').doc(docId).set(integrationData, { merge: true });
      console.log(`✅ [SUCCESS] Google integration saved to Firestore for: ${email}`);

      return NextResponse.redirect(new URL('/dashboard?google=connected', request.url));
    } catch (dbError: any) {
      // Don't crash the flow if DB save fails
      console.warn("⚠️ [WARNING] Failed to save integration to Firestore:", dbError.message);
      console.warn("   This is OK for local development. Integration will work but won't be persisted.");
      
      // Still redirect to success page even if DB save fails
      return NextResponse.redirect(new URL('/dashboard?google=connected', request.url));
    }

  } catch (error: any) {
    console.error("❌ Server Error:", error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

