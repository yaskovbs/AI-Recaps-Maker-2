# 🚀 מדריך התחלה מהיר - OnSpace Cloud

## ✅ מה כבר מוכן

### 1. Backend (OnSpace Cloud)
- ✅ Database Tables: `recaps`, `processing_jobs`, `contact_messages`
- ✅ Storage Buckets: `videos`, `audio`, `documents`, `rendered`, `thumbnails`
- ✅ Edge Functions: `process-gemini`, `send-contact`
- ✅ RLS Security: כל הטבלאות מאובטחות

### 2. AdMob (מאובטח)
- ✅ Android App ID: `ca-app-pub-9953179201685717~2085518801`
- ✅ iOS App ID: `ca-app-pub-9953179201685717~6597950204`

### 3. Google OAuth
- ✅ הגדרה הושלמה
- ✅ Login עם Google פעיל

---

## 🎯 איך להשתמש - 5 דקות

### שלב 1️⃣: התחבר עם Google OAuth

**בקוד כבר עובד!** פשוט הרץ את האפליקציה:

```typescript
// app/login.tsx - כבר קיים
import { useAuth } from '@/contexts/AuthContext';

const { signInWithGoogle } = useAuth();

// לחיצה על כפתור Google
await signInWithGoogle();
```

**למשתמש**:
1. פתח אפליקציה → Login
2. לחץ "Continue with Google"
3. בחר חשבון Google
4. ✅ התחברת!

---

### שלב 2️⃣: העלאת קבצים (MP4, MP3, TXT)

```typescript
import { uploadFile } from '@/services/upload';
import * as DocumentPicker from 'expo-document-picker';

// בחר קובץ
const result = await DocumentPicker.getDocumentAsync({
  type: ['video/*', 'audio/*', 'text/*'],
});

if (result.canceled) return;

const file = result.assets[0];

// העלה לSupabase Storage עם Progress
const uploadResult = await uploadFile(
  file.uri,
  file.name,
  'videos', // או 'audio' או 'documents'
  (progress) => {
    console.log(`📤 Upload: ${progress.percentage}%`);
    // עדכן UI
    setUploadProgress(progress.percentage);
  }
);

console.log('✅ File uploaded!');
console.log('URL:', uploadResult.url);
console.log('Path:', uploadResult.path);
```

**תמיכה בפורמטים**:
- **Video**: MP4, AVI, MOV, MKV, WebM (עד 500MB)
- **Audio**: MP3, WAV, AAC, M4A, OGG (עד 100MB)
- **Documents**: TXT, DOC, DOCX, PDF (עד 10MB)

---

### שלב 3️⃣: יצירת Recap חדש

```typescript
import { useRecaps } from '@/contexts/RecapsContext';

const { createRecap } = useRecaps();

// יצירת recap
const recap = await createRecap({
  title: 'Scream 2 (1997) Full Movie Recap',
  description: 'Horror movie recap',
  genre: 'horror',
  duration: 240, // 4 דקות בשניות
  cut_interval: 9, // חתוך כל 9 שניות
  input_type: 'mp4',
  video_url: uploadResult.url, // מהשלב הקודם
  visibility: 'private', // או 'public'
});

console.log('✅ Recap created:', recap.id);
```

**שדות חובה**:
- `title` - כותרת
- `genre` - ז'אנר
- `duration` - אורך בשניות
- `cut_interval` - מרווח חיתוך בשניות
- `input_type` - סוג קלט (mp4/mp3-txt/record)

---

### שלב 4️⃣: עיבוד AI עם Gemini

```typescript
import { processWithGemini, subscribeToRecap } from '@/services/gemini';
import { useAuth } from '@/contexts/AuthContext';

const { geminiApiKey } = useAuth();

// התחל עיבוד Gemini
const { data, error } = await processWithGemini({
  recapId: recap.id,
  geminiApiKey, // מפתח API שהמשתמש הכניס
});

if (error) {
  console.error('❌ Gemini failed:', error);
  return;
}

console.log('✅ Gemini started!');
console.log('Script preview:', data.script.substring(0, 100));

// האזן לעדכונים בזמן אמת
const unsubscribe = subscribeToRecap(recap.id, (updatedRecap) => {
  console.log('📊 Status:', updatedRecap.status);
  console.log('📊 Progress:', updatedRecap.progress + '%');
  
  if (updatedRecap.status === 'completed') {
    console.log('✅ Processing completed!');
    console.log('📝 Script URL:', updatedRecap.script_url);
    console.log('🎬 Video URL:', updatedRecap.rendered_url);
    unsubscribe(); // הפסק האזנה
  }
  
  if (updatedRecap.status === 'failed') {
    console.error('❌ Processing failed:', updatedRecap.error_message);
    unsubscribe();
  }
});
```

**Real-time Progress**:
- Status: `pending` → `processing` → `completed` / `failed`
- Progress: `0%` → `100%`

---

