# راهنمای تست مرحله به مرحله Drive Watcher

## مرحله 1: دریافت Organization ID

### روش 1: از Browser Console
1. به صفحه Dashboard بروید: `https://theatomicwork.com/dashboard`
2. F12 را بزنید (Developer Console را باز کنید)
3. در Console این کد را تایپ کنید:

```javascript
// دریافت Organization ID
localStorage.getItem('organizationId')
```

یا:

```javascript
// از Network tab
// 1. F12 → Network tab
// 2. یک API call را باز کنید (مثلاً /api/...)
// 3. در Headers یا Payload دنبال organizationId بگردید
```

### روش 2: از Firestore Console
1. به [Firebase Console](https://console.firebase.google.com/) بروید
2. پروژه را انتخاب کنید
3. Firestore Database → Collections → `organizations`
4. یکی از organization ها را باز کنید
5. `id` را کپی کنید (مثلاً `org-xxxxx`)

---

## مرحله 2: تست Test Endpoint (ساده‌ترین روش)

### در Browser Console:

```javascript
// 1. Organization ID خود را اینجا بگذارید
const orgId = 'org-xxxxx'; // Organization ID خود را اینجا بگذارید

// 2. Test endpoint را صدا بزنید
fetch(`https://theatomicwork.com/api/test/drive-watcher?orgId=${orgId}`)
  .then(r => r.json())
  .then(result => {
    console.log('✅ نتیجه تست:', result);
    
    // بررسی نتایج
    if (result.success) {
      console.log('✅ تست موفق بود!');
      console.log('📊 Procedures tested:', result.proceduresTested);
      console.log('📋 Results:', result.results);
      
      // بررسی هر procedure
      result.results.forEach((r, i) => {
        console.log(`\n📌 Procedure ${i + 1}:`);
        console.log('  Title:', r.procedureTitle);
        console.log('  Folder:', r.folderPath);
        console.log('  Status:', r.status);
        console.log('  Runs Created:', r.runsCreated?.length || 0);
        console.log('  Errors:', r.errors);
        console.log('  Logs:', r.logs);
      });
    } else {
      console.error('❌ تست ناموفق:', result.error);
    }
  })
  .catch(error => {
    console.error('❌ خطا در تست:', error);
  });
```

### نتیجه مورد انتظار:

اگر همه چیز درست باشد، باید ببینید:
```json
{
  "success": true,
  "proceduresTested": 4,
  "results": [
    {
      "procedureId": "...",
      "procedureTitle": "Candidate Resume Processing",
      "folderPath": "/Resumes",
      "status": "testing",
      "runsCreated": ["run-id-1"],
      "runStatus": "COMPLETED",
      "logs": [...]
    }
  ]
}
```

---

## مرحله 3: بررسی لاگ‌های Vercel

### اگر test endpoint خطا داد:

1. به [Vercel Dashboard](https://vercel.com/dashboard) بروید
2. پروژه را انتخاب کنید
3. به تب **Logs** بروید
4. فیلتر کنید: `/api/test/drive-watcher` یا `/api/runs/trigger`
5. خطاها را بررسی کنید

### خطاهای رایج:

#### خطا 1: "GOOGLE_REFRESH_TOKEN environment variable is not set"
**راه حل:**
- به Vercel → Settings → Environment Variables بروید
- مطمئن شوید `GOOGLE_REFRESH_TOKEN` وجود دارد
- اگر نیست، از Google OAuth Playground بگیرید

#### خطا 2: "Folder not found"
**راه حل:**
- بررسی کنید که folder path درست است
- اگر از نام استفاده می‌کنید: `/Resumes` (با slash اول)
- اگر از ID استفاده می‌کنید: `1QCTmcAWB-L2fS-N6FKUz7ehkCsGQgegK` (بدون slash)

#### خطا 3: "Unauthorized" یا "401"
**راه حل:**
- `CRON_SECRET` را در Vercel بررسی کنید
- مطمئن شوید که در cron-job.org هم همان secret است

---

## مرحله 4: تست دستی Cron Job

### در Browser Console:

```javascript
// 1. CRON_SECRET را از Vercel Environment Variables بگیرید
const cronSecret = 'YOUR_CRON_SECRET'; // از Vercel بگیرید

// 2. Cron job را دستی صدا بزنید
fetch('https://theatomicwork.com/api/cron/drive-watcher', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${cronSecret}`
  }
})
  .then(r => r.json())
  .then(result => {
    console.log('✅ نتیجه Cron Job:', result);
    
    if (result.success) {
      console.log('✅ Cron job اجرا شد');
      console.log('📊 Procedures checked:', result.checkedProcedures);
      console.log('📁 Folders checked:', result.checkedFolders);
      console.log('🚀 Runs created:', result.runsCreated);
      
      if (result.errors && result.errors.length > 0) {
        console.error('❌ خطاها:', result.errors);
      }
    } else {
      console.error('❌ Cron job ناموفق:', result.error);
    }
  })
  .catch(error => {
    console.error('❌ خطا در cron job:', error);
  });
```

---

## مرحله 5: بررسی دیتابیس

### بررسی Runs ایجاد شده:

```javascript
// در Browser Console
// باید به Firestore دسترسی داشته باشید یا از Firebase Console استفاده کنید

// یا از API:
fetch('https://theatomicwork.com/api/runs/trigger', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log);
```

### بررسی Candidates Table:

1. به صفحه Database بروید: `https://theatomicwork.com/data`
2. Collection "Candidates" را باز کنید
3. بررسی کنید که رکوردهای جدید اضافه شده‌اند

---

## مرحله 6: تست کامل با فایل واقعی

### استفاده از Webhook Simulation:

```javascript
// 1. Organization ID
const orgId = 'org-xxxxx';

// 2. یک فایل PDF واقعی را آپلود کنید و URL آن را بگیرید
// یا از یک URL تست استفاده کنید
const fileUrl = 'https://example.com/resume.pdf'; // URL یک فایل PDF واقعی

// 3. Webhook simulation را صدا بزنید
fetch('https://theatomicwork.com/api/webhooks/simulation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'FILE_CREATED',
    filePath: '/Resumes/test-resume.pdf',
    orgId: orgId,
    metadata: {
      fileUrl: fileUrl
    }
  })
})
  .then(r => r.json())
  .then(result => {
    console.log('✅ نتیجه Simulation:', result);
    
    if (result.success) {
      console.log('✅ Workflow triggered!');
      console.log('🚀 Runs created:', result.runsCreated);
      
      // 4. بررسی run ایجاد شده
      if (result.runsCreated && result.runsCreated.length > 0) {
        const runId = result.runsCreated[0];
        console.log('📋 Run ID:', runId);
        
        // 5. بعد از 5 ثانیه، run را بررسی کنید
        setTimeout(() => {
          window.open(`https://theatomicwork.com/run/${runId}`, '_blank');
        }, 5000);
      }
    }
  })
  .catch(console.error);
```

---

## چک‌لیست عیب‌یابی

- [ ] Organization ID درست است؟
- [ ] Procedure `isActive: true` است؟
- [ ] Procedure `isPublished: true` است؟
- [ ] `trigger.type === "ON_FILE_CREATED"` است؟
- [ ] `trigger.config.folderPath` درست است؟
- [ ] `GOOGLE_REFRESH_TOKEN` در Vercel تنظیم شده است؟
- [ ] `GOOGLE_CLIENT_ID` در Vercel تنظیم شده است؟
- [ ] `GOOGLE_CLIENT_SECRET` در Vercel تنظیم شده است？
- [ ] `CRON_SECRET` در Vercel و cron-job.org یکسان است؟
- [ ] Service Account به فولدر Google Drive دسترسی دارد؟

---

## اگر هنوز کار نمی‌کند

1. **لاگ‌های Vercel را بررسی کنید** و خطاها را برای من بفرستید
2. **نتیجه test endpoint را بفرستید**
3. **نتیجه cron job manual test را بفرستید**

با این اطلاعات می‌توانم مشکل دقیق را پیدا کنم.

