# AI Copilot Setup

This application uses OpenAI's GPT-4o model for AI-powered workflow generation and task automation.

## Environment Variables

Add the following to your `.env.local` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Fallback Behavior

- When `OPENAI_API_KEY` is missing or OpenAI is temporarily unavailable, `/api/ai/generate-procedure` now returns a deterministic workflow built from the request description.
- The JSON payload includes a `source` field so you can tell whether the steps came from `openai` or the local `fallback` generator.
- Fallback workflows always stay within the 15 Atomic Actions and ensure each step has the required config, so you can keep building while credentials are being configured.
- Add your real API key as soon as possible to regain richer, AI-generated procedures.

## Features

### 1. Magic Builder
- **Location**: Studio Hub (`/studio`)
- **Function**: Converts natural language descriptions into structured workflows
- **Example**: "Employee Expense Reimbursement" → Generates INPUT → IMPORT → COMPARE → AUTHORIZE steps

### 2. AI Worker
- **Location**: Runner Engine (`/run/[id]`)
- **Function**: Automatically executes AI-automated tasks
- **Supported Actions**: GENERATE, TRANSFORM, ORGANISE, CALCULATE
- **How to Enable**: Toggle "AI Automation" in the Config Panel for eligible steps

## API Routes

- `/api/ai/generate-procedure` - Generates workflow steps from description
- `/api/ai/execute-task` - Executes AI-automated tasks

## Usage

1. **Generate a Workflow**:
   - Go to Studio Hub
   - Type a process description in the "Magic Builder" box
   - Click "Generate Workflow with AI"
   - Review and edit the generated steps

2. **Enable AI Automation**:
   - In Procedure Builder, select a GENERATE, TRANSFORM, ORGANISE, or CALCULATE step
   - Toggle "AI Automation" in the Config Panel
   - When the run reaches this step, AI will automatically complete it

