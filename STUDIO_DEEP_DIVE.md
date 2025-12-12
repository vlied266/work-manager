# 🏗️ Studio UI Deep Dive: Technical & Functional Audit

**Generated:** 2025-01-10  
**Auditor:** Senior Frontend Architect & UX Auditor  
**Scope:** Complete analysis of Workflow Studio (`src/app/(dashboard)/studio` and related components)

---

## 📋 Executive Summary

The Workflow Studio is a **drag-and-drop workflow builder** that allows users to create "Procedures" (linear sequences of atomic tasks) and "Process Groups" (chains of Procedures). The UI is built with React, TypeScript, Firestore, and uses `@dnd-kit` for drag-and-drop functionality.

**Key Findings:**
- ✅ **Well-structured** component architecture
- ⚠️ **Moderate complexity** in configuration panels (15 atomic actions with varying field requirements)
- ⚠️ **Missing** advanced features: conditional routing UI, variable resolver preview, step dependencies visualization
- ✅ **Process Groups** are implemented but **simplistic** (just ordered lists, no conditional logic between Procedures)

---

## 1. Studio UI Architecture

### 1.1 File Structure

```
src/app/(dashboard)/studio/
├── page.tsx                          # Entry point: Studio Hub (AI generation + navigation)
├── procedure/[id]/page.tsx           # Procedure Builder (main editor)
├── process/[id]/page.tsx             # Process Composer (chain Procedures)
└── templates/page.tsx                # Template Gallery

src/components/studio/
├── TriggerConfigModal.tsx            # Modal for configuring triggers
├── VisualEditor.tsx                  # Flow/canvas view (alternative to list view)
├── mobile-preview.tsx                # Mobile preview component
├── magic-input.tsx                   # AI-powered input with mentions
└── flow/                             # Flow-specific components
    ├── CustomNode.tsx
    └── GoogleSheetNode.tsx

src/components/design/
├── config-panel.tsx                  # ⭐ CRITICAL: Configuration UI for all atomic actions
├── draggable-sidebar.tsx             # Toolbox (drag-and-drop atomic actions)
├── sortable-canvas.tsx               # Canvas where steps are dropped/reordered
└── key-value-builder.tsx             # Helper for DB_INSERT data mapping
```

**Entry Point:** `/studio/page.tsx` → Hub with 3 cards:
1. **Create Procedure** → `/studio/procedure/new`
2. **Compose Process** → `/studio/process/new`
3. **Template Gallery** → `/studio/templates`

### 1.2 Layout Structure

The Procedure Builder (`procedure/[id]/page.tsx`) uses a **3-column layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Title, Description, Actions (Run, Activate, Save)   │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│  Sidebar     │    Canvas/List View      │   Config Panel   │
│  (Toolbox)   │    (Steps)               │   (Step Config)   │
│              │                          │                   │
│  - Drag      │  - Sortable list         │  - Basic Tab      │
│    actions   │  - Step cards            │  - Settings Tab  │
│  - Grouped   │  - Add/Delete buttons    │  - Assignment Tab │
│    by type   │  - Reorder via drag      │  - Routing Tab    │
│              │                          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

**View Modes:**
- **List View** (default): Vertical list of steps with cards
- **Canvas View** (`VisualEditor.tsx`): Flow diagram (less mature, optional)

**Preview Mode:** Toggle between Edit and Preview (read-only)

### 1.3 State Management

**Local State (useState):**
- `procedure`: The current Procedure object (draft)
- `selectedStepId`: Which step is currently being configured
- `procedureTitle`, `procedureDescription`: Form fields
- `isPublished`, `saving`, `loading`: UI state flags
- `viewMode`: "list" | "canvas"
- `previewMode`: boolean

**Firestore Real-time Sync:**
- Uses `onSnapshot` to sync Procedure from Firestore
- When user edits, updates are saved to Firestore via `updateDoc`
- **No Redux/Context for Procedure state** - direct Firestore sync

**Session Storage:**
- AI-generated Procedures are temporarily stored in `sessionStorage` before saving
- Key: `procedure-${tempId}`

**State Flow:**
```
User edits → Local state updates → Save button → Firestore update → onSnapshot → UI updates
```

