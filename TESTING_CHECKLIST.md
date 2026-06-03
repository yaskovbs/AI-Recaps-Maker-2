# ✅ רשימת בדיקות - AI Recaps Maker

## 🎯 טסטים חובה לפני שימוש

### 1. Authentication (התחברות)

#### Google OAuth
- [ ] לחץ "Continue with Google" במסך Login
- [ ] בחר חשבון Google
- [ ] וודא שנכנסת לאפליקציה
- [ ] וודא שהשם שלך מופיע ב-Settings
- [ ] צא (Logout) וכנס שוב
- [ ] וודא ש-Token נשמר (לא צריך להתחבר שוב)

**אם לא עובד**:
1. בדוק `GOOGLE_OAUTH_SETUP.md`
2. וודא שה-Redirect URI נכון
3. בדוק Logs: Cloud → Authentication → Logs

---

### 2. File Upload (העלאת קבצים)

#### וידאו (MP4)
- [ ] Create → בחר "Upload MP4"
- [ ] בחר קובץ MP4 (עד 500MB)
- [ ] וודא שמופיע Progress Bar
- [ ] וודא ש-Upload הצליח (100%)
- [ ] וודא שהקובץ נשמר: Cloud → Storage → videos

#### אודיו (MP3)
- [ ] Create → בחר "MP3 + Script"
- [ ] בחר קובץ MP3 (עד 100MB)
- [ ] וודא Progress Bar
- [ ] וודא שהקובץ נשמר: Cloud → Storage → audio

#### טקסט (TXT)
- [ ] Create → בחר "MP3 + Script"
- [ ] בחר קובץ TXT (עד 10MB)
- [ ] וודא Upload הצליח
- [ ] וודא שהקובץ נשמר: Cloud → Storage → documents

**אם לא עובד**:
1. בדוק Console Logs
2. וודא שהמשתמש מחובר
3. בדוק RLS Policies: Cloud → Storage → Policies

---

### 3. Gemini AI Processing

**לפני הטסט**: הכנס Gemini API Key ב-Settings

- [ ] צור Recap חדש
- [ ] וודא שמופיע "Processing with AI..."
- [ ] וודא Progress Bar עולה (0% → 100%)
- [ ] וודא שמתקבל תסריט AI
- [ ] בדוק Logs: Cloud → Edge Functions → process-gemini → Logs

**סימני הצלחה**:
- Status: `pending` → `processing` → `completed`
- Progress: 0 → 50 → 100
- Script URL מתקבל

