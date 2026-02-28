# Daily Walk — App Store Submission Guide

## Pre-Submission Checklist

### 1. Apple Developer Account
- [ ] Enroll at https://developer.apple.com/programs/ ($99/year)
- [ ] Account must be fully approved before submitting

### 2. App Store Connect Setup
- [ ] Go to https://appstoreconnect.apple.com
- [ ] Click "My Apps" → "+" → "New App"
- [ ] Fill in:
  - **Platform:** iOS
  - **Name:** `Daily Walk — Jesus & Bible`
  - **Primary Language:** English (U.S.)
  - **Bundle ID:** `com.powoso.dailywalk`
  - **SKU:** `dailywalk001`

### 3. App Information (in App Store Connect)

| Field | Value |
|-------|-------|
| **Name** | Daily Walk — Jesus & Bible |
| **Subtitle** | Devotionals & Prayer Journal |
| **Category** | Health & Fitness (Primary), Lifestyle (Secondary) |
| **Age Rating** | 4+ |
| **Copyright** | 2026 Paul Chung |
| **Privacy Policy URL** | https://daily-walk.netlify.app/privacy |

### 4. Version Information

**Promotional Text** (can be updated without review):
```
Your sacred space to grow closer to Jesus. Daily devotionals, prayer journal, Scripture memory with spaced repetition, gratitude wall & spiritual growth tracking. Free.
```

**Description** (see `/public/store/listing.txt` for full text)

**Keywords** (100 chars max, comma-separated):
```
bible,devotional,prayer,journal,scripture,memory,jesus,christian,gratitude,faith,worship,reading
```

**Support URL:** Your website or GitHub repo URL
**Marketing URL:** (optional) Your website

### 5. Screenshots (REQUIRED)

Apple requires screenshots for each device size your app supports:

| Device | Size (pixels) | Min Required |
|--------|---------------|-------------|
| **6.7" iPhone** (iPhone 15 Pro Max) | 1290 x 2796 | 3 screenshots |
| **6.5" iPhone** (iPhone 11 Pro Max) | 1284 x 2778 | 3 screenshots |
| **5.5" iPhone** (iPhone 8 Plus) | 1242 x 2208 | 3 screenshots |
| **iPad Pro 12.9"** (6th gen) | 2048 x 2732 | 3 screenshots |

**How to capture screenshots:**

**Option A — From your iPad/iPhone:**
1. Open Daily Walk on your device
2. Navigate to each screen (Devotional, Prayer, Memory, etc.)
3. Take a screenshot (Power + Volume Up)
4. Upload to App Store Connect

**Option B — Using the screenshot generator:**
1. Open `public/store/screenshots/app-store-screenshots.html` in Chrome
2. Each frame shows a styled mockup with headline + phone frame
3. Use a screenshot tool to capture each frame
4. Resize to the required dimensions

**Option C — From Xcode Simulator:**
1. Run the app in Xcode Simulator
2. Select different device sizes (iPhone 15 Pro Max, etc.)
3. Cmd+S to take simulator screenshots
4. Upload to App Store Connect

### 6. App Icon
- [x] 1024x1024 icon already set in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- The cross with sunrise design is ready

### 7. Build & Upload from Xcode

#### Step-by-step:

1. **Sync the project:**
   ```bash
   npm run cap:sync
   ```

2. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

3. **In Xcode — Set version:**
   - Select the **App** target
   - Under **General** tab:
     - **Version:** `1.0.0`
     - **Build:** `1`

4. **In Xcode — Set signing:**
   - Select **Signing & Capabilities** tab
   - Check "Automatically manage signing"
   - **Team:** Select your Apple Developer team
   - **Bundle Identifier:** `com.powoso.dailywalk`

5. **Archive the app:**
   - Select **Any iOS Device (arm64)** as the build destination (NOT a simulator)
   - Menu: **Product → Archive**
   - Wait for the build to complete

6. **Upload to App Store Connect:**
   - When the Archive window opens, click **Distribute App**
   - Select **App Store Connect**
   - Click **Upload**
   - Wait for processing (can take 15-30 minutes)

7. **In App Store Connect:**
   - Go to your app → **iOS App** section
   - Under **Build**, click "+" and select the uploaded build
   - Fill in all metadata (description, screenshots, etc.)
   - Click **Submit for Review**

### 8. App Review Notes

Provide this to Apple reviewers:

```
Daily Walk is a devotional app that stores all data locally on the device.
No account creation is required. Simply open the app and begin using any
of the six features: Devotionals, Prayer Journal, Bible Reading Plans,
Scripture Memory, Gratitude Wall, and Growth Tracker.

The app does not collect any user data, has no server-side component,
and does not require internet access to function.
```

### 9. App Privacy (App Store Connect)

In the **App Privacy** section, select:
- **Data Not Collected** — Daily Walk does not collect any data

This is accurate because:
- All data stays in localStorage on the device
- No analytics, no tracking, no server calls
- No account system

### 10. Common Rejection Reasons (and how we avoid them)

| Rejection Reason | Our Status |
|-----------------|------------|
| Crashes on launch | Test thoroughly before submitting |
| Broken links | Privacy policy URL must be live |
| Missing privacy policy | ✅ We have one at /privacy |
| Placeholder content | ✅ All 366 verses are real content |
| WebView-only app | We use Capacitor (WebView-based) — add enough native feel with proper icons, splash, and smooth transitions |
| Metadata mismatch | Ensure screenshots match actual app |

### 11. Post-Submission

- **Review time:** Typically 24-48 hours
- **If rejected:** Read the rejection reason carefully, fix, and resubmit
- **Version updates:** Increment build number for each new upload

---

## Quick Command Reference

```bash
# Build and sync iOS
npm run cap:sync

# Open Xcode
npx cap open ios

# Check version
cat package.json | grep version
```

## File Locations

| Asset | Path |
|-------|------|
| App Store listing text | `/public/store/listing.txt` |
| Screenshot templates | `/public/store/screenshots/app-store-screenshots.html` |
| App icon | `/ios/App/App/Assets.xcassets/AppIcon.appiconset/` |
| Privacy policy | `/src/app/privacy/page.tsx` |
| Capacitor config | `/capacitor.config.ts` |
| iOS Info.plist | `/ios/App/App/Info.plist` |
