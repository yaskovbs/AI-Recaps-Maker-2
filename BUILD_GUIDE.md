# 🏗️ Production APK Build Guide — Large File Support (5GB)

## למה APK ייצור ולא Expo Go?

Expo Go טוען קבצים לזיכרון לפני העלאה — מגבלה פנימית של ~200MB.
ה-APK הייצורי עם `android:largeHeap="true"` מאפשר קבצי וידאו עד 5GB.

---

## הגדרות שהופעלו אוטומטית

| קובץ | הגדרה | השפעה |
|------|-------|-------|
| `plugins/withGradleJvmArgs.js` | `android:largeHeap="true"` | heap גדול לעיבוד קבצים גדולים |
| `plugins/withGradleJvmArgs.js` | `org.gradle.jvmargs=-Xmx4096m` | מניעת OOM בזמן build |
| `eas.json` → `production-apk` | `GRADLE_OPTS=-Xmx4g` | זיכרון נוסף לתהליך Gradle |
| `app.json` | `enableProguardInReleaseBuilds: false` | מניעת שגיאות obfuscation |

---

## פקודות Build

### ✅ מהיר — APK להתקנה ישירה (מומלץ לבדיקה)

```bash
eas build --platform android --profile production-apk
```

לאחר הסיום, יתקבל קישור להורדת APK — להתקין ישירות על המכשיר.

---

### 🏪 לחנות Google Play — AAB

```bash
eas build --platform android --profile production-aab
```

---

### 🛠️ Build מקומי (בלי EAS Cloud)

```bash
# הורד את ה-native code
npx expo prebuild --platform android --clean

# Build עם Gradle ישירות
cd android
./gradlew assembleRelease \
  -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=512m" \
  --stacktrace

# APK נמצא ב:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## שלבים להתקנת APK על מכשיר Android

```
1. פתח הגדרות המכשיר
2. אבטחה → "מקורות לא ידועים" → אפשר
3. הורד את ה-APK מהקישור של EAS
4. פתח את הקובץ → "התקן"
5. פתח את האפליקציה → בחר וידאו 2.2GB+ → צריך לעבוד ✅
```

---

## וידוא שה-APK תומך בקבצים גדולים

לאחר התקנה, פתח `Step 3 — העלאת וידאו` ובחר קובץ מעל 1GB.
אם מצליח לבחור ולהתחיל העלאה — ה-largeHeap פעיל בהצלחה.

---

## פתרון בעיות

| שגיאה | פתרון |
|-------|-------|
| `OutOfMemoryError` בזמן build | הגדל ב-`eas.json`: `GRADLE_OPTS=-Xmx6g` |
| `File is too large to load into memory` | ודא שמריץ APK ייצור ולא Expo Go |
| APK לא מותקן | ודא "מקורות לא ידועים" מופעל |
| העלאה נכשלת | בדוק חיבור לאינטרנט — קבצים גדולים דורשים Wi-Fi יציב |
