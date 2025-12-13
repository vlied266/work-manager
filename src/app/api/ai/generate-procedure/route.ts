import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { DEFAULT_ENGLISH_PROMPT } from "@/lib/ai/default-prompt";
import OpenAI from "openai";
import { AlertRule } from "@/types/alerts";

const ATOMIC_ACTIONS: AtomicAction[] = [
  // Human Tasks
  "INPUT", "APPROVAL", "MANUAL_TASK", "NEGOTIATE", "INSPECT",
  // Automation Tasks
  "AI_PARSE", "DB_INSERT", "HTTP_REQUEST", "SEND_EMAIL", "GOOGLE_SHEET", "DOC_GENERATE",
  "CALCULATE", "GATEWAY", "VALIDATE", "COMPARE"
];

const GUARDRAIL_CLAUSE = `CRITICAL RULE: You are a strict Process Architect. If the user input is NOT a description of a business process, workflow, or task sequence (e.g., if it is a joke, a greeting, random characters, or code request), you must return a JSON array with a SINGLE step: { "id": "error", "title": "Invalid Request", "action": "INSPECT", "description": "I can only generate business workflows. Please describe a process." }. Do NOT attempt to interpret nonsense.`;

const STRATEGIC_RULES = `
### 🎯 WORKFLOW STRATEGY & BEST PRACTICES:

These rules help you choose the RIGHT step for the RIGHT job and ensure logical workflow design.

---

1. **VALIDATE vs. COMPARE (Critical Distinction):**

   - **Use VALIDATE** when checking the *quality* or *format* of a **single variable**:
     * "Is email valid?"
     * "Is age > 18?"
     * "Is field not empty?"
     * "Does phone number match format?"
     * VALIDATE checks ONE value against rules/criteria.

   - **Use COMPARE** when checking for *reconciliation* between **two different data sources**:
     * "Does Invoice Amount (from AI Parse) match PO Amount (from Database)?"
     * "Does extracted total match calculated total?"
     * "Does user input match stored record?"
     * COMPARE checks TWO values against each other (with optional tolerance).

   **Example:**
   - User says: "Check if email is valid" → Use **VALIDATE** (single value check)
   - User says: "Verify invoice amount matches purchase order" → Use **COMPARE** (two sources)

---

2. **GATEWAY Usage (Business Logic Routing):**

   - Use **GATEWAY** for *business logic branching* (routing decisions):
     * "If Amount > 10k, route to Manager Approval. Else, route to Auto-Save."
     * "If Status is 'VIP', route to Priority Queue. Else, route to Standard Queue."
     * "If Region is 'US', route to US Team. If 'EU', route to EU Team. Else, route to Global Team."

   - **Do NOT** use Gateway for simple data validation errors:
     * ❌ Wrong: Use Gateway to check "if email is invalid, terminate"
     * ✅ Right: Use **VALIDATE** with "On Fail" route to handle validation errors

   - Gateway is for **business decisions**, not **data quality checks**.

---

3. **INPUT & DATA FLOW (Logical Sequence):**

   - **Every workflow usually starts with a TRIGGER or INPUT step** to get data:
     * Manual workflows: Start with **INPUT** step (file upload, form fields)
     * Automated workflows: Start with **TRIGGER** (ON_FILE_CREATED, WEBHOOK)

   - **If the user asks to "Read a file" or "Parse a document":**
     * You MUST place an **AI_PARSE** (Read Document) step immediately after the Trigger/Input.
     * Example: INPUT (file) → AI_PARSE (extract data) → DB_INSERT (save)

   - **Before a DOC_GENERATE step:**
     * Ensure you have collected ALL necessary variables (via Input or AI Parse).
     * Example: INPUT (collect name, date) → DOC_GENERATE (create invoice)

   - **Data Flow Pattern:**
     * Collect → Process → Validate → Save/Notify
     * Example: INPUT → AI_PARSE → VALIDATE → DB_INSERT → SEND_EMAIL

---

4. **LOOPING & CORRECTION (Error Handling):**

   - **If a VALIDATE step fails** (e.g., wrong email format):
     * Route the "On Fail" path back to the **INPUT** step (creating a correction loop).
     * This allows users to fix errors and resubmit.
     * Example: INPUT (email) → VALIDATE (email format) → [On Fail → back to INPUT]

   - **Do NOT** terminate on first validation failure:
     * ❌ Wrong: VALIDATE → [On Fail → __END_FAILURE__]
     * ✅ Right: VALIDATE → [On Fail → INPUT (loop back)]

   - **For critical errors** (e.g., unauthorized access):
     * You may route to __END_FAILURE__ to terminate the workflow.

---

5. **DB SAVING (Final Step Pattern):**

   - **Usually, DB_INSERT (Save to DB) is the last step** in a successful branch:
     * After all validation, processing, and approval steps are complete.
     * Example: INPUT → AI_PARSE → VALIDATE → APPROVAL → DB_INSERT

   - **Exception:** If user wants to send notifications or generate documents AFTER saving:
     * DB_INSERT → SEND_EMAIL (notify user)
     * DB_INSERT → DOC_GENERATE (create receipt)

---

6. **APPROVAL vs. VALIDATE (Human vs. Automated):**

   - **Use APPROVAL** when a **human decision** is required:
     * "Manager must approve", "Require signature", "Needs review"
     * This pauses the workflow and waits for human input.

   - **Use VALIDATE** when an **automated check** is sufficient:
     * "Email format is valid", "Amount is positive", "Required field is not empty"
     * This runs automatically without human intervention.

---

7. **CALCULATE Usage:**

   - Use **CALCULATE** for mathematical operations:
     * "Total = Price × Quantity"
     * "Discount = Amount × 0.1"
     * "Final = Subtotal + Tax - Discount"

   - **Do NOT** use Calculate for simple comparisons (use COMPARE instead).

---

8. **MANUAL_TASK vs. NEGOTIATE vs. INSPECT:**

   - **MANUAL_TASK**: Generic human task (e.g., "Call customer", "Archive document")
   - **NEGOTIATE**: Human-to-human interaction (e.g., "Discuss terms with client")
   - **INSPECT**: Review/audit task (e.g., "Review contract", "Audit invoice")

   Choose based on the nature of the human interaction required.

---

9. **HTTP_REQUEST Usage:**

   - Use **HTTP_REQUEST** to call external APIs:
     * "Fetch customer data from CRM", "Send data to webhook", "Get exchange rates"
   - Use it when you need to integrate with external systems.

---

10. **SEND_EMAIL Usage:**

   - Use **SEND_EMAIL** for notifications:
     * "Send confirmation email", "Notify manager", "Alert user"
   - Usually placed after successful operations (DB_INSERT, APPROVAL, etc.)

---

**Summary Checklist:**

✅ Start with TRIGGER or INPUT to get data
✅ Use AI_PARSE immediately after file input/trigger
✅ Use VALIDATE for single-value quality checks
✅ Use COMPARE for two-source reconciliation
✅ Use GATEWAY for business logic routing (not validation)
✅ Route validation failures back to INPUT (correction loop)
✅ Save to DB as the final step (usually)
✅ Use APPROVAL for human decisions, VALIDATE for automated checks
✅ Collect all data before DOC_GENERATE
✅ Send notifications after successful operations
`;

const GOOGLE_SHEET_INSTRUCTION = `
SPECIAL RULE FOR "GOOGLE_SHEET":

If the user asks to save data to a spreadsheet/excel or read/lookup data from a spreadsheet, use action "GOOGLE_SHEET".

1. **When to Use:**
   - User says: "Save to spreadsheet", "Add to Google Sheet", "Update Excel", "Lookup in sheet", "Read from spreadsheet"
   - User mentions: "Google Sheets", "Excel", "Spreadsheet"

2. **Config Structure (NEW ARCHITECTURE):**

   {
     "spreadsheetId": "abc123...",  // REQUIRED: Google Sheet ID (extract from URL or ask user)
     "sheetName": "Sheet1",  // REQUIRED: Name of the sheet tab
     "operation": "APPEND_ROW" | "UPDATE_ROW" | "LOOKUP_ROW",  // REQUIRED: Default is "APPEND_ROW"
     "columnMapping": {  // REQUIRED if operation === "APPEND_ROW" or "UPDATE_ROW"
       "Header Name": "{{step_1.output.field}}",
       "Email": "{{step_2.output.email}}",
       "Total": "{{step_3.output.total}}"
     },
     "rowNumber": "5",  // REQUIRED if operation === "UPDATE_ROW": Row number to update
     "lookupColumn": "Email",  // REQUIRED if operation === "LOOKUP_ROW": Column header to search
     "lookupValue": "{{step_1.output.email}}"  // REQUIRED if operation === "LOOKUP_ROW": Value to find
   }

3. **Operation Types:**
   - **"APPEND_ROW"** (default): Add a new row to the sheet.
     * Requires "columnMapping" object: { "Column Header": "{{variable}}" }
     * Maps workflow variables to column headers
   - **"UPDATE_ROW"**: Update an existing row.
     * Requires "rowNumber" (row index, e.g., "5")
     * Requires "columnMapping" for fields to update
   - **"LOOKUP_ROW"**: Read/find a row by searching a column.
     * Requires "lookupColumn" (column header name, e.g., "Email")
     * Requires "lookupValue" (value to search for, e.g., "{{step_1.output.email}}")
     * Returns the entire row data as output

4. **Spreadsheet ID:**
   - Extract from Google Sheet URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   - If user provides full URL, extract the ID from it
   - If user only provides name, use placeholder (system will need manual update)

5. **Column Mapping:**
   - Keys are column headers (exact match with sheet headers)
   - Values are workflow variables using mustache syntax: {{step_x.output.fieldName}}
   - Example: { "Name": "{{step_1.output.name}}", "Email": "{{step_1.output.email}}", "Amount": "{{step_2.output.total}}" }

6. **Examples:**
   - User says: "Save invoice data to Google Sheet"
     → action: "GOOGLE_SHEET", config: { 
         spreadsheetId: "abc123...",
         sheetName: "Invoices",
         operation: "APPEND_ROW",
         columnMapping: {
           "Invoice Date": "{{step_1.output.invoice_date}}",
           "Amount": "{{step_1.output.total_amount}}",
           "Vendor": "{{step_1.output.vendor}}"
         }
       }
   
   - User says: "Lookup customer by email in spreadsheet"
     → action: "GOOGLE_SHEET", config: { 
         spreadsheetId: "abc123...",
         sheetName: "Customers",
         operation: "LOOKUP_ROW",
         lookupColumn: "Email",
         lookupValue: "{{step_1.output.email}}"
       }

7. **Output:**
   - APPEND_ROW/UPDATE_ROW: Returns success status
   - LOOKUP_ROW: Returns the found row data as JSON object (accessible via {{step_x.output.fieldName}})
`;

