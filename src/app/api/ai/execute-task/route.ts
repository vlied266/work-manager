import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";

export async function POST(req: NextRequest) {
  try {
    const { step, context, previousOutputs } = await req.json();

    if (!step || !step.action) {
      return NextResponse.json(
        { error: "Step is required" },
        { status: 400 }
      );
    }

    const action = step.action as AtomicAction;
    const config = step.config || {};
    const contextString = JSON.stringify(context, null, 2);
    const previousOutputsString = JSON.stringify(previousOutputs, null, 2);

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "GENERATE":
        systemPrompt = `You are an AI assistant that generates content based on templates and context. 
Generate professional, accurate content following the provided template and using the context data.`;
        userPrompt = `Template: ${config.template || "Generate content"}\n\nContext:\n${contextString}\n\nPrevious Step Outputs:\n${previousOutputsString}\n\nGenerate the content now.`;
        break;

      case "TRANSFORM":
        systemPrompt = `You are an AI assistant that transforms data from one format to another.
Transform the provided data according to the transformation rules.`;
        userPrompt = `Transformation Rule: ${config.transformationRule || "Transform the data"}\n\nData to Transform:\n${contextString}\n\nTransform the data now.`;
        break;

      case "ORGANISE":
        systemPrompt = `You are an AI assistant that organizes and structures data.
Sort, filter, or group the provided data according to the specified rules.`;
        userPrompt = `Organization Rules:\nSort By: ${config.sortBy || "default"}\nGroup By: ${config.groupBy || "none"}\n\nData to Organize:\n${contextString}\n\nOrganize the data now. Return the organized data as JSON.`;
        break;

      case "CALCULATE":
        systemPrompt = `You are an AI assistant that performs calculations.
Calculate the result based on the provided formula and variables.`;
        userPrompt = `Formula: ${config.formula || "Calculate"}\n\nVariables:\n${previousOutputsString}\n\nCalculate the result now. Return only the numeric result.`;
        break;

      default:
        systemPrompt = `You are an AI assistant that processes tasks.
Complete the task based on the provided context and instructions.`;
        userPrompt = `Task: ${step.title}\nDescription: ${step.description || ""}\n\nContext:\n${contextString}\n\nPrevious Outputs:\n${previousOutputsString}\n\nComplete this task.`;
    }

    const result = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent results
      maxTokens: 1000,
    });

    return NextResponse.json({
      output: result.text,
      metadata: {
        model: "gpt-4o",
        tokens: result.usage?.totalTokens || 0,
      },
    });
  } catch (error) {
    console.error("Error executing AI task:", error);
    return NextResponse.json(
      { error: "Failed to execute AI task. Please try again." },
      { status: 500 }
    );
  }
}

