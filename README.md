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

> **Heads-up — history was rewritten on 2026-06-13** (commit authorship cleaned
> up). If you have an **older clone** on another machine (e.g. the Windows PC for
> the Android build), don't `git push` from it — it carries the old commits and
> would re-introduce them. Either re-clone fresh, or sync the existing clone to
> the rewritten history:
> ```
> git fetch origin
> git reset --hard origin/main
> ```

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
- **Three iOS fixes are applied automatically** by `scripts/patch-ios.js` (wired to
  Capacitor's `add`/`sync` hooks in `package.json`), since the `ios/` folder is
  regenerated per-machine and these live inside it:
  1. Pins **GoogleUserMessagingPlatform** to `2.3.0` in the Podfile — CocoaPods
     otherwise pulls 3.x, which renamed an API and breaks the AdMob plugin build.
  2. Adds a **`GADApplicationIdentifier`** (Google's *test* App ID) + ATT key to
     `Info.plist` — without it the AdMob SDK crashes the app on launch.
  3. Locks **`UISupportedInterfaceOrientations`** to portrait only (iPhone + iPad) —
     the game is portrait-only.

  Before release, replace the **test** `GADApplicationIdentifier` in
  `scripts/patch-ios.js` with your real AdMob iOS App ID (`ca-app-pub-XXXX~YYYY`).
- CocoaPods setup on a fresh Mac: the system Ruby (2.6) is too old, so install via
  Homebrew (`brew install cocoapods`) and point the toolchain at the full Xcode
  app — `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- **Adding a new Capacitor plugin?** `npx cap sync` may print *"Skipping pod install
  because CocoaPods is not installed"* (Homebrew's `pod` isn't on its PATH) and the
  new pod won't be compiled. Install it manually from `ios/App`:
  `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 /opt/homebrew/bin/pod install`
  (the `LANG`/`LC_ALL` vars avoid a CocoaPods Unicode-normalization crash on newer Ruby).
- **App icon / splash:** the source art lives in `assets/` (`icon-only.png`,
  `splash.png`, `splash-dark.png` — a blue orb on the dark game background).
  Generated icons land in the per-machine `ios/`, so after `npx cap add ios` run
  `npm run assets` to (re)generate them. To change the icon, edit the `assets/`
  images directly, or re-run the generator: `swift scripts/icongen.swift`.

## AdMob ad units
Put your real **Rewarded** ad unit IDs in `www/mobile-ads.js` (it ships with
Google's test IDs). Set `isTesting: false` for production.

## In-app purchases (premium themes)
Premium themes are sold via native **StoreKit** (`cordova-plugin-purchase`):
$0.99 per theme or **$4.99 to unlock all**, with coins kept as a free alternative.
Integration is `www/iap.js` + the IAP bridge in `www/index.html`. **Setup, the exact
product IDs to create in App Store Connect, and how to test locally are in
[IAP-SETUP.md](IAP-SETUP.md).** Until the products exist, the shop just shows coin
prices.

## Updating the game
When the web `index.html` changes, re-copy it into `www/` and delete the two
AdSense `<head>` lines (`google-adsense-account` meta + `adsbygoogle.js` script),
then `npx cap sync`.

> **Don't clobber the mobile-only changes in `www/index.html`** — a web→mobile
> re-copy will wipe these; fold them into the live-site source or re-apply them:
> - **Safe-area handling** so the HUD clears the notch / Dynamic Island / home
>   indicator: `viewport-fit=cover`, `env(safe-area-inset-*)` offsets on the DOM
>   HUD (`#title`/`#ui`/`#hint`), and a JS `safeProbe` whose insets
>   (`SAFE_TOP`/`SAFE_BOTTOM`/`SAFE_LEFT`/`SAFE_RIGHT`) shift the canvas HUD.
> - **Title screen** (`#titleScreen` + `titleOpen`): tap **Play** to start; the
>   pause overlay's **Menu** button (`#toTitleBtn`) returns here. **About/Privacy**
>   open in-app pages (`#info` modal); the content lives in the `INFO` object in
>   the script and is written for the *app* (AdMob/ATT, on-device save, leaderboard
>   data) — edit those strings to change the copy.
> - **No `Co-Authored-By` trailer** and assorted feel tweaks (restart into the
>   looping ready-state, multiplier placement, long-press loupe disabled).
> - **Shop real-money buttons + Restore + hidden Ko-fi** (IAP bridge, `renderShop`).

> Apple/Google **require** digital purchases (premium themes) to use native
> in-app purchase (StoreKit / Play Billing) — not Stripe. Done on iOS — see
> [IAP-SETUP.md](IAP-SETUP.md). (Android Play Billing still TODO.)
