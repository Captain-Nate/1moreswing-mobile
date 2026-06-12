# 1 More Swing — Mobile (Capacitor)

Native **iOS + Android** wrapper for the web game, from one shared codebase.

- `www/index.html` — the game (a copy of the live site, with the AdSense web tags
  removed since AdSense isn't allowed inside an app webview).
- `www/mobile-ads.js` — wires **AdMob** rewarded video into the game's
  `window.OMS_showRewarded` hook (the Free-Play "Continue · Ad" revive). Loaded
  automatically by index.html when running inside Capacitor.
- The leaderboard calls `https://1moreswing.com/api/*` (the live web backend) — no
  separate server needed for the app.

The native `android/` and `ios/` folders are **not committed** — each machine
generates its own with `npx cap add <platform>`.

## Common setup (any machine)
```
npm install
```

## Android  (Windows or Mac — needs Android Studio installed)
```
npx cap add android
npx cap sync
npx cap open android      # build / run in Android Studio
```
- Put your AdMob **App ID** in `android/app/src/main/AndroidManifest.xml`:
  `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-XXXX~YYYY"/>`

## iOS  (Mac only — needs Xcode + an Apple Developer account to publish)
```
npx cap add ios
npx cap sync
npx cap open ios          # build / run in Xcode
```
- Add `GADApplicationIdentifier` (your AdMob iOS App ID) + ATT keys to
  `ios/App/App/Info.plist`.

## AdMob ad units
Put your real **Rewarded** ad unit IDs in `www/mobile-ads.js` (it ships with
Google's test IDs). Set `isTesting: false` for production.

## Updating the game
When the web `index.html` changes, re-copy it into `www/` and delete the two
AdSense `<head>` lines (`google-adsense-account` meta + `adsbygoogle.js` script),
then `npx cap sync`.

> Apple/Google **require** digital purchases (premium themes) to use native
> in-app purchase (StoreKit / Play Billing) — not Stripe — in the app.