**Complexity Note:** The Procedure object is large (contains `steps[]` array with nested `config` objects). Every edit triggers a full Firestore update. Consider optimistic updates or partial updates for better performance.

---

## 2. The Atomic Toolbox (Step Configuration)

### 2.1 Supported Atomic Actions

**Total: 15 Actions** (defined in `src/types/schema.ts`)

#### Human Tasks (5):
1. **INPUT** - Form input (text, number, email, date, file, select, checkbox, multiline)
2. **APPROVAL** - Approval/authorization step
3. **MANUAL_TASK** - Generic manual task
4. **NEGOTIATE** - Human negotiation/discussion
5. **INSPECT** - Manual inspection

#### Automation Tasks (10):
6. **AI_PARSE** - Extract data from documents (PDF, Excel, Images)
7. **DB_INSERT** - Save data to Firestore collection
8. **HTTP_REQUEST** - API call (GET, POST, PUT, DELETE)
9. **SEND_EMAIL** - Send email via Resend
10. **GOOGLE_SHEET** - Append/update Google Sheets
11. **DOC_GENERATE** - Generate PDF/DOCX from template
12. **CALCULATE** - Mathematical calculations
13. **GATEWAY** - Conditional branching (if/else logic)
14. **VALIDATE** - Data validation rules
15. **COMPARE** - Compare two values

### 2.2 Configuration Requirements (Per Action)

#### INPUT
**Required Fields:**
- `fieldLabel` (string) - Question text
- `inputType` (enum) - Type: text, number, email, date, select, checkbox, multiline, file

**Conditional Fields:**
- If `inputType === "select"` or `"checkbox"`: `options` (array) - List of options
- If `inputType === "file"`: `allowedExtensions` (array) - e.g., ["pdf", "jpg", "png"]

**Optional Fields:**
- `placeholder` (string)
- `required` (boolean)
- `outputVariableName` (string) - Custom variable name (default: derived from fieldLabel)
- `validationRegex` (string)
- `validationMessage` (string)

**Complexity:** ⚠️ **Medium** - Conditional fields based on inputType can be confusing.

---

#### DB_INSERT
**Required Fields:**
- `collectionName` (string) - Must match existing collection
- `data` (Record<string, any>) - Key-value mapping (e.g., `{ "amount": "{{step_1.output.total}}" }`)

**UI:** Uses `KeyValueBuilder` component for data mapping. Supports variable insertion via `{{variable}}` syntax.

**Complexity:** ⚠️ **High** - Users must understand:
1. Collection names must exist
2. Variable syntax (`{{step_1.output.field}}`)
3. Field names must match collection schema

---

#### AI_PARSE
**Required Fields:**
- `fileSourceStepId` (string) - ID of INPUT step with file, or `"TRIGGER_EVENT"` for automated triggers
- `fieldsToExtract` (string[]) - List of field names (e.g., `["name", "email", "phone"]`)

**Optional Fields:**
- `fileUrl` (string) - Direct file URL
- `fileType` (enum) - "pdf" | "excel" | "image"
- `outputVariableName` (string)

**Complexity:** ⚠️ **Medium** - Users must understand trigger context vs. step references.

---

#### SEND_EMAIL
**Required Fields:**
- `recipient` or `to` (string) - Email address (supports `{{variable}}`)
- `subject` (string) - Email subject (supports `{{variable}}`)
- `emailBody` or `body` (string) - Email body text (supports `{{variable}}`)

**Optional Fields:**
- `html` (string) - HTML email content (alternative to body)
- `from` (string) - From address (default: "Atomic Work <noreply@theatomicwork.com>")
- `attachments` (string[]) - File URLs from previous steps

**Complexity:** ⚠️ **Low** - Straightforward, but variable syntax must be understood.

---

#### HTTP_REQUEST
**Required Fields:**
- `url` (string) - API endpoint (supports `{{variable}}`)
- `method` (enum) - "GET" | "POST" | "PUT" | "DELETE"

**Optional Fields:**
- `headers` (Record<string, string>) - HTTP headers
- `requestBody` (string) - JSON body for POST/PUT (supports `{{variable}}`)

