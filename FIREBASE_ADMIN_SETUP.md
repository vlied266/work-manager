# Firebase Admin SDK Setup Guide

To use the "Login as Org" feature in Backoffice, you need to configure Firebase Admin SDK.

## Method 1: Using Service Account Key (Recommended)

### Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### Step 2: Add to .env.local

Open the `.env.local` file and add the key:

```bash
# Firebase Admin SDK Service Account Key (JSON as string)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'
```

**Important:** Put the entire JSON as a single-line string. You can also use this method:

```bash
# Or you can use this method:
FIREBASE_SERVICE_ACCOUNT_KEY="$(cat path/to/service-account-key.json)"
```

### Step 3: Restart the Server

After adding the environment variable, restart the server:

```bash
npm run dev
```

## Method 2: Using gcloud CLI (For Local Environments)

If you're using gcloud CLI:

```bash
gcloud auth application-default login
```

This method is not recommended for production environments.

## Verify Setup

After configuration, you can test by clicking the "Login as Org" button on the Backoffice page.

If you encounter errors, make sure:
- ✅ The `.env.local` file exists
- ✅ `FIREBASE_SERVICE_ACCOUNT_KEY` is set
- ✅ JSON format is correct
- ✅ Server has been restarted

## Security

⚠️ **Warning:** Never commit the Service Account Key file to Git. Always keep it in `.env.local` and add `.env.local` to `.gitignore`.