const ASSIGNMENT_INSTRUCTION = `
SPECIAL RULE FOR ASSIGNMENTS (CONTEXT AWARE):

1. **Analyze Context:** The user may assign specific tasks to specific people in a single sentence.

   - Example Input: "Create onboarding. Assign IT setup to @Jack and Welcome Email to @Sara."
   - Example Input: "Create a hiring process. Assign resume review to @David and interview to @Sara."

2. **Mapping Logic:**

   - When generating steps, check if the user linked a specific person to that specific action.

   - If found, look up that person in the "Organization Staff List" and set the \`assignee\` field for THAT step only.

   - Each step should have its own \`assignee\` field based on what the user specified for that particular task.

3. **Global Fallback:**

   - If the user says "Assign the process to @Jack" (global assignment), then assign ALL human steps to Jack.

   - If the user specifies different people for different steps, prioritize the specific assignment over global.

4. **Staff Lookup:** Always use the exact Email or Name found in the staff list. Match names using partial matching (e.g., "@Jack" matches "Jack Smith", "David" matches "David Jones"). If no match is found, leave \`assignee\` empty.

5. **Role-Based Assignment:**

   - If the step is generic (e.g., "Manager Approval") and no specific name is mentioned, try to find a relevant role in the staff list.

   - When generating steps that require human intervention (like "Approval", "Review", "Manual Input", "APPROVAL", "MANUAL_TASK", "INPUT"), you MUST populate the \`assignee\` field if a person is mentioned. If no person is mentioned, choose the most appropriate person from the staff list based on their role.

Examples:
- User says: "Create onboarding. Assign IT setup to @Jack and Welcome Email to @Sara"
  → Step 1 (IT setup): assignee = "jack@test.com" or "Jack Smith"
  → Step 2 (Welcome Email): assignee = "sara@test.com" or "Sara Johnson"
  
- User says: "Create a hiring process. Assign resume review to @David and interview to @Sara"
  → Step 1 (Resume Review): assignee = "david@test.com" or "David Jones"
  → Step 2 (Interview): assignee = "sara@test.com" or "Sara Johnson"
  
- User says: "Assign the process to @Jack" (global)
  → All human steps: assignee = "jack@test.com" or "Jack Smith"
  
- User says: "Manager should review"
  → Find person with Role: "Manager" → Set assignee to their email/name
`;

const METADATA_INSTRUCTION = `
STRUCTURE INSTRUCTION:

You must return a JSON Object (NOT just an array) with this exact structure:

{
  "title": "A short, professional title derived from the request (e.g., 'Employee Onboarding')",
  "description": "A professional summary of what this workflow does (e.g., 'Standard process for new hires, including IT setup and welcome email.')",
  "steps": [ ... array of steps ... ],
  "trigger": { ... optional trigger configuration ... }
}

NAMING RULES (STRICT):

1. **Title:**
   - Must be short, professional, and action-oriented (3-5 words).
   - Example: Instead of "Create a form for resume", use "Candidate Resume Processing".
   - Example: Instead of "Check if price is high", use "High Value Transaction Approval".
   - Example: Instead of "AI Generated Procedure to...", use "Invoice Processing Workflow".
   - DO NOT use phrases like "AI Generated", "Procedure to...", "Create a...", "Make a...", or "Build a...".
   - Focus on the business outcome, not the action of creating it.
   - Use noun phrases that describe what the workflow does (e.g., "Employee Onboarding", "Invoice Approval", "Contract Review").

2. **Description:**
   - Must be a professional summary of what the workflow does (1-2 sentences).
   - Focus on the business outcome and value.
   - Example: "Automates the collection of candidate resumes, extracts key data using AI, and stores valid entries in the Candidates database."
   - Example: "Streamlines the approval process for high-value transactions by routing requests to appropriate managers and tracking decision outcomes."
   - NEVER copy the user's prompt verbatim.
   - DO NOT start with "This workflow..." or "This procedure...". Start directly with what it does.
   - Explain the end-to-end process and its business value.

3. **Language:**
   - If the user prompt is in English, generate English title/description.
   - If the user prompt is in Persian (Farsi), generate Persian title/description.
   - Maintain consistency: both title and description must be in the same language as the user's prompt.

4. **Quality Standards:**
   - Titles should sound like they belong in a professional business application.
   - Descriptions should be clear enough for a business stakeholder to understand the workflow's purpose.
   - Avoid technical jargon unless necessary.
   - Use active voice and present tense in descriptions.

- The "steps" array must follow the atomic step schema as defined before.
- The "trigger" field is optional. Only include it if the user explicitly mentions automatic triggers (e.g., "when a file is uploaded", "automatically start when...").
`;

const SLACK_INSTRUCTION = `
SPECIAL RULE FOR SLACK NOTIFICATIONS:

NOTE: Slack notification functionality is currently not available as a dedicated action. 
If the user requests Slack notifications, you should inform them that this feature is not yet implemented, 
or use alternative actions like "SEND_EMAIL" for notifications.

For future implementation, when Slack support is added:
- Use action "SLACK_NOTIFY" (when available)
- Extract channel names from user input (e.g., "#marketing", "#general")
- Create message templates using mustache variables from previous steps
`;

const DB_INSERT_INSTRUCTION = `
SPECIAL RULE FOR DATA OPERATIONS ("DB_INSERT"):

If the user wants to SAVE/STORE data into a specific table/collection (e.g., "Save to Deals", "Store in Employees table", "Add to Products"):

1. Check if a matching Table Name exists in "Available Tables" (provided above).

2. If yes, generate a step with action: "DB_INSERT".

3. **CRITICAL RULE FOR FIELD NAMING:**
   - You MUST STRICTLY use "snake_case" (lowercase with underscores) for all keys in the \`data\` object.
   - NEVER use camelCase or PascalCase.
   - Examples:
     * User asks for "Start Date" → You MUST use key: "start_date"
     * User asks for "Payment Terms" → You MUST use key: "payment_terms"
     * User asks for "Contract Number" → You MUST use key: "contract_number"
   - This applies to ALL keys in the \`data\` object, including those referencing previous step outputs.

4. **MANDATORY FILE URL FIELD:**
   - You MUST ALWAYS include a "file_url" field in the \`data\` object.
   - Map it to the source file URL:
     * If triggered by file upload (ON_FILE_CREATED): use "{{trigger.fileUrl}}" or "{{trigger.file}}"
     * If file comes from INPUT step: use "{{step_1.output.fileUrl}}" or "{{step_1.output.filePath}}"
     * If file comes from AI_PARSE step: use "{{step_1.output.fileUrl}}" (if available) or fallback to trigger
   - This field is REQUIRED for document verification UI functionality.
   - Example:
     \`\`\`json
     {
       "collectionName": "Contracts",
       "data": {
         "contract_date": "{{step_1.output.contract_date}}",
         "parties": "{{step_1.output.parties}}",
         "file_url": "{{trigger.fileUrl}}"
       }
     }
     \`\`\`

5. In the \`config\` object, you MUST include:

   {
     "collectionName": "Deals",  // Exact name from Available Tables
     "data": {
       "amount": "{{step_1.output.amount}}",
       "customer": "{{step_1.output.customerName}}",
       "status": "{{step_1.output.status}}",
       "file_url": "{{trigger.fileUrl}}"  // MANDATORY: Always include file URL
     }
   }

4. **Field Mapping Logic:**

   - Map fields intelligently using variables from previous steps (mustache syntax: {{step_x.output.fieldName}}).
   
   - Match field keys from the collection's schema to the data being collected.
   
   - If a field name doesn't match exactly, use intelligent matching (e.g., "customerName" → "customer", "totalAmount" → "amount").
   
   - Include all relevant fields from previous steps that match the collection's schema.

5. **Examples:**
   - User says: "Save the deal to Deals table"
     → action: "DB_INSERT", config: { collectionName: "Deals", data: { amount: "{{step_1.output.amount}}", customer: "{{step_1.output.customer}}" } }
   
   - User says: "Store employee information in Employees"
     → action: "DB_INSERT", config: { collectionName: "Employees", data: { name: "{{step_1.output.name}}", role: "{{step_1.output.role}}" } }
   
   - User says: "Add this order to Orders table"
     → action: "DB_INSERT", config: { collectionName: "Orders", data: { orderId: "{{step_1.output.orderId}}", total: "{{step_2.output.total}}" } }

6. **Important:** Only use DB_INSERT if the user explicitly mentions saving to a table/collection. For generic storage, use "STORE" action instead.
`;