**Complexity:** ⚠️ **Medium** - Requires API knowledge.

---

#### GOOGLE_SHEET
**Required Fields:**
- `spreadsheetId` (string) - Google Sheets ID (supports `{{variable}}`)
- `sheetName` (string) - Sheet/tab name
- `operation` (enum) - "APPEND_ROW" | "UPDATE_ROW"
- `columnMapping` (Record<string, string>) - Maps columns (A, B, C) to values

**Optional Fields:**
- `connectionId` (string) - Google Sheets connection/credential ID

**Complexity:** ⚠️ **High** - Requires Google Sheets knowledge and column mapping understanding.

---

#### DOC_GENERATE
**Required Fields:**
- `templateId` (string) - ID of template in Firestore `templates` collection
- `dataMapping` (Record<string, string>) - Maps variables to template placeholders

**Optional Fields:**
- `outputFormat` (enum) - "pdf" | "docx" (default: "pdf")

**Complexity:** ⚠️ **High** - Requires template setup and mapping knowledge.

---

#### CALCULATE
**Required Fields:**
- `formula` (string) - Mathematical formula using variables (e.g., `"{{step_1.output.amount}} * 1.1"`)

**Complexity:** ⚠️ **Medium** - Requires formula syntax knowledge.

---

#### GATEWAY
**Required Fields:**
- `conditions` (array) - Array of condition objects:
  ```typescript
  {
    variable: string,        // e.g., "step_1.output.amount"
    operator: "eq" | "neq" | "gt" | "lt" | "contains",
    value: string,          // Comparison value
    nextStepId: string      // Step to jump to if true
  }
  ```
- `defaultNextStepId` (string) - Step to proceed to if no conditions match

**Complexity:** ⚠️ **Very High** - Complex conditional logic. No visual flow builder.

---

#### VALIDATE
**Required Fields:**
- `rule` (enum) - "GREATER_THAN" | "LESS_THAN" | "EQUAL" | "CONTAINS" | "REGEX"
- `target` (string) - Variable to validate (supports `{{variable}}`)
- `value` (any) - Expected value

**Optional Fields:**
- `errorMessage` (string) - Custom error message

**Complexity:** ⚠️ **Medium** - Straightforward validation rules.

---

#### COMPARE
**Required Fields:**
- `targetA` (string) - First value (supports `{{variable}}`)
- `targetB` (string) - Second value (supports `{{variable}}`)
- `comparisonType` (enum) - "exact" | "fuzzy" | "numeric" | "date"

**Optional Fields:**
- `requireMismatchReason` (boolean) - If true, routes to user input on mismatch

**Complexity:** ⚠️ **Medium** - Straightforward comparison.

---

#### APPROVAL / MANUAL_TASK / NEGOTIATE / INSPECT
**Required Fields:**
- `instruction` (string) - Task instructions/guidelines

**Optional Fields (APPROVAL):**
- `requireSignature` (boolean)
- `actions` (string[]) - Custom approval actions (default: ["Approve", "Reject"])
- `approvalLevel` (number)

**Optional Fields (MANUAL_TASK):**
- `dueInHours` (number)

**Optional Fields (INSPECT):**
- `proofType` (enum) - "photo" | "signature" | "checkbox"

**Complexity:** ⚠️ **Low** - Simple instruction-based tasks.

---

### 2.3 Configuration Panel Structure

The `ConfigPanel` component uses **tabs** to organize fields:

1. **Basic Tab** - Critical required fields
2. **Settings Tab** - Optional/advanced fields
3. **Assignment Tab** - Who does the task (for HUMAN steps)
4. **Routing Tab** - Conditional flow (for VALIDATE/COMPARE/GATEWAY)

**Complexity Hotspots:**
- ⚠️ **Variable Resolution:** Users must manually type `{{step_1.output.field}}` - no autocomplete or picker
- ⚠️ **No Validation Preview:** Users can't test if variables resolve correctly before saving
- ⚠️ **Conditional Fields:** Some fields only appear based on other field values (e.g., INPUT options only show for select/checkbox)
- ⚠️ **No Field Helpers:** No tooltips or inline help for complex fields (e.g., GATEWAY conditions)

---

