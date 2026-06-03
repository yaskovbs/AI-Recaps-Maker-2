# 📚 מדריך שימוש ב-Database - AI Recaps Maker

## 🎯 טבלאות מרכזיות

### 1. 📝 `recaps` - סיכומים

**מה זה?** טבלה המכילה את כל הסיכומים שנוצרו על ידי משתמשים.

#### שדות חובה:

| שדה | סוג | תיאור | דוגמה |
|-----|-----|-------|--------|
| `user_id` | uuid | מזהה המשתמש שיצר | (אוטומטי) |
| `title` | text | כותרת הסיכום | "Scream 2 (1997) Full Movie Recap" |
| `genre` | text | ז'אנר (מטבלת `genres`) | "Horror" |
| `duration` | integer | אורך הסיכום **בשניות** | 240 (=4 דקות) |
| `cut_interval` | integer | כל כמה שניות לחתוך | 9 |
| `input_type` | text | סוג קלט | "mp4" / "mp3-txt" / "record" |

#### שדות אופציונליים:

| שדה | תיאור | ברירת מחדל |
|-----|-------|-----------|
| `description` | תיאור הסיכום | NULL |
| `video_url` | URL לקובץ וידאו | NULL |
| `audio_url` | URL לקובץ אודיו | NULL |
| `script_url` | URL לתסריט AI | NULL |
| `thumbnail_url` | URL לתמונה ממוזערת | NULL |
| `rendered_url` | URL לסיכום הסופי (MP4) | NULL |
| `status` | סטטוס עיבוד | "pending" |
| `progress` | התקדמות (0-100) | 0 |
| `error_message` | הודעת שגיאה (אם נכשל) | NULL |
| `visibility` | ציבורי/פרטי | "private" |
| `views` | מספר צפיות | 0 |
| `shares` | מספר שיתופים | 0 |
| `rating` | דירוג (0-5) | 0.0 |

#### ערכים אפשריים:

**`input_type`**:
- `mp4` - וידאו מלא
- `mp3-txt` - אודיו + תסריט
- `record` - הקלטה חדשה

**`status`**:
- `pending` - ממתין לעיבוד
- `processing` - בעיבוד
- `completed` - הושלם
- `failed` - נכשל

**`visibility`**:
- `private` - פרטי (רק המשתמש רואה)
- `public` - ציבורי (כולם רואים)

---

### 2. ⚙️ `processing_jobs` - תהליכי עיבוד

**מה זה?** מעקב אחר תהליכי AI/רינדור בזמן אמת.

#### שדות חובה:

| שדה | תיאור | דוגמה |
|-----|-------|--------|
| `recap_id` | מזהה הסיכום | (uuid מטבלת recaps) |
| `job_type` | סוג התהליך | "gemini-analysis" |
| `status` | סטטוס | "running" |

#### שדות אופציונליים:

| שדה | תיאור | ברירת מחדל |
|-----|-------|-----------|
| `progress` | התקדמות (0-100) | 0 |
| `result` | תוצאה (JSON) | NULL |
| `error_message` | שגיאה | NULL |
| `started_at` | זמן התחלה | NULL |
| `completed_at` | זמן סיום | NULL |

#### ערכים אפשריים:

**`job_type`**:
- `gemini-analysis` - ניתוח AI עם Gemini
- `video-render` - רינדור וידאו סופי
- `audio-process` - עיבוד אודיו

**`status`**:
- `pending` - ממתין
- `running` - רץ עכשיו
- `completed` - הושלם בהצלחה
- `failed` - נכשל

**`result` (JSON)**:
```json
{
  "script": "AI generated script...",
  "scriptUrl": "https://...",
  "tokensUsed": 1250,
  "duration": 15000
}
```

---

### 3. 📧 `contact_messages` - הודעות צור קשר

**מה זה?** הודעות שמשתמשים שולחים דרך טופס צור קשר.

#### שדות חובה:

| שדה | תיאור | דוגמה |
|-----|-------|--------|
| `name` | שם השולח | "John Doe" |
| `email` | אימייל | "john@example.com" |
| `subject` | נושא | "Need help with rendering" |
| `message` | ההודעה | "My video failed to render..." |

#### שדות אופציונליים:

| שדה | תיאור | ברירת מחדל |
|-----|-------|-----------|
| `user_id` | אם מחובר | NULL |
| `status` | סטטוס טיפול | "new" |
| `email_sent` | נשלח אימייל? | false |
| `email_sent_at` | מתי נשלח | NULL |

#### ערכים אפשריים:

**`status`**:
- `new` - חדש
- `read` - נקרא
- `replied` - נענה
- `archived` - בארכיון

---

### 4. 📊 `api_usage` - מעקב שימוש ב-API (חדש!)

**מה זה?** מעקב פרטי אחר שימוש במפתחות API של כל משתמש.

#### שדות חובה:

