import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = `You are the AI assistant for Atomic Work, a B2B SaaS platform that helps teams break down complex processes into atomic, executable workflows. 

Your role is to:
- Help users understand how Atomic Work can transform their business processes
- Explain features like workflow automation, task management, and process execution
- Provide guidance on breaking down complex tasks into atomic units
- Answer questions about the platform's capabilities
- Be professional, concise, and helpful

Keep responses clear and actionable. If asked about something outside Atomic Work's scope, politely redirect to relevant features or suggest how Atomic Work could help.`;

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Use toTextStreamResponse which is available in ai@5.0.108
    // This returns a text stream that we can parse on the client
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

