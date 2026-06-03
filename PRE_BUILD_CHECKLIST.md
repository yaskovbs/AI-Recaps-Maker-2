# ✅ Pre-Build Checklist — Production APK (EAS Build)

## Step 1: Update react-native-google-mobile-ads → v14

```bash
npm install react-native-google-mobile-ads@^14.0.0 --legacy-peer-deps
```

Verify in package.json:
```json
"react-native-google-mobile-ads": "^14.0.0"
```

---

## Step 2: Fix all Expo SDK package versions

```bash
npx expo install --fix
```

---

## Step 3: Run doctor check

```bash
npx expo-doctor
```

Expected: all ✅ green. Common warnings (safe to ignore):
- `react-native-google-mobile-ads` peer dep warning — OK with `--legacy-peer-deps`

---

## Step 4: Verify app.json settings (already configured ✅)

| Setting | Value |
|---------|-------|
| `kotlinVersion` | `1.9.25` |
| `compileSdkVersion` | `35` |
| `targetSdkVersion` | `35` |
| `minSdkVersion` | `23` |
| `enableProguardInReleaseBuilds` | `false` |
| Android App ID (AdMob) | `ca-app-pub-9953179201685717~4175960790` |

---

## Step 5: Verify Ad Unit IDs (already updated ✅)

| Type | ID |
|------|----|
| Banner | `ca-app-pub-9953179201685717/1363779404` |
| Interstitial | `ca-app-pub-9953179201685717/5210675011` |
| Rewarded | `ca-app-pub-9953179201685717/6229927427` |
| Rewarded Interstitial | `ca-app-pub-9953179201685717/8848066496` |
| App ID | `ca-app-pub-9953179201685717~4175960790` |

---

## Step 6: Login to EAS (first time only)

```bash
eas login
# Enter your Expo account credentials
```

---

## Step 7: Build Production APK

```bash
eas build --platform android --profile production-apk
```

**Estimated build time:** 15–25 minutes on EAS cloud servers.

Progress: https://expo.dev/builds

---

## Step 8: Download & Install APK

After build completes:
1. EAS sends email with download link  
2. Or visit https://expo.dev/accounts/[username]/projects/ai-recaps-maker-and-auto-post-android-app/builds
3. Download the `.apk` file
4. Transfer to Android device
5. Enable **Settings → Security → Unknown Sources**
6. Tap APK file → Install

---

## Step 9: Test Ads on Device

| Ad Type | Where to test |
|---------|---------------|
| Banner | Home screen (bottom) |
| Rewarded | Home screen → "Earn Credits" button |
| Interstitial | Create → Step 5 → Confirm Creation |
| App Open | Background app → return to foreground |

> ⚠️ New ad units may take up to 1 hour to start serving real ads after first use.
> Use test IDs during development (Settings → Test Mode).

---

## If Build Fails

| Error | Fix |
|-------|-----|
| `compileDebugKotlin` | Ensure `kotlinVersion: "1.9.25"` in app.json ✅ |
| `Cannot find MaxAdContentRating` | Install `react-native-google-mobile-ads@^14` |
| `Duplicate class kotlin.*` | `META-INF` exclusions already in app.json ✅ |
| `minSdkVersion too low` | `minSdkVersion: 23` already set ✅ |
| Build cache issue | `eas build --platform android --profile production-apk --clear-cache` |

---

## Quick Commands Summary

```bash
# Full pre-build sequence
npm install react-native-google-mobile-ads@^14.0.0 --legacy-peer-deps
npx expo install --fix
npx expo-doctor

# Build
eas build --platform android --profile production-apk
```
