# 📚 מדריך מלא ל-Database - AI Recaps Maker

## 🎯 סקירה כללית

**6 טבלאות מרכזיות:**
1. `recaps` - הסיכומים שלך
2. `processing_jobs` - תהליכי עיבוד
3. `contact_messages` - הודעות צור קשר
4. `api_usage` - מעקב שימוש ב-API
5. `user_api_keys` - ניהול מפתחות API
6. `genres` - 44 ז'אנרים

---

## 1️⃣ טבלת `recaps` - הסיכומים שלך

### 🎬 מה זה?
טבלה המכילה את כל הסיכומים שיצרת (סרטים, סדרות, סרטונים).

### 📝 מתי להוסיף?
כשאתה יוצר סיכום חדש דרך האפליקציה.

### ✍️ מה להכניס בכל שדה:

#### שדות **חובה** (אי אפשר בלעדיהם):

| שדה | מה להכניס | דוגמה נכונה | ❌ שגוי |
|-----|-----------|-------------|---------|
| `title` | כותרת הסיכום (טקסט חופשי) | `Scream 2 (1997) Full Recap` | אל תשאיר ריק |
| `genre` | **חובה לבחור מרשימת הז'אנרים** (ראה טבלת `genres`) | `Horror` | `scary movie` (לא קיים!) |
| `duration` | אורך הסיכום **בשניות בלבד** | `240` (=4 דקות) | `4` (זה 4 שניות!) |
| `cut_interval` | כל כמה שניות לחתוך קטע | `9` (=כל 9 שניות) | `0:09` (רק מספר!) |
| `input_type` | **בחר אחד**: `mp4`, `mp3-txt`, `record` | `mp4` | `video` (לא קיים!) |

#### שדות **אופציונליים** (אפשר להשאיר ריקים):

| שדה | מה להכניס | דוגמה | מתי להשתמש |
|-----|-----------|--------|-----------|
| `description` | תיאור קצר | `Full recap with key scenes` | אם רוצה להוסיף פרטים |
| `video_url` | קישור לקובץ MP4 | `https://storage.../video.mp4` | אחרי העלאה |
| `audio_url` | קישור לקובץ MP3 | `https://storage.../audio.mp3` | אם יש אודיו |
| `script_url` | קישור לתסריט | `https://storage.../script.txt` | אחרי AI |
| `thumbnail_url` | תמונה ממוזערת | `https://storage.../thumb.jpg` | לתצוגה |
| `rendered_url` | **הסיכום הסופי!** | `https://storage.../final.mp4` | כשמוכן |
| `visibility` | `public` או `private` | `private` | ברירת מחדל: `private` |

#### שדות שהמערכת מעדכנת אוטומטית (אל תשנה!):

| שדה | מה זה | ערכים אפשריים |
|-----|-------|---------------|
| `status` | איפה הסיכום בתהליך | `pending` → `processing` → `completed` / `failed` |
| `progress` | אחוזי התקדמות | `0` עד `100` |
| `views` | כמה צפו | `0`, `1`, `2`, ... |
| `shares` | כמה שיתפו | `0`, `1`, `2`, ... |
| `rating` | דירוג ממוצע | `0.0` עד `5.0` |
| `created_at` | תאריך יצירה | אוטומטי |
| `updated_at` | תאריך עדכון אחרון | אוטומטי |

---

## 2️⃣ טבלת `processing_jobs` - תהליכי עיבוד

### ⚙️ מה זה?
מעקב אחר תהליכי AI/רינדור **בזמן אמת**.

### 📝 מתי להוסיף?
**אוטומטי!** המערכת יוצרת Job כשמתחילים לעבד סיכום.

### ✍️ מה להכניס (רק אם אתה מתכנת):

| שדה | מה להכניס | דוגמה | ערכים מותרים |
|-----|-----------|--------|--------------|
| `recap_id` | מזהה הסיכום | `f47ac10b-...` | מטבלת `recaps` |
| `job_type` | סוג העיבוד | `video-analysis` | `video-analysis`, `script-generation`, `chat`, `other` |
| `status` | סטטוס | `new` | `new`, `read`, `replied`, `archived` |
| `progress` | אחוזים | `45` | 0-100 |
| `result` | תוצאה (JSON) | `{"script": "...", "tokens": 1250}` | פורמט JSON |
| `error_message` | שגיאה | `Failed to analyze` | טקסט חופשי |

