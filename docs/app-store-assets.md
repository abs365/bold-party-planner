# App Store Asset Checklist — ELBOLD

All assets required before submitting to Google Play and Apple App Store.

---

## App Icons

All icons must be **square**, **no alpha channel** (App Store), high-res PNG.

### Android (Google Play)

| Size | File | Usage |
|------|------|-------|
| 512×512 | `public/icons/icon-512.png` | Play Store listing |
| 192×192 | `public/icons/icon-192.png` | Home screen, launcher |
| 512×512 | `public/icons/icon-512-maskable.png` | Adaptive icon (must be maskable) |

**Maskable icon**: The subject (logo) must fit within the central 80% "safe zone" of a 512×512 canvas. The outer 20% may be clipped on some launchers. Background must be solid brand purple (`#d946ef`) or dark (`#0a0a0f`).

Generate adaptive icons: [maskable.app](https://maskable.app/editor)

### iOS (App Store)

| Size | File | Usage |
|------|------|-------|
| 1024×1024 | `public/icons/apple-touch-icon-1024.png` | App Store listing |
| 180×180 | `public/icons/apple-touch-icon.png` | iPhone home screen |
| 167×167 | `public/icons/apple-touch-icon-167.png` | iPad Pro |
| 152×152 | `public/icons/apple-touch-icon-152.png` | iPad |

**No alpha channel** on iOS icons. No rounded corners (OS applies them automatically).

### PWA / Browser

| Size | File | Usage |
|------|------|-------|
| 192×192 | `public/icons/icon-192.png` | Android Chrome install |
| 512×512 | `public/icons/icon-512.png` | Splash screen, install |
| 180×180 | `public/icons/apple-touch-icon.png` | iOS Safari add-to-homescreen |
| 32×32 | `public/favicon-32.png` | Browser tab |
| 16×16 | `public/favicon-16.png` | Browser tab (small) |
| any | `public/favicon.ico` | Legacy fallback |

---

## Splash Screens

### Android

Capacitor uses a drawable resource. Place in `android/app/src/main/res/`:
- `drawable/splash.png` — 2048×2048 (scales to all densities)
- Background: `#0a0a0f` (set in `capacitor.config.ts`)

Generate with: `@capacitor/assets` CLI tool:
```bash
npx @capacitor/assets generate --android
```

### iOS

iOS uses a LaunchScreen storyboard (included by Capacitor). Custom splash:
- Edit `ios/App/App/Assets.xcassets/Splash.imageset/`
- Required sizes: 2732×2048, 2208×2208, 1668×2224

Generate with:
```bash
npx @capacitor/assets generate --ios
```

---

## Screenshots (App Store)

Screenshots must show real app content. Capture on actual devices or simulators.

### Android (Google Play)

Minimum 2, maximum 8 per device type:

| Device | Resolution |
|--------|-----------|
| Phone | 1080×1920 minimum |
| 7" tablet | 1080×1920 minimum |
| 10" tablet | 1920×1200 minimum |

### iOS (App Store)

Required for at least 6.5" and 5.5" (or universal):

| Device | Required |
|--------|---------|
| 6.7" (iPhone 15 Pro Max) | Yes |
| 6.5" (iPhone 14 Plus) | Yes |
| 5.5" (iPhone 8 Plus) | Yes |
| 12.9" iPad Pro | If supporting iPad |

Recommended screenshots for ELBOLD:
1. **Home / Browse** — vendor cards with category filters
2. **Vendor Profile** — photos, reviews, packages, request quote button
3. **Event Planning** — create event wizard
4. **Dashboard** — event timeline with booked vendors
5. **Vendor Dashboard** — bookings and leads overview (for vendor listing)

---

## Store Listing Copy

### Short Description (80 chars max — Google Play)
```
Book DJs, caterers & photographers for any event. UK's trusted vendor marketplace.
```

### Full Description (4000 chars — Google Play / 4000 chars — App Store)

```
ELBOLD is the UK's premium event vendor marketplace. Whether you're planning a birthday bash, wedding reception, corporate event or intimate gathering — find and book verified vendors in minutes.

FIND THE PERFECT VENDORS
• Browse 100+ verified DJs, photographers, caterers, decorators and more
• Filter by category, location, price and availability
• Read verified reviews from real event hosts

PLAN YOUR EVENT
• Smart event planning wizard — tell us about your occasion, we'll handle the rest
• Manage multiple events from your personal dashboard
• Smart planning assistant gives personalised vendor recommendations

BOOK WITH CONFIDENCE
• Every vendor is identity-verified and reviewed
• Secure online payments with Stripe
• Messaging with vendors built right in
• Quotes and bookings tracked in one place

FOR VENDORS
• List your services and reach thousands of event planners
• Manage bookings, quotes and availability
• Get verified to stand out with trust badges
• Analytics dashboard to grow your business

Download ELBOLD today and start planning your extraordinary event.
```

### Keywords (100 chars — App Store)
```
event planner,DJ hire,party planning,wedding vendors,event booking,caterers,photographers UK
```

### Age Rating
- Google Play: **Everyone**
- App Store: **4+** (no objectionable content)

### Category
- Google Play: **Lifestyle**
- App Store: **Lifestyle** (primary), **Business** (secondary)

### Privacy Policy URL
`https://elbold.com/privacy`

### Support URL
`https://elbold.com/how-it-works`

### Marketing URL
`https://elbold.com`

---

## Checklist Before Submission

### Both stores
- [ ] All icon sizes generated and placed correctly
- [ ] Splash screens generated
- [ ] Screenshots captured (all required sizes)
- [ ] Store listing copy written and proofread
- [ ] Privacy policy published at elbold.com/privacy
- [ ] App tested on physical device (not just simulator)
- [ ] Push notifications tested end-to-end
- [ ] Deep links working correctly

### Google Play additional
- [ ] App signed with release keystore
- [ ] AAB (not APK) generated for upload
- [ ] Target API level is current (API 34+)
- [ ] Data safety form completed
- [ ] App content rating questionnaire completed

### App Store additional
- [ ] Bundle ID matches Apple Developer Portal
- [ ] Push notification entitlement enabled
- [ ] No private API usage
- [ ] App Store review guidelines checklist reviewed
- [ ] Export compliance answered (No encryption beyond standard HTTPS)
- [ ] `NSUserTrackingUsageDescription` added if using any tracking
