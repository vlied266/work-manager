# Firebase Storage Setup Guide

## مشکل CORS در Firebase Storage

اگر با خطای CORS مواجه می‌شوید، باید Storage Rules را در Firebase Console تنظیم کنید.

## مراحل تنظیم:

1. به [Firebase Console](https://console.firebase.google.com/) بروید
2. پروژه خود را انتخاب کنید
3. در منوی سمت چپ، روی **Storage** کلیک کنید
4. به تب **Rules** بروید
5. Rules زیر را اضافه کنید:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload/read files in runs folder
    match /runs/{runId}/{stepId}/{fileName} {
      allow read, write: if request.auth != null;
    }
    
    // Or for testing, allow all authenticated users (less secure):
    // match /{allPaths=**} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
```

6. روی **Publish** کلیک کنید

## بررسی Environment Variables

مطمئن شوید که در `.env.local` این متغیرها تنظیم شده‌اند:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

یا:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gs://your-project-id.appspot.com
```

## تست

بعد از تنظیم rules، صفحه را refresh کنید و دوباره فایل را upload کنید.

