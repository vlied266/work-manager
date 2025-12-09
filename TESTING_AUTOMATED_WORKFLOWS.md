# Testing Automated Workflows (Manual Testing Guide)

## Problem
The cron job is currently a placeholder and doesn't actually connect to Google Drive. To test your automated workflows, you need to manually trigger them.

## Solution: Use Webhook Simulation Endpoint

### Step 1: Get Your Organization ID
1. Open your browser's Developer Console (F12)
2. Go to the Dashboard page
3. In the console, type: `localStorage.getItem('organizationId')` or check the Network tab for API calls

### Step 2: Test the Workflow Manually

Use the `/api/webhooks/simulation` endpoint to simulate a file upload:

**Using cURL:**
```bash
curl -X POST https://theatomicwork.com/api/webhooks/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "file_upload",
    "filePath": "/Resumes/test-resume.pdf",
    "orgId": "YOUR_ORG_ID_HERE",
    "fileUrl": "https://example.com/path/to/resume.pdf"
  }'
```

**Using JavaScript (Browser Console):**
```javascript
fetch('https://theatomicwork.com/api/webhooks/simulation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'file_upload',
    filePath: '/Resumes/test-resume.pdf',
    orgId: 'YOUR_ORG_ID_HERE',
    fileUrl: 'https://example.com/path/to/resume.pdf' // Optional: direct URL to a test PDF
  })
})
.then(r => r.json())
.then(console.log);
```

### Step 3: Check the Results

1. Go to Dashboard → Check if a new run was created
2. Go to the run details page
3. Verify:
   - AI_PARSE step extracted Name and Email
   - DB_INSERT step saved to Candidates table
4. Go to Database → Candidates → Verify the record was created

## What Happens When You Trigger:

1. **Trigger Event**: Creates a new Run with `triggerContext` containing the file path
2. **Step 1 (AI_PARSE)**: 
   - Downloads the file from `fileUrl` (or uses `filePath`)
   - Extracts text using pdf-parse (for PDFs) or OpenAI Vision (for images)
   - Uses GPT-4o to extract Name and Email
   - Stores result in `step_1.output`
3. **Step 2 (DB_INSERT)**:
   - Resolves variables like `{{step_1.output.name}}` and `{{step_1.output.email}}`
   - Inserts into Candidates collection
   - Marks run as COMPLETED

## Troubleshooting

### Issue: "No workflows found for folder"
- Check that your procedure has `isActive: true`
- Check that `trigger.type === "ON_FILE_CREATED"`
- Check that `trigger.config.folderPath === "/Resumes"` (exact match)

### Issue: "File URL not found"
- Make sure you provide a valid `fileUrl` in the simulation request
- The URL must be publicly accessible (or use a signed URL)

### Issue: Variables not resolving
- Check the run logs to see what `step_1.output` contains
- Verify the AI_PARSE step completed successfully
- Check that variable names match exactly (case-sensitive)

## Next Steps (Real Google Drive Integration)

To enable real Google Drive monitoring:
1. Set up Google Drive API credentials
2. Implement `listDriveFiles()` function in `/api/cron/drive-watcher/route.ts`
3. Add file caching logic to avoid processing the same file twice
4. Update `lastPolledAt` after each successful check

