# Seed Financial Mock Data

This script populates your Firestore database with mock financial system data.

## Prerequisites

1. Make sure you have Firebase project configured in `.env.local`
2. Authenticate with Firebase Admin SDK:

### Option 1: Using gcloud (Recommended)
```bash
gcloud auth application-default login
```

### Option 2: Using Service Account Key
1. Download service account key from Firebase Console
2. Add to `.env.local`:
```
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

## Run Seed Script

```bash
npm run seed
```

## What Gets Created

- **1 Organization**: FinancialCore Inc.
- **3 Teams**: Finance Team, Accounting Department, Financial Operations
- **5 Users**:
  - CFO (ADMIN) - cfo@financialcore.com
  - Accountant 1 (LEAD) - accountant1@financialcore.com
  - Accountant 2 (OPERATOR) - accountant2@financialcore.com
  - Operator 1 (OPERATOR) - operator1@financialcore.com
  - Operator 2 (OPERATOR) - operator2@financialcore.com

- **3 Procedures**:
  1. **Invoice Processing** - Complete workflow for processing vendor invoices
  2. **Payment Verification** - Verify and reconcile payment transactions
  3. **Monthly Financial Close** - Complete monthly financial closing process

- **1 Process**: Monthly Financial Close Process (combines all 3 procedures)

## Note

These are mock users. You'll need to create actual Firebase Auth users with these emails if you want to log in. The seed script only creates Firestore documents.

