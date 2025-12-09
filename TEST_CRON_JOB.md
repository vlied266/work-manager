# Testing the Drive Watcher Cron Job

## Problem
The cron job shows "Never checked" because it hasn't run yet or encountered errors.

## Solution: Manual Test

### Option 1: Test via Browser/Postman

**GET Request:**
```
GET https://theatomicwork.com/api/cron/drive-watcher
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
```

**Using cURL:**
```bash
curl -X GET "https://theatomicwork.com/api/cron/drive-watcher" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Using JavaScript (Browser Console):**
```javascript
fetch('https://theatomicwork.com/api/cron/drive-watcher', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_CRON_SECRET'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Option 2: Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Logs** tab
4. Filter by `/api/cron/drive-watcher`
5. Check for errors

### Common Issues

#### 1. "GOOGLE_REFRESH_TOKEN environment variable is not set"
- **Fix:** Add `GOOGLE_REFRESH_TOKEN` to Vercel Environment Variables

#### 2. "Unauthorized" (401)
- **Fix:** Make sure `CRON_SECRET` in Vercel matches the one in cron-job.org
- **Fix:** Check that the Authorization header format is: `Bearer <CRON_SECRET>`

#### 3. "Folder not found"
- **Fix:** Check that the folder path in your procedure matches exactly:
  - If using folder name: `/Resumes` (with leading slash)
  - If using folder ID: `1QCTmcAWB-L2fS-N6FKUz7ehkCsGQgegK` (no slashes)

#### 4. OAuth Token Expired
- **Fix:** Regenerate refresh token from Google OAuth Playground
- **Fix:** Make sure the refresh token has `https://www.googleapis.com/auth/drive.readonly` scope

### Expected Response

**Success:**
```json
{
  "success": true,
  "message": "Drive watcher cron job completed",
  "checkedProcedures": 4,
  "checkedFolders": 2,
  "runsCreated": 0,
  "timestamp": "2025-12-09T...",
  "details": {
    "proceduresChecked": [...],
    "foldersChecked": [...]
  }
}
```

**Error:**
```json
{
  "error": "Failed to execute drive watcher cron job",
  "details": "Error message here"
}
```

### After Successful Run

1. Check Dashboard → Active Automations
2. `lastPolledAt` should update to current time
3. "Never checked" should change to "Checked X minutes ago"
4. If new files found, runs should be created automatically

