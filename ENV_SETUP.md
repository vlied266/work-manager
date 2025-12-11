# Environment Variables Setup

## Required Environment Variables

### Resend Email Service

Add the following to your `.env.local` file (or `.env` for production):

```bash
# Resend API Key for email notifications
RESEND_API_KEY=re_ad9w6et3_6QxcdRLrGrweEsPupHzj73Pa

# Admin email for alert notifications
ADMIN_EMAIL=vlied266@gmail.com
```

### Optional Environment Variables

```bash
# Base URL for the application (used in email links)
NEXT_PUBLIC_APP_URL=https://theatomicwork.com

# Or use Vercel's automatic URL
VERCEL_URL=your-vercel-url.vercel.app
```

## Verification

1. **Resend Domain**: Make sure your domain is verified in Resend dashboard
2. **From Address**: Update the `from` address in `src/lib/email/send-alert.ts` to match your verified domain
3. **API Key**: Ensure the `RESEND_API_KEY` is correctly set in your deployment environment (Vercel, etc.)

## Testing

To test email notifications:
1. Create an alert rule with `action: 'email'` or `action: 'both'`
2. Trigger the alert condition by inserting a record that matches
3. Check the admin email inbox for the notification

