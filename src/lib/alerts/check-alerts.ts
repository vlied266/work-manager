import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { AlertRule, Notification } from "@/types/alerts";
import { sendAlertEmail } from "@/lib/email/send-alert";

/**
 * Evaluates a JavaScript-like condition against a record
 * Example: "record.total_amount > 5000" -> true/false
 */
function evaluateCondition(condition: string, record: any): boolean {
  try {
    // Ensure condition is a string
    if (typeof condition !== 'string' || !condition.trim()) {
      return false;
    }

    // Basic validation: only allow safe characters (prevent code injection)
    // Allow: letters, numbers, spaces, operators, dots, underscores, parentheses, quotes
    const safePattern = /^[a-zA-Z0-9\s\._<>=\-+*\/()'"&|!]+$/;
    if (!safePattern.test(condition)) {
      console.error(`[Alert Check] Unsafe condition detected: ${condition}`);
      return false;
    }

    // Use Function constructor for evaluation
    // The condition should reference 'record' as the variable name
    const func = new Function('record', `return ${condition}`);
    const result = func(record);
    
    // Return true only if result is explicitly true
    return result === true;
  } catch (error) {
    console.error(`[Alert Check] Error evaluating condition "${condition}":`, error);
    return false;
  }
}

/**
 * Resolves message template with record data
 * Example: "High value invoice: {{invoice_number}}" -> "High value invoice: INV-123"
 */
function resolveMessageTemplate(template: string, record: any): string {
  let message = template;
  
  // Replace {{field_name}} with actual values
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (matches) {
    matches.forEach((match) => {
      const fieldName = match.replace(/\{\{|\}\}/g, '');
      const value = record[fieldName] || record.data?.[fieldName] || '';
      message = message.replace(match, String(value));
    });
  }
  
  return message;
}

/**
 * Checks all alert rules for a collection and creates notifications if conditions are met
 */
export async function checkAlertsForRecord(
  organizationId: string,
  collectionName: string,
  recordId: string,
  recordData: any
): Promise<void> {
  try {
    const db = getAdminDb();

    // Fetch all active alert rules for this collection
    const alertsSnapshot = await db
      .collection("_alerts")
      .where("organizationId", "==", organizationId)
      .where("collectionName", "==", collectionName)
      .where("isActive", "==", true)
      .get();

    if (alertsSnapshot.empty) {
      console.log(`[Alert Check] No active alerts found for collection "${collectionName}"`);
      return;
    }

    console.log(`[Alert Check] Checking ${alertsSnapshot.size} alert rule(s) for collection "${collectionName}"`);

    // Check each alert rule
    for (const alertDoc of alertsSnapshot.docs) {
      const alertRule = alertDoc.data() as AlertRule;

      try {
        // Evaluate condition
        const conditionMet = evaluateCondition(alertRule.condition, recordData);

        if (conditionMet) {
          console.log(`[Alert Check] ✅ ALERT TRIGGERED: ${alertRule.message}`);

          // Resolve message template
          const resolvedMessage = resolveMessageTemplate(alertRule.message, recordData);

          // Create notification (for in_app or both actions)
          if (alertRule.action === 'in_app' || alertRule.action === 'both') {
            const notification: Omit<Notification, 'id'> = {
              alertRuleId: alertDoc.id,
              collectionName: alertRule.collectionName,
              recordId: recordId,
              recordData: recordData,
              message: resolvedMessage,
              action: alertRule.action,
              organizationId: organizationId,
              createdAt: Timestamp.now().toDate(),
              read: false,
            };

            await db.collection("_notifications").add(notification);
            console.log(`[Alert Check] In-app notification created for alert rule: ${alertDoc.id}`);
          }

          // Send email (for email or both actions)
          if (alertRule.action === 'email' || alertRule.action === 'both') {
            try {
              // Determine recipient email
              const recipientEmail = alertRule.recipientEmail || process.env.ADMIN_EMAIL;
              
              if (!recipientEmail) {
                console.warn(`[Alert Check] No recipient email configured for alert rule ${alertDoc.id}. Skipping email.`);
              } else {
                const emailResult = await sendAlertEmail({
                  to: recipientEmail,
                  subject: `Alert: ${resolvedMessage}`,
                  message: resolvedMessage,
                  collectionName: alertRule.collectionName,
                  recordId: recordId,
                  recordData: recordData,
                });

                if (emailResult.success) {
                  console.log(`[Alert Check] ✅ Email sent successfully for alert rule: ${alertDoc.id}`);
                } else {
                  console.error(`[Alert Check] ❌ Failed to send email for alert rule ${alertDoc.id}:`, emailResult.error);
                  // Don't throw - email failure should not break the workflow
                }
              }
            } catch (emailError) {
              console.error(`[Alert Check] Exception sending email for alert rule ${alertDoc.id}:`, emailError);
              // Don't throw - email failure should not break the workflow
            }
          }

          console.log(`[Alert Check] ALERT TRIGGERED: ${resolvedMessage}`);
        } else {
          console.log(`[Alert Check] Condition not met for alert rule: ${alertDoc.id}`);
        }
      } catch (error) {
        console.error(`[Alert Check] Error checking alert rule ${alertDoc.id}:`, error);
        // Continue checking other alerts even if one fails
      }
    }
  } catch (error) {
    console.error(`[Alert Check] Error checking alerts for collection "${collectionName}":`, error);
    // Don't throw - alert checking should not break the main workflow
  }
}