**אם נכשל**:
1. בדוק שה-API Key תקין
2. בדוק Gemini Quota (https://aistudio.google.com/app/apikey)
3. בדוק Edge Function Logs

---

### 4. Real-time Updates

- [ ] צור Recap חדש
- [ ] **אל תרענן את הדף**
- [ ] וודא שה-Progress מתעדכן אוטומטית
- [ ] וודא שה-Status משתנה בזמן אמת
- [ ] וודא שאתה מקבל התראה כש-Recap מוכן

**אם לא עובד**:
1. בדוק Console: צריך לראות `📡 Recap update received`
2. בדוק Network: צריך לראות WebSocket connection
3. וודא שה-`subscribeToRecap` נקרא

---

### 5. Download Video (הורדת סרטון)

- [ ] צור Recap שהושלם
- [ ] לחץ "Download MP4"
- [ ] וודא Progress Bar להורדה
- [ ] וודא שהקובץ נשמר במכשיר
- [ ] פתח את הקובץ וודא שהוא תקין

**אם לא עובד**:
1. בדוק Permissions (Storage)
2. בדוק שה-`rendered_url` קיים
3. בדוק שהקובץ קיים ב-Storage: Cloud → Storage → rendered

---

### 6. Gallery (גלריה ציבורית)

#### פרסום Recap
- [ ] צור Recap
- [ ] שנה Visibility ל-"Public"
- [ ] לך ל-Gallery
- [ ] וודא שה-Recap מופיע

#### צפייה בRecaps ציבוריים
- [ ] פתח Gallery
- [ ] לחץ על Recap ציבורי
- [ ] וודא שמוצג נכון
- [ ] לחץ Play (אם יש נגן)
- [ ] וודא שה-Views עולה

**אם לא עובד**:
1. בדוק RLS Policies: Cloud → Database → recaps → Policies
2. בדוק שיש `visibility = 'public'`

---

### 7. Contact Form (צור קשר)

- [ ] לך ל-Contact
- [ ] מלא את הטופס (Name, Email, Subject, Message)
- [ ] לחץ Send
- [ ] וודא הודעת הצלחה
- [ ] בדוק שההודעה נשמרה: Cloud → Database → contact_messages

**אם לא עובד**:
1. בדוק Console Logs
2. בדוק Edge Function Logs: Cloud → Edge Functions → send-contact
3. וודא שה-Email valid

---

### 8. Stats (סטטיסטיקות)

#### Views
- [ ] פתח Recap ציבורי
- [ ] וודא שה-Views עולה ב-1

#### Shares
- [ ] לחץ Share
- [ ] בחר פלטפורמה (WhatsApp/Facebook)
- [ ] וודא שה-Shares עולה ב-1

**בדיקה ב-Database**:
```sql
SELECT id, title, views, shares FROM recaps;
```

---

### 9. AdMob (פרסומות)

**שים לב**: AdMob IDs כבר מוגדרים:
- Android: `ca-app-pub-9953179201685717~2085518801`
- iOS: `ca-app-pub-9953179201685717~6597950204`

#### Interstitial Ad
- [ ] צור 2 Recaps (כדי להפעיל פרסומת)
- [ ] וודא שמופיעה פרסומת ביניים
- [ ] סגור את הפרסומת
- [ ] וודא שאתה חוזר לאפליקציה

#### Rewarded Ad
- [ ] לחץ "Watch Ad for 10 Credits"
- [ ] צפה בפרסומת עד הסוף
- [ ] וודא שקיבלת 10 Credits
- [ ] בדוק ב-Settings → Credits

**אם לא עובד**:
1. AdMob צריך אישור (עד 24 שעות)
2. בטסט - השתמש ב-Test IDs
3. בדוק Logs: Cloud → Log → AdMob

---

### 10. Performance (ביצועים)

#### זמני טעינה
- [ ] Login מסך → Home: < 2 שניות
- [ ] Gallery טעינה: < 3 שניות
- [ ] Create טופס: מיידי

#### זיכרון
- [ ] צפה ב-5+ Recaps
- [ ] וודא שהאפליקציה לא קופאת
- [ ] סגור ופתח שוב - וודא מהירות

#### Network
- [ ] Upload קובץ 100MB
- [ ] וודא שה-Progress חלק (לא קופץ)
- [ ] בטל העלאה באמצע - וודא שזה עובד

---

## 🐛 בעיות נפוצות ופתרונות

### בעיה 1: "User not authenticated"
**פתרון**:
```typescript
const { user } = useAuth();
if (!user) {
  router.push('/login');
}
```

### בעיה 2: "File too large"
**פתרון**:
- וידאו: מקסימום 500MB
- אודיו: מקסימום 100MB
- מסמכים: מקסימום 10MB

### בעיה 3: "Gemini API failed"
**פתרון**:
1. בדוק API Key תקין
2. בדוק Quota: https://aistudio.google.com/app/apikey
3. וודא שיש כסף/Credits ב-Gemini

### בעיה 4: "Real-time not working"
**פתרון**:
1. בדוק WebSocket connection
2. בדוק Realtime enabled: Cloud → Settings → API
3. רענן דף

### בעיה 5: "Download failed"
**פתרון**:
1. בדוק Permissions
2. בדוק שיש מקום במכשיר
3. בדוק שה-URL תקין

---

## 📊 Performance Benchmarks

### מהירות צפויה:

| פעולה | זמן צפוי |
|-------|----------|
| Login עם Google | 2-5 שניות |
| Upload 100MB Video | 1-3 דקות (תלוי באינטרנט) |
| Gemini Processing | 30-60 שניות |
| Create Recap | < 1 שניה |
| Gallery Load | < 3 שניות |
| Download 200MB Video | 2-5 דקות |

### זיכרון צפוי:

- **Idle**: ~50-80MB RAM
- **עם 10 Recaps**: ~100-150MB RAM
- **במהלך Upload**: ~150-200MB RAM

אם יש בעיות ביצועים - צור קשר!

---

## ✅ רשימת וידוא סופית

לפני Production, וודא:

- [ ] Google OAuth עובד
- [ ] העלאת קבצים עובדת (MP4/MP3/TXT)
- [ ] Gemini Processing עובד
- [ ] Real-time Updates עובד
- [ ] הורדת וידאו עובדת
- [ ] Gallery ציבורית עובדת
- [ ] Contact Form עובד
- [ ] AdMob עובד (או מושבת)
- [ ] ביצועים טובים (< 3 שניות לכל מסך)
- [ ] אין קריסות
- [ ] אין Logs errors באדום

**אם הכל ירוק = מוכן לPRODUCTION! 🚀**

---

## 📞 עזרה

יש בעיה? בדוק:

1. **Console Logs**: Developer Tools → Console
2. **Network**: Developer Tools → Network
3. **Backend Logs**: Cloud → Log
4. **Edge Function Logs**: Cloud → Edge Functions → Logs

עדיין לא עובד? צור קשר דרך האפליקציה! 💪