| שדה | תיאור | דוגמה |
|-----|-------|--------|
| `user_id` | מזהה משתמש | (אוטומטי) |
| `api_type` | סוג API | "gemini" |
| `api_key_hash` | Hash של המפתח | (SHA256) |
| `tokens_input` | טוקנים נכנסים | 500 |
| `tokens_output` | טוקנים יוצאים | 750 |
| `cost_input` | עלות input (סנט) | 15 |
| `cost_output` | עלות output (סנט) | 45 |
| `status` | סטטוס הקריאה | "success" |

#### שדות נוספים:

| שדה | תיאור |
|-----|-------|
| `tokens_total` | סה"כ טוקנים (אוטומטי) |
| `cost_total` | סה"כ עלות בסנט (אוטומטי) |
| `duration_ms` | משך זמן ב-ms |
| `operation_type` | סוג פעולה |
| `recap_id` | אם קשור לסיכום |
| `error_message` | אם נכשל |

#### ערכים אפשריים:

**`api_type`**:
- `gemini` - Google Gemini
- `openai` - OpenAI GPT
- `claude` - Anthropic Claude
- `other` - אחר

**`operation_type`**:
- `video-analysis` - ניתוח וידאו
- `script-generation` - יצירת תסריט
- `chat` - שיחה
- `other` - אחר

**`status`**:
- `success` - הצליח
- `failed` - נכשל
- `timeout` - תם זמן

#### חישוב עלות:

**Gemini Pricing (דוגמה)**:
- Input: $0.000125 per 1K tokens = **0.0125 cents**
- Output: $0.000375 per 1K tokens = **0.0375 cents**

```
Tokens: 500 input + 750 output = 1,250 total
Cost: (500 * 0.0125 / 1000) + (750 * 0.0375 / 1000) = 0.03 cents
```

---

### 5. 🔑 `user_api_keys` - ניהול מפתחות API (חדש!)

**מה זה?** ניהול מפתחות API של המשתמש + סטטיסטיקות.

#### שדות חובה:

| שדה | תיאור | דוגמה |
|-----|-------|--------|
| `api_type` | סוג API | "gemini" |
| `api_key_hash` | Hash של המפתח | (SHA256 - **לא המפתח עצמו!**) |

#### שדות אופציונליים:

| שדה | תיאור | ברירת מחדל |
|-----|-------|-----------|
| `key_name` | שם ידידותי | NULL |
| `daily_limit_tokens` | מקסימום ליום | NULL |
| `monthly_limit_tokens` | מקסימום לחודש | NULL |
| `daily_limit_cost` | מקסימום עלות ליום (סנט) | NULL |
| `monthly_limit_cost` | מקסימום עלות לחודש (סנט) | NULL |
| `total_uses` | סה"כ שימושים | 0 |
| `total_tokens` | סה"כ טוקנים | 0 |
| `total_cost` | סה"כ עלות (סנט) | 0 |
| `last_used_at` | שימוש אחרון | NULL |
| `is_active` | פעיל? | true |

---

### 6. 🎬 `genres` - ז'אנרים (חדש! 44 ז'אנרים!)

**מה זה?** כל הז'אנרים האפשריים (סרטים + סדרות).

#### שדות:

| שדה | תיאור | דוגמה |
|-----|-------|--------|
| `name_en` | שם באנגלית | "Action" |
| `name_he` | שם בעברית | "אקשן" |
| `category` | קטגוריה | "movie" / "tv" / "both" |
| `icon` | שם אייקון | "local-fire-department" |
| `color` | צבע (hex) | "#FF5722" |
| `sort_order` | סדר מיון | 1-44 |

#### רשימת כל 44 הז'אנרים:

**סרטים (1-18)**:
1. Action (אקשן)
2. Adventure (הרפתקאות)
3. Animation (אנימציה)
4. Comedy (קומדיה)
5. Crime (פשע)
6. Documentary (דוקומנטרי)
7. Drama (דרמה)
8. Family (משפחה)
9. Fantasy (פנטזיה)
10. History (היסטוריה)
11. Horror (אימה)
12. Music (מוזיקה)
13. Mystery (מסתורין)
14. Romance (רומנטיקה)
15. Sci-Fi (מדע בדיוני)
16. Thriller (מתח)
17. War (מלחמה)
18. Western (מערבון)

**סדרות טלוויזיה (19-44)**:
19. TV Action
20. TV Adventure
21. TV Animation
22. TV Comedy
23. TV Crime
24. TV Documentary
25. TV Drama
26. TV Family
27. TV Fantasy
28. TV Horror
29. TV Mystery
30. TV Sci-Fi
31. TV Thriller
32. Reality (ריאליטי)
33. Talk Show (תכנית אירוח)
34. Game Show (חידון)
35. News (חדשות)
36. Sports (ספורט)
37. Cooking (בישול)
38. Travel (טיולים)
39. Educational (חינוכי)
40. Kids (ילדים)
41. Teen (נוער)
42. Adult (מבוגרים)
43. Variety (מגוון)
44. Other (אחר)

---

## 🔧 איך להשתמש?

### יצירת Recap חדש

