# Mobile Deployment Guide — Bold Party

This guide covers deploying Bold Party as a native Android and iOS app using Capacitor.

---

## Architecture Overview

Bold Party uses **Capacitor** to wrap the Next.js web app in a native WebView shell. The app always loads from the hosted production URL (`https://boldparty.co.uk`), which means:

- All SSR, API routes, and Supabase auth work unchanged
- Native features (push notifications, camera, etc.) are added via Capacitor plugins
- App updates happen via web deployment — no app store submission needed for content changes
- Only native plugin changes require a new app store release

---

## Prerequisites

### Android
- Android Studio (latest stable)
- JDK 17+
- Android SDK (API level 24+)
- Google Play Developer account ($25 one-time fee)

### iOS
- macOS only
- Xcode 15+
- Apple Developer Program ($99/year)
- iPhone or iPad for physical testing

---

## Environment Setup

### 1. Install Capacitor CLI globally

```bash
npm install -g @capacitor/cli
```

### 2. Set your local IP in capacitor.config.ts

For development with live reload, update the server URL:

```typescript
server: {
  url: "http://YOUR_LOCAL_IP:3000",  // e.g., 192.168.1.42:3000
  cleartext: true,
}
```

Find your local IP:
- Mac/Linux: `ifconfig | grep "inet "`
- Windows: `ipconfig | findstr "IPv4"`

---

## VAPID Keys for Push Notifications

Push notifications require VAPID keys. Generate them once:

```bash
npx web-push generate-vapid-keys
```

Add to `.env.local` and Vercel environment variables:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:hello@boldparty.co.uk
```

**IMPORTANT**: Never rotate VAPID keys after users have subscribed — existing subscriptions will break. Keep them in a password manager.

---

## Android Deployment

### 1. Add Android platform

```bash
npx cap add android
```

### 2. Copy web assets and open in Android Studio

```bash
npx cap sync
npx cap open android
```

### 3. Configure signing

In Android Studio → Build → Generate Signed Bundle/APK:
1. Create a keystore (keep this safe — it's your app identity)
2. Store keystore path/alias/passwords in Capacitor config (or CI secrets)

### 4. Build for release

```bash
# From Android Studio: Build > Generate Signed Bundle > Android App Bundle
# OR via CLI:
cd android && ./gradlew bundleRelease
```

### 5. Upload to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app → Select "App" type
3. Internal testing → Upload AAB file
4. Fill in store listing (see `docs/app-store-assets.md`)
5. Promote to Production when ready

### App ID: `uk.co.boldparty.app`

---

## iOS Deployment

### 1. Add iOS platform (macOS only)

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

### 2. Configure in Xcode

- Set Bundle Identifier: `uk.co.boldparty.app`
- Set Development Team (Apple Developer account)
- Set minimum iOS version: 15.0
- Enable Push Notifications capability
- Enable Background Modes → Remote notifications

### 3. Configure Push Notifications (APNs)

1. In Apple Developer Portal: Certificates > Identifiers > Select app
2. Enable Push Notifications → Configure → Create a certificate
3. In Supabase or your push provider: upload the APNs certificate

For web-push (VAPID), no APNs certificate is needed — VAPID works on iOS 16.4+ when the app is installed to the home screen.

### 4. Build for release

1. Xcode → Product → Archive
2. Distribute App → App Store Connect
3. Upload to App Store Connect

### 5. Submit to App Store

1. [App Store Connect](https://appstoreconnect.apple.com)
2. + New App → iOS → select app ID
3. Fill metadata (see `docs/app-store-assets.md`)
4. Submit for Review (typically 1–3 days)

---

## Capacitor Plugins Roadmap

To add native functionality beyond the base Capacitor shell:

| Feature | Plugin | Command |
|---------|--------|---------|
| Camera | `@capacitor/camera` | `npm i @capacitor/camera` |
| File access | `@capacitor/filesystem` | `npm i @capacitor/filesystem` |
| Share sheet | `@capacitor/share` | `npm i @capacitor/share` |
| Haptics | `@capacitor/haptics` | `npm i @capacitor/haptics` |
| Geolocation | `@capacitor/geolocation` | `npm i @capacitor/geolocation` |
| App review | `@capacitor-community/in-app-review` | npm install |

After installing any plugin: `npx cap sync`

---

## Live Reload in Development

```bash
# Start Next.js dev server
npm run dev

# In a second terminal, open the native app pointing to dev server
npx cap run android --livereload --external
# OR
npx cap run ios --livereload --external
```

Ensure `server.url` in `capacitor.config.ts` points to your machine's local IP.

---

## CI/CD with GitHub Actions

Add to `.github/workflows/android-release.yml`:

```yaml
name: Android Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx cap sync android
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - run: cd android && ./gradlew bundleRelease
        env:
          KEYSTORE_PATH: ${{ secrets.KEYSTORE_PATH }}
          KEYSTORE_ALIAS: ${{ secrets.KEYSTORE_ALIAS }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
```

---

## Troubleshooting

**White screen on load**: Check `server.url` is reachable from the device. Ensure HTTPS in production.

**Push notifications not arriving**: Verify VAPID keys are set in env vars. Check browser console for SW registration errors.

**Mixed content errors**: In production, all resources must be HTTPS. Set `allowMixedContent: false` in android config.

**App rejected from App Store**: Ensure privacy policy URL is set, push notification usage description is in `Info.plist`, and all required screenshots are provided.
