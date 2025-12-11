import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generic email sender function
 * Used by both alert system and workflow SEND_EMAIL atom
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY is not set");
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }

    // Validate recipient
    const recipients = Array.isArray(to) ? to : [to];
    const invalidRecipients = recipients.filter((email) => !email || !email.includes("@"));
    if (invalidRecipients.length > 0) {
      console.error("[Email] Invalid recipient email(s):", invalidRecipients);
      return { success: false, error: `Invalid recipient email(s): ${invalidRecipients.join(", ")}` };
    }

    // Validate subject
    if (!subject || !subject.trim()) {
      console.error("[Email] Subject is required");
      return { success: false, error: "Email subject is required" };
    }

    // Validate HTML content
    if (!html || !html.trim()) {
      console.error("[Email] HTML content is required");
      return { success: false, error: "Email HTML content is required" };
    }

    // Default from address
    const fromAddress = from || "Atomic Work <alerts@theatomicwork.com>";

    // Send email
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject: subject.trim(),
      html: html,
    });

    if (error) {
      console.error("[Email] Error sending email:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log(`[Email] ✅ Email sent successfully to ${recipients.join(", ")}. Email ID: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("[Email] Exception sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Helper function to convert plain text to HTML
 * Preserves line breaks and basic formatting
 */
export function textToHtml(text: string): string {
  if (!text) return "";

  // Escape HTML entities
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Convert line breaks to <br> tags
  const withBreaks = escaped.replace(/\n/g, "<br>");

  // Wrap in a simple HTML template
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaped.substring(0, 50)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <div style="color: #374151; font-size: 16px; white-space: pre-wrap;">${withBreaks}</div>
  </div>
</body>
</html>
  `.trim();
}

