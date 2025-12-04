# راهنمای ایجاد کاربر جدید

برای ایجاد کاربر جدید با email و password، نیاز به Firebase Admin SDK دارید.

## روش 1: استفاده از Firebase Console (ساده‌ترین روش)

1. به [Firebase Console](https://console.firebase.google.com/) بروید
2. پروژه خود را انتخاب کنید
3. به بخش **Authentication** بروید
4. روی **Add user** کلیک کنید
5. Email: `edvli@yahoo.com`
6. Password: `123456`
7. کاربر را ایجاد کنید

سپس از اسکریپت زیر برای تنظیم role و organization استفاده کنید:

```bash
npx tsx scripts/update-user-role.ts edvli@yahoo.com OPERATOR
```

## روش 2: استفاده از Firebase Admin SDK (نیاز به Service Account Key)

1. Service Account Key را از Firebase Console دانلود کنید:
   - Firebase Console > Project Settings > Service Accounts
   - روی "Generate new private key" کلیک کنید
   - فایل JSON را دانلود کنید

2. محتوای JSON را در `.env.local` قرار دهید:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```

3. اسکریپت را اجرا کنید:
   ```bash
   npx tsx scripts/create-user.ts vlied266@gmail.com edvli@yahoo.com 123456 OPERATOR
   ```

## روش 3: استفاده از API Route (نیاز به Service Account Key)

اگر dev server در حال اجرا است:

```bash
curl -X POST http://localhost:3000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "adminEmail": "vlied266@gmail.com",
    "newUserEmail": "edvli@yahoo.com",
    "password": "123456",
    "role": "OPERATOR"
  }'
```