const AI_PARSE_INSTRUCTION = `
SPECIAL RULE FOR "AI_PARSE" (Read Document / Document Parser):

If the user wants to EXTRACT/READ/PARSE data from a file (PDF, Excel, Image), use action "AI_PARSE".

1. **When to Use:**
   - User says: "Read the invoice", "Extract data from PDF", "Parse the contract", "Read the Excel file"
   - User mentions extracting specific fields from a document
   - User wants to process uploaded files automatically

2. **Config Structure (NEW ARCHITECTURE):**

   {
     "fileSourceStepId": "step_1" | "TRIGGER_EVENT",  // REQUIRED: ID of step providing file, or "TRIGGER_EVENT" if first step with automated trigger
     "extractionMode": "specific_fields" | "summary_qa" | "full_text",  // REQUIRED: Default is "specific_fields"
     "fieldsToExtract": [  // ONLY if extractionMode === "specific_fields"
       { "name": "invoice_date", "description": "Date of invoice" },
       { "name": "total_amount", "description": "Total amount" },
       { "name": "vendor", "description": "Vendor name" }
     ],
     "prompt": "..."  // ONLY if extractionMode === "summary_qa" - Question or prompt for AI
   }

3. **CRITICAL RULE FOR FIELD NAMING:**
   - You MUST STRICTLY use "snake_case" (lowercase with underscores) for all field names in "fieldsToExtract" array.
   - NEVER use camelCase or PascalCase.
   - Examples:
     * User asks for "Start Date" → You MUST use: "start_date"
     * User asks for "Payment Terms" → You MUST use: "payment_terms"
     * User asks for "Contract Number" → You MUST use: "contract_number"
     * User asks for "Invoice Date" → You MUST use: "invoice_date"
     * User asks for "Total Amount" → You MUST use: "total_amount"

4. **File Source Logic:**
   - **IF AI_PARSE is the FIRST step (index 0) AND procedure has automated trigger (ON_FILE_CREATED or WEBHOOK):**
     * You MUST set \`fileSourceStepId\` to the string literal: \`"TRIGGER_EVENT"\`.
     * The file comes from the trigger, not from a previous step.
   - **IF AI_PARSE comes AFTER an INPUT step:**
     * Set \`fileSourceStepId\` to the ID of the previous INPUT step (e.g., "step_1").
   - **IF AI_PARSE comes AFTER a DOC_GENERATE step:**
     * Set \`fileSourceStepId\` to the ID of the DOC_GENERATE step.

5. **Extraction Modes:**
   - **"specific_fields"** (default): Extract structured data with specific field names.
     * Requires "fieldsToExtract" array with objects: { "name": "field_name", "description": "Field description" }
     * Example: Invoice extraction → fieldsToExtract: [{ "name": "invoice_date", "description": "Invoice date" }, { "name": "total_amount", "description": "Total amount" }]
   - **"summary_qa"**: Generate a summary or answer questions about the document.
     * Requires "prompt" field with the question or instruction.
     * Example: "Summarize the key terms of this contract, specifically liability clauses"
   - **"full_text"**: Extract the entire text content (OCR).
     * No additional fields needed.

6. **Examples:**
   - User says: "Read the invoice and extract date, amount, and vendor"
     → action: "AI_PARSE", config: { 
         fileSourceStepId: "step_1", 
         extractionMode: "specific_fields",
         fieldsToExtract: [
           { "name": "invoice_date", "description": "Date of invoice" },
           { "name": "total_amount", "description": "Total amount" },
           { "name": "vendor", "description": "Vendor name" }
         ]
       }
   
   - User says: "When a file is uploaded, parse it and extract contract details"
     → action: "AI_PARSE", config: { 
         fileSourceStepId: "TRIGGER_EVENT",  // First step with automated trigger
         extractionMode: "specific_fields",
         fieldsToExtract: [
           { "name": "contract_date", "description": "Contract date" },
           { "name": "parties", "description": "Contracting parties" },
           { "name": "expiry_date", "description": "Expiry date" }
         ]
       }
   
   - User says: "Summarize the contract terms"
     → action: "AI_PARSE", config: { 
         fileSourceStepId: "step_1",
         extractionMode: "summary_qa",
         prompt: "Summarize the key terms of this contract, specifically liability clauses and payment terms"
       }

7. **Output:** The AI_PARSE step will output a JSON object with the extracted fields, which can be used in subsequent steps using {{step_x.output.fieldName}}.
`;

const DOC_GENERATE_INSTRUCTION = `
SPECIAL RULE FOR "DOC_GENERATE" (Generate Document):

If the user wants to CREATE/GENERATE a document (Contract, Invoice, Letter, Report, PDF), use action "DOC_GENERATE".

1. **When to Use:**
   - User says: "Create a contract", "Generate an invoice", "Make a PDF", "Create a document"
   - User mentions: "Generate [document type]", "Create [document type] from template"
   - User wants to produce a formatted document automatically

2. **Config Structure (NEW ARCHITECTURE):**

   {
     "sourceType": "template" | "inline",  // REQUIRED: "template" for DOCX template, "inline" for HTML/text content
     "templateId": "template_123",  // REQUIRED if sourceType === "template": ID of template record in 'templates' collection
     "dataMapping": {  // REQUIRED if sourceType === "template": Maps template placeholders to variables
       "{{clientName}}": "{{step_1.output.name}}",
       "{{invoiceDate}}": "{{step_2.output.date}}",
       "{{totalAmount}}": "{{step_3.output.total}}"
     },
     "inlineContent": "<html>...</html>",  // REQUIRED if sourceType === "inline": HTML/Text content with variables
     "outputFormat": "pdf"  // Optional: "pdf" (default) or "docx"
   }

3. **Source Types:**
   - **"template"**: Use an uploaded DOCX template file.
     * Requires "templateId": ID of the template (from /dashboard/templates)
     * Requires "dataMapping": Object mapping template placeholders to workflow variables
     * Example: { "{{clientName}}": "{{step_1.output.name}}", "{{amount}}": "{{step_1.output.total}}" }
   - **"inline"**: Generate document from inline HTML/text content.
     * Requires "inlineContent": HTML or plain text with variables
     * Example: "<h1>Invoice</h1><p>Client: {{step_1.output.name}}</p><p>Amount: {{step_1.output.total}}</p>"

4. **Template ID:**
   - If user names a template (e.g., "Service Agreement", "Invoice Template", "Contract Template"), try to find its ID.
   - If template name is unknown, use a placeholder like "invoice_template" or "contract_template".
   - The template must exist in the 'templates' collection (uploaded via /dashboard/templates).

5. **Data Mapping (for templates):**
   - Maps template placeholders (e.g., "{{clientName}}") to workflow variables (e.g., "{{step_1.output.name}}")
   - Keys are template placeholder names (must match what's in the DOCX template)
   - Values are workflow variables using mustache syntax
   - Example: { "{{clientName}}": "{{step_1.output.name}}", "{{invoiceDate}}": "{{step_2.output.date}}" }

6. **Inline Content (for inline mode):**
   - Can be HTML or plain text
   - Use variables with mustache syntax: {{step_x.output.fieldName}}
   - Example: "<h1>Invoice #{{step_1.output.invoice_number}}</h1><p>Client: {{step_1.output.client_name}}</p>"

7. **Examples:**
   - User says: "Create an invoice using the invoice template with client name and amount"
     → action: "DOC_GENERATE", config: { 
         sourceType: "template",
         templateId: "invoice_template",
         dataMapping: {
           "{{clientName}}": "{{step_1.output.name}}",
           "{{amount}}": "{{step_1.output.amount}}"
         }
       }
   
   - User says: "Generate a simple contract document"
     → action: "DOC_GENERATE", config: { 
         sourceType: "inline",
         inlineContent: "<h1>Contract Agreement</h1><p>Party 1: {{step_1.output.party1}}</p><p>Party 2: {{step_1.output.party2}}</p><p>Date: {{step_2.output.date}}</p>"
       }
   
   - User says: "Create a PDF invoice from template"
     → action: "DOC_GENERATE", config: { 
         sourceType: "template",
         templateId: "invoice_template",
         dataMapping: {
           "{{invoiceNumber}}": "{{step_1.output.invoice_number}}",
           "{{clientName}}": "{{step_1.output.client}}",
           "{{total}}": "{{step_2.output.total}}"
         },
         outputFormat: "pdf"
       }

8. **Output:** The DOC_GENERATE step will output { fileUrl: "...", fileName: "..." }, which can be used in subsequent steps (e.g., email attachment, storage) using {{step_x.output.fileUrl}}.

9. **Important:** DOC_GENERATE is an AUTOMATED step (no assignee needed). It runs automatically and generates the document.
`;

const GATEWAY_INSTRUCTION = `
SPECIAL RULE FOR "GATEWAY" (Conditional Branching):

If the user wants to split the workflow into multiple paths based on conditions (If/Else logic), use action "GATEWAY".

1. **When to Use:**
   - User says: "If amount is over 10k, route to manager", "Check if status is approved", "Split based on value"
   - User mentions: "If... then...", "Route based on...", "Conditional logic"

2. **Config Structure (NEW ARCHITECTURE):**

   {
     "conditions": [  // REQUIRED: Array of condition objects
       {
         "label": "High Value",  // REQUIRED: Human-readable name for this route (e.g., "VIP", "Approved", "High Value > 10k")
         "variable": "{{step_1.output.amount}}",  // REQUIRED: Variable to check
         "operator": "gt",  // REQUIRED: One of: "eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains", "starts_with", "is_empty", "is_not_empty"
         "value": "10000",  // REQUIRED: Value to compare against
         "nextStepId": "step_3"  // REQUIRED: Step ID to go to if condition is true
       },
       {
         "label": "Standard",
         "variable": "{{step_1.output.amount}}",
         "operator": "lte",
         "value": "10000",
         "nextStepId": "step_4"
       }
     ],
     "defaultNextStepId": "step_5"  // REQUIRED: Step ID to go to if NO conditions match (the "else" case)
   }

3. **Operators:**
   - **"eq"**: Equals (==)
   - **"neq"**: Not Equals (!=)
   - **"gt"**: Greater Than (>)
   - **"gte"**: Greater Than or Equal (>=)
   - **"lt"**: Less Than (<)
   - **"lte"**: Less Than or Equal (<=)
   - **"contains"**: String contains text
   - **"not_contains"**: String does not contain text
   - **"starts_with"**: String starts with text
   - **"is_empty"**: Value is empty/null
   - **"is_not_empty"**: Value is not empty

4. **Label Field:**
   - Each condition MUST have a "label" field.
   - This label appears on the visual canvas connection point.
   - Use descriptive names: "High Value", "VIP", "Approved", "Rejected", "Standard"
   - Example: "High Value > 10k", "VIP Customer", "Needs Review"

5. **Condition Evaluation:**
   - Conditions are evaluated in order (top to bottom).
   - First matching condition routes to its nextStepId.
   - If no conditions match, route to defaultNextStepId.

6. **Examples:**
   - User says: "If amount is over 10k, route to manager approval, else route to standard approval"
     → action: "GATEWAY", config: {
         conditions: [
           {
             label: "High Value",
             variable: "{{step_1.output.amount}}",
             operator: "gt",
             value: "10000",
             nextStepId: "step_3"
           }
         ],
         defaultNextStepId: "step_4"
       }
   
   - User says: "Route based on status: if approved go to step 3, if rejected go to step 4, else go to step 5"
     → action: "GATEWAY", config: {
         conditions: [
           {
             label: "Approved",
             variable: "{{step_1.output.status}}",
             operator: "eq",
             value: "approved",
             nextStepId: "step_3"
           },
           {
             label: "Rejected",
             variable: "{{step_1.output.status}}",
             operator: "eq",
             value: "rejected",
             nextStepId: "step_4"
           }
         ],
         defaultNextStepId: "step_5"
       }

7. **Output:** Gateway steps don't produce output. They route the workflow to different steps based on conditions.
`;

