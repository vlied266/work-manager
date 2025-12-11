# Project Architecture: Atomic Work - AI-Powered Business Automation OS

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Core Systems & Architecture](#core-systems--architecture)
4. [Database Schema](#database-schema)
5. [Frontend & UI Features](#frontend--ui-features)
6. [Key Flows](#key-flows)
7. [API Routes](#api-routes)

---

## Project Overview

**Atomic Work** is an AI-powered Business Automation Operating System that enables organizations to create, execute, and monitor complex business workflows through natural language descriptions. The system automatically:

- **Generates workflows** from natural language prompts using AI
- **Processes documents** (PDFs, images, Excel) using AI vision and text extraction
- **Creates database schemas** dynamically based on document types
- **Generates dashboard layouts** automatically for data visualization
- **Monitors data** with intelligent alert rules that trigger notifications and emails
- **Executes workflows** with human-in-the-loop support for manual steps

### Core Philosophy: The Atomic Engine

The system follows a **4-Layer Biological Hierarchy**:

- **Level 4: Organization** (The Organism) - Top-level workspace/company
- **Level 3: Process Group** (The Material) - Collections of related workflows
- **Level 2: Procedure** (The Molecule) - Linear sequence of steps
- **Level 1: Atomic Step** (The Atom) - Indivisible unit of work

Every workflow is composed of **15 Atomic Actions** (the "Periodic Table of Work"):
- **Human Tasks**: `INPUT`, `APPROVAL`, `MANUAL_TASK`, `NEGOTIATE`, `INSPECT`
- **Automation Tasks**: `AI_PARSE`, `DB_INSERT`, `HTTP_REQUEST`, `SEND_EMAIL`, `GOOGLE_SHEET`, `DOC_GENERATE`, `CALCULATE`, `GATEWAY`, `VALIDATE`, `COMPARE`

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 with custom Glassmorphism design system
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API
- **File Processing**: 
  - `pdf2json` - Text extraction from PDFs
  - `pdf-lib` - Image extraction from scanned PDFs
  - `papaparse` - CSV export/import

### Backend
- **Runtime**: Node.js (Vercel Serverless Functions)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **Admin SDK**: Firebase Admin SDK

### AI & Integrations
- **AI Provider**: OpenAI (GPT-4o, GPT-4o-mini)
  - Function Calling for tool execution
  - Vision API for image/document analysis
  - Structured JSON output with Zod schemas
- **Email Service**: Resend
- **Google APIs**: 
  - Google Drive API (via `googleapis`)
  - Google Sheets API
  - Google Calendar API
- **Slack Integration**: Slack Webhooks

### Development Tools
- **Language**: TypeScript
- **Package Manager**: npm
- **Build Tool**: Next.js built-in
- **Deployment**: Vercel

---

## Core Systems & Architecture

### 1. Workflow Engine

The workflow engine is the heart of the system, responsible for executing atomic steps in sequence.

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Execution Flow                   │
└─────────────────────────────────────────────────────────────┘

1. TRIGGER → 2. RUN CREATION → 3. STEP EXECUTION → 4. COMPLETION
     │              │                    │                │
     │              │                    │                │
     ▼              ▼                    ▼                ▼
[File Upload]  [active_runs]    [AI_PARSE/DB_INSERT]  [Status Update]
[Webhook]      [triggerContext] [Variable Resolution]  [Alert Check]
[Manual]       [initialInput]   [Context Building]    [Notification]
```

#### Key Components

**1. Trigger System** (`/api/runs/trigger`)
- Handles `ON_FILE_CREATED` triggers from Google Drive
- Matches file paths to workflow folder configurations
- Creates `active_runs` documents with `triggerContext`

**2. Execution Engine** (`/api/runs/execute`)
- Processes both **HUMAN** and **AUTO** steps
- **HUMAN Steps**: Creates `user_tasks`, pauses workflow (`WAITING_FOR_USER`)
- **AUTO Steps**: Executes immediately, continues to next step
- Supports **routing logic** (conditional branching, success/failure paths)
- Builds **run context** for variable resolution across steps

**3. Variable Resolution** (`/lib/engine/resolver.ts`)
- Resolves `{{step_1.output.name}}` syntax
- Multi-strategy approach:
  - Standard nested lookup: `step_1.output.name`
  - Flattened fallback: `step_1_output.name`
- Safe traversal with error handling

#### Google Drive Watcher (`/api/cron/drive-watcher`)

**External Cron Job** (called every 24 hours by external service):
1. Fetches all procedures with `ON_FILE_CREATED` triggers
2. Queries Google Drive API for new files in watched folders
3. Compares against `file_watcher_cache` collection
4. For new files:
   - Updates cache with `detectedAt` timestamp
   - Calls `/api/runs/trigger` to create workflow runs
5. Updates `lastPolledAt` on procedures (even inactive ones) for UI status

**Key Features**:
- Only triggers **active** and **published** procedures
- Updates `lastPolledAt` for **all** procedures (for UI "Checked X ago" display)
- Prevents duplicate triggers via cache

---

### 2. AI Auto-Creation System

The AI system uses **OpenAI Function Calling** to dynamically create database schemas and dashboard layouts.

#### AI Workflow Generator (`/api/ai/generate-procedure`)

**Input**: Natural language description (e.g., "Extract name and email from resumes")

**Process**:

1. **Context Building**:
   - Fetches organization staff list
   - Fetches existing collections schema
   - Loads dynamic system prompt from Firestore (or uses default)

2. **Function Calling Loop**:
   ```
   Iteration 1: AI decides if tools are needed
   ├─ create_database_collection? → Execute → Update context
   ├─ generate_dashboard_layout? → Execute → Update context
   └─ create_alert_rule? → Execute → Update context
   
   Iteration 2: AI generates workflow JSON
   └─ Returns complete workflow with steps
   ```

3. **Tool Execution**:
   - **`create_database_collection`**: Creates Firestore collection with fields
   - **`generate_dashboard_layout`**: Generates widget configuration
   - **`create_alert_rule`**: Creates alert rules for data monitoring

#### AI Tools

**Tool 1: `create_database_collection`**
```typescript
Parameters:
  - name: string (e.g., "Candidates")
  - fields: Array<{ label: string, key: string, type: string }>
  
Logic:
  - Normalizes keys to snake_case
  - Automatically adds "file_url" field if missing
  - Creates collection document in Firestore
  - Returns collection ID and schema
```

**Tool 2: `generate_dashboard_layout`**
```typescript
Parameters:
  - collection_name: string
  - widgets: Array<DashboardWidget>
  
Widget Types:
  - stat_card: Sum/count/avg operations
  - bar_chart: X/Y axis mappings
  - line_chart: Time-series data
  - pie_chart: Categorical distributions
  
Logic:
  - Analyzes collection fields
  - Generates 3+ widgets based on field types
  - Saves to collection.dashboardLayout
```

**Tool 3: `create_alert_rule`**
```typescript
Parameters:
  - collection_name: string
  - condition_description: string (e.g., "amount is over 5000")
  - message_template?: string
  - action?: 'in_app' | 'email' | 'both'
  
Logic:
  - Uses AI (GPT-4o-mini) to parse condition to JavaScript
  - Falls back to pattern matching if AI fails
  - Creates alert rule in _alerts collection
```

#### Document Parsing (`/api/ai/parse-document`)

**Multi-Modal Support**:

1. **Text PDFs**: Uses `pdf2json` to extract text
2. **Scanned PDFs**: 
   - Attempts text extraction first
   - If no text found, uses `pdf-lib` to extract first image
   - Sends image to OpenAI Vision API
3. **Images** (JPG, PNG, WEBP, GIF): Direct Vision API processing
4. **Excel Files**: Text extraction + AI parsing

**Vision API Integration**:
- Uses `gpt-4o` model with `image_url` content type
- Dynamically builds Zod schema from `fieldsToExtract`
- Returns structured JSON with extracted fields

**Error Handling**:
- Soft fallback: If document is unreadable, returns nulls instead of crashing
- Logs detailed errors for debugging

---

### 3. Alert System

The alert system monitors data in real-time and triggers notifications when conditions are met.

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Alert System Flow                          │
└─────────────────────────────────────────────────────────────┘

DB_INSERT Success
      │
      ▼
checkAlertsForRecord()
      │
      ├─ Fetch active rules from _alerts collection
      │
      ├─ For each rule:
      │   ├─ Evaluate condition (JavaScript-like)
      │   ├─ If true:
      │   │   ├─ Resolve message template
      │   │   ├─ Create _notifications entry (if in_app/both)
      │   │   └─ Send email via Resend (if email/both)
      │   └─ Continue to next rule
      │
      └─ Non-blocking: Errors don't crash workflow
```

#### Components

**1. Alert Rules** (`_alerts` collection)
```typescript
interface AlertRule {
  collectionName: string;
  condition: string; // e.g., "record.total_amount > 5000"
  message: string; // Template: "High value: {{invoice_number}}"
  action: 'email' | 'in_app' | 'both';
  organizationId: string;
  isActive: boolean;
  recipientEmail?: string; // Overrides ADMIN_EMAIL
}
```

**2. Condition Evaluation** (`/lib/alerts/check-alerts.ts`)
- Validates condition syntax (prevents code injection)
- Uses `Function` constructor for safe evaluation
- Returns `true` only if condition explicitly evaluates to `true`

**3. Message Template Resolution**
- Replaces `{{field_name}}` with actual record values
- Supports nested field access

**4. Notification Creation**
- **In-App**: Creates document in `_notifications` collection
- **Email**: Calls `sendAlertEmail()` via Resend
- **Both**: Creates both notification types

**5. Email Service** (`/lib/email/send-alert.ts`)
- Uses Resend SDK
- HTML email template with:
  - Alert message
  - Collection name, Record ID, timestamp
  - Direct link to record detail page
- Fetches `collectionId` from `collectionName` for accurate URLs
- Error handling: Logs but doesn't throw

#### Integration Point

Alert checking is triggered **automatically** after every successful `DB_INSERT` in `/api/runs/execute`:

```typescript
// After record insertion
await checkAlertsForRecord(
  orgId,
  collectionName,
  recordId,
  cleanData
);
```

---

## Database Schema

### System Collections

#### 1. `procedures`
Workflow definitions (templates).

```typescript
{
  id: string;
  organizationId: string;
  processGroupId: string;
  title: string;
  description: string;
  isPublished: boolean;
  isActive: boolean; // For automated triggers
  steps: AtomicStep[];
  trigger?: {
    type: "MANUAL" | "ON_FILE_CREATED" | "WEBHOOK";
    config: {
      folderPath?: string;
      provider?: "google_drive";
      webhookUrl?: string;
    };
  };
  lastPolledAt?: Timestamp; // Updated by cron job
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. `active_runs`
Workflow execution instances.

```typescript
{
  id: string;
  organizationId: string;
  procedureId: string;
  procedureTitle: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FLAGGED" | "WAITING_FOR_USER";
  currentStepId: string;
  currentStepIndex: number;
  triggerContext?: {
    file: string;
    fileId: string;
    filePath: string;
    fileUrl: string;
  };
  initialInput?: any;
  logs: Array<{
    stepId: string;
    stepTitle: string;
    action: AtomicAction;
    output: any;
    timestamp: Timestamp;
    outcome: "SUCCESS" | "FAILURE" | "FLAGGED";
    executedBy: string;
    executionType: "AUTO" | "HUMAN";
  }>;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  assigneeId?: string;
  assigneeType: "USER" | "TEAM";
}
```

#### 3. `collections`
Dynamic business data schemas (created by AI or manually).

```typescript
{
  id: string;
  orgId: string;
  name: string; // e.g., "Candidates", "Invoices"
  fields: Array<{
    key: string; // snake_case (e.g., "total_amount")
    label: string; // Human-readable (e.g., "Total Amount")
    type: "text" | "number" | "date" | "boolean" | "select";
    options?: string[]; // For select type
  }>;
  dashboardLayout?: {
    widgets: Array<{
      id: string;
      type: 'stat_card' | 'bar_chart' | 'line_chart' | 'pie_chart';
      title: string;
      field: string;
      operation?: 'sum' | 'count' | 'avg';
      xAxis?: string;
      yAxis?: string;
    }>;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4. `records`
Actual data records (inserted by `DB_INSERT` steps).

```typescript
{
  id: string;
  collectionId: string;
  organizationId: string;
  data: Record<string, any>; // Dynamic fields based on collection schema
  verificationStatus?: "pending" | "needs_review" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

#### 5. `_alerts`
Alert rule definitions.

```typescript
{
  id: string;
  collectionName: string;
  condition: string; // JavaScript-like: "record.total_amount > 5000"
  message: string; // Template: "High value: {{invoice_number}}"
  action: 'email' | 'in_app' | 'both';
  organizationId: string;
  isActive: boolean;
  recipientEmail?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 6. `_notifications`
Alert-triggered notifications.

```typescript
{
  id: string;
  alertRuleId: string;
  collectionName: string;
  recordId: string;
  recordData: any;
  message: string; // Resolved message (variables replaced)
  action: 'email' | 'in_app';
  organizationId: string;
  read: boolean;
  createdAt: Timestamp;
}
```

#### 7. `file_watcher_cache`
Google Drive file detection cache.

```typescript
{
  fileId: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  folderPath: string;
  organizationId: string;
  detectedAt: Timestamp;
  createdTime: string; // From Google Drive API
}
```

#### 8. `notifications`
Workflow notifications (user tasks, mentions, etc.).

```typescript
{
  id: string;
  recipientId: string;
  triggerBy: {
    userId: string;
    name: string;
    avatar?: string;
  };
  type: "MENTION" | "ASSIGNMENT" | "COMMENT" | "FLAG" | "COMPLETION";
  title: string;
  message?: string;
  link: string; // e.g., "/run/xyz"
  isRead: boolean;
  createdAt: Timestamp;
  runId?: string;
  stepId?: string;
}
```

#### 9. `organizations`
Organization/workspace metadata.

```typescript
{
  id: string;
  name: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  subscriptionStatus: "active" | "canceled" | "past_due";
  limits: {
    maxUsers: number;
    maxActiveRuns: number;
    aiGenerations: number; // Monthly limit
  };
  slackWebhookUrl?: string;
  createdAt: Timestamp;
}
```

#### 10. `users`
User profiles.

```typescript
{
  id: string;
  organizationId: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "MANAGER" | "LEAD" | "OPERATOR";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Frontend & UI Features

### 1. Dynamic Dashboard (`DynamicDashboard.tsx`)

**Purpose**: Renders AI-generated dashboard widgets based on collection metadata.

**Components**:
- **`StatCard`**: Displays sum/count/avg metrics
- **`SimpleBarChart`**: Bar chart visualization (Recharts)
- **`SimpleLineChart`**: Line chart for time-series data
- **`SimplePieChart`**: Pie chart for categorical data

**Layout**:
- CSS Grid: Stat cards in 4-column row, charts in 2-column row
- Responsive: Adapts to screen size
- Glassmorphism design: Frosted glass effects, gradients, shadows

**Data Flow**:
```
Collection Metadata (dashboardLayout)
      │
      ▼
DynamicDashboard Component
      │
      ├─ StatCard → Calculates metrics from records
      ├─ BarChart → Transforms data for Recharts
      ├─ LineChart → Groups by date field
      └─ PieChart → Counts by category field
```

### 2. Split-Screen Record View (`/data/[collectionId]/[recordId]/page.tsx`)

**Layout**: 2-column grid (responsive to 1 column on mobile)

**Left Column**: `DocumentViewer`
- Displays PDFs via iframe (Google Docs Viewer for external PDFs)
- Displays images via `<img>` tag
- Handles Google Drive links (converts to preview URLs)
- Loading states and error handling
- Glassmorphism styling

**Right Column**: Edit Form
- Dynamic form fields based on collection schema
- Field types: text, number, date, boolean, select
- Verification status badge (pending/needs_review/approved/rejected)
- "Save" and "Verify & Save" buttons
- Scrollable content area

**Features**:
- Auto-detects `file_url` from record data (checks multiple field names)
- Updates `verificationStatus` when "Verify & Save" is clicked
- Navigation back to collection view

### 3. AI Chat Widget (`AICopilot.tsx`)

**Context-Aware AI Assistant**:

**Default Mode** (System-wide):
- Analyzes current page path
- Provides proactive nudges based on context
- Helps with workflow bottlenecks

**Collection Mode** (When `records` and `collectionName` props provided):
- Analyzes collection data
- Provides data insights and summaries
- Answers questions about specific records
- Generates initial message: "I see X records in this collection. Want a summary?"

**Integration**:
- Located in dashboard layout (always accessible)
- Sends context to `/api/ai/chat` endpoint
- System prompt adapts based on provided context

### 4. Notification Bell (`NotificationBell.tsx`)

**Dual Notification Sources**:
1. **Schema Notifications** (`notifications` collection): Workflow-related
2. **Alert Notifications** (`_notifications` collection): Alert-triggered

**Features**:
- Real-time updates via Firestore `onSnapshot`
- Clickable notifications:
  - **Alert notifications**: Navigate to `/data/[collectionId]/[recordId]`
  - **Schema notifications**: Navigate to `link` field
- Mark as read on click
- Visual distinction: Alert icon (🚨) vs workflow icons
- Unread count badge

**Navigation Logic**:
- For alerts: Fetches `collectionId` from `collectionName`, then navigates
- Handles both notification types seamlessly

### 5. CSV Export (`/data/[collectionId]/page.tsx`)

**Implementation**:
- Uses `papaparse` library
- Exports filtered table data (respects search input)
- Excludes system fields: `_id`, `userId`, `file_url`, `dashboardLayout`
- Filename format: `[collection_name]_export_[date].csv`
- Browser download trigger

### 6. Real-Time Search

**Client-Side Filtering**:
- Filters table rows as user types
- Searches across all text fields
- Case-insensitive matching
- Updates table display instantly

### 7. Glassmorphism Design System

Applied consistently across:
- Collection schema page
- Collection view page
- Record edit page
- Document viewer
- Dashboard widgets
- Notification bell

**Design Elements**:
- `bg-white/70 backdrop-blur-xl` - Frosted glass background
- `border border-white/60` - Subtle borders
- `shadow-xl shadow-black/5` - Soft shadows
- `rounded-3xl` - Large border radius
- Gradient overlays for depth
- Hover effects with transitions

---

## Key Flows

### Flow 1: File Upload → AI Processing → Database → Dashboard → Alert

```
1. User uploads file to Google Drive folder (/Resumes/resume.pdf)
   │
   ▼
2. Cron Job (drive-watcher) detects new file
   - Queries Google Drive API
   - Compares with file_watcher_cache
   - Creates cache entry
   │
   ▼
3. Trigger Endpoint (/api/runs/trigger)
   - Finds active procedure with matching folderPath
   - Creates active_run document
   - Sets triggerContext: { file, fileId, filePath, fileUrl }
   │
   ▼
4. Execution Engine (/api/runs/execute)
   - Step 1: AI_PARSE
     ├─ Fetches file from Google Drive (via googleapis)
     ├─ Detects file type (PDF/image)
     ├─ Extracts text (pdf2json) or image (pdf-lib)
     ├─ Sends to OpenAI Vision API (if needed)
     └─ Returns: { name: "John Doe", email: "john@example.com" }
   │
   ▼
   - Step 2: DB_INSERT
     ├─ Resolves variables: {{step_1.output.name}} → "John Doe"
     ├─ Finds collection by name ("Candidates")
     ├─ Inserts record into "records" collection
     ├─ Returns: recordId
     │
     └─ [HOOK] checkAlertsForRecord()
        ├─ Fetches active alert rules for "Candidates"
        ├─ Evaluates conditions
        ├─ If condition met:
        │   ├─ Creates _notifications entry
        │   └─ Sends email via Resend
        └─ Continues (non-blocking)
   │
   ▼
5. Frontend Updates
   - Collection view shows new record
   - Dashboard widgets recalculate (if layout exists)
   - Notification bell shows alert (if triggered)
   │
   ▼
6. User Clicks Notification
   - Navigates to /data/[collectionId]/[recordId]
   - Sees split-screen: Document (left) + Form (right)
   - Verifies data, clicks "Verify & Save"
   - Record status updated to "approved"
```

### Flow 2: AI Workflow Generation → Auto-Creation

```
1. User types: "Extract name and email from resumes and save to Candidates table"
   │
   ▼
2. AI Generator (/api/ai/generate-procedure)
   - Analyzes prompt
   - Detects: New document type ("resumes") → needs collection
   │
   ▼
3. Function Call: create_database_collection
   - AI generates schema:
     { name: "Candidates", fields: [
       { key: "name", label: "Name", type: "text" },
       { key: "email", label: "Email", type: "text" },
       { key: "file_url", label: "File URL", type: "text" } // Auto-added
     ]}
   - Creates collection in Firestore
   - Updates system context
   │
   ▼
4. Function Call: generate_dashboard_layout
   - AI analyzes fields
   - Generates widgets:
     - stat_card: Count of records
     - bar_chart: (if applicable)
     - pie_chart: (if applicable)
   - Saves to collection.dashboardLayout
   │
   ▼
5. AI Generates Workflow JSON
   - Step 1: AI_PARSE
     { action: "AI_PARSE", config: {
       fileSourceStepId: "TRIGGER_EVENT",
       fieldsToExtract: ["name", "email"]
     }}
   - Step 2: DB_INSERT
     { action: "DB_INSERT", config: {
       collectionName: "Candidates",
       data: {
         name: "{{step_1.output.name}}",
         email: "{{step_1.output.email}}",
         file_url: "{{trigger.fileUrl}}"
       }
     }}
   │
   ▼
6. Workflow Saved
   - Procedure created in Firestore
   - User can activate and publish
   - Ready for file uploads
```

### Flow 3: Alert Rule Creation → Trigger → Notification

```
1. User (or AI) creates alert rule
   - Collection: "Invoices"
   - Condition: "amount is over 5000"
   - Action: "email"
   │
   ▼
2. AI Parses Condition
   - Input: "amount is over 5000"
   - Output: "record.total_amount > 5000"
   - Saved to _alerts collection
   │
   ▼
3. Invoice Record Inserted
   - DB_INSERT step completes
   - Record: { total_amount: 7500, invoice_number: "INV-123" }
   │
   ▼
4. Alert Check Triggered
   - checkAlertsForRecord() called
   - Fetches alert rules for "Invoices"
   - Evaluates: record.total_amount > 5000 → true
   │
   ▼
5. Notification Created
   - Resolves message: "High value invoice: {{invoice_number}}"
   - Result: "High value invoice: INV-123"
   │
   ▼
6. Email Sent (Resend)
   - Recipient: ADMIN_EMAIL or alertRule.recipientEmail
   - Subject: "Alert: High value invoice: INV-123"
   - HTML email with link to record
   - Link: /data/[collectionId]/[recordId]
   │
   ▼
7. User Receives Email
   - Clicks "View Record" button
   - Navigates to split-screen record view
   - Reviews invoice data
```

---

## API Routes

### Workflow Execution
- `POST /api/runs/trigger` - Creates workflow run from trigger event
- `POST /api/runs/execute` - Executes a single step
- `POST /api/runs/start` - Manually starts a workflow
- `POST /api/runs/flag` - Flags a run for review
- `POST /api/runs/reassign` - Reassigns a run to different user

### AI Services
- `POST /api/ai/generate-procedure` - Generates workflow from description
- `POST /api/ai/parse-document` - Extracts data from PDF/image/Excel
- `POST /api/ai/generate-document` - Generates documents from templates
- `POST /api/ai/chat` - Context-aware AI chat
- `POST /api/ai/modify-procedure` - Modifies existing workflow
- `POST /api/ai/execute-task` - Executes AI-automated tasks

### Data Management
- `GET /api/data/collections` - List collections
- `POST /api/data/collections` - Create collection
- `GET /api/data/collections/[id]` - Get collection
- `PUT /api/data/collections/[id]` - Update collection (including dashboardLayout)
- `GET /api/data/records` - List records
- `POST /api/data/records` - Create record
- `GET /api/data/records/[id]` - Get record
- `PUT /api/data/records/[id]` - Update record (including verificationStatus)

### Automation
- `GET /api/cron/drive-watcher` - External cron job for Google Drive monitoring

### Integrations
- `GET /api/integrations/google/auth` - Google OAuth initiation
- `GET /api/integrations/google/callback` - Google OAuth callback
- `GET /api/integrations/google/list-files` - List Google Drive files
- `POST /api/integrations/google-sheets` - Write to Google Sheets
- `POST /api/integrations/google-calendar/create-event` - Create calendar event
- `GET /api/integrations/slack/auth` - Slack OAuth initiation
- `GET /api/integrations/slack/callback` - Slack OAuth callback

---

## Design Patterns & Best Practices

### 1. Variable Resolution
- Uses `{{step_N.output.fieldName}}` syntax
- Multi-strategy fallback for robustness
- Safe traversal prevents crashes

### 2. Error Handling
- Non-blocking alert checks (don't crash workflows)
- Soft fallbacks for unreadable documents
- Extensive logging for debugging

### 3. Real-Time Updates
- Firestore `onSnapshot` for live data
- Client-side state management
- Optimistic UI updates

### 4. Security
- Organization-scoped queries
- User authentication required
- Input validation and sanitization
- Safe condition evaluation (pattern matching)

### 5. Scalability
- Serverless functions (Vercel)
- Firestore for horizontal scaling
- Efficient queries with proper indexing
- Client-side filtering for search

---

## Environment Variables

Required for full functionality:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY={...}

# Resend
RESEND_API_KEY=re_...
ADMIN_EMAIL=admin@example.com

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Slack
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...

# Cron Job
CRON_SECRET=...

# App URL
NEXT_PUBLIC_APP_URL=https://theatomicwork.com
```

---

## Future Enhancements

### Potential Additions
1. **Multi-tenant isolation**: Enhanced organization boundaries
2. **Workflow versioning**: Track changes to procedures
3. **Advanced routing**: Complex conditional logic
4. **Webhook triggers**: External system integration
5. **Batch processing**: Process multiple files at once
6. **Custom field types**: Rich text, file uploads, etc.
7. **Role-based permissions**: Fine-grained access control
8. **Audit logs**: Track all system changes
9. **Export formats**: Excel, JSON, PDF reports
10. **Mobile app**: Native iOS/Android clients

---

## Conclusion

Atomic Work is a sophisticated, AI-powered automation platform that combines:
- **Natural language workflow generation**
- **Intelligent document processing**
- **Dynamic database schema creation**
- **Automatic dashboard generation**
- **Real-time alert monitoring**
- **Human-in-the-loop execution**

The system is designed for scalability, maintainability, and extensibility, with a clear separation between automation and human tasks, robust error handling, and a modern, responsive UI.

---

*Last Updated: December 2025*
*Version: 1.0*