```sql
-- דוגמה ליצירת recap
INSERT INTO recaps (
  user_id,
  title,
  genre,
  duration,
  cut_interval,
  input_type,
  visibility
) VALUES (
  auth.uid(), -- המשתמש הנוכחי
  'Scream 2 (1997) Full Movie Recap',
  'Horror', -- מטבלת genres
  240, -- 4 דקות בשניות
  9, -- חתוך כל 9 שניות
  'mp4',
  'private'
);
```

### רישום שימוש ב-API

```sql
-- רישום שימוש (דרך הפונקציה)
SELECT track_api_usage(
  auth.uid(), -- user_id
  'gemini', -- api_type
  'abc123...', -- api_key_hash
  500, -- tokens_input
  750, -- tokens_output
  6, -- cost_input (cents)
  28, -- cost_output (cents)
  15000, -- duration_ms (15 seconds)
  'video-analysis', -- operation_type
  'recap-uuid-here', -- recap_id
  'success' -- status
);
```

### קבלת סטטיסטיקות API

```sql
-- סטטיסטיקות לחודש האחרון
SELECT * FROM get_user_api_stats(auth.uid(), 'month');

-- תוצאה:
-- api_type | total_calls | total_tokens | total_cost | avg_duration_ms | success_rate
-- gemini   | 15          | 12500        | 450        | 12500.00        | 93.33
```

---

## 🎯 תרחישי שימוש נפוצים

### תרחיש 1: יצירת סיכום מלא

```sql
-- 1. יצירת recap
INSERT INTO recaps (...) RETURNING id;

-- 2. רישום job
INSERT INTO processing_jobs (recap_id, job_type, status)
VALUES ('recap-id', 'gemini-analysis', 'running');

-- 3. רישום שימוש ב-API
SELECT track_api_usage(...);

-- 4. עדכון recap כשמוכן
UPDATE recaps
SET status = 'completed', progress = 100, rendered_url = '...'
WHERE id = 'recap-id';
```

### תרחיש 2: מעקב אחר עלות חודשית

```sql
-- סה"כ עלות החודש
SELECT SUM(cost_total) / 100.0 AS total_usd
FROM api_usage
WHERE user_id = auth.uid()
  AND created_at >= date_trunc('month', now());
```

### תרחיש 3: הגבלת שימוש יומי

```sql
-- בדיקה האם חרגתי מהמגבלה היומית
SELECT
  k.daily_limit_cost,
  SUM(u.cost_total) AS today_cost
FROM user_api_keys k
LEFT JOIN api_usage u ON u.api_key_hash = k.api_key_hash
  AND u.created_at >= date_trunc('day', now())
WHERE k.user_id = auth.uid()
  AND k.is_active = true
GROUP BY k.id;
```

---

## 📈 Dashboard Queries

### סיכום כללי למשתמש

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

### Top 5 Recaps (לפי צפיות)

```sql
SELECT title, views, shares, rating
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

---

## ⚠️ שגיאות נפוצות

### 1. "Foreign key violation on user_id"

**פתרון**: וודא שהמשתמש מחובר:
```sql
SELECT auth.uid(); -- צריך להחזיר uuid, לא NULL
```

### 2. "Check constraint violation on status"

**פתרון**: השתמש רק בערכים מותרים:
```sql
-- ✅ נכון
UPDATE recaps SET status = 'completed';

-- ❌ שגוי
UPDATE recaps SET status = 'done'; -- לא קיים!
```

### 3. "RLS policy violation"

**פתרון**: וודא שאתה מנסה לגשת רק לנתונים שלך:
```sql
-- ✅ נכון
SELECT * FROM recaps WHERE user_id = auth.uid();

-- ❌ שגוי
SELECT * FROM recaps; -- ינסה לקבל הכל!
```

---

## 🔐 אבטחה

### מה בטוח לשתף?

✅ **בטוח**:
- Recap ID
- Title
- Genre
- Views/Shares
- Public recap URLs

❌ **לא בטוח**:
- API Keys (גם לא ה-Hash!)
- User ID של אחרים
- Private recap URLs
- Email addresses
- Error messages מפורטות

### RLS מבטיח:

1. **משתמשים רואים רק את הנתונים שלהם**
2. **Recaps ציבוריים נגישים לכולם**
3. **API Usage פרטי לגמרי**
4. **Genres ציבוריים לקריאה**

---

## 🎉 סיכום

### טבלאות קיימות:
1. ✅ `recaps` - הסיכומים שלך
2. ✅ `processing_jobs` - תהליכי עיבוד
3. ✅ `contact_messages` - הודעות צור קשר
4. ✅ `api_usage` - מעקב שימוש (חדש!)
5. ✅ `user_api_keys` - ניהול מפתחות (חדש!)
6. ✅ `genres` - 44 ז'אנרים (חדש!)

### סטטיסטיקות זמינות:
- 📊 שימוש ב-API (טוקנים, עלות, זמן)
- 📈 ביצועים (success rate, avg duration)
- 💰 עלויות (יומי, שבועי, חודשי)
- 🎬 פופולריות (views, shares, rating)

**הכל פרטי ומאובטח!** 🔒