const VALIDATE_INSTRUCTION = `
SPECIAL RULE FOR "VALIDATE" (Data Validation):

If the user wants to CHECK/VALIDATE data (email format, required field, value range), use action "VALIDATE".

1. **When to Use:**
   - User says: "Validate email", "Check if required", "Ensure amount is positive", "Verify phone number"
   - User mentions: "Validate", "Check", "Verify", "Ensure"

2. **Config Structure (NEW ARCHITECTURE):**

   {
     "target": "{{step_1.output.email}}",  // REQUIRED: Variable to validate (renamed from "valueToValidate" for consistency)
     "rule": "IS_VALID_EMAIL",  // REQUIRED: Validation rule type
     "value": "100",  // CONDITIONAL: Only required if rule needs comparison (e.g., "gt", "lt", "contains", "eq")
     "errorMessage": "Email format is invalid",  // Optional: Custom error message
     "routes": {  // REQUIRED: Routing configuration
       "onSuccessStepId": "step_3",  // Step to go to if validation passes
       "onFailureStepId": "step_4"  // Step to go to if validation fails (or "__END_FAILURE__" to terminate)
     }
   }

3. **Validation Rules:**
   - **"IS_NOT_EMPTY"**: Value must not be empty (Required field check)
     * No "value" field needed
   - **"IS_VALID_EMAIL"**: Value must be a valid email format
     * No "value" field needed
   - **"IS_VALID_PHONE"**: Value must be a valid phone number format
     * No "value" field needed
   - **"CONTAINS"**: Value must contain specified text
     * Requires "value" field: text to find
   - **"GREATER_THAN"**: Value must be greater than specified number
     * Requires "value" field: limit number
   - **"LESS_THAN"**: Value must be less than specified number
     * Requires "value" field: limit number
   - **"EQUAL"**: Value must equal specified value
     * Requires "value" field: expected value
   - **"REGEX"**: Value must match regex pattern
     * Requires "value" field: regex pattern

4. **Routing:**
   - **"onSuccessStepId"**: Step to go to if validation passes (default: next step)
   - **"onFailureStepId"**: Step to go to if validation fails
     * Can be a step ID (e.g., "step_2") to loop back for correction
     * Can be "__END_FAILURE__" to terminate the workflow
     * Can be "__END_SUCCESS__" to complete successfully

5. **Error Message:**
   - Optional but recommended for better UX
   - Should explain what went wrong
   - Example: "Email format is invalid", "Amount must be greater than 0", "This field is required"

6. **Examples:**
   - User says: "Validate that email is in correct format"
     → action: "VALIDATE", config: {
         target: "{{step_1.output.email}}",
         rule: "IS_VALID_EMAIL",
         errorMessage: "Email format is invalid",
         routes: {
           onSuccessStepId: "step_3",
           onFailureStepId: "step_2"  // Loop back to input step
         }
       }
   
   - User says: "Check if amount is greater than 100"
     → action: "VALIDATE", config: {
         target: "{{step_1.output.amount}}",
         rule: "GREATER_THAN",
         value: "100",
         errorMessage: "Amount must be greater than 100",
         routes: {
           onSuccessStepId: "step_3",
           onFailureStepId: "__END_FAILURE__"
         }
       }
   
   - User says: "Ensure the field is not empty"
     → action: "VALIDATE", config: {
         target: "{{step_1.output.name}}",
         rule: "IS_NOT_EMPTY",
         errorMessage: "Name is required",
         routes: {
           onSuccessStepId: "step_3",
           onFailureStepId: "step_1"  // Loop back
         }
       }

7. **Output:** Validate steps don't produce output. They route the workflow based on validation result.
`;

const TRIGGER_INSTRUCTION = `
### 🧠 PROCEDURE GENERATION RULES (STRICT)

You must generate a JSON object representing the procedure. Follow these rules for the "trigger" section and the "steps" array separately.

---

### PART 1: TRIGGER RULES (The Start)

Determine how the procedure starts based on the user's intent:

**A) AUTOMATED WATCHER (User says "Watch folder", "Monitor Drive", "When file arrives")**

* Set \`procedure.trigger\`:
  \`\`\`json
  {
    "type": "ON_FILE_CREATED",
    "config": { "provider": "google_drive", "folderPath": "/extracted_path" }
  }
  \`\`\`
* **CRITICAL:** Do NOT create an INPUT step. The file is already provided by the trigger.
* **Data Source:** Use \`{{trigger.file}}\` or \`{{trigger.fileUrl}}\` in the first step (e.g., AI_PARSE).

**B) MANUAL UPLOAD (User says "Create form", "Upload file", "Attach resume")**

* Set \`procedure.trigger\`:
  \`\`\`json
  { "type": "MANUAL" }
  \`\`\`
* **CRITICAL:** You MUST create an INPUT step (type='file') as Step 1.
* **Data Source:** Use \`{{step_1.output.fileUrl}}\` or \`fileSourceStepId: "step_1"\` in subsequent steps.

**C) WEBHOOK (User says "Webhook", "API trigger", "External system calls")**

* Set \`procedure.trigger\`:
  \`\`\`json
  { "type": "WEBHOOK" }
  \`\`\`
* Webhook URL and secret will be auto-generated by the system.

**D) DEFAULT (No trigger mentioned)**

* Set \`procedure.trigger\`:
  \`\`\`json
  { "type": "MANUAL" }
  \`\`\`
* User starts the workflow manually.

---

### PART 2: STEP WHITELIST (The Body)

For the \`steps\` array, you are ONLY allowed to use the following types. Any action not listed here must be mapped to the closest type or "MANUAL_TASK".

✅ **ALLOWED AUTOMATION STEPS:**

* **AI_PARSE** - Extract data from file.
  * If Trigger is automated: source is \`{{trigger.file}}\`
  * If Manual: source is \`{{step_1.output.fileUrl}}\` or use \`fileSourceStepId: "step_1"\`
* **DB_INSERT** - Save to database
* **HTTP_REQUEST** - Call APIs (replaces FETCH)
* **SEND_EMAIL** - Send email notifications
* **GOOGLE_SHEET** - Append/update Google Sheets
* **DOC_GENERATE** - Generate PDF documents
* **CALCULATE** - Perform calculations
* **GATEWAY** - Conditional branching logic
* **VALIDATE** - Validate data
* **COMPARE** - Compare values

✅ **ALLOWED HUMAN STEPS:**

* **INPUT** - Only if Trigger is MANUAL (for file uploads or form inputs)
* **APPROVAL** - Require approval from a user
* **MANUAL_TASK** - Generic manual task
* **NEGOTIATE** - Negotiation step
* **INSPECT** - Inspection step

⛔️ **FORBIDDEN:**

* NEVER use "FETCH" as a step type (use "HTTP_REQUEST" instead)
* NEVER use "TRIGGER" as a step type (triggers are procedure settings, not steps)
* NEVER use "UPLOAD" as a step type (use "INPUT" with type='file' instead)
* NEVER use "STORE", "TRANSFORM", "ORGANISE", "MOVE_OBJECT", "TRANSFORM_OBJECT" (these are deprecated)

---

### EXAMPLES:

**Example 1: Manual File Upload (NO AUTOMATED TRIGGER)**
User: "Create a form where users upload their resume"
Response:
\`\`\`json
{
  "title": "Resume Collection Form",
  "description": "Collects candidate resumes through an interactive form.",
  "trigger": { "type": "MANUAL" },
  "steps": [
    {
      "id": "step_1",
      "title": "Upload Resume",
      "action": "INPUT",
      "config": {
        "inputType": "file",
        "fieldLabel": "Resume File",
        "allowedExtensions": [".pdf", ".doc", ".docx"]
      }
    },
    {
      "id": "step_2",
      "title": "Extract Resume Data",
      "action": "AI_PARSE",
      "config": {
        "fileSourceStepId": "step_1",
        "fieldsToExtract": ["name", "email", "experience", "skills"]
      }
    }
  ]
}
\`\`\`

**Example 2: Automated File Watcher (WITH TRIGGER)**
User: "When a file is uploaded to /uploads/contracts, parse it and save to Contracts table"
Response:
\`\`\`json
{
  "title": "Contract Processing Automation",
  "description": "Automatically processes uploaded contracts, extracts data, and saves to database.",
  "trigger": {
    "type": "ON_FILE_CREATED",
    "config": {
      "provider": "google_drive",
      "folderPath": "/uploads/contracts"
    }
  },
  "steps": [
    {
      "id": "step_1",
      "title": "Parse Contract Document",
      "action": "AI_PARSE",
      "config": {
        "fileUrl": "{{trigger.file}}",
        "fieldsToExtract": ["contractDate", "parties", "expiryDate", "terms"],
        "fileType": "pdf"
      }
    },
    {
      "id": "step_2",
      "title": "Save to Contracts Table",
      "action": "DB_INSERT",
      "config": {
        "collectionName": "Contracts",
        "data": {
          "contractDate": "{{step_1.output.contractDate}}",
          "parties": "{{step_1.output.parties}}",
          "expiryDate": "{{step_1.output.expiryDate}}",
          "terms": "{{step_1.output.terms}}"
        }
      }
    }
  ]
}
\`\`\`

**CRITICAL REMINDERS:**
1. Triggers are procedure settings (at the top level), NOT steps.
2. Steps are actions that execute in sequence.
3. If trigger is ON_FILE_CREATED, do NOT create an INPUT step for file upload.
4. If trigger is MANUAL and user wants file upload, you MUST create an INPUT step.
5. Always use the whitelist of allowed step types. Map unknown actions to the closest match.
`;

/**
 * Helper function to create a database collection
 */