### 🔄 תרחיש טיפוסי:

```
1. משתמש מעלה וידאו
2. מערכת יוצרת ProcessingJob עם status=new
3. AI מעבד → progress משתנה: 0 → 25 → 50 → 75 → 100
4. סיום → status=completed, result={...}
```

---

## 3️⃣ טבלת `contact_messages` - הודעות צור קשר

### 📧 מה זה?
הודעות שאתה שולח דרך טופס "צור קשר" באפליקציה.

### 📝 מתי להוסיף?
כשאתה שולח הודעה למפתחי האפליקציה.

### ✍️ מה להכניס:

#### שדות **חובה**:

| שדה | מה להכניס | דוגמה נכונה | ❌ שגוי |
|-----|-----------|-------------|---------|
| `name` | השם שלך | `יוסי כהן` או `John Doe` | אל תשאיר ריק |
| `email` | האימייל שלך | `yossi@example.com` | `yossi` (לא תקין!) |
| `subject` | נושא ההודעה | `בעיה ברינדור וידאו` | אל תשאיר ריק |
| `message` | תוכן ההודעה | `הוידאו שלי נכשל אחרי 5 דקות...` | אל תשאיר ריק |

#### שדות **אוטומטיים** (אל תמלא!):

| שדה | מה זה | הערה |
|-----|-------|------|
| `user_id` | אם אתה מחובר | `null` אם לא מחובר |
| `status` | סטטוס הטיפול | תמיד `new` בהתחלה |
| `email_sent` | נשלח אימייל? | `false` → `true` אוטומטית |
| `email_sent_at` | מתי נשלח | אוטומטי |
| `created_at` | תאריך יצירה | אוטומטי |

### 📮 לאן נשלח?
כל הודעה נשלחת ל: **contact-us@y-l-b-s-ai-studio-apps.com**

---

## 4️⃣ טבלת `api_usage` - מעקב שימוש ב-API

