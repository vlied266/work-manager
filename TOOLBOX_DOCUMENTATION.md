# 📚 Complete Toolbox Documentation - Atomic Workflow Builder

This document contains comprehensive documentation for all items in the Toolbox and their complete configuration options.

---

## 📋 Table of Contents

### Human Tasks (👤 Interactive Steps)
1. [Input](#1-input)
2. [Approval](#2-approval)
3. [Manual Task](#3-manual-task)
4. [Negotiate](#4-negotiate)
5. [Inspect](#5-inspect)

### Automation (⚡ Automated Steps)
6. [Read Document (AI_PARSE)](#6-read-document-ai_parse)
7. [Save to DB (DB_INSERT)](#7-save-to-db-db_insert)
8. [HTTP Request](#8-http-request)
9. [Send Email](#9-send-email)
10. [Google Sheet](#10-google-sheet)
11. [Generate Document](#11-generate-document)
12. [Calculate](#12-calculate)
13. [Gateway](#13-gateway)
14. [Validate](#14-validate)
15. [Compare](#15-compare)

---

## Human Tasks (👤 Interactive Steps)

### 1. INPUT

**Code:** `INPUT`

**Group:** Human Tasks

**Execution Type:** HUMAN (Requires user interaction - workflow pauses and waits)

**Description:**
Collect input from users through various input types (text, number, email, date, file upload, select dropdown, checkbox, multiline text). The workflow pauses at this step until the assigned user completes the input.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Description:** The display name for this step in the workflow builder and run view.
- **Example:** "Enter Invoice Amount", "Upload Contract", "Select Department"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No (but recommended)
- **Description:** Variable name for referencing this step's data later in the workflow. Used in variable picker for subsequent steps.
- **Example:** `invoice_total`, `contract_file`, `selected_department`
- **Why:** Allows other steps to reference this step's output using `{{step_1.invoice_total}}` syntax.

---

##### Responsibility (Assignment)

**Assignment Type**
- **Field:** `step.assignment.type` or `step.assigneeType`
- **Type:** Dropdown select
- **Required:** Yes
- **Options:**
  - **Process Starter (STARTER):** Assigned to the person who clicked "Run" to start the workflow
  - **Specific User (SPECIFIC_USER):** Assigned to a specific user selected from the organization's user list
  - **Team Queue (TEAM_QUEUE):** Assigned to a team - any member of that team can pick up the task
- **Why:** Determines who receives the task notification and can complete this step.

**Assignee Selection** (shown when Assignment Type is SPECIFIC_USER or TEAM_QUEUE)
- **Field:** `step.assignment.assigneeId` or `step.assigneeId`
- **Type:** Dropdown select (users or teams)
- **Required:** Yes (when Assignment Type is not STARTER)
- **Description:** Select the specific user or team from your organization.
- **Why:** Ensures the right person or team receives the task.

---

##### Evidence

**Require Evidence Upload**
- **Field:** `step.requiresEvidence`
- **Type:** Toggle checkbox
- **Required:** No
- **Default:** `false`
- **Description:** When enabled, users must upload a file (PDF, Image, Doc) before completing this task.
- **Why:** Adds an audit trail and ensures documentation is attached to the workflow run.

---

##### Input Configuration

**What information do you need?**
- **Field:** `config.fieldLabel`
- **Type:** Text input
- **Required:** Yes
- **Description:** The question text that will be displayed to the operator on their mobile device or web interface.
- **Example:** "Enter the oven temperature", "What is the invoice number?", "Select the approval status"
- **Why:** This is exactly what the operator will see on their screen - it should be clear and actionable.

**What type of answer?**
- **Field:** `config.inputType`
- **Type:** Dropdown select
- **Required:** Yes
- **Options:**
  - **Text:** Single-line text input (words or sentences)
  - **Number:** Numeric input (e.g., 350, 12.5)
  - **Email:** Email address input with validation
  - **Date:** Date picker
  - **File Upload:** File upload button (PDF, Image, Excel, etc.)
  - **Select:** Dropdown with predefined options
  - **Checkbox:** Multiple checkbox options
  - **Multiline:** Multi-line text area
- **Why:** Determines the UI component and validation rules applied to the input field.

**Placeholder**
- **Field:** `config.placeholder`
- **Type:** Text input
- **Required:** No
- **Description:** Hint text displayed inside the input field before the user types.
- **Example:** "Enter placeholder text", "e.g., 100", "Select an option"
- **Why:** Provides guidance to users on what format or value is expected.

**Required Field**
- **Field:** `config.required`
- **Type:** Toggle checkbox
- **Required:** No
- **Default:** `false`
- **Description:** When enabled, users must fill this field before proceeding to the next step.
- **Why:** Ensures critical data is collected before workflow continues.

**Validation Regex (optional)**
- **Field:** `config.validationRegex`
- **Type:** Text input (regex pattern)
- **Required:** No
- **Description:** Regular expression pattern to validate the input format.
- **Example:** `^[A-Z0-9]+$` (uppercase letters and numbers only), `^\d{4}-\d{2}-\d{2}$` (date format)
- **Why:** Enforces data quality and format consistency.

---

##### Options Configuration (for Select/Checkbox input types)

**Options List**
- **Field:** `config.options`
- **Type:** Array of objects `{ label: string, value: string }` or strings
- **Required:** Yes (when `inputType` is "select" or "checkbox")
- **Description:** List of available options for dropdown or checkbox selection.
- **Format:** 
  - For Select: `[{ label: "Option 1", value: "opt1" }, { label: "Option 2", value: "opt2" }]`
  - For Checkbox: Same format, but multiple selections allowed
- **Why:** Provides predefined choices, reducing errors and standardizing responses.

**Add Option Button**
- **Description:** Click to add a new option to the list. Each option has:
  - **Label:** Display text shown to the user
  - **Value:** Internal value stored in the workflow (for Select type)
- **Why:** Allows dynamic configuration of available choices.

---

##### File Upload Specific Configuration (when `inputType === "file"`)

**Button Label**
- **Field:** `config.buttonLabel`
- **Type:** Text input
- **Required:** Yes (for file uploads)
- **Description:** Text displayed on the upload button.
- **Example:** "Upload Invoice", "Attach Contract", "Select File"
- **Why:** Makes the upload action clear and contextual.

**Allowed File Extensions**
- **Field:** `config.allowedExtensions`
- **Type:** Array of strings
- **Required:** No
- **Description:** List of allowed file extensions (without the dot).
- **Example:** `["pdf", "xlsx", "jpg", "png"]`
- **Why:** Restricts file types to ensure compatibility with downstream steps (e.g., AI parsing).

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Required:** No
- **Options:**
  - **Auto (Next in sequence):** Automatically proceeds to the next step in the workflow
  - **Complete Process:** Ends the workflow
  - **[Step Name]:** Jump to a specific step
- **Why:** Controls workflow flow when no conditional routes match.

**Conditional Routes**
- **Field:** `step.routes.conditions`
- **Type:** Array of condition objects
- **Required:** No
- **Description:** Define conditions to route the workflow to different steps based on the input value.
- **Condition Structure:**
  ```typescript
  {
    variable: string,        // Variable name (e.g., "step_1.output")
    operator: "eq" | "neq" | "gt" | "lt" | "contains",  // Comparison operator
    value: string,           // Value to compare against
    nextStepId: string       // Step ID to jump to if condition is true
  }
  ```
- **Why:** Enables branching logic (e.g., "If amount > 1000, go to Manager Approval step").

**Add Condition Button**
- **Description:** Click to add a new conditional route. Configure:
  - **Variable:** Select from available variables or enter manually
  - **Operator:** Choose comparison type (Equal, Not Equal, Greater Than, Less Than, Contains)
  - **Value:** Enter the value to compare against
  - **Then go to:** Select the target step if condition is true
- **Why:** Allows complex workflow routing based on user input.

---

#### Code References
- **UI Renderer:** `src/components/run/task-renderer.tsx` (case "INPUT")
- **Config Panel:** `src/components/design/config-panel.tsx` (case "INPUT")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `INPUT` action)

---

### 2. APPROVAL

**Code:** `APPROVAL` (formerly `AUTHORIZE`)

**Group:** Human Tasks

**Execution Type:** HUMAN (Requires user interaction - workflow pauses and waits)

**Description:**
Request approval from a designated user or team. The approver reviews the request and selects an action (Approve, Reject, etc.). The workflow pauses until approval is given.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Description:** Display name for this approval step.
- **Example:** "Manager Approval", "Finance Review", "Legal Sign-off"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for referencing the approval result.
- **Example:** `approval_status`, `manager_decision`
- **Why:** Allows subsequent steps to check approval status using `{{step_2.approval_status}}`.

---

##### Responsibility (Assignment)

**Assignment Type**
- **Field:** `step.assignment.type` or `step.assigneeType`
- **Type:** Dropdown select
- **Required:** Yes
- **Options:**
  - **Process Starter:** Assigned to the person who started the workflow
  - **Specific User:** Assigned to a specific approver
  - **Team Queue:** Assigned to a team (any member can approve)
- **Why:** Determines who has authority to approve this request.

**Assignee Selection** (when Assignment Type is SPECIFIC_USER or TEAM_QUEUE)
- **Field:** `step.assignment.assigneeId` or `step.assigneeId`
- **Type:** Dropdown select
- **Required:** Yes (when not STARTER)
- **Description:** Select the approver or approval team.
- **Why:** Ensures approval authority is correctly assigned.

---

##### Evidence

**Require Evidence Upload**
- **Field:** `step.requiresEvidence`
- **Type:** Toggle checkbox
- **Default:** `false`
- **Description:** Require approver to upload supporting documents.
- **Why:** Adds documentation to approval decisions.

---

##### Approval Configuration

**What should the approver review?**
- **Field:** `config.instruction`
- **Type:** Textarea (multiline text)
- **Required:** Yes
- **Description:** Detailed instructions explaining what the approver should review and consider.
- **Example:** "Please review the purchase request and verify that the budget is available. Check that all required approvals have been obtained."
- **Why:** Provides context to the approver, ensuring informed decisions.

**Approval Actions**
- **Field:** `config.actions`
- **Type:** Array of strings
- **Required:** Yes
- **Default:** `["Approve", "Reject"]`
- **Description:** Custom buttons/actions available to the approver.
- **Example:** `["Approve", "Reject", "Need More Info", "Escalate"]`
- **Why:** Allows custom approval workflows beyond simple approve/reject.

**Add Action Button**
- **Description:** Click to add a new approval action button.
- **Why:** Enables flexible approval processes (e.g., "Request Changes", "Defer Decision").

**Require Digital Signature**
- **Field:** `config.requireSignature`
- **Type:** Toggle checkbox
- **Default:** `false`
- **Description:** When enabled, approver must provide a digital signature to complete approval.
- **Why:** Adds legal validity and audit trail for critical approvals.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after approval (if no conditional routes match).
- **Why:** Controls workflow continuation after approval decision.

**Conditional Routes**
- **Field:** `step.routes.conditions`
- **Type:** Array of condition objects
- **Description:** Route workflow based on approval action selected.
- **Example:** If action is "Reject", go to "Correction Step"; if "Approve", continue to next step.
- **Why:** Enables different paths based on approval decision.

---

#### Code References
- **UI Renderer:** `src/components/run/task-renderer.tsx` (case "APPROVAL")
- **Config Panel:** `src/components/design/config-panel.tsx` (case "APPROVAL")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `APPROVAL` action)

---

### 3. MANUAL_TASK

**Code:** `MANUAL_TASK`

**Group:** Human Tasks

**Execution Type:** HUMAN (Requires user interaction - workflow pauses and waits)

**Description:**
A generic manual task assigned to a user. The user receives instructions and must complete the task within a specified time frame. Useful for tasks that don't fit into specific categories like Input or Approval.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Description:** Display name for this manual task.
- **Example:** "Review Contract", "Update Database", "Contact Customer"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for task completion status or result.
- **Example:** `task_completed`, `review_status`

---

##### Responsibility (Assignment)

**Assignment Type**
- **Field:** `step.assignment.type` or `step.assigneeType`
- **Type:** Dropdown select
- **Required:** Yes
- **Options:** STARTER, SPECIFIC_USER, TEAM_QUEUE
- **Why:** Determines who receives the task.

**Assignee Selection**
- **Field:** `step.assignment.assigneeId` or `step.assigneeId`
- **Type:** Dropdown select
- **Required:** Yes (when not STARTER)
- **Description:** Select the user or team responsible for this task.

---

##### Evidence

**Require Evidence Upload**
- **Field:** `step.requiresEvidence`
- **Type:** Toggle checkbox
- **Default:** `false`
- **Description:** Require user to upload proof of task completion.

---

##### Manual Task Configuration

**Instruction**
- **Field:** `config.instruction`
- **Type:** Textarea
- **Required:** Yes
- **Description:** Detailed instructions for what the user should do.
- **Example:** "Review the contract terms and verify all clauses are acceptable. Mark any issues in the comments section."
- **Why:** Provides clear guidance to ensure task is completed correctly.

**Due In Hours**
- **Field:** `config.dueInHours`
- **Type:** Number input
- **Required:** No
- **Description:** Number of hours from task assignment until due date.
- **Example:** `24` (due in 24 hours), `168` (due in 1 week)
- **Why:** Sets expectations and enables deadline tracking/notifications.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after task completion.

**Conditional Routes**
- **Field:** `step.routes.conditions`
- **Type:** Array of condition objects
- **Description:** Route workflow based on task completion status or output.

---

#### Code References
- **UI Renderer:** `src/components/run/task-renderer.tsx` (case "MANUAL_TASK")
- **Config Panel:** `src/components/design/config-panel.tsx` (case "MANUAL_TASK")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `MANUAL_TASK` action)

---

### 4. NEGOTIATE

**Code:** `NEGOTIATE`

**Group:** Human Tasks

**Execution Type:** HUMAN (Requires user interaction - workflow pauses and waits)

**Description:**
A negotiation step where users can exchange messages, proposals, and counter-offers. Typically used in contract negotiations, pricing discussions, or agreement processes.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Price Negotiation", "Contract Terms Discussion", "Service Agreement"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for negotiation result or final agreement.

---

##### Responsibility (Assignment)

**Assignment Type**
- **Field:** `step.assignment.type` or `step.assigneeType`
- **Type:** Dropdown select
- **Required:** Yes
- **Options:** STARTER, SPECIFIC_USER, TEAM_QUEUE
- **Why:** Determines negotiation participants.

**Assignee Selection**
- **Field:** `step.assignment.assigneeId` or `step.assigneeId`
- **Type:** Dropdown select
- **Required:** Yes (when not STARTER)

---

##### Evidence

**Require Evidence Upload**
- **Field:** `step.requiresEvidence`
- **Type:** Toggle checkbox
- **Default:** `false`
- **Description:** Require attachment of negotiation documents or agreements.

---

##### Negotiate Configuration

**Negotiation Instructions**
- **Field:** `config.instruction` (if available)
- **Type:** Textarea
- **Description:** Guidelines for the negotiation process.
- **Why:** Sets expectations and boundaries for negotiation.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select

**Conditional Routes**
- **Field:** `step.routes.conditions`
- **Type:** Array of condition objects
- **Description:** Route based on negotiation outcome (e.g., "Agreed" vs "No Agreement").

---

#### Code References
- **UI Renderer:** `src/components/run/task-renderer.tsx` (case "NEGOTIATE")
- **Config Panel:** `src/components/design/config-panel.tsx` (case "NEGOTIATE")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `NEGOTIATE` action)

---

### 5. INSPECT

**Code:** `INSPECT`

**Group:** Human Tasks

**Execution Type:** HUMAN (Requires user interaction - workflow pauses and waits)

**Description:**
An inspection step where a user reviews, verifies, or inspects something (e.g., quality check, compliance review, physical inspection). The inspector provides feedback or approval.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Quality Inspection", "Safety Check", "Compliance Review"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for inspection result or findings.

---

##### Responsibility (Assignment)

**Assignment Type**
- **Field:** `step.assignment.type` or `step.assigneeType`
- **Type:** Dropdown select
- **Required:** Yes
- **Options:** STARTER, SPECIFIC_USER, TEAM_QUEUE
- **Why:** Determines who performs the inspection.

**Assignee Selection**
- **Field:** `step.assignment.assigneeId` or `step.assigneeId`
- **Type:** Dropdown select
- **Required:** Yes (when not STARTER)

---

##### Evidence

**Require Evidence Upload**
- **Field:** `step.requiresEvidence`
- **Type:** Toggle checkbox
- **Default:** `false`
- **Description:** Require inspector to upload photos, reports, or documentation.

---

##### Inspect Configuration

**Inspection Instructions**
- **Field:** `config.instruction` (if available)
- **Type:** Textarea
- **Description:** Checklist or guidelines for the inspection.
- **Why:** Ensures consistent and thorough inspections.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select

**Conditional Routes**
- **Field:** `step.routes.conditions`
- **Type:** Array of condition objects
- **Description:** Route based on inspection result (e.g., "Pass" vs "Fail").

---

#### Code References
- **UI Renderer:** `src/components/run/task-renderer.tsx` (case "INSPECT")
- **Config Panel:** `src/components/design/config-panel.tsx` (case "INSPECT")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `INSPECT` action)

---

## Automation (⚡ Automated Steps)

### 6. Read Document (AI_PARSE)

**Code:** `AI_PARSE`

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Extract structured data from unstructured files (PDF, Excel, Image) using AI. The AI analyzes the document and extracts specified fields into JSON format. The workflow continues automatically after extraction.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Extract Invoice Data", "Parse Contract Terms", "Read Purchase Order"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No (but recommended)
- **Description:** Variable name for the extracted data object.
- **Example:** `extracted_data`, `invoice_fields`
- **Why:** Allows subsequent steps to access extracted fields using `{{step_1.extracted_data.invoiceNumber}}`.

---

##### AI Parse Configuration

**File Source Step**
- **Field:** `config.fileSourceStepId`
- **Type:** Dropdown select
- **Required:** Yes
- **Description:** Select the INPUT step where the file was uploaded (must be an INPUT step with `inputType === "file"`).
- **Why:** References the file from a previous step - the AI parser needs to know which file to process.

**Fields to Extract**
- **Field:** `config.fieldsToExtract`
- **Type:** Textarea (one field name per line)
- **Required:** Yes
- **Description:** List of field names to extract from the document. Each line is a field name.
- **Example:**
  ```
  invoiceDate
  amount
  vendor
  invoiceNumber
  ```
- **Why:** Tells the AI what data to look for and extract. The AI will return a JSON object with these keys.

**Output Variable Name** (repeated for clarity)
- **Field:** `config.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for the extracted JSON data.
- **Why:** Makes the extracted data available to subsequent steps.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after extraction completes (usually automatic).

**Note:** This step executes immediately and does not pause the workflow.

---

#### Execution Flow

1. **File Retrieval:** System retrieves the file URL from the specified INPUT step.
2. **AI Processing:** 
   - For PDF: Uses `pdf-parse` library to extract text, then sends to OpenAI GPT-4o
   - For Excel: Uses `xlsx` library to parse spreadsheet, then sends to AI
   - For Images: Sends directly to OpenAI GPT-4o Vision API
3. **Field Extraction:** AI extracts specified fields and returns structured JSON.
4. **Data Storage:** Extracted data is stored in the step's output and made available to subsequent steps.
5. **Continue:** Workflow automatically proceeds to the next step.

---

#### Code References
- **API Route:** `src/app/api/ai/parse-document/route.ts`
- **UI Renderer:** `src/components/run/ai-parse-renderer.tsx`
- **Config Panel:** `src/components/design/config-panel.tsx` (case "AI_PARSE")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "AI_PARSE")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `AI_PARSE` action)

---

### 7. Save to DB (DB_INSERT)

**Code:** `DB_INSERT`

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Save data to a custom collection/table in the Atomic Data database. This allows workflows to store structured data that can be queried, displayed in tables, or used in other workflows.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Save Invoice", "Create Customer Record", "Log Transaction"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for the created record ID or confirmation.
- **Example:** `saved_record_id`, `db_result`

---

##### Database Configuration

**Collection Name**
- **Field:** `config.collectionName`
- **Type:** Text input
- **Required:** Yes
- **Description:** Name of the collection/table to save data to. Must match an existing collection created in the Database Schema Builder (`/data/schema`).
- **Example:** `Deals`, `Employees`, `Orders`, `Invoices`
- **Why:** Identifies which table to insert the record into. The collection must exist before the workflow runs.

**Data Mapping**
- **Field:** `config.data`
- **Type:** Textarea (JSON object)
- **Required:** Yes
- **Description:** JSON object mapping field names to values. Values can be static strings or variables from previous steps using `{{variable}}` syntax.
- **Example:**
  ```json
  {
    "amount": "{{step_1.amount}}",
    "customer": "{{step_1.customerName}}",
    "date": "{{step_2.invoiceDate}}",
    "status": "pending"
  }
  ```
- **Why:** Defines what data to save. Variables are resolved at runtime from previous step outputs.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after data is saved (usually automatic).

**Note:** This step executes immediately and does not pause the workflow.

---

#### Execution Flow

1. **Collection Lookup:** System finds the collection by `collectionName` in Firestore.
2. **Variable Resolution:** All `{{variable}}` placeholders in `data` are resolved to actual values.
3. **Record Creation:** A new record is created in the `records` collection with:
   - `collectionId`: ID of the found collection
   - `data`: Resolved data object
   - `createdAt`: Timestamp
4. **Continue:** Workflow automatically proceeds to the next step.

---

#### Code References
- **API Route:** `src/app/api/data/records/route.ts` (POST)
- **Config Panel:** `src/components/design/config-panel.tsx` (case "DB_INSERT")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "DB_INSERT")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `DB_INSERT` action)

---

### 8. HTTP Request

**Code:** `HTTP_REQUEST` (formerly `FETCH`)

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Make HTTP API calls to external services. Useful for integrating with third-party APIs, webhooks, or custom backend services. The workflow continues automatically after the request completes.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Call Payment API", "Send Webhook", "Fetch Customer Data"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for the API response data.
- **Example:** `api_response`, `payment_result`

---

##### HTTP Request Configuration

**URL**
- **Field:** `config.url`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** The API endpoint URL. Can include variables from previous steps.
- **Example:** `https://api.example.com/payment`, `{{step_1.apiUrl}}/process`
- **Why:** Defines where to send the request. Variables allow dynamic URLs based on workflow data.

**HTTP Method**
- **Field:** `config.method`
- **Type:** Dropdown select
- **Required:** Yes
- **Default:** `GET`
- **Options:**
  - **GET:** Retrieve data
  - **POST:** Create or submit data
  - **PUT:** Update existing data
  - **DELETE:** Delete data
- **Why:** Determines the HTTP verb used in the request.

**Request Body (JSON)** (shown when method is POST or PUT)
- **Field:** `config.requestBody`
- **Type:** Textarea (JSON)
- **Required:** No
- **Description:** JSON body to send with POST/PUT requests. Supports variables.
- **Example:**
  ```json
  {
    "amount": "{{step_1.amount}}",
    "customerId": "{{step_2.customerId}}"
  }
  ```
- **Why:** Sends data to the API endpoint. Variables are resolved at runtime.

**Headers (Optional)**
- **Field:** `config.headers`
- **Type:** Textarea (JSON object)
- **Required:** No
- **Description:** HTTP headers to include in the request (e.g., Authorization, Content-Type).
- **Example:**
  ```json
  {
    "Authorization": "Bearer {{step_1.apiToken}}",
    "Content-Type": "application/json"
  }
  ```
- **Why:** Adds authentication, content type, or custom headers required by the API.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after API call completes.

**Note:** This step executes immediately and does not pause the workflow.

---

#### Execution Flow

1. **Variable Resolution:** URL, request body, and headers are resolved (variables replaced with actual values).
2. **HTTP Request:** System makes the HTTP request to the specified URL.
3. **Response Handling:** API response is stored in the step's output.
4. **Continue:** Workflow automatically proceeds to the next step.

---

#### Code References
- **Config Panel:** `src/components/design/config-panel.tsx` (case "HTTP_REQUEST")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "HTTP_REQUEST")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `HTTP_REQUEST` action)

---

### 9. Send Email

**Code:** `SEND_EMAIL` (formerly `TRANSMIT`)

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Send email notifications with HTML content and attachments. Useful for notifying stakeholders, sending reports, or triggering email-based workflows. The workflow continues automatically after the email is sent.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Send Invoice Email", "Notify Manager", "Email Report"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for email send confirmation or message ID.
- **Example:** `email_sent`, `message_id`

---

##### Email Configuration

**Recipient**
- **Field:** `config.recipient`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** Email address of the recipient. Can be a variable from a previous step.
- **Example:** `manager@company.com`, `{{step_1.customerEmail}}`
- **Why:** Defines who receives the email. Variables allow dynamic recipients based on workflow data.

**Subject**
- **Field:** `config.subject`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** Email subject line. Supports variables for dynamic content.
- **Example:** `Invoice {{step_1.invoiceNumber}}`, `Approval Required: {{step_2.requestTitle}}`
- **Why:** Provides context in the recipient's inbox. Variables personalize the subject.

**Body (HTML)**
- **Field:** `config.emailBody`
- **Type:** Textarea (HTML)
- **Required:** Yes
- **Description:** HTML email body content. Supports variables using `{{variable}}` syntax.
- **Example:**
  ```html
  <p>Hello {{step_1.customerName}},</p>
  <p>Your invoice #{{step_1.invoiceNumber}} for ${{step_1.amount}} is ready.</p>
  <p>Thank you!</p>
  ```
- **Why:** The email content. HTML allows rich formatting. Variables personalize the message.

**Attachments (Optional)**
- **Field:** `config.attachments`
- **Type:** Textarea (one URL per line)
- **Required:** No
- **Description:** File URLs from previous steps to attach to the email. One URL per line.
- **Example:**
  ```
  {{step_2.invoiceFileUrl}}
  {{step_3.contractFileUrl}}
  ```
- **Why:** Attaches documents generated or uploaded in previous steps (e.g., PDF invoices, contracts).

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after email is sent.

**Note:** This step executes immediately and does not pause the workflow.

---

#### Execution Flow

1. **Variable Resolution:** Recipient, subject, body, and attachments are resolved (variables replaced).
2. **Email Sending:** System sends the email using the configured email service (e.g., Resend, SendGrid).
3. **Confirmation:** Email send status is stored in the step's output.
4. **Continue:** Workflow automatically proceeds to the next step.

---

#### Code References
- **Config Panel:** `src/components/design/config-panel.tsx` (case "SEND_EMAIL")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "SEND_EMAIL")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `SEND_EMAIL` action)

---

### 10. Google Sheet

**Code:** `GOOGLE_SHEET` (formerly `GOOGLE_SHEET_APPEND`)

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Append or update rows in Google Sheets. Useful for logging workflow data, creating reports, or syncing data with spreadsheets. The workflow continues automatically after the operation completes.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Log to Sheet", "Update Customer List", "Append Transaction"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for the operation result or row number.

---

##### Google Sheet Configuration

**Operation**
- **Field:** `config.operation`
- **Type:** Dropdown select
- **Required:** Yes
- **Default:** `APPEND_ROW`
- **Options:**
  - **Append Row:** Add a new row at the end of the sheet
  - **Update Row:** Update an existing row (requires row identifier)
- **Why:** Determines whether to add new data or modify existing data.

**Spreadsheet ID**
- **Field:** `config.spreadsheetId`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** Google Sheets spreadsheet ID (found in the spreadsheet URL).
- **Example:** `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- **Why:** Identifies which spreadsheet to modify. Can be dynamic using variables.

**Sheet Name**
- **Field:** `config.sheetName`
- **Type:** Text input
- **Required:** Yes
- **Description:** Name of the sheet/tab within the spreadsheet.
- **Example:** `Sheet1`, `Data`, `Transactions`
- **Why:** Specifies which tab to write to (spreadsheets can have multiple sheets).

**Column Mapping**
- **Field:** `config.columnMapping`
- **Type:** Textarea (JSON object)
- **Required:** Yes
- **Description:** Maps column letters (A, B, C) or names to values. Values can be variables.
- **Example:**
  ```json
  {
    "A": "{{step_1.customerName}}",
    "B": "{{step_1.amount}}",
    "C": "{{step_2.date}}"
  }
  ```
- **Why:** Defines what data goes in which column. Column letters (A, B, C) or names can be used.

**Connection ID** (if applicable)
- **Field:** `config.connectionId`
- **Type:** Text input
- **Required:** No
- **Description:** ID of the Google Sheets connection/credential configured in the system.
- **Why:** Identifies which Google account/service account to use for authentication.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after sheet operation completes.

**Note:** This step executes immediately and does not pause the workflow.

---

#### Execution Flow

1. **Variable Resolution:** Spreadsheet ID and column mapping values are resolved.
2. **Google Sheets API Call:** System authenticates and makes API call to Google Sheets.
3. **Row Operation:** New row is appended or existing row is updated.
4. **Continue:** Workflow automatically proceeds to the next step.

---

#### Code References
- **Config Panel:** `src/components/design/config-panel.tsx` (case "GOOGLE_SHEET")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "GOOGLE_SHEET")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `GOOGLE_SHEET` action)

---

### 11. Generate Document

**Code:** `DOC_GENERATE`

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Generate PDF or DOCX documents from HTML templates. Templates use Handlebars syntax for dynamic content. Useful for creating invoices, contracts, reports, or any formatted documents. The workflow continues automatically after document generation.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Generate Invoice PDF", "Create Contract", "Generate Report"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for the generated document file URL.
- **Example:** `invoice_pdf_url`, `document_file`

---

##### Document Generation Configuration

**Template ID**
- **Field:** `config.templateId`
- **Type:** Text input
- **Required:** Yes
- **Description:** ID of the template record in the `templates` Firestore collection.
- **Example:** `invoice_template`, `contract_template`
- **Why:** References the HTML template to use. Templates are stored in Firestore and can be managed separately.

**Data Mapping**
- **Field:** `config.dataMapping`
- **Type:** Textarea (JSON object)
- **Required:** Yes
- **Description:** Maps variables to template placeholders. Template uses Handlebars syntax (e.g., `{{clientName}}`).
- **Example:**
  ```json
  {
    "clientName": "{{step_1.customerName}}",
    "amount": "{{step_1.invoiceAmount}}",
    "date": "{{step_2.invoiceDate}}"
  }
  ```
- **Why:** Provides data to fill the template. Variables are resolved from previous step outputs.

**Output Format**
- **Field:** `config.outputFormat`
- **Type:** Dropdown select
- **Required:** No
- **Default:** `pdf`
- **Options:**
  - **PDF:** Generate PDF document
  - **DOCX:** Generate Word document
- **Why:** Determines the file format of the generated document.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after document is generated.

**Note:** This step executes immediately and does not pause the workflow.

---

#### Execution Flow

1. **Template Retrieval:** System fetches the HTML template from Firestore using `templateId`.
2. **Variable Resolution:** Data mapping values are resolved (variables replaced with actual values).
3. **Template Compilation:** Handlebars compiles the template with the resolved data.
4. **Document Generation:** HTML is converted to PDF or DOCX using `html-pdf-node`.
5. **File Storage:** Generated document is saved to `public/uploads` and file URL is returned.
6. **Continue:** Workflow automatically proceeds to the next step.

---

#### Code References
- **API Route:** `src/app/api/ai/generate-document/route.ts`
- **Config Panel:** `src/components/design/config-panel.tsx` (case "DOC_GENERATE")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "DOC_GENERATE")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `DOC_GENERATE` action)

---

### 12. Calculate

**Code:** `CALCULATE`

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Perform mathematical calculations using variables from previous steps. Supports addition, subtraction, multiplication, division, and more complex formulas. The workflow continues automatically after calculation.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Calculate Total", "Compute Tax", "Sum Amounts"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for the calculation result.
- **Example:** `total_amount`, `tax_value`, `final_price`

---

##### Calculation Configuration

**Formula**
- **Field:** `config.formula`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** Mathematical formula using variables from previous steps. Supports `{{variable}}` syntax.
- **Example:**
  - `{{step_1.amount}} * 1.1` (add 10% to amount)
  - `{{step_1.total}} + {{step_2.tax}}` (add tax to total)
  - `{{step_1.price}} * {{step_1.quantity}}` (multiply price by quantity)
- **Why:** Defines the calculation to perform. Variables are resolved before evaluation.

**Available Variables Display**
- **Description:** Shows a list of available variables from previous steps that can be used in the formula.
- **Why:** Helps users identify which variables are available for use.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed after calculation completes.

**Note:** This step executes immediately and does not pause the workflow.

---

#### Execution Flow

1. **Variable Resolution:** All `{{variable}}` placeholders in the formula are resolved to numeric values.
2. **Formula Evaluation:** The formula is evaluated as a mathematical expression.
3. **Result Storage:** Calculation result is stored in the step's output.
4. **Continue:** Workflow automatically proceeds to the next step.

---

#### Code References
- **Config Panel:** `src/components/design/config-panel.tsx` (case "CALCULATE")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "CALCULATE")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `CALCULATE` action)

---

### 13. Gateway

**Code:** `GATEWAY`

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Conditional routing logic - evaluates conditions and routes the workflow to different steps based on variable values. Similar to "if-else" logic in programming. The workflow continues automatically after routing decision.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Check Amount", "Route by Status", "Decision Point"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for the routing decision or condition result.

---

##### Gateway Configuration

**Conditions**
- **Field:** `config.conditions`
- **Type:** Array of condition objects
- **Required:** Yes (at least one condition)
- **Description:** List of conditions to evaluate. First matching condition determines the route.
- **Condition Structure:**
  ```typescript
  {
    variable: string,        // Variable name (e.g., "step_1.amount")
    operator: "eq" | "neq" | "gt" | "lt" | "contains",  // Comparison operator
    value: string,           // Value to compare against
    nextStepId: string       // Step ID to jump to if condition is true
  }
  ```
- **Why:** Defines branching logic. Conditions are evaluated in order, and the first match determines the route.

**Add Condition Button**
- **Description:** Click to add a new condition. Configure:
  - **Variable:** Select from available variables or enter manually (e.g., `step_1.amount`)
  - **Operator:** Choose comparison type:
    - **eq:** Equal to
    - **neq:** Not equal to
    - **gt:** Greater than
    - **lt:** Less than
    - **contains:** Contains substring
  - **Value:** Enter the value to compare against (can be a variable or literal)
  - **Then go to:** Select the target step if condition is true
- **Why:** Allows multiple routing paths based on different conditions.

**Default Next Step (Else)**
- **Field:** `config.defaultNextStepId`
- **Type:** Dropdown select
- **Required:** No
- **Description:** Step to proceed to if no conditions match (the "else" case).
- **Options:**
  - **Select step...:** Choose a specific step
  - **Complete Process:** End the workflow
- **Why:** Handles cases where none of the conditions are true.

---

##### Flow Logic

**Note:** Gateway steps use their own conditions (`config.conditions`) instead of `step.routes.conditions`.

---

#### Execution Flow

1. **Variable Resolution:** Condition variables and values are resolved.
2. **Condition Evaluation:** Conditions are evaluated in order.
3. **Routing Decision:** First matching condition determines the next step. If no conditions match, `defaultNextStepId` is used.
4. **Continue:** Workflow automatically proceeds to the selected step.

---

#### Code References
- **Config Panel:** `src/components/design/config-panel.tsx` (case "GATEWAY")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "GATEWAY")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `GATEWAY` action)

---

### 14. Validate

**Code:** `VALIDATE`

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Validate data against a rule. If validation fails, the workflow can route to an error handling step or stop. Useful for data quality checks, business rule enforcement, or input validation. The workflow continues automatically after validation.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Validate Amount", "Check Required Fields", "Verify Format"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for validation result (e.g., `is_valid`, `validation_passed`).

---

##### Validation Configuration

**Validation Rule**
- **Field:** `config.rule`
- **Type:** Dropdown select
- **Required:** Yes
- **Default:** `EQUAL`
- **Options:**
  - **Greater Than:** Value must be greater than expected value
  - **Less Than:** Value must be less than expected value
  - **Equal:** Value must equal expected value
  - **Contains:** Value must contain expected substring
  - **Regex Pattern:** Value must match regex pattern
- **Why:** Defines the type of validation to perform.

**Value to Check**
- **Field:** `config.target`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** Variable or value to validate. Can be a variable from a previous step.
- **Example:** `{{step_1.amount}}`, `{{step_2.status}}`
- **Why:** Identifies what data to validate.

**Expected Value**
- **Field:** `config.value`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** The value to compare against (can be a variable or literal).
- **Example:** `1000`, `"approved"`, `{{step_1.minimumAmount}}`
- **Why:** Defines the expected value or pattern for validation.

**Error Message**
- **Field:** `config.errorMessage`
- **Type:** Text input
- **Required:** No
- **Description:** Message to display or log if validation fails.
- **Example:** `"Validation failed: Amount is too high"`, `"Status must be 'approved'"`
- **Why:** Provides context when validation fails, helpful for debugging or user feedback.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed if validation passes.

**On Success → Go To**
- **Field:** `step.routes.onSuccessStepId`
- **Type:** Dropdown select
- **Description:** Optional override for success case (if different from default next step).

**On Failure/Mismatch → Go To**
- **Field:** `step.routes.onFailureStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed if validation fails. Useful for error handling loops.
- **Example:** Route back to an INPUT step to ask user to correct the data.
- **Why:** Enables error recovery workflows.

---

#### Execution Flow

1. **Variable Resolution:** Target and expected values are resolved.
2. **Validation Check:** Rule is evaluated (e.g., is `step_1.amount > 1000`?).
3. **Routing Decision:**
   - If validation passes: Proceed to `onSuccessStepId` or `defaultNextStepId`.
   - If validation fails: Proceed to `onFailureStepId` or stop workflow.
4. **Continue:** Workflow automatically proceeds based on validation result.

---

#### Code References
- **Config Panel:** `src/components/design/config-panel.tsx` (case "VALIDATE")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "VALIDATE")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `VALIDATE` action)

---

### 15. Compare

**Code:** `COMPARE`

**Group:** Automation

**Execution Type:** AUTO (Executes immediately without user interaction)

**Description:**
Compare two values and route the workflow based on the comparison result. Useful for checking if two values match, differ, or meet a relationship (greater than, less than). The workflow continues automatically after comparison.

---

#### Configuration Panel Fields

##### Basic Information

**Step Title**
- **Field:** `step.title`
- **Type:** Text input
- **Required:** Yes
- **Example:** "Compare Amounts", "Check Match", "Verify Consistency"

**Output Variable Name**
- **Field:** `step.outputVariableName`
- **Type:** Text input
- **Required:** No
- **Description:** Variable name for comparison result (e.g., `values_match`, `comparison_result`).

---

##### Comparison Configuration

**First Value**
- **Field:** `config.targetA`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** First value to compare. Can be a variable from a previous step.
- **Example:** `{{step_1.invoiceAmount}}`, `{{step_2.total}}`
- **Why:** First operand in the comparison.

**Comparison Type**
- **Field:** `config.comparisonType`
- **Type:** Dropdown select
- **Required:** Yes
- **Default:** `exact`
- **Options:**
  - **Equal To:** Values must be exactly equal
  - **Greater Than:** First value must be greater than second
  - **Less Than:** First value must be less than second
  - **Similar To:** Fuzzy matching (for text similarity)
- **Why:** Defines the type of comparison to perform.

**Second Value**
- **Field:** `config.targetB`
- **Type:** Text input (supports variables)
- **Required:** Yes
- **Description:** Second value to compare against. Can be a variable or literal.
- **Example:** `{{step_1.expectedAmount}}`, `1000`
- **Why:** Second operand in the comparison.

**If it fails, force user to explain?**
- **Field:** `config.requireMismatchReason`
- **Type:** Toggle checkbox
- **Default:** `false`
- **Description:** When enabled and comparison fails, workflow routes to a user input step asking for explanation.
- **Why:** Captures reason for mismatch, useful for audit trails or troubleshooting.

---

##### Flow Logic

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed if comparison matches (or if no conditional routes).

**On Success → Go To**
- **Field:** `step.routes.onSuccessStepId`
- **Type:** Dropdown select
- **Description:** Optional override for match case.

**On Failure/Mismatch → Go To**
- **Field:** `step.routes.onFailureStepId`
- **Type:** Dropdown select
- **Description:** Where to proceed if comparison fails (values don't match or relationship is false).
- **Why:** Enables error handling or correction workflows.

---

#### Execution Flow

1. **Variable Resolution:** Both target values are resolved.
2. **Comparison:** Values are compared based on `comparisonType`.
3. **Routing Decision:**
   - If comparison passes: Proceed to `onSuccessStepId` or `defaultNextStepId`.
   - If comparison fails: Proceed to `onFailureStepId` or stop workflow.
4. **Continue:** Workflow automatically proceeds based on comparison result.

---

#### Code References
- **Config Panel:** `src/components/design/config-panel.tsx` (case "COMPARE")
- **Execution Engine:** `src/app/api/runs/execute/route.ts` (case "COMPARE")
- **Schema:** `src/types/schema.ts` (`AtomicStepConfig` interface, `COMPARE` action)

---

## Common Configuration Fields

### Flow Logic (All Steps)

All steps share common flow logic configuration:

**Default Next Step**
- **Field:** `step.routes.defaultNextStepId`
- **Type:** Dropdown select
- **Description:** The default step to proceed to after this step completes. If set to "Auto", proceeds to the next step in sequence.

**Conditional Routes**
- **Field:** `step.routes.conditions`
- **Type:** Array of condition objects
- **Description:** Define conditions to route workflow to different steps. Each condition has:
  - **Variable:** Variable name to check
  - **Operator:** Comparison operator (`>`, `<`, `==`, `!=`, `>=`, `<=`, `contains`, `startsWith`, `endsWith`)
  - **Value:** Value to compare against
  - **Then go to:** Target step if condition is true

**Success/Failure Routes** (for VALIDATE and COMPARE)
- **On Success → Go To:** `step.routes.onSuccessStepId`
- **On Failure → Go To:** `step.routes.onFailureStepId`
- **Description:** Specific routing for validation/comparison results.

---

## Variable Syntax

Throughout the configuration, variables from previous steps can be referenced using:

**Syntax:** `{{step_N.variableName}}`

**Examples:**
- `{{step_1.amount}}` - Value from step 1's `amount` field
- `{{step_2.outputVariableName}}` - Value from step 2's output variable
- `{{step_3.customerEmail}}` - Value from step 3's `customerEmail` field

**Why:** Allows dynamic data flow between steps, enabling workflows to use data collected or generated in previous steps.

---

## Execution Types

### HUMAN Steps
- **Behavior:** Workflow pauses and waits for user interaction
- **Notification:** User receives a task notification
- **Completion:** User must complete the task before workflow continues
- **Examples:** INPUT, APPROVAL, MANUAL_TASK, NEGOTIATE, INSPECT

### AUTO Steps
- **Behavior:** Executes immediately without user interaction
- **Notification:** No user notification (system executes automatically)
- **Completion:** Step completes instantly and workflow continues
- **Examples:** AI_PARSE, DB_INSERT, HTTP_REQUEST, SEND_EMAIL, GOOGLE_SHEET, DOC_GENERATE, CALCULATE, GATEWAY, VALIDATE, COMPARE

---

## Notes

- **Assignment:** Only HUMAN steps show the "Responsibility" (Assignment) section. AUTO steps do not require assignment.
- **Evidence:** Evidence upload can be required for HUMAN steps to add documentation.
- **Variable Resolution:** All variables are resolved at runtime when the step executes.
- **Error Handling:** Failed AUTO steps can be configured to route to error handling steps or stop the workflow.

---

## Version History

- **v2.0:** Refactored to separate HUMAN and AUTO step types. Updated action names (APPROVAL, HTTP_REQUEST, SEND_EMAIL, GOOGLE_SHEET). Added new actions (MANUAL_TASK, DOC_GENERATE).
- **v1.0:** Initial documentation with original action set.

---

**Last Updated:** 2024
