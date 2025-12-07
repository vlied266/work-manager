import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

    console.log("🟡 [STEP 1] Exchanging code...");

    // 1. Get Token & Webhook Info
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/slack/callback`,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("❌ Token Error:", data.error);
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    // 2. Extract the Webhook URL (The Golden Key) 🗝️
    const webhookUrl = data.incoming_webhook?.url;
    const channelName = data.incoming_webhook?.channel;

    if (!webhookUrl) {
      console.error("❌ No Webhook URL found. Did you request 'incoming-webhook' scope?");
      return NextResponse.json({ error: 'No webhook url' }, { status: 400 });
    }

    console.log(`🟡 [STEP 2] Webhook found for channel: ${channelName}. Sending message...`);

    // 3. Send Message via Webhook (Guaranteed Delivery)
    const msgResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: "🚀 Hello from Atomic Work! (Sent via Webhook)",
      }),
    });

    if (msgResponse.ok) {
        console.log("✅ [SUCCESS] MESSAGE SENT SUCCESSFULLY!");
        
        // 4. Save Integration Data to Firestore
        try {
          const db = getAdminDb();
          const teamId = data.team?.id || data.team_id;
          
          if (!teamId) {
            console.warn("⚠️ [WARNING] No team_id found in Slack response. Skipping DB save.");
          } else {
            const integrationData = {
              access_token: data.access_token,
              webhook_url: webhookUrl,
              channel_id: data.incoming_webhook?.channel_id || null,
              channel_name: channelName || null,
              team_name: data.team?.name || null,
              team_id: teamId,
              connected_at: Timestamp.now(),
            };

            await db.collection('slack_integrations').doc(teamId).set(integrationData, { merge: true });
            console.log(`✅ [SUCCESS] Integration saved to Firestore for team: ${teamId}`);
          }
        } catch (dbError: any) {
          // Don't crash the flow if DB save fails (e.g., missing service account key locally)
          console.warn("⚠️ [WARNING] Failed to save integration to Firestore:", dbError.message);
          console.warn("   This is OK for local development. Integration will work but won't be persisted.");
        }
        
        return NextResponse.redirect(new URL('/dashboard?slack=success', request.url));
    } else {
        const errorText = await msgResponse.text();
        console.error("❌ [ERROR] Webhook Failed:", errorText);
        return NextResponse.json({ error: 'Message failed' }, { status: 500 });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