### 📊 מה זה?
מעקב **פרטי ומוצפן** אחרי כל שימוש במפתחות API שלך (Gemini, OpenAI וכו').

### 📝 מתי להוסיף?
**אוטומטי!** המערכת מתעדת כל קריאה ל-API.

### 📈 מה כל שדה אומר:

| שדה | מה זה | דוגמה | הסבר |
|-----|-------|--------|------|
| `user_id` | זה אתה! | (אוטומטי) | המשתמש שעשה את הקריאה |
| `api_type` | איזה AI? | `gemini` | `gemini`, `openai`, `claude`, `other` |
| `api_key_hash` | חתימה מוצפנת | `abc123...` | ⚠️ **לא המפתח עצמו!** |
| `tokens_input` | כמה שלחת | `500` | כמה מילים שלחת ל-AI |
| `tokens_output` | כמה קיבלת | `750` | כמה מילים AI החזיר |
| `tokens_total` | סה"כ | `1250` | חישוב אוטומטי: 500+750 |
| `cost_input` | עלות שליחה | `6` | **בסנט**: $0.06 |
| `cost_output` | עלות תשובה | `28` | **בסנט**: $0.28 |
| `cost_total` | סה"כ עלות | `34` | **בסנט**: $0.34 |
| `duration_ms` | כמה זמן לקח | `15000` | 15 שניות (15,000 מילישניות) |
| `operation_type` | מה עשית? | `video-analysis` | `video-analysis`, `script-generation`, `chat`, `other` |
| `recap_id` | קשור לסיכום? | uuid או `null` | אם זה היה חלק מסיכום |
| `status` | הצליח? | `success` | `success`, `failed`, `timeout` |
| `error_message` | שגיאה | `null` או טקסט | רק אם נכשל |
| `created_at` | מתי | אוטומטי | תאריך השימוש |

### 💰 איך מחושבת העלות?

**דוגמה - Gemini Pricing**:
- Input: $0.000125 לכל 1,000 טוקנים = **0.0125 סנט**
- Output: $0.000375 לכל 1,000 טוקנים = **0.0375 סנט**

**חישוב**:
```
500 טוקנים input × (0.0125 ÷ 1000) = 0.00625 סנט = 6 סנט (מעוגל)
750 טוקנים output × (0.0375 ÷ 1000) = 0.028125 סנט = 28 סנט (מעוגל)
סה"כ = 6 + 28 = 34 סנט = $0.34
```

### 📊 איך לראות סטטיסטיקות?

המערכת מציגה לך ב-Dashboard:
- ✅ כמה קריאות עשית (יומי/שבועי/חודשי)
- ✅ כמה טוקנים השתמשת
- ✅ כמה עלה לך (בדולרים)
- ✅ זמן תגובה ממוצע
- ✅ אחוז הצלחה

---

## 5️⃣ טבלת `user_api_keys` - ניהול מפתחות API

### 🔑 מה זה?
מקום בטוח לשמור את המפתחות שלך + לעקוב אחריהם.

### 📝 מתי להוסיף?
כשאתה מוסיף API Key חדש בהגדרות.

### ✍️ מה להכניס:

#### שדות **חובה**:

| שדה | מה להכניס | דוגמה | ⚠️ חשוב! |
|-----|-----------|--------|----------|
| `api_type` | סוג ה-API | `gemini` | `gemini`, `openai`, `claude`, `other` |
| `api_key_hash` | Hash של המפתח | (SHA256) | **לא המפתח עצמו!** |

#### שדות **אופציונליים**:

| שדה | מה זה | דוגמה | למה זה טוב? |
|-----|-------|--------|-------------|
| `key_name` | שם ידידותי | `Gemini Work Key` | כדי לזהות מפתחות |
| `daily_limit_tokens` | מקסימום ליום | `50000` | התראה כשמגיעים למגבלה |
| `monthly_limit_tokens` | מקסימום לחודש | `1000000` | שליטה בהוצאות |
| `daily_limit_cost` | מקסימום $ ליום | `1000` | **בסנט**: $10 |
| `monthly_limit_cost` | מקסימום $ לחודש | `10000` | **בסנט**: $100 |

#### שדות **אוטומטיים** (המערכת מעדכנת):

| שדה | מה זה |
|-----|-------|
| `total_uses` | כמה פעמים השתמשת |
| `total_tokens` | סה"כ טוקנים |
| `total_cost` | סה"כ עלות (סנט) |
| `last_used_at` | שימוש אחרון |
| `is_active` | פעיל? (`true`/`false`) |

### 🔔 התראות חכמות:

המערכת תתריע כש:
- ✅ הגעת ל-80% מהמגבלה היומית
- ✅ חרגת מהתקציב החודשי
- ✅ יש הרבה שגיאות חוזרות

---

## 6️⃣ טבלת `genres` - 44 ז'אנרים

### 🎬 מה זה?
רשימת כל הז'אנרים האפשריים (סרטים + סדרות).

### 📝 מתי להשתמש?
כשיוצרים Recap חדש - **חובה לבחור ז'אנר מהרשימה הזו!**

### 📋 כל 44 הז'אנרים:

#### סרטים (1-18):
1. `Action` (אקשן) 🔥
2. `Adventure` (הרפתקאות) 🗺️
3. `Animation` (אנימציה) 🎨
4. `Comedy` (קומדיה) 😂
5. `Crime` (פשע) 🕵️
6. `Documentary` (דוקומנטרי) 📹
7. `Drama` (דרמה) 🎭
8. `Family` (משפחה) 👨‍👩‍👧‍👦
9. `Fantasy` (פנטזיה) ✨
10. `History` (היסטוריה) 📜
11. `Horror` (אימה) 👻
12. `Music` (מוזיקה) 🎵
13. `Mystery` (מסתורין) 🔍
14. `Romance` (רומנטיקה) ❤️
15. `Sci-Fi` (מדע בדיוני) 🚀
16. `Thriller` (מתח) ⚡
17. `War` (מלחמה) ⚔️
18. `Western` (מערבון) 🤠

#### סדרות טלוויזיה (19-44):
19. `TV Action`
20. `TV Adventure`
21. `TV Animation`
22. `TV Comedy`
23. `TV Crime`
24. `TV Documentary`
25. `TV Drama`
26. `TV Family`
27. `TV Fantasy`
28. `TV Horror`
29. `TV Mystery`
30. `TV Sci-Fi`
31. `TV Thriller`
32. `Reality` (ריאליטי) 📺
33. `Talk Show` (תכנית אירוח) 🎙️
34. `Game Show` (חידון) 🎲
35. `News` (חדשות) 📰
36. `Sports` (ספורט) ⚽
37. `Cooking` (בישול) 👨‍🍳
38. `Travel` (טיולים) ✈️
39. `Educational` (חינוכי) 📚
40. `Kids` (ילדים) 👶
41. `Teen` (נוער) 🧑
42. `Adult` (מבוגרים) 👔
43. `Variety` (מגוון) 🎪
44. `Other` (אחר) ❓

### 🎨 מה יש בכל ז'אנר?

| שדה | מה זה | דוגמה |
|-----|-------|--------|
| `name_en` | שם באנגלית | `Action` |
| `name_he` | שם בעברית | `אקשן` |
| `category` | קטגוריה | `movie` / `tv` / `both` |
| `icon` | אייקון | `local-fire-department` |
| `color` | צבע | `#FF5722` |
| `sort_order` | סדר | 1-44 |
| `is_active` | פעיל? | `true` / `false` |

---

## 🎯 תרחישי שימוש נפוצים

### תרחיש 1: יצירת סיכום מלא

```sql
-- שלב 1: יצירת Recap
INSERT INTO recaps (
  user_id, title, genre, duration, cut_interval, input_type
) VALUES (
  auth.uid(),
  'Scream 2 (1997) Full Recap',
  'Horror',
  240,  -- 4 דקות
  9,    -- כל 9 שניות
  'mp4'
) RETURNING id;

-- שלב 2: יצירת Job
INSERT INTO processing_jobs (recap_id, job_type, status)
VALUES ('recap-uuid-here', 'video-analysis', 'new');

-- שלב 3: רישום שימוש ב-API (אוטומטי)
-- המערכת קוראת ל-track_api_usage(...)

-- שלב 4: עדכון כשמוכן
UPDATE recaps
SET status = 'completed', progress = 100, rendered_url = 'https://...'
WHERE id = 'recap-uuid-here';
```

### תרחיש 2: שליחת הודעת צור קשר

```
פשוט! מלא את הטופס באפליקציה:
- שם: יוסי כהן
- אימייל: yossi@example.com
- נושא: בעיה ברינדור
- הודעה: הוידאו נכשל...

המערכת תוסיף אוטומטית ל-contact_messages ותשלח אימייל!
```

### תרחיש 3: מעקב אחר עלות חודשית

```sql
-- כמה הוצאתי החודש?
SELECT SUM(cost_total) / 100.0 AS total_usd
FROM api_usage
WHERE user_id = auth.uid()
  AND created_at >= date_trunc('month', now());
```

### תרחיש 4: בדיקת מגבלה יומית

```sql
-- האם חרגתי מהמגבלה היומית?
SELECT
  k.daily_limit_cost / 100.0 AS daily_limit_usd,
  SUM(u.cost_total) / 100.0 AS today_spent_usd,
  (SUM(u.cost_total) / k.daily_limit_cost * 100.0) AS percentage
FROM user_api_keys k
LEFT JOIN api_usage u
  ON u.api_key_hash = k.api_key_hash
  AND u.created_at >= date_trunc('day', now())
WHERE k.user_id = auth.uid()
  AND k.is_active = true
GROUP BY k.id;
```

---

## ⚠️ שגיאות נפוצות ופתרונות

### 1. "Foreign key violation on user_id"

**סיבה**: ניסית להוסיף Recap בלי להיות מחובר.

**פתרון**:
```sql
-- בדוק שאתה מחובר:
SELECT auth.uid();  -- צריך להחזיר uuid, לא NULL
```

### 2. "Check constraint violation on status"

**סיבה**: השתמשת בערך לא קיים ב-`status`.

**פתרון**:
```sql
-- ✅ נכון
UPDATE recaps SET status = 'completed';

-- ❌ שגוי
UPDATE recaps SET status = 'done';  -- לא קיים!
```

### 3. "RLS policy violation"

**סיבה**: ניסית לגשת לנתונים של משתמש אחר.

**פתרון**:
```sql
-- ✅ נכון
SELECT * FROM recaps WHERE user_id = auth.uid();

-- ❌ שגוי
SELECT * FROM recaps;  -- ינסה לקבל הכל!
```

### 4. "Invalid genre"

**סיבה**: השתמשת בז'אנר שלא קיים.

**פתרון**:
```sql
-- ראה את כל הז'אנרים:
SELECT name_en FROM genres WHERE is_active = true;

-- ✅ נכון
INSERT INTO recaps (..., genre) VALUES (..., 'Horror');

-- ❌ שגוי
INSERT INTO recaps (..., genre) VALUES (..., 'Scary');
```

---

## 🔐 אבטחה - מה חשוב לדעת

### ✅ מה **בטוח** לשתף?

- Recap ID
- Title
- Genre
- Views / Shares / Rating
- Public recap URLs
- Username

### ❌ מה **אסור** לשתף?

- ⛔ API Keys (גם לא ה-Hash!)
- ⛔ User ID של משתמשים אחרים
- ⛔ Private recap URLs
- ⛔ Email addresses
- ⛔ Error messages מפורטות
- ⛔ api_key_hash

### 🔒 RLS (Row Level Security) מגן עליך:

1. **אתה רואה רק את הנתונים שלך**
   - Recaps שלך
   - API Usage שלך
   - API Keys שלך
   - Contact Messages שלך

2. **כולם רואים רק תוכן ציבורי**
   - Recaps עם `visibility='public'`
   - Genres (כולם)

3. **אף אחד לא רואה מפתחות**
   - API Keys פרטיים לגמרי
   - API Usage פרטי לגמרי

---

## 📊 Dashboard Queries - שאילתות שימושיות

### סיכום כללי שלי

```sql
SELECT
  COUNT(*) AS total_recaps,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'processing') AS processing,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  SUM(views) AS total_views,
  SUM(shares) AS total_shares
FROM recaps
WHERE user_id = auth.uid();
```

### Top 5 הסיכומים הכי נצפים שלי

```sql
SELECT title, views, shares, rating, created_at
FROM recaps
WHERE user_id = auth.uid()
  AND status = 'completed'
ORDER BY views DESC
LIMIT 5;
```

### שימוש ב-API השבוע

```sql
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS calls,
  SUM(tokens_total) AS tokens,
  SUM(cost_total) / 100.0 AS cost_usd
FROM api_usage
WHERE user_id = auth.uid()
  AND created_at >= now() - interval '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Genres הכי פופולריים

```sql
SELECT
  genre,
  COUNT(*) AS total_recaps,
  SUM(views) AS total_views
FROM recaps
WHERE visibility = 'public'
  AND status = 'completed'
GROUP BY genre
ORDER BY total_views DESC
LIMIT 10;
```

---

## 🎉 סיכום

### ✅ יש לך 6 טבלאות:
1. **recaps** - הסיכומים שלך
2. **processing_jobs** - תהליכי עיבוד (אוטומטי)
3. **contact_messages** - הודעות צור קשר
4. **api_usage** - מעקב שימוש (אוטומטי)
5. **user_api_keys** - ניהול מפתחות
6. **genres** - 44 ז'אנרים

### 📊 סטטיסטיקות שיש לך:
- 📈 שימוש ב-API (טוקנים, עלות, זמן)
- 🎯 ביצועים (success rate, avg duration)
- 💰 עלויות (יומי, שבועי, חודשי)
- 🎬 פופולריות (views, shares, rating)

### 🔒 אבטחה:
- ✅ הכל פרטי ומאובטח
- ✅ RLS מגן על הנתונים שלך
- ✅ API Keys מוצפנים
- ✅ רק אתה רואה את המידע שלך

---

**עזרה נוספת?** שלח הודעה דרך צור קשר באפליקציה! 📧