async function createDatabaseCollection(
  orgId: string,
  name: string,
  fields: Array<{ label: string; key: string; type: string }>
): Promise<{ id: string; name: string; fields: any[] }> {
  const adminDb = getAdminDb();
  const now = Timestamp.now();

  // Validate fields
  for (const field of fields) {
    if (!field.key || !field.label || !field.type) {
      throw new Error("Each field must have key, label, and type");
    }
    if (!["text", "number", "date", "boolean", "select"].includes(field.type)) {
      throw new Error(`Invalid field type: ${field.type}`);
    }
  }

  // CRITICAL: Always ensure file_url field exists
  const hasFileUrl = fields.some(f => f.key === "file_url");
  if (!hasFileUrl) {
    fields.push({
      label: "File URL",
      key: "file_url",
      type: "text",
    });
    console.log("[AI Generator] Automatically added file_url field to collection:", name);
  }

  const collectionData = {
    orgId,
    name,
    fields,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await adminDb.collection("collections").add(collectionData);

  return {
    id: docRef.id,
    name,
    fields,
  };
}

/**
 * Helper function to update collection with dashboard layout
 */
async function updateCollectionDashboardLayout(
  collectionId: string,
  widgets: Array<{
    id: string;
    type: 'stat_card' | 'bar_chart' | 'line_chart' | 'pie_chart';
    title: string;
    field: string;
    operation?: 'sum' | 'count' | 'avg';
    xAxis?: string;
    yAxis?: string;
  }>
): Promise<void> {
  const adminDb = getAdminDb();
  const now = Timestamp.now();

  await adminDb.collection("collections").doc(collectionId).update({
    dashboardLayout: {
      widgets,
    },
    updatedAt: now,
  });

  console.log(`[AI Generator] Dashboard layout saved for collection ${collectionId} with ${widgets.length} widgets`);
}

/**
 * Helper function to create an alert rule
 * Uses AI to convert natural language condition descriptions to JavaScript conditions
 */
async function createAlertRule(
  orgId: string,
  collectionName: string,
  conditionDescription: string,
  messageTemplate?: string,
  action: 'email' | 'in_app' | 'both' = 'in_app'
): Promise<{ id: string; collectionName: string; condition: string; message: string }> {
  const adminDb = getAdminDb();
  const now = Timestamp.now();

  // Fetch collection to get field names for better condition generation
  let collectionFields: string[] = [];
  try {
    const collectionsSnapshot = await adminDb
      .collection("collections")
      .where("orgId", "==", orgId)
      .where("name", "==", collectionName)
      .limit(1)
      .get();
    
    if (!collectionsSnapshot.empty) {
      const collectionData = collectionsSnapshot.docs[0].data();
      collectionFields = (collectionData.fields || []).map((f: any) => f.key);
    }
  } catch (error) {
    console.warn(`[AI Generator] Could not fetch collection fields for "${collectionName}":`, error);
  }

  // Use AI to convert natural language to JavaScript condition
  let condition = "";
  try {
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const fieldsContext = collectionFields.length > 0 
      ? `Available fields in this collection: ${collectionFields.join(", ")}`
      : "No field information available. Use common field names like 'total_amount', 'amount', 'status', etc.";

    const aiResponse = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini", // Use cheaper model for simple parsing
      messages: [
        {
          role: "system",
          content: `You are a condition parser. Convert natural language descriptions into JavaScript-like conditions that evaluate against a 'record' object.

${fieldsContext}

Rules:
- The condition must reference 'record' as the variable (e.g., "record.total_amount > 5000")
- Use snake_case for field names (e.g., "total_amount", "invoice_date", "status")
- Support operators: >, <, >=, <=, ===, !==
- For string comparisons, use === with quotes (e.g., record.status === 'expired')
- For numeric comparisons, use numbers directly (e.g., record.amount > 5000)
- Return ONLY the condition expression, nothing else

Examples:
- "amount is over 5000" -> "record.total_amount > 5000"
- "status equals expired" -> "record.status === 'expired'"
- "total is greater than 10000" -> "record.total_amount > 10000"
- "value is under 100" -> "record.total_amount < 100"`,
        },
        {
          role: "user",
          content: `Convert this condition description to a JavaScript condition: "${conditionDescription}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    condition = aiResponse.choices[0]?.message?.content?.trim() || "";
    
    // Validate the condition
    if (!condition || !condition.includes("record.")) {
      throw new Error("AI did not generate a valid condition");
    }

    console.log(`[AI Generator] AI-generated condition: "${condition}"`);
  } catch (error) {
    console.error(`[AI Generator] Error using AI to parse condition, using fallback:`, error);
    
    // Fallback: Simple pattern matching
    const lowerDesc = conditionDescription.toLowerCase();
    
    // Pattern: "amount is over X" or "amount > X"
    const overMatch = lowerDesc.match(/(?:amount|total|value|price|cost).*(?:over|greater|more than|above)\s*(\d+[k]?)/i);
    if (overMatch) {
      const value = overMatch[1].replace('k', '000');
      condition = `record.total_amount > ${value}`;
    }
    // Pattern: "amount is under X" or "amount < X"
    else if (lowerDesc.match(/(?:amount|total|value|price|cost).*(?:under|less than|below)\s*(\d+[k]?)/i)) {
      const underMatch = lowerDesc.match(/(?:amount|total|value|price|cost).*(?:under|less than|below)\s*(\d+[k]?)/i);
      if (underMatch) {
        const value = underMatch[1].replace('k', '000');
        condition = `record.total_amount < ${value}`;
      }
    }
    // Pattern: "status is X" or "status == X"
    else if (lowerDesc.match(/status.*(?:is|equals?|==)\s*['"]?(\w+)['"]?/i)) {
      const statusMatch = lowerDesc.match(/status.*(?:is|equals?|==)\s*['"]?(\w+)['"]?/i);
      if (statusMatch) {
        const status = statusMatch[1];
        condition = `record.status === '${status}'`;
      }
    }
    // Default fallback
    else {
      condition = `record.total_amount > 0`; // Default fallback
      console.warn(`[AI Generator] Could not parse condition from: "${conditionDescription}". Using fallback.`);
    }
  }

  // Generate message template if not provided
  const message = messageTemplate || `Alert: Condition met in ${collectionName} - ${conditionDescription}`;

  const alertRule: Omit<AlertRule, 'id'> = {
    collectionName,
    condition,
    message,
    action: action, // Use provided action
    organizationId: orgId,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    isActive: true,
  };

  const docRef = await adminDb.collection("_alerts").add(alertRule);

  console.log(`[AI Generator] Alert rule created: ${docRef.id} for collection "${collectionName}" with condition: "${condition}"`);

  return {
    id: docRef.id,
    collectionName,
    condition,
    message,
  };
}

const CONFIGURATION_REFINEMENT_RULES = `
### 🔧 CONFIGURATION REFINEMENT RULES

These rules ensure precise variable mapping and data flow between steps.

1. **FILE SOURCE LOGIC (For AI_PARSE):**

   * **CRITICAL RULE:** IF AI_PARSE is the **very first step** (index 0) AND the procedure has an Automated Trigger (ON_FILE_CREATED or WEBHOOK):
     * You MUST set \`fileSourceStepId\` to the string literal: \`"TRIGGER_EVENT"\`.
     * This is NOT optional. The file comes from the trigger, not from a previous step.
     * Example:
       \`\`\`json
       {
         "id": "step_1",
         "action": "AI_PARSE",
         "config": {
           "fileSourceStepId": "TRIGGER_EVENT",
           "fieldsToExtract": ["invoiceDate", "amount", "vendor"]
         }
       }
       \`\`\`

   * IF AI_PARSE is NOT the 1st step (comes after an INPUT step):
     * Set fileSourceStepId to the ID of the previous INPUT step (e.g., "step_1").
     * Example:
       \`\`\`json
       {
         "id": "step_2",
         "action": "AI_PARSE",
         "config": {
           "fileSourceStepId": "step_1",
           "fieldsToExtract": ["name", "email", "experience"]
         }
       }
       \`\`\`

2. **VARIABLE REFERENCING LOGIC:**

   * When mapping data in Step N, you MUST reference the output of **Previous Steps** (Step N-1, N-2...), NEVER the current step.
   * Step numbering starts at 1 (step_1, step_2, step_3...).
   * Example: In Step 2 (DB_INSERT), use {{step_1.output.name}}, NOT {{step_2.output.name}}.
   * Example: In Step 3 (SEND_EMAIL), use {{step_1.output.email}} or {{step_2.output.result}}, NOT {{step_3.output.email}}.

   * **Correct Pattern:**
     \`\`\`json
     {
       "id": "step_1",
       "action": "INPUT",
       "config": { "inputType": "text", "fieldLabel": "Customer Name" }
     },
     {
       "id": "step_2",
       "action": "DB_INSERT",
       "config": {
         "collectionName": "Customers",
         "data": {
           "name": "{{step_1.output.customerName}}",  // ✅ References step_1
           "status": "active"
         }
       }
     }
     \`\`\`

   * **Incorrect Pattern:**
     \`\`\`json
     {
       "id": "step_2",
       "action": "DB_INSERT",
       "config": {
         "data": {
           "name": "{{step_2.output.name}}"  // ❌ Self-reference - WRONG!
         }
       }
     }
     \`\`\`

3. **DATA MAPPING KEYS (CRITICAL FOR DB_INSERT AND GOOGLE_SHEET):**

   ### 🔧 DATA MAPPING KEY RULES (CRITICAL)

   When creating the JSON mapping for \`DB_INSERT\` (or Google Sheets):

   1. **INFER THE KEY NAME (MANDATORY):**
      * Look at the value you are mapping (e.g., \`{{step_1.output.customerEmail}}\`).
      * Extract the core business noun from the variable path (e.g., "email" from "customerEmail").
      * Use that noun as the **Key** (left side).
      * **Rule:** The Key MUST match the semantic meaning of the data being stored.
      * IF the value is \`{{step_1.output.email}}\`, the Key MUST be \`"email"\`.
      * IF the value is \`{{step_1.output.customer_name}}\`, the Key MUST be \`"customer_name"\` or \`"name"\`.
      * IF the value is \`{{step_1.output.invoice_date}}\`, the Key MUST be \`"invoice_date"\` or \`"date"\`.
      * IF you extracted fields ["Invoice Date", "Total Amount"] in AI_PARSE, the Keys MUST be \`"invoice_date"\` and \`"total_amount"\` (snake_case).

   2. **FORMAT REQUIREMENTS (CRITICAL):**
      * Keys MUST be **snake_case** (lowercase with underscores). NEVER use camelCase or PascalCase.
      * Keys must be meaningful, semantic names that describe the data (e.g., "address", "total_amount", "phone_number").
      * Keys must match the collection schema if provided, or use standard business terminology.

   3. **STRICTLY FORBIDDEN:**
      * NEVER use \`"field_"\`, \`"field_1"\`, \`"field_2"\`, \`"column_A"\`, \`"key_"\`, \`"value_"\`, or empty strings as keys.
      * NEVER assume the database uses generic IDs. Assume it uses semantic names like "address", "totalAmount", "customerName".
      * NEVER use placeholder names. Every key must have a clear business meaning.

   3. **EXTRACTION LOGIC:**
      * For AI_PARSE outputs: Use the exact field names from \`fieldsToExtract\` array, normalized to camelCase.
      * Example: If \`fieldsToExtract: ["Customer Name", "Email Address"]\`, use keys \`"customerName"\` and \`"emailAddress"\`.
      * For INPUT step outputs: Use the \`fieldLabel\` normalized to camelCase, or infer from context.
      * If collection schema is provided: Match the field keys from the schema exactly.

   4. **NORMALIZATION:**
      * Convert spaces to camelCase: "Invoice Date" → "invoiceDate"
      * Convert to lowercase with underscores if preferred: "Invoice Date" → "invoice_date"
      * Remove special characters and keep alphanumeric + underscore only.
      * Prefer camelCase over snake_case for consistency.

   **Example of CORRECT Output:**
   \`\`\`json
   {
     "action": "DB_INSERT",
     "config": {
       "collectionName": "Customers",
       "data": {
         "email": "{{step_1.output.email}}",
         "full_name": "{{step_1.output.name}}",
         "phone_number": "{{step_1.output.phone}}",
         "status": "New"
       }
     }
   }
   \`\`\`
   ✅ **RIGHT:** Keys are meaningful English words in snake_case (email, full_name, phone_number, status)

   **Example of WRONG Output (BANNED):**
   \`\`\`json
   {
     "action": "DB_INSERT",
     "config": {
       "collectionName": "Customers",
       "data": {
         "field_": "{{step_1.output.email}}",     // ❌ WRONG - Generic key
         "field_1": "{{step_1.output.name}}",      // ❌ WRONG - Generic key
         "column_A": "{{step_1.output.phone}}",   // ❌ WRONG - Generic key
         "": "{{step_1.output.status}}"           // ❌ WRONG - Empty key
       }
     }
   }
   \`\`\`
   ❌ **WRONG:** Keys are generic placeholders that don't exist in the database

   **Real-World Example:**
   User says: "Parse invoice and save invoice number, date, and amount to Invoices table"
   
   AI_PARSE step extracts: \`fieldsToExtract: ["invoice_number", "invoice_date", "total_amount"]\` (snake_case)
   
   DB_INSERT step MUST use:
   \`\`\`json
   {
     "action": "DB_INSERT",
     "config": {
       "collectionName": "Invoices",
       "data": {
         "invoice_number": "{{step_1.output.invoice_number}}",
         "invoice_date": "{{step_1.output.invoice_date}}",
         "total_amount": "{{step_1.output.total_amount}}"
       }
     }
   }
   \`\`\`
   
   NOT:
   \`\`\`json
   {
     "data": {
       "field_1": "{{step_1.output.invoice_number}}",  // ❌ BANNED
       "field_2": "{{step_1.output.invoice_date}}",    // ❌ BANNED
       "field_3": "{{step_1.output.total_amount}}"     // ❌ BANNED
     }
   }
   \`\`\`

   * **Correct Pattern:**
     \`\`\`json
     {
       "action": "DB_INSERT",
       "config": {
         "collectionName": "Invoices",
         "data": {
           "invoice_number": "{{step_1.output.invoice_number}}",
           "amount": "{{step_1.output.total}}",
           "vendor": "{{step_1.output.vendor_name}}",
           "due_date": "{{step_1.output.due_date}}"
         }
       }
     }
     \`\`\`

   * **Incorrect Pattern:**
     \`\`\`json
     {
       "action": "DB_INSERT",
       "config": {
         "collectionName": "Invoices",
         "data": {
           "field_1": "{{step_1.output.invoiceNumber}}",  // ❌ Generic key
           "field_2": "{{step_1.output.total}}",          // ❌ Generic key
           "": "{{step_1.output.vendorName}}"             // ❌ Empty key
         }
       }
     }
     \`\`\`

   * **Inference Guidelines:**
     * If user says "save invoice number", use key "invoice_number" (snake_case).
     * If user says "store customer name", use key "customer_name" (snake_case).
     * If collection schema is provided, match the field keys from the schema.
     * ALWAYS use snake_case (lowercase with underscores). NEVER use camelCase or PascalCase.

4. **STEP OUTPUT VARIABLE NAMES:**

   * When referencing step outputs, use the actual field names from the step's output.
   * For INPUT steps: Use {{step_N.output.fieldName}} where fieldName matches the input field label (normalized).
   * For AI_PARSE steps: Use {{step_N.output.extractedFieldName}} where extractedFieldName matches the fieldsToExtract array.
   * For other steps: Use {{step_N.output.result}} or the specific output field name.

   * Example:
     \`\`\`json
     {
       "id": "step_1",
       "action": "INPUT",
       "config": { "fieldLabel": "Customer Email" }
     },
     {
       "id": "step_2",
       "action": "SEND_EMAIL",
       "config": {
         "recipient": "{{step_1.output.customerEmail}}",  // ✅ Matches fieldLabel
         "subject": "Welcome"
       }
     }
     \`\`\`

**CRITICAL: Always validate that:**
- File sources are correctly set for AI_PARSE steps.
- Variable references point to previous steps, never the current step.
- Data mapping keys are meaningful and match the business context.
`;

function formatStaffList(staff: Array<{ displayName?: string; role?: string; email?: string }>): string {
  if (!staff.length) {
    return "- No staff records available for this organization.";
  }

  return staff
    .map((member) => {
      const name = member.displayName || member.email?.split("@")[0] || "Unknown";
      const role = member.role || "Unknown";
      const email = member.email || "Not provided";
      return `- Name: ${name}, Email: ${email}`;
    })
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { description, orgId } = await req.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Check AI plan limit
    if (orgId) {
      try {
        const adminDb = getAdminDb();
        const orgDoc = await adminDb.collection("organizations").doc(orgId).get();
        
        if (orgDoc.exists) {
          const orgData = orgDoc.data();
          const plan = (orgData?.plan || "FREE").toUpperCase() as "FREE" | "PRO" | "ENTERPRISE";
          
          // FREE plan has no AI access
          if (plan === "FREE") {
            return NextResponse.json(
              {
                error: "PLAN_LIMIT",
                message: "AI Copilot is not available on the Free plan. Please upgrade to Pro or Enterprise to use AI features.",
                resource: "aiGenerations",
              },
              { status: 403 }
            );
          }

          // PRO plan: Check monthly AI generation limit (1000 per month)
          if (plan === "PRO") {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

            const monthlyAiGenerationsQuery = await adminDb
              .collection("ai_usage_logs")
              .where("organizationId", "==", orgId)
              .where("timestamp", ">=", startOfMonthTimestamp)
              .get();

            const monthlyAiCount = monthlyAiGenerationsQuery.size;

            if (monthlyAiCount >= 1000) {
              return NextResponse.json(
                {
                  error: "LIMIT_REACHED",
                  message: "You have reached the Pro plan limit of 1000 AI generations per month. Please upgrade to Enterprise for unlimited AI.",
                  limit: 1000,
                  currentUsage: monthlyAiCount,
                  resource: "aiGenerations",
                },
                { status: 403 }
              );
            }
          }

          // ENTERPRISE plan: Unlimited (no check needed)
        }
      } catch (orgError) {
        console.error("Error checking organization plan:", orgError);
        // Continue execution if org check fails (fail open for now)
      }
    }

    // Fetch dynamic prompt from Firestore, fallback to default
    let baseSystemPrompt = DEFAULT_ENGLISH_PROMPT;
    try {
      const promptDoc = await getDoc(doc(db, "system_configs", "ai_prompts"));
      if (promptDoc.exists()) {
        const data = promptDoc.data();
        if (data?.prompt_text && typeof data.prompt_text === "string") {
          baseSystemPrompt = data.prompt_text;
        }
      }
    } catch (error) {
      console.error("Error fetching dynamic prompt, using default:", error);
      // Continue with default prompt
    }

    let staffListText = "";
    let collectionsSchemaText = "";
    const trimmedOrgId = typeof orgId === "string" ? orgId.trim() : "";
    if (trimmedOrgId) {
      try {
        const adminDb = getAdminDb();
        const usersRef = adminDb.collection("users");
        let staffSnapshot = await usersRef.where("organizationId", "==", trimmedOrgId).get();

        if (staffSnapshot.empty) {
          staffSnapshot = await usersRef.where("orgId", "==", trimmedOrgId).get();
        }

        const staffMembers = staffSnapshot.docs.map((doc) => doc.data() as { displayName?: string; role?: string; email?: string });
        staffListText = formatStaffList(staffMembers);

        // Fetch collections for this organization
        const collectionsSnapshot = await adminDb
          .collection("collections")
          .where("orgId", "==", trimmedOrgId)
          .get();

        if (!collectionsSnapshot.empty) {
          const collections = collectionsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              name: data.name || doc.id,
              fields: (data.fields || []).map((f: any) => ({
                key: f.key || "",
                label: f.label || "",
                type: f.type || "text",
              })),
            };
          });

          collectionsSchemaText = `Available Tables:\n${collections
            .map(
              (col) =>
                `- { name: "${col.name}", fields: [${col.fields.map((f: any) => `"${f.key}"`).join(", ")}] }`
            )
            .join("\n")}`;
        } else {
          collectionsSchemaText = "Available Tables: []";
        }
      } catch (staffError) {
        console.error(`Error fetching staff/collections for org ${trimmedOrgId}:`, staffError);
        staffListText = "- Unable to load staff records due to an internal error.";
        collectionsSchemaText = "Available Tables: []";
      }
    }

    const staffContextSection = `Organization Staff List:\n${
      staffListText || "- No staff records available for this organization."
    }`;

    // Add instruction for auto-creating collections
    const COLLECTION_CREATION_INSTRUCTION = `
AUTO-CREATE COLLECTIONS:

If the user asks to process a new type of document (e.g., "Invoices", "Contracts", "Receipts") that doesn't exist in the Available Tables list, you MUST use the create_database_collection tool FIRST to define the schema before generating the workflow.

Rules:
- Use snake_case for all field keys (e.g., "invoice_date", "total_amount", "contract_number").
- Infer field types from context: dates → "date", numbers → "number", text → "text", yes/no → "boolean".
- Create fields based on what the user wants to extract or store.
- **MANDATORY:** You MUST ALWAYS include a "file_url" field (type: "text") in the fields array, even if the user didn't explicitly ask for it. This field stores the source document URL for verification purposes.
- After creating the collection, proceed to generate the workflow targeting this new collection.
`;

    // Add instruction for dashboard layout generation
    const DASHBOARD_LAYOUT_INSTRUCTION = `
DASHBOARD LAYOUT GENERATION:

AFTER creating a new collection using create_database_collection, you MUST immediately call generate_dashboard_layout to create a useful dashboard configuration.

Rules for generating widgets:
1. **Stat Cards**: If fields contain currency/numbers (e.g., "amount", "total", "price", "cost"), create a 'stat_card' with:
   - type: "stat_card"
   - operation: "sum" (for currency) or "count" (for counting records)
   - field: the numeric field key (e.g., "total_amount")

2. **Bar Charts**: If you have numeric fields, create a 'bar_chart' with:
   - type: "bar_chart"
   - xAxis: a categorical field (e.g., "vendor", "status", "category")
   - yAxis: a numeric field (e.g., "total_amount")

3. **Line Charts**: If fields contain dates, create a 'line_chart' showing trends over time:
   - type: "line_chart"
   - xAxis: the date field (e.g., "invoice_date", "created_at")
   - yAxis: a numeric field to track over time (e.g., "total_amount")

4. **Pie Charts**: If fields contain categories (e.g., "status", "type", "category"), create a 'pie_chart':
   - type: "pie_chart"
   - field: the categorical field key (e.g., "status")

5. **Always create at least 3 widgets** to provide comprehensive insights.

Example: For a collection with fields ["invoice_date", "total_amount", "vendor", "status"]:
- Widget 1: stat_card (sum of total_amount)
- Widget 2: bar_chart (xAxis: vendor, yAxis: total_amount)
- Widget 3: line_chart (xAxis: invoice_date, yAxis: total_amount)
- Widget 4: pie_chart (field: status)
`;

    // Construct the final system prompt with all instructions
    let systemPrompt = [
      baseSystemPrompt, // Base prompt (from Firestore or default)
      GUARDRAIL_CLAUSE,
      STRATEGIC_RULES, // 🎯 HIGH PRIORITY: Workflow strategy and best practices (when to use which step)
      staffContextSection, // The list of users
      collectionsSchemaText, // Available collections/tables
      COLLECTION_CREATION_INSTRUCTION, // Auto-create collections instruction
      DASHBOARD_LAYOUT_INSTRUCTION, // Dashboard layout generation instruction
      ASSIGNMENT_INSTRUCTION, // Smart Mentions logic
      GOOGLE_SHEET_INSTRUCTION, // Google Sheet operations (Append/Update/Lookup)
      METADATA_INSTRUCTION, // Professional Title & Description generation
      SLACK_INSTRUCTION, // Smart Slack channel & message extraction
      DB_INSERT_INSTRUCTION, // Database insert logic
      AI_PARSE_INSTRUCTION, // AI Document Parser logic (Read Document)
      DOC_GENERATE_INSTRUCTION, // Document Generator logic
      GATEWAY_INSTRUCTION, // Gateway conditional branching logic
      VALIDATE_INSTRUCTION, // Data validation logic
      TRIGGER_INSTRUCTION, // Workflow trigger logic
      CONFIGURATION_REFINEMENT_RULES // Configuration refinement and variable mapping rules
    ].join("\n\n");

    // Initialize OpenAI client for function calling
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Define the tools for creating collections and dashboard layouts
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "create_database_collection",
          description: "Creates a new database collection (table) with defined fields. Use this when the user wants to process a document type that doesn't exist yet.",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the collection (e.g., 'Contracts', 'Invoices', 'Receipts')",
              },
              fields: {
                type: "array",
                description: "Array of field definitions for the collection",
                items: {
                  type: "object",
                  properties: {
                    label: {
                      type: "string",
                      description: "Human-readable label for the field (e.g., 'Invoice Date', 'Total Amount')",
                    },
                    key: {
                      type: "string",
                      description: "Field key in snake_case (e.g., 'invoice_date', 'total_amount'). MUST be lowercase with underscores.",
                    },
                    type: {
                      type: "string",
                      enum: ["text", "number", "date", "boolean", "select"],
                      description: "Data type of the field",
                    },
                  },
                  required: ["label", "key", "type"],
                },
              },
            },
            required: ["name", "fields"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "generate_dashboard_layout",
          description: "Generates a dashboard layout configuration for a collection. MUST be called immediately after creating a new collection. Analyzes the collection fields and creates appropriate widgets (stat cards, charts) for data visualization.",
          parameters: {
            type: "object",
            properties: {
              collection_name: {
                type: "string",
                description: "The name of the collection to generate dashboard for (must match the collection created earlier)",
              },
              widgets: {
                type: "array",
                description: "Array of dashboard widgets to display",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "Unique identifier for the widget (e.g., 'widget_1', 'total_sum_card')",
                    },
                    type: {
                      type: "string",
                      enum: ["stat_card", "bar_chart", "line_chart", "pie_chart"],
                      description: "Type of widget",
                    },
                    title: {
                      type: "string",
                      description: "Display title for the widget (e.g., 'Total Revenue', 'Sales Over Time')",
                    },
                    field: {
                      type: "string",
                      description: "The database field key to analyze (e.g., 'total_amount', 'status')",
                    },
                    operation: {
                      type: "string",
                      enum: ["sum", "count", "avg"],
                      description: "Operation for stat_card widgets (sum for currency, count for records, avg for averages)",
                    },
                    xAxis: {
                      type: "string",
                      description: "Field key for X-axis (for bar_chart and line_chart)",
                    },
                    yAxis: {
                      type: "string",
                      description: "Field key for Y-axis (for bar_chart and line_chart)",
                    },
                  },
                  required: ["id", "type", "title", "field"],
                },
              },
            },
            required: ["collection_name", "widgets"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_alert_rule",
          description: "Creates an alert rule that triggers notifications when specific conditions are met in collection data. Use this when the user asks to be notified about certain conditions (e.g., 'Notify me when amount is over 5k', 'Alert if status is expired', 'Send email when total > 10000').",
          parameters: {
            type: "object",
            properties: {
              collection_name: {
                type: "string",
                description: "The name of the collection to monitor (e.g., 'Invoices', 'Contracts')",
              },
              condition_description: {
                type: "string",
                description: "Natural language description of the condition (e.g., 'amount is over 5000', 'status equals expired', 'total is greater than 10000')",
              },
              message_template: {
                type: "string",
                description: "Optional: Custom message template with variables (e.g., 'High value invoice detected: {{invoice_number}}'). If not provided, a default message will be generated.",
              },
              action: {
                type: "string",
                enum: ["in_app", "email", "both"],
                description: "Optional: How to deliver the alert. 'in_app' (default) for in-app notifications, 'email' for email only, 'both' for both. If user says 'email me' or 'send email', use 'email' or 'both'.",
              },
            },
            required: ["collection_name", "condition_description"],
          },
        },
      },
    ];

    // First call: Check if AI wants to create a collection or alert rule
    const userPrompt = `Convert this process description into a workflow:\n\n"${description}"\n\nReturn a JSON object with "title", "description", and "steps" fields.\n\nIMPORTANT: Follow the NAMING RULES strictly:\n- Title must be 3-5 words, professional, action-oriented (e.g., "Candidate Resume Processing", NOT "Create a form for resume").\n- Description must be 1-2 sentences focusing on business outcome (e.g., "Automates the collection of candidate resumes, extracts key data using AI, and stores valid entries in the Candidates database.").\n- NEVER copy the user's prompt verbatim.\n- Match the language of the user's prompt (English or Persian).\n\nIf you need to create a new collection that doesn't exist, use the create_database_collection tool FIRST, then immediately call generate_dashboard_layout for that collection.\n\nIf the user asks to be notified when certain conditions are met (e.g., "Notify me when amount is over 5k", "Alert if status is expired"), use the create_alert_rule tool.`;

    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    let createdCollection: { id: string; name: string; fields: any[] } | null = null;
    let workflowJson: string = "";

    // Handle function calling loop
    let maxIterations = 3; // Prevent infinite loops
    while (maxIterations > 0) {
      maxIterations--;

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools: maxIterations === 2 ? tools : undefined, // Only provide tools on first call
        tool_choice: maxIterations === 2 ? "auto" : undefined,
      temperature: 0.7,
      });

      const message = completion.choices[0]?.message;
      if (!message) {
        throw new Error("No response from OpenAI");
      }

      // Add assistant message to conversation
      messages.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.tool_calls,
      });

      // Check if AI wants to call a tool
      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.function.name === "generate_dashboard_layout") {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log("[AI Generator] Generating dashboard layout for collection:", args.collection_name);

              if (!createdCollection) {
                throw new Error("No collection was created yet. Create a collection first.");
              }

              if (args.collection_name !== createdCollection.name) {
                console.warn(`[AI Generator] Collection name mismatch: expected "${createdCollection.name}", got "${args.collection_name}". Using created collection.`);
              }

              // Validate widgets
              if (!args.widgets || !Array.isArray(args.widgets) || args.widgets.length === 0) {
                throw new Error("Widgets array is required and must contain at least one widget");
              }

              // Validate each widget
              for (const widget of args.widgets) {
                if (!widget.id || !widget.type || !widget.title || !widget.field) {
                  throw new Error(`Widget is missing required fields: id, type, title, or field`);
                }
                if (!["stat_card", "bar_chart", "line_chart", "pie_chart"].includes(widget.type)) {
                  throw new Error(`Invalid widget type: ${widget.type}`);
                }
                if (widget.type === "stat_card" && !widget.operation) {
                  throw new Error(`stat_card widgets require an operation (sum, count, or avg)`);
                }
                if ((widget.type === "bar_chart" || widget.type === "line_chart") && (!widget.xAxis || !widget.yAxis)) {
                  throw new Error(`${widget.type} widgets require both xAxis and yAxis`);
                }
              }

              // Save dashboard layout to collection
              await updateCollectionDashboardLayout(
                createdCollection.id,
                args.widgets
              );

              console.log(`[AI Generator] Dashboard layout created with ${args.widgets.length} widgets`);

              // Add tool result to messages
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: true,
                  collectionName: createdCollection.name,
                  widgetsCount: args.widgets.length,
                  message: `Dashboard layout generated successfully with ${args.widgets.length} widgets for collection "${createdCollection.name}".`,
                }),
              });
            } catch (error: any) {
              console.error("[AI Generator] Error generating dashboard layout:", error);
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: false,
                  error: error.message || "Failed to generate dashboard layout",
                }),
              });
            }
            continue;
          }
          
          if (toolCall.function.name === "create_database_collection") {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log("[AI Generator] Creating collection:", args.name);

              if (!trimmedOrgId) {
                throw new Error("Organization ID is required to create collections");
              }

              // Ensure all keys are snake_case
              const normalizedFields = args.fields.map((f: any) => ({
                ...f,
                key: f.key
                  .toLowerCase()
                  .replace(/\s+/g, "_")
                  .replace(/[^a-z0-9_]/g, ""),
              }));

              createdCollection = await createDatabaseCollection(
                trimmedOrgId,
                args.name,
                normalizedFields
              );

              console.log("[AI Generator] Collection created:", createdCollection.id);

              // Add tool result to messages
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: true,
                  collectionId: createdCollection.id,
                  collectionName: createdCollection.name,
                  message: `Collection "${createdCollection.name}" created successfully with ${createdCollection.fields.length} fields.`,
                }),
              });

              // Update collections schema text for next call
              const existingCollections = collectionsSchemaText !== "Available Tables: []" 
                ? collectionsSchemaText.split("\n").slice(1).join("\n")
                : "";
              collectionsSchemaText = `Available Tables:\n- { name: "${createdCollection.name}", fields: [${createdCollection.fields.map((f: any) => `"${f.key}"`).join(", ")}] }${existingCollections ? "\n" + existingCollections : ""}`;
              
              // Update system prompt with new collection info
              systemPrompt = [
                baseSystemPrompt,
                GUARDRAIL_CLAUSE,
                STRATEGIC_RULES, // 🎯 HIGH PRIORITY: Workflow strategy and best practices
                staffContextSection,
                collectionsSchemaText,
                COLLECTION_CREATION_INSTRUCTION,
                DASHBOARD_LAYOUT_INSTRUCTION,
                ASSIGNMENT_INSTRUCTION,
                GOOGLE_SHEET_INSTRUCTION,
                METADATA_INSTRUCTION,
                SLACK_INSTRUCTION,
                DB_INSERT_INSTRUCTION,
                AI_PARSE_INSTRUCTION,
                DOC_GENERATE_INSTRUCTION,
                GATEWAY_INSTRUCTION,
                VALIDATE_INSTRUCTION,
                TRIGGER_INSTRUCTION,
                CONFIGURATION_REFINEMENT_RULES,
              ].join("\n\n");
              
              // Update system message in conversation
              messages[0] = {
                role: "system",
                content: systemPrompt,
              };
            } catch (error: any) {
              console.error("[AI Generator] Error creating collection:", error);
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: false,
                  error: error.message || "Failed to create collection",
                }),
              });
            }
          } else if (toolCall.function.name === "create_alert_rule") {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log("[AI Generator] Creating alert rule for collection:", args.collection_name);

              if (!trimmedOrgId) {
                throw new Error("Organization ID is required to create alert rules");
              }

              const alertRule = await createAlertRule(
                trimmedOrgId,
                args.collection_name,
                args.condition_description,
                args.message_template,
                args.action || 'in_app' // Use provided action or default to 'in_app'
              );

              console.log("[AI Generator] Alert rule created:", alertRule.id);

              // Add tool result to messages
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: true,
                  alertRuleId: alertRule.id,
                  collectionName: alertRule.collectionName,
                  condition: alertRule.condition,
                  message: alertRule.message,
                }),
              });
            } catch (error: any) {
              console.error("[AI Generator] Error creating alert rule:", error);
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: false,
                  error: error.message || "Failed to create alert rule",
                }),
              });
            }
          }
        }
        // Continue loop to generate workflow after tool execution
        continue;
      }

      // No tool calls, AI returned the workflow JSON
      workflowJson = message.content || "";
      break;
    }

    if (!workflowJson) {
      throw new Error("Failed to generate workflow after tool calls");
    }

    // Parse the workflow JSON (same logic as before)
    const result = { text: workflowJson };

    // Get the full response
    const fullText = result.text;
    
    // Try to extract JSON from the response
    let jsonString = fullText.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }
    
    // Parse the JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text (support both array and object)
      const jsonMatch = jsonString.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (nestedError) {
          console.error("Failed to parse extracted AI JSON:", nestedError);
          return NextResponse.json(
            { error: "Invalid AI response format. Please describe the process again." },
            { status: 400 }
          );
        }
      } else {
        console.error("AI response missing JSON:", parseError);
        return NextResponse.json(
          { error: "Could not find workflow data in the AI response." },
          { status: 400 }
        );
      }
    }

    // Handle both old format (array) and new format (object with title, description, steps, trigger)
    let steps: unknown[];
    let title: string;
    let procedureDescription: string;
    let trigger: { type: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK"; config?: { folderPath?: string; provider?: string; webhookUrl?: string; webhookSecret?: string } } | undefined;

    if (Array.isArray(parsed)) {
      // Old format: just an array of steps
      steps = parsed;
      title = "Generated Process";
      procedureDescription = description; // Use the original user description as fallback
      trigger = undefined; // Default to manual
    } else if (parsed && typeof parsed === "object" && "steps" in parsed) {
      // New format: object with title, description, steps, and optional trigger
      const parsedObj = parsed as { 
        title?: string; 
        description?: string; 
        steps?: unknown[];
        trigger?: { type?: string; config?: { folderPath?: string } };
      };
      steps = Array.isArray(parsedObj.steps) ? parsedObj.steps : [];
      title = typeof parsedObj.title === "string" && parsedObj.title.trim()
        ? parsedObj.title.trim()
        : "Generated Process";
      procedureDescription = typeof parsedObj.description === "string" && parsedObj.description.trim()
        ? parsedObj.description.trim()
        : description; // Fallback to user's original description
      
      // Parse trigger if present
      if (parsedObj.trigger && typeof parsedObj.trigger === "object") {
        const triggerTypeStr = parsedObj.trigger.type;
        let triggerType: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK" = "MANUAL";
        
        if (triggerTypeStr === "ON_FILE_CREATED" || triggerTypeStr === "ON_FILE_UPLOAD") {
          triggerType = "ON_FILE_CREATED"; // Support old name for backward compatibility
        } else if (triggerTypeStr === "WEBHOOK") {
          triggerType = "WEBHOOK";
        }
        
        const triggerConfig = parsedObj.trigger.config as any; // Type assertion for flexible config
        if (triggerType === "ON_FILE_CREATED" && triggerConfig && typeof triggerConfig === "object") {
          trigger = {
            type: triggerType,
            config: {
              folderPath: triggerConfig.folderPath || undefined,
              provider: triggerConfig.provider || "google_drive",
            },
          };
        } else if (triggerType === "WEBHOOK") {
          trigger = {
            type: triggerType,
            config: {
              webhookUrl: triggerConfig?.webhookUrl || undefined,
              webhookSecret: triggerConfig?.webhookSecret || undefined,
            },
          };
        } else {
          trigger = { type: triggerType };
        }
      }
    } else {
      return NextResponse.json(
        { error: "AI response must be either an array of steps or an object with 'title', 'description', and 'steps' fields." },
        { status: 400 }
      );
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "AI response must contain a non-empty array of steps." },
        { status: 400 }
      );
    }

    const sanitizedSteps: AtomicStep[] = [];

    for (const [index, rawStep] of steps.entries()) {
      if (!rawStep || typeof rawStep !== "object" || Array.isArray(rawStep)) {
        return NextResponse.json(
          { error: `Step ${index + 1} is malformed.` },
          { status: 400 }
        );
      }

      const stepRecord = rawStep as Record<string, unknown>;
      const normalizedAction =
        typeof stepRecord.action === "string"
          ? stepRecord.action.trim().toUpperCase()
          : "";

      const actionValue: AtomicAction = ATOMIC_ACTIONS.includes(normalizedAction as AtomicAction)
        ? (normalizedAction as AtomicAction)
        : "INPUT";

      const sanitizedConfig =
        stepRecord.config && typeof stepRecord.config === "object" && !Array.isArray(stepRecord.config)
          ? (stepRecord.config as AtomicStep["config"])
          : ({} as AtomicStep["config"]);

      const sanitizedStep: AtomicStep = {
        id:
          typeof stepRecord.id === "string" && stepRecord.id.trim()
            ? stepRecord.id.trim()
            : `step_${index + 1}`,
        title:
          typeof stepRecord.title === "string" && stepRecord.title.trim()
            ? stepRecord.title.trim()
            : `Step ${index + 1}`,
        action: actionValue,
        assignee: typeof stepRecord.assignee === "string" ? stepRecord.assignee : undefined,
        config: sanitizedConfig,
      };

      sanitizedSteps.push(sanitizedStep);
    }

    // Log AI usage (after successful generation)
    if (orgId) {
      try {
        const adminDb = getAdminDb();
        await adminDb.collection("ai_usage_logs").add({
          organizationId: orgId,
          type: "generate-procedure",
          timestamp: Timestamp.now(),
          tokensUsed: result.usage?.totalTokens || 0,
        });
      } catch (logError) {
        console.error("Error logging AI usage:", logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({ 
      title,
      description: procedureDescription,
      steps: sanitizedSteps,
      trigger: trigger || undefined, // Include trigger if present
      createdCollection: createdCollection ? {
        id: createdCollection.id,
        name: createdCollection.name,
        fields: createdCollection.fields,
      } : null,
    });
  } catch (error) {
    console.error("Error generating procedure:", error);
    return NextResponse.json(
      { error: "Failed to generate procedure. Please try again." },
      { status: 500 }
    );
  }
}

