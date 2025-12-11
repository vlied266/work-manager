import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AtomicStep, AtomicAction } from "@/types/schema";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { DEFAULT_ENGLISH_PROMPT } from "@/lib/ai/default-prompt";

const ATOMIC_ACTIONS: AtomicAction[] = [
  // Human Tasks
  "INPUT", "APPROVAL", "MANUAL_TASK", "NEGOTIATE", "INSPECT",
  // Automation Tasks
  "AI_PARSE", "DB_INSERT", "HTTP_REQUEST", "SEND_EMAIL", "GOOGLE_SHEET", "DOC_GENERATE",
  "CALCULATE", "GATEWAY", "VALIDATE", "COMPARE"
];

const GUARDRAIL_CLAUSE = `CRITICAL RULE: You are a strict Process Architect. If the user input is NOT a description of a business process, workflow, or task sequence (e.g., if it is a joke, a greeting, random characters, or code request), you must return a JSON array with a SINGLE step: { "id": "error", "title": "Invalid Request", "action": "INSPECT", "description": "I can only generate business workflows. Please describe a process." }. Do NOT attempt to interpret nonsense.`;

const GOOGLE_SHEET_INSTRUCTION = `
SPECIAL RULE FOR "GOOGLE_SHEET":

If the user asks to save data to a spreadsheet/excel, use action "GOOGLE_SHEET".

You MUST generate a "config" object:

{
  "sheetId": "",
  "mapping": {
    "A": "{{step_x.output}}", 
    "B": "Static Value"
  }
}

- Leave "sheetId" empty.
- Intelligently map previous steps' data to columns using mustache syntax.
- Use meaningful column mappings based on the data flow. For example:
  * If step 1 collects "Full Name", map it to column A: "{{step_1.output.fullName}}" or "{{step_1.output.name}}"
  * If step 2 collects "Email", map it to column B: "{{step_2.output.email}}"
  * If step 3 calculates "Total Amount", map it to column C: "{{step_3.output.total}}"
- You can also use static text combined with variables, e.g., "Applicant: {{step_1.output.name}}"
- Always include at least 2-3 column mappings (A, B, C) to make the template useful.
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

4. In the \`config\` object, you MUST include:

   {
     "collectionName": "Deals",  // Exact name from Available Tables
     "data": {
       "amount": "{{step_1.output.amount}}",
       "customer": "{{step_1.output.customerName}}",
       "status": "{{step_1.output.status}}"
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
SPECIAL RULE FOR "AI_PARSE" (Document Parser):

If the user wants to EXTRACT/READ/PARSE data from a file (PDF, Excel, Image), use action "AI_PARSE".

1. **When to Use:**
   - User says: "Read the invoice", "Extract data from PDF", "Parse the contract", "Read the Excel file"
   - User mentions extracting specific fields from a document
   - User wants to process uploaded files automatically

2. **Config Structure:**

   {
     "fileUrl": "{{step_1.output.fileUrl}}",  // URL or path to the file (use variable from previous step)
     "fieldsToExtract": ["invoice_date", "amount", "vendor", "invoice_number"],  // List of field names to extract
     "fileType": "pdf"  // Optional: "pdf", "excel", or "image" (auto-detected if not provided)
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

4. **Field Extraction:**
   - The "fieldsToExtract" array should contain meaningful field names based on what the user wants to extract.
   - Examples:
     * Invoice: ["invoice_date", "amount", "vendor", "invoice_number", "due_date"]
     * Contract: ["contract_date", "parties", "expiry_date", "terms"]
     * Receipt: ["date", "total", "merchant", "items"]

4. **File URL Source:**
   - If the file comes from a previous INPUT step, use: "{{step_x.output.fileUrl}}" or "{{step_x.output.filePath}}"
   - If triggered by file upload, use: "{{initialInput.fileUrl}}" or "{{initialInput.filePath}}"

5. **Examples:**
   - User says: "Read the invoice and extract date, amount, and vendor"
     → action: "AI_PARSE", config: { fileUrl: "{{step_1.output.fileUrl}}", fieldsToExtract: ["invoice_date", "amount", "vendor"] }
   
   - User says: "Parse the contract PDF"
     → action: "AI_PARSE", config: { fileUrl: "{{step_1.output.fileUrl}}", fieldsToExtract: ["contract_date", "parties", "expiry_date"], fileType: "pdf" }
   
   - User says: "Extract data from the uploaded Excel file"
     → action: "AI_PARSE", config: { fileUrl: "{{step_1.output.fileUrl}}", fieldsToExtract: ["name", "email", "amount"], fileType: "excel" }

6. **Output:** The AI_PARSE step will output a JSON object with the extracted fields, which can be used in subsequent steps using {{step_x.output.fieldName}}.
`;

