# 🚀 Vercel Cron Job Deployment Notes

## Environment Variables Required

Add the following environment variable to your Vercel Project Settings:

### `CRON_SECRET`
- **Purpose**: Secret token to secure the cron job endpoint
- **How to generate**: Use a strong random string (e.g., `openssl rand -hex 32`)
- **Where to add**: Vercel Dashboard → Your Project → Settings → Environment Variables
- **Required for**: Production environment

## Vercel Cron Configuration

The `vercel.json` file has been configured to run the drive watcher every 5 minutes:

```json
{
  "crons": [
    {
      "path": "/api/cron/drive-watcher",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Security

The endpoint `/api/cron/drive-watcher` is protected by:
- Checking `Authorization: Bearer <CRON_SECRET>` header
- In production: Blocks unauthorized requests
- In development: Allows for testing but logs warnings

## Testing

### Local Testing (Development)
You can test the endpoint locally:
```bash
curl http://localhost:3000/api/cron/drive-watcher \
  -H "Authorization: Bearer your-cron-secret-here"
```

### Production Testing
After deployment, Vercel will automatically call this endpoint every 5 minutes.
You can also manually trigger it (if you have the secret):
```bash
curl https://theatomicwork.com/api/cron/drive-watcher \
  -H "Authorization: Bearer your-cron-secret-here"
```

## Next Steps

1. **Add CRON_SECRET to Vercel**: Generate a secure random string and add it to Vercel environment variables
2. **Deploy**: Push changes to trigger a new deployment
3. **Monitor**: Check Vercel Cron Job logs to ensure it's running correctly
4. **Implement Real Drive Integration**: Replace the placeholder logic with actual Google Drive API calls

## Current Implementation Status

⚠️ **Placeholder**: The current implementation logs folder checks but doesn't actually connect to Google Drive.
To enable real file watching:
- Integrate Google Drive API
- Implement file cache in Firestore (`file_watcher_cache` collection)
- Update the cron job logic to compare cached vs. new files
