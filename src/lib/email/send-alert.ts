import { Resend } from "resend";
import { getAdminDb } from "@/lib/firebase-admin";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an alert email notification
 */
export async function sendAlertEmail({
  to,
  subject,
  message,
  collectionName,
  recordId,
  recordData,
}: {
  to: string;
  subject: string;
  message: string;
  collectionName: string;
  recordId: string;
  recordData: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY is not set");
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }

    // Validate recipient
    if (!to || !to.includes("@")) {
      console.error("[Email] Invalid recipient email:", to);
      return { success: false, error: "Invalid recipient email" };
    }

    // Get the base URL for the record link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "https://theatomicwork.com");

    // Fetch collectionId from collectionName
    let recordUrl = `${baseUrl}/data/schema`; // Fallback to schema page
    try {
      const db = getAdminDb();
      const collectionsSnapshot = await db
        .collection("collections")
        .where("name", "==", collectionName)
        .limit(1)
        .get();
      
      if (!collectionsSnapshot.empty) {
        const collectionId = collectionsSnapshot.docs[0].id;
        recordUrl = `${baseUrl}/data/${collectionId}/${recordId}`;
      }
    } catch (error) {
      console.warn("[Email] Could not fetch collectionId, using fallback URL:", error);
    }

    // Create HTML email template
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🚨 Alert Notification</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 20px; font-weight: 600;">${subject}</h2>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <p style="margin: 0; color: #374151; font-size: 16px;">${message}</p>
    </div>
    
    <div style="margin: 25px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Details</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Collection:</strong> ${collectionName}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Record ID:</strong> ${recordId}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <a href="${recordUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; transition: opacity 0.2s;">
      View Record →
    </a>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This is an automated alert from Atomic Work. You're receiving this because an alert rule condition was met.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const { data, error } = await resend.emails.send({
      from: "Atomic Work <alerts@theatomicwork.com>", // Update with your verified domain
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("[Email] Error sending alert email:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log(`[Email] ✅ Alert email sent successfully to ${to}. Email ID: ${data?.id}`);
    return { success: true };
  } catch (error) {
    console.error("[Email] Exception sending alert email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