const DOC_GENERATE_INSTRUCTION = `
SPECIAL RULE FOR "DOC_GENERATE" (Document Generator):

If the user wants to CREATE/GENERATE a document (Contract, Invoice, Letter, Report, PDF), use action "DOC_GENERATE".

1. **When to Use:**
   - User says: "Create a contract", "Generate an invoice", "Make a PDF", "Create a document"
   - User mentions: "Generate [document type]", "Create [document type] from template"
   - User wants to produce a formatted document automatically

2. **Config Structure:**

   {
     "templateId": "template_123",  // ID of template record in 'templates' collection
     "docData": {
       "clientName": "{{step_1.output.name}}",
       "date": "{{step_2.output.date}}",
       "amount": "{{step_3.output.total}}",
       "invoiceNumber": "{{step_1.output.invoiceNumber}}"
     }
   }

3. **Template ID:**
   - If user names a template (e.g., "Service Agreement", "Invoice Template", "Contract Template"), try to find its ID.
   - If template name is unknown, use a placeholder like "invoice_template" or "contract_template".
   - The template must exist in the 'templates' collection with an 'htmlContent' field.

4. **Data Mapping:**
   - Map fields from previous steps using mustache syntax: {{step_x.output.fieldName}}
   - Include all relevant data that should appear in the document.
   - Field names should match what the template expects (e.g., "clientName", "invoiceDate", "totalAmount").

5. **Examples:**
   - User says: "Create an invoice with client name and amount"
     → action: "DOC_GENERATE", config: { templateId: "invoice_template", docData: { clientName: "{{step_1.output.name}}", amount: "{{step_1.output.amount}}" } }
   
   - User says: "Generate a contract document"
     → action: "DOC_GENERATE", config: { templateId: "contract_template", docData: { party1: "{{step_1.output.party1}}", party2: "{{step_1.output.party2}}", date: "{{step_2.output.date}}" } }
   
   - User says: "Create a PDF invoice"
     → action: "DOC_GENERATE", config: { templateId: "invoice_template", docData: { invoiceNumber: "{{step_1.output.invoiceNumber}}", clientName: "{{step_1.output.client}}", total: "{{step_2.output.total}}" } }

6. **Output:** The DOC_GENERATE step will output { fileUrl: "...", fileName: "..." }, which can be used in subsequent steps (e.g., email attachment, storage) using {{step_x.output.fileUrl}}.

7. **Important:** DOC_GENERATE is an AUTOMATED step (no assignee needed). It runs automatically and generates the PDF document.
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
      * IF the value is \`{{step_1.output.customerName}}\`, the Key MUST be \`"customerName"\` or \`"name"\`.
      * IF the value is \`{{step_1.output.invoiceDate}}\`, the Key MUST be \`"invoiceDate"\` or \`"date"\`.
      * IF you extracted fields ["Invoice Date", "Total Amount"] in AI_PARSE, the Keys MUST be \`"invoiceDate"\` and \`"totalAmount"\`.

   2. **FORMAT REQUIREMENTS:**
      * Keys must be **camelCase** or **lowercase** English words.
      * Keys must be meaningful, semantic names that describe the data (e.g., "address", "totalAmount", "phoneNumber").
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
         "fullName": "{{step_1.output.name}}",
         "phoneNumber": "{{step_1.output.phone}}",
         "status": "New"
       }
     }
   }
   \`\`\`
   ✅ **RIGHT:** Keys are meaningful English words (email, fullName, phoneNumber, status)

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
   
   AI_PARSE step extracts: \`fieldsToExtract: ["Invoice Number", "Invoice Date", "Total Amount"]\`
   
   DB_INSERT step MUST use:
   \`\`\`json
   {
     "action": "DB_INSERT",
     "config": {
       "collectionName": "Invoices",
       "data": {
         "invoiceNumber": "{{step_1.output.invoiceNumber}}",
         "invoiceDate": "{{step_1.output.invoiceDate}}",
         "totalAmount": "{{step_1.output.totalAmount}}"
       }
     }
   }
   \`\`\`
   
   NOT:
   \`\`\`json
   {
     "data": {
       "field_1": "{{step_1.output.invoiceNumber}}",  // ❌ BANNED
       "field_2": "{{step_1.output.invoiceDate}}",    // ❌ BANNED
       "field_3": "{{step_1.output.totalAmount}}"     // ❌ BANNED
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
           "invoiceNumber": "{{step_1.output.invoiceNumber}}",
           "amount": "{{step_1.output.total}}",
           "vendor": "{{step_1.output.vendorName}}",
           "dueDate": "{{step_1.output.dueDate}}"
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
    let systemPrompt = DEFAULT_ENGLISH_PROMPT;
    try {
      const promptDoc = await getDoc(doc(db, "system_configs", "ai_prompts"));
      if (promptDoc.exists()) {
        const data = promptDoc.data();
        if (data?.prompt_text && typeof data.prompt_text === "string") {
          systemPrompt = data.prompt_text;
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

    // Construct the final system prompt with all instructions
    systemPrompt = [
      systemPrompt, // Base prompt (from Firestore or default)
      GUARDRAIL_CLAUSE,
      staffContextSection, // The list of users
      collectionsSchemaText, // Available collections/tables
      ASSIGNMENT_INSTRUCTION, // Smart Mentions logic
      GOOGLE_SHEET_INSTRUCTION, // Smart Sheet Mapping logic
      METADATA_INSTRUCTION, // Professional Title & Description generation
      SLACK_INSTRUCTION, // Smart Slack channel & message extraction
      DB_INSERT_INSTRUCTION, // Database insert logic
      AI_PARSE_INSTRUCTION, // AI Document Parser logic
      DOC_GENERATE_INSTRUCTION, // Document Generator logic
      TRIGGER_INSTRUCTION, // Workflow trigger logic
      CONFIGURATION_REFINEMENT_RULES // Configuration refinement and variable mapping rules
    ].join("\n\n");

    const result = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Convert this process description into a workflow:\n\n"${description}"\n\nReturn a JSON object with "title", "description", and "steps" fields.\n\nIMPORTANT: Follow the NAMING RULES strictly:\n- Title must be 3-5 words, professional, action-oriented (e.g., "Candidate Resume Processing", NOT "Create a form for resume").\n- Description must be 1-2 sentences focusing on business outcome (e.g., "Automates the collection of candidate resumes, extracts key data using AI, and stores valid entries in the Candidates database.").\n- NEVER copy the user's prompt verbatim.\n- Match the language of the user's prompt (English or Persian).`,
      temperature: 0.7,
    });

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
      trigger: trigger || undefined // Include trigger if present
    });
  } catch (error) {
    console.error("Error generating procedure:", error);
    return NextResponse.json(
      { error: "Failed to generate procedure. Please try again." },
      { status: 500 }
    );
  }
}