## 3. Procedure Logic (The "Molecule")

### 3.1 Data Structure

```typescript
interface Procedure {
  id: string;
  organizationId: string;
  processGroupId: string;              // Link to Process Group (Level 3)
  title: string;
  description: string;
  isPublished: boolean;                // Whether procedure is published
  isActive?: boolean;                   // For automated triggers: listening for events
  steps: AtomicStep[];                 // Ordered array of steps
  defaultAssignee?: {
    type: "USER" | "TEAM";
    id: string;
  };
  trigger?: {
    type: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK";
    config?: {
      folderPath?: string;             // For ON_FILE_CREATED
      provider?: "google_drive" | "dropbox" | "local";
      webhookUrl?: string;             // For WEBHOOK (auto-generated)
      webhookSecret?: string;         // For WEBHOOK
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Steps Array:**
- Ordered by array index (step 0, step 1, step 2, ...)
- Each step has a unique `id` (e.g., `"step-1234567890-abc123"`)
- Steps can reference each other via `id` in routing logic

### 3.2 Step Connectivity (Variable Resolution)

**How Step A passes data to Step B:**

1. **Step A** produces output (e.g., `{ name: "John", email: "john@example.com" }`)
2. **Step B** references Step A's output via variable syntax: `{{step_1.output.name}}`
3. **Variable Resolver** (`src/lib/engine/resolver.ts`) resolves variables at runtime:
   - Looks up `step_1` in the run context
   - Extracts `output.name`
   - Replaces `{{step_1.output.name}}` with actual value

**Variable Syntax:**
- `{{step_N.output.field}}` - Access output field from step N
- `{{step_N_output.field}}` - Alternative flat syntax
- `{{trigger.body.field}}` - Access webhook request body
- `{{trigger.headers.header}}` - Access webhook headers

**UI Support:**
- ⚠️ **No Variable Picker:** Users must manually type variable syntax
- ⚠️ **No Autocomplete:** No dropdown showing available variables
- ⚠️ **No Preview:** Can't test variable resolution in Studio
- ✅ **MagicInput Component:** Some fields use `MagicInput` which shows variable hints, but not a full picker

**Complexity:** ⚠️ **High** - Users must memorize variable syntax and step indices.

### 3.3 Validation

**Validation Hook:** `useProcedureValidation` (`src/hooks/use-procedure-validation.ts`)

**Current Validation Rules:**
- ✅ **INPUT:** Checks for `fieldLabel` and `inputType`
- ✅ **COMPARE:** Checks for `targetA` and `targetB`
- ✅ **AUTHORIZE/NEGOTIATE:** Checks for `instruction`
- ✅ **GOOGLE_SHEET_APPEND:** Checks for `sheetId` and column mapping
- ⚠️ **Missing:** Validation for other actions (DB_INSERT, SEND_EMAIL, AI_PARSE, etc.)

**Validation UI:**
- Validation errors are shown in the Config Panel
- ⚠️ **No Save Prevention:** Users can still save invalid procedures (validation is advisory)

**Complexity:** ⚠️ **Low** - Basic validation, but incomplete coverage.

---

## 4. Process Logic (The "Material")

### 4.1 Process Group Structure

```typescript
interface ProcessGroup {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  icon: string;
  procedureSequence: string[];         // Ordered list of Procedure IDs
  isActive: boolean;
  defaultAssignee?: {
    type: "USER" | "TEAM";
    id: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Process Composer Implementation

**Location:** `src/app/(dashboard)/studio/process/[id]/page.tsx`

**How It Works:**
1. **Library View:** Shows all Procedures for the organization
2. **Drag & Drop:** Users drag Procedures into a sequence
3. **Ordering:** `procedureSequence` stores ordered Procedure IDs
4. **Execution:** When a Process Group is started, Procedures execute **sequentially** in order

**Limitations:**
- ⚠️ **No Conditional Logic:** Can't route between Procedures based on conditions
- ⚠️ **No Data Passing:** Procedures don't share data (each Procedure starts fresh)
- ⚠️ **No Parallel Execution:** Procedures always run sequentially
- ⚠️ **No Loops:** Can't repeat Procedures

**Complexity:** ⚠️ **Low** - Very simple implementation, just an ordered list.

**Missing Features:**
- Conditional routing between Procedures
- Data pipeline between Procedures
- Parallel execution
- Error handling between Procedures
- Process-level variables

---

## 5. Assignment & Execution Logic

### 5.1 Assignment Configuration

**Per-Step Assignment:**
```typescript
assignment?: {
  type: "STARTER" | "SPECIFIC_USER" | "TEAM_QUEUE";
  assigneeId?: string;
}
```

**Assignment Types:**
- **STARTER:** Assigned to the user who started the workflow
- **SPECIFIC_USER:** Assigned to a specific user (by `assigneeId`)
- **TEAM_QUEUE:** Assigned to a team (by `assigneeId`)

**Default Assignment:**
- Procedure-level `defaultAssignee` is used if step doesn't specify
- If no default, falls back to workflow starter

**UI:**
- Assignment Tab in Config Panel (for HUMAN steps only)
- Dropdown to select user or team
- ⚠️ **No Dynamic Assignment:** Can't assign based on variables (e.g., `{{step_1.output.managerId}}`)

**Complexity:** ⚠️ **Low** - Simple static assignment.

### 5.2 Execution Buttons

#### "Run Now" Button
**Location:** Procedure Builder header  
**API:** `POST /api/runs/start`  
**Payload:**
```json
{
  "procedureId": "...",
  "orgId": "...",
  "starterUserId": "..."
}
```

**Logic:**
- Only works for `MANUAL` triggers
- Creates a new `active_run` document
- Assigns first step to appropriate user
- Redirects to `/run/{runId}`

**Complexity:** ⚠️ **Low** - Straightforward manual trigger.

#### "Activate/Deactivate" Button
**Location:** Procedure Builder header  
**Action:** Toggles `isActive` field in Firestore

**Logic:**
- Only available for `ON_FILE_CREATED` or `WEBHOOK` triggers
- When activating, automatically sets `isPublished: true` (ensures cron job can find it)
- Updates Firestore: `updateDoc(doc(db, "procedures", id), { isActive: newActiveState, isPublished: newPublishedState })`

**Complexity:** ⚠️ **Low** - Simple toggle.

#### "Trigger Settings" Button
**Location:** Procedure Builder header  
**Component:** `TriggerConfigModal`

**Options:**
1. **MANUAL** - No trigger (user starts manually)
2. **ON_FILE_CREATED** - Triggered when file is uploaded to Google Drive folder
   - Requires: `folderPath` (e.g., "/Resumes")
   - Requires: `provider` (default: "google_drive")
3. **WEBHOOK** - Triggered by HTTP POST request
   - Auto-generates: `webhookUrl` (e.g., `/api/webhooks/{procedureId}`)
   - Auto-generates: `webhookSecret` (random string)
   - Shows copy buttons for URL and secret

**Complexity:** ⚠️ **Medium** - Requires understanding of file paths and webhooks.

---

## 6. Complexity Analysis

### 6.1 High Complexity Areas

1. **Variable Resolution** ⚠️⚠️⚠️
   - Users must manually type `{{step_N.output.field}}`
   - No autocomplete or picker
   - No preview/testing
   - Step indices are confusing (step_1 = index 0)

2. **GATEWAY Configuration** ⚠️⚠️⚠️
   - Complex conditional logic
   - No visual flow builder
   - Must manually specify `nextStepId` strings
   - No validation that `nextStepId` exists

3. **DB_INSERT Data Mapping** ⚠️⚠️
   - Must know collection schema
   - Must match field names exactly
   - Variable syntax required
   - No schema preview

4. **GOOGLE_SHEET Configuration** ⚠️⚠️
   - Requires Google Sheets knowledge
   - Column mapping (A, B, C) is technical
   - No spreadsheet picker

### 6.2 Medium Complexity Areas

1. **AI_PARSE Configuration** ⚠️
   - Must understand trigger context vs. step references
   - Field extraction list must match expected output

2. **HTTP_REQUEST Configuration** ⚠️
   - Requires API knowledge
   - Headers and body formatting

3. **DOC_GENERATE Configuration** ⚠️
   - Requires template setup
   - Data mapping to template placeholders

### 6.3 Low Complexity Areas

1. **INPUT Configuration** ✅
   - Straightforward form fields
   - Conditional fields are clear

2. **SEND_EMAIL Configuration** ✅
   - Simple email fields
   - Variable hints available

3. **APPROVAL/MANUAL_TASK Configuration** ✅
   - Just instruction text

---

## 7. Missing Features & Gaps

### 7.1 UI/UX Gaps

- ❌ **No Variable Picker:** Users must type `{{step_1.output.field}}` manually
- ❌ **No Variable Preview:** Can't test variable resolution before saving
- ❌ **No Step Dependencies Visualization:** Can't see which steps depend on which
- ❌ **No Flow Diagram for Routing:** GATEWAY conditions are text-only
- ❌ **No Schema Browser:** Can't browse collection schemas when configuring DB_INSERT
- ❌ **No Template Browser:** Can't browse templates when configuring DOC_GENERATE
- ❌ **No Google Sheets Picker:** Must manually enter spreadsheet ID
- ❌ **No Validation Preview:** Can't test VALIDATE rules before saving

### 7.2 Functional Gaps

- ❌ **No Conditional Routing UI:** GATEWAY conditions are complex JSON
- ❌ **No Process-Level Variables:** Procedures in Process Groups can't share data
- ❌ **No Parallel Execution:** Everything is sequential
- ❌ **No Error Handling UI:** Can't configure error handling between steps
- ❌ **No Step Dependencies:** Can't enforce that Step B requires Step A to complete
- ❌ **No Step Templates:** Can't save/reuse step configurations
- ❌ **No Procedure Versioning:** Can't roll back to previous versions

### 7.3 Hardcoded/Technical Debt

- ⚠️ **Step ID Generation:** Uses `step-${Date.now()}-${random}` - not user-friendly
- ⚠️ **Variable Syntax:** Hardcoded `{{step_N.output.field}}` - no abstraction
- ⚠️ **Collection Names:** Must match exactly - no fuzzy matching or suggestions
- ⚠️ **No Import/Export:** Can't export Procedure as JSON or import from file

---

## 8. Recommendations

### 8.1 Immediate Improvements (High Impact, Low Effort)

1. **Add Variable Picker**
   - Dropdown showing available variables from previous steps
   - Click to insert instead of typing

2. **Add Variable Preview**
   - Show resolved values in Config Panel (mock data)
   - Help users catch errors before saving

3. **Improve Validation**
   - Prevent saving invalid procedures
   - Show all validation errors at once
   - Add validation for all action types

4. **Add Field Helpers**
   - Tooltips explaining complex fields
   - Inline examples (e.g., "Example: {{step_1.output.email}}")

### 8.2 Medium-Term Improvements

1. **Visual Flow Builder for GATEWAY**
   - Drag-and-drop conditional branches
   - Visual representation of routing logic

2. **Schema Browser for DB_INSERT**
   - Browse collections and fields
   - Auto-complete field names

3. **Step Dependencies Visualization**
   - Show which steps depend on which
   - Highlight missing dependencies

### 8.3 Long-Term Improvements

1. **Process-Level Variables**
   - Allow Procedures in Process Groups to share data
   - Pipeline data between Procedures

2. **Conditional Routing Between Procedures**
   - Allow Process Groups to route based on Procedure outcomes

3. **Parallel Execution**
   - Allow multiple Procedures to run simultaneously

4. **Procedure Versioning**
   - Track changes over time
   - Roll back to previous versions

---

## 9. Conclusion

The Workflow Studio is **functionally complete** but has **usability gaps** that increase complexity for end users. The main pain points are:

1. **Variable Resolution** - Manual typing, no autocomplete
2. **Complex Actions** - GATEWAY, DB_INSERT, GOOGLE_SHEET require technical knowledge
3. **No Visual Aids** - Flow diagrams, dependency graphs, schema browsers are missing
4. **Process Groups** - Too simplistic, missing advanced features

**Recommendation:** Focus on **UX improvements** (variable picker, preview, validation) before adding new features. These will have the highest impact on reducing perceived complexity.

---

**End of Audit Report**

