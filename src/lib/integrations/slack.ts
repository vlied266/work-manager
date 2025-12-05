/**
 * Slack Integration Utilities
 * 
 * Functions for sending notifications to Slack via webhooks
 */

interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

/**
 * Send a notification to Slack via webhook URL
 * This is a fire-and-forget operation (doesn't block)
 */
export async function sendSlackNotification(
  webhookUrl: string,
  message: SlackMessage
): Promise<void> {
  try {
    // Validate webhook URL
    if (!webhookUrl.startsWith("https://hooks.slack.com/")) {
      console.error("Invalid Slack webhook URL");
      return;
    }

    // Send POST request to Slack webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send Slack notification:", errorText);
    }
  } catch (error) {
    // Silently fail - don't block the main flow
    console.error("Error sending Slack notification:", error);
  }
}

/**
 * Create a Slack message for a new task/run
 */
export function createTaskNotificationMessage(
  taskTitle: string,
  taskPriority?: string,
  runId?: string,
  procedureTitle?: string
): SlackMessage {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://atomicwork.com";
  const runLink = runId ? `${appUrl}/run/${runId}` : appUrl;

  return {
    text: `New Task Created: ${taskTitle}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*New Task in Atomic Work*\nManage your workflow efficiently.",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Title:*\n${taskTitle}`,
          },
          ...(procedureTitle
            ? [
                {
                  type: "mrkdwn" as const,
                  text: `*Procedure:*\n${procedureTitle}`,
                },
              ]
            : []),
          ...(taskPriority
            ? [
                {
                  type: "mrkdwn" as const,
                  text: `*Priority:*\n${taskPriority}`,
                },
              ]
            : []),
        ],
      },
      ...(runId
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `<${runLink}|View Task in Atomic Work>`,
              },
            },
          ]
        : []),
    ],
  };
}