### שלב 5️⃣: הורדת סרטון מוכן

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// הורד את הסרטון הסופי
async function downloadVideo(recap) {
  const fileUri = FileSystem.documentDirectory + `recap_${recap.id}.mp4`;
  
  const downloadResumable = FileSystem.createDownloadResumable(
    recap.rendered_url,
    fileUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      console.log(`⬇️ Download: ${(progress * 100).toFixed(0)}%`);
      setDownloadProgress(progress * 100);
    }
  );
  
  const result = await downloadResumable.downloadAsync();
  console.log('✅ Downloaded to:', result.uri);
  
  // שתף או שמור
  await Sharing.shareAsync(result.uri);
}
```

---

### שלב 6️⃣: שליחת הודעת צור קשר

```typescript
import { sendContactMessage } from '@/services/contact';

const { data, error } = await sendContactMessage({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Support Request',
  message: 'I need help with...',
});

if (!error) {
  console.log('✅ Message sent!');
  console.log('📧 Message ID:', data.messageId);
}
```

**הודעות נשלחות ל**: `contact-us@y-l-b-s-ai-studio-apps.com`

---

## 🎬 תהליך יצירה מלא (דוגמה)

```typescript
async function createCompleteRecap() {
  const { createRecap, updateRecap } = useRecaps();
  const { geminiApiKey } = useAuth();
  
  // 1️⃣ בחר וידאו
  const pickerResult = await DocumentPicker.getDocumentAsync({
    type: 'video/*',
  });
  
  if (pickerResult.canceled) return;
  
  const videoFile = pickerResult.assets[0];
  
  // 2️⃣ העלה וידאו
  setStatus('Uploading video...');
  const uploadResult = await uploadFile(
    videoFile.uri,
    videoFile.name,
    'videos',
    (progress) => setProgress(progress.percentage)
  );
  
  // 3️⃣ צור recap
  setStatus('Creating recap...');
  const recap = await createRecap({
    title: 'My Awesome Movie Recap',
    genre: 'action',
    duration: 180,
    cut_interval: 9,
    input_type: 'mp4',
    video_url: uploadResult.url,
  });
  
  // 4️⃣ עבד עם Gemini
  setStatus('Processing with AI...');
  await processWithGemini({
    recapId: recap.id,
    geminiApiKey,
  });
  
  // 5️⃣ האזן לעדכונים
  const unsubscribe = subscribeToRecap(recap.id, (updated) => {
    setStatus(updated.status);
    setProgress(updated.progress);
    
    if (updated.status === 'completed') {
      setStatus('✅ Recap ready!');
      setVideoUrl(updated.rendered_url);
      unsubscribe();
    }
  });
}
```

---

## 📊 Real-time Updates - איך זה עובד?

### Database Changes (Realtime)

כל עדכון ב-Database מתקבל **מיידית** בלי polling:

```typescript
import { subscribeToRecap } from '@/services/gemini';

// התחל האזנה
const unsubscribe = subscribeToRecap(recapId, (recap) => {
  // נקרא כל פעם שיש עדכון ב-recap
  console.log('📡 Recap updated:', recap);
  
  // עדכן UI
  setRecapStatus(recap.status);
  setRecapProgress(recap.progress);
});

// הפסק האזנה כשלוקחים את הקומפוננטה
return () => unsubscribe();
```

**זה עובד ב**:
- `recaps` table
- `processing_jobs` table
- כל טבלה אחרת

---

## 🗄️ Database - CRUD מלא

### יצירה (Create)

```typescript
const { createRecap } = useRecaps();

const recap = await createRecap({
  title: 'My Title',
  genre: 'action',
  duration: 240,
  cut_interval: 9,
  input_type: 'mp4',
});
```

### קריאה (Read)

```typescript
const { recaps, publicRecaps } = useRecaps();

// הRecaps שלי
console.log('My recaps:', recaps);

// כל הRecaps הציבוריים
console.log('Public recaps:', publicRecaps);
```

### עדכון (Update)

```typescript
const { updateRecap } = useRecaps();

await updateRecap(recapId, {
  status: 'completed',
  progress: 100,
  rendered_url: 'https://...',
});
```

### מחיקה (Delete)

```typescript
const { deleteRecap } = useRecaps();

await deleteRecap(recapId);
```

### סטטיסטיקות

```typescript
const { incrementViews, incrementShares } = useRecaps();

// כשמישהו צופה
await incrementViews(recapId);

// כשמישהו משתף
await incrementShares(recapId);
```

---

## 📁 Storage - ניהול קבצים

### העלאה

```typescript
import { uploadFile } from '@/services/upload';

const result = await uploadFile(
  fileUri,
  'my-video.mp4',
  'videos',
  (progress) => console.log(progress.percentage + '%')
);
```

### הורדה

```typescript
import { downloadFile } from '@/services/upload';

const blob = await downloadFile('videos', 'path/to/file.mp4');
```

### מחיקה

```typescript
import { deleteFile } from '@/services/upload';

await deleteFile('videos', 'path/to/file.mp4');
```

---

## 🔧 Edge Functions - API בצד השרת

### process-gemini

**מה זה עושה?**
- מקבל `recapId` ו-`geminiApiKey`
- שולח את הוידאו ל-Gemini API
- מייצר תסריט AI
- שומר ב-Storage
- מעדכן את ה-recap

**איך לקרוא?**
```typescript
import { processWithGemini } from '@/services/gemini';

const { data, error } = await processWithGemini({
  recapId: 'uuid',
  geminiApiKey: 'your-key',
});
```

### send-contact

**מה זה עושה?**
- שומר הודעה ב-`contact_messages`
- (בעתיד) שולח אימייל ל-`contact-us@y-l-b-s-ai-studio-apps.com`

**איך לקרוא?**
```typescript
import { sendContactMessage } from '@/services/contact';

const { data, error } = await sendContactMessage({
  name: 'John',
  email: 'john@example.com',
  subject: 'Help',
  message: 'I need...',
});
```

---

## 🐛 Debug Tips

### בדיקת חיבור

```typescript
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// בדוק משתמש
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// בדוק Database
const { data, error } = await supabase.from('recaps').select('*');
console.log('Recaps:', data);
```

### לוגים של Edge Functions

1. OnSpace → Right Panel → **Cloud**
2. Edge Functions → בחר function
3. לחץ **Logs**
4. צפה בלוגים בזמן אמת

### בדיקת Storage

1. OnSpace → Right Panel → **Cloud**
2. Storage → בחר bucket
3. ראה את כל הקבצים שהועלו

---

## ⚡ Performance Tips

### 1. Compress וידאו לפני העלאה

```typescript
import { compressVideo } from '@/services/upload';

const compressedUri = await compressVideo(videoUri, 'medium');
await uploadFile(compressedUri, 'video.mp4', 'videos');
```

### 2. Batch updates

```typescript
// ❌ לא טוב - 3 queries
await updateRecap(id, { progress: 10 });
await updateRecap(id, { progress: 20 });
await updateRecap(id, { progress: 30 });

// ✅ טוב - 1 query
await updateRecap(id, { progress: 30 });
```

### 3. Unsubscribe מ-Realtime

```typescript
useEffect(() => {
  const unsubscribe = subscribeToRecap(id, callback);
  
  // חשוב! הפסק האזנה כש-component unmounts
  return () => unsubscribe();
}, [id]);
```

---

## 🚨 שגיאות נפוצות

### "User not authenticated"

**פתרון**: המשתמש לא מחובר
```typescript
const { user } = useAuth();
if (!user) {
  // הפנה ל-login
  router.push('/login');
}
```

### "File too large"

**פתרון**: הקובץ גדול מדי
```typescript
import { validateFileSize } from '@/services/upload';

const maxSize = 500 * 1024 * 1024; // 500MB
const { valid, error } = validateFileSize(fileSize, maxSize);

if (!valid) {
  alert(error);
}
```

### "Invalid format"

**פתרון**: פורמט לא נתמך
```typescript
import { validateFileFormat, SUPPORTED_FORMATS } from '@/services/upload';

if (!validateFileFormat(fileName, SUPPORTED_FORMATS.video)) {
  alert('Format not supported');
}
```

---

## 📚 קבצים חשובים

| קובץ | תיאור |
|------|-------|
| `services/upload.ts` | העלאת קבצים |
| `services/gemini.ts` | עיבוד AI |
| `services/contact.ts` | שליחת הודעות |
| `contexts/RecapsContext.tsx` | ניהול Recaps |
| `supabase/functions/process-gemini/` | Edge Function AI |
| `supabase/functions/send-contact/` | Edge Function Email |

---

## ✅ Checklist - האם הכל עובד?

- [ ] התחברות עם Google OAuth
- [ ] העלאת קובץ MP4
- [ ] העלאת קובץ MP3
- [ ] העלאת קובץ TXT
- [ ] יצירת Recap
- [ ] עיבוד עם Gemini (צריך API Key)
- [ ] Real-time updates
- [ ] הורדת סרטון מוכן
- [ ] שליחת הודעת צור קשר
- [ ] צפייה ב-Recaps ציבוריים

---

## 🎉 סיימת!

**עכשיו יש לך**:
- ✅ Backend מלא ופועל
- ✅ Google OAuth
- ✅ File Upload (כל הפורמטים)
- ✅ Gemini AI Processing
- ✅ Real-time Updates
- ✅ Storage מאובטח
- ✅ Edge Functions
- ✅ CRUD מלא

**מוכן ליצור Recaps! 🚀**

---

## 🆘 עזרה נוספת

- **תיעוד Backend**: `BACKEND_INTEGRATION_GUIDE.md`
- **Google OAuth**: `GOOGLE_OAUTH_SETUP.md`
- **Build APK**: `BUILD_INSTRUCTIONS.md`
- **Fix Dependencies**: `FIX_DEPENDENCIES.md`
