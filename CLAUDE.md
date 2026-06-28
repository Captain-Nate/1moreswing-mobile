# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Native **iOS + Android** wrapper (Capacitor 6) for the *1 More Swing* web game. There is **no app-specific game logic server-side here** — the entire game is a single self-contained `www/index.html` (~2,500 lines, HTML + canvas + inline JS), copied from the live site at `https://1moreswing.com`. The leaderboard talks to the live web backend (`https://1moreswing.com/api/*`); this repo ships no server. The companion web repo lives at `~/Desktop/1moreswing_web`.

`www/index.html` is the **same file** that runs on the web — it branches at runtime on `window.Capacitor` to enable native features. Most "mobile" behavior is therefore conditional code *inside* the shared web file, not separate mobile files.

## Commands

```
npm install              # deps (run after every fresh clone)
npx cap sync             # copy www/ into native projects + install plugins (run after editing www/)
npx cap add ios          # generate the per-machine ios/ folder (Mac only)
npx cap add android      # generate the per-machine android/ folder
npx cap open ios         # build/run in Xcode
npx cap open android     # build/run in Android Studio
npm run assets           # regenerate app icons/splash into ios/ from assets/ (after cap add ios)
npm run patch:ios        # manually re-apply the iOS fixes (normally automatic, see below)
```

There is **no test suite, linter, or build step** beyond Capacitor's sync. "Building" = open in Xcode/Android Studio and run.

## Critical: `ios/` and `android/` are NOT committed

`.gitignore` excludes both — each machine regenerates them with `npx cap add <platform>`. Anything that must live inside those folders has to be re-applied programmatically, which is why `scripts/patch-ios.js` exists (wired to Capacitor's `add`/`sync` hooks in `package.json`). It auto-applies three iOS fixes that would otherwise be lost on every regenerate:
1. Pins **GoogleUserMessagingPlatform to 2.3.0** in the Podfile (3.x breaks the AdMob plugin build).
2. Adds `GADApplicationIdentifier` + ATT key to `Info.plist` (missing → AdMob SDK crashes on launch). Currently Google's **test** App ID — must be swapped for the real one before release.
3. Locks orientation to **portrait only** (iPhone + iPad).

If you need native-side config to persist, add it to `patch-ios.js`, don't just edit `ios/` by hand.

## Architecture: the web ↔ native bridge

`www/index.html` loads the two native glue scripts **only when `window.Capacitor` exists** (see the loader near line 362). On the web these are no-ops. The contract between the shared game and native is a set of `window.OMS_*` globals:

- **Ads** — `www/mobile-ads.js` defines `window.OMS_showRewarded()` (returns a Promise<bool>) backed by AdMob rewarded video. The game calls it for the Free-Play "Continue · Ad" revive. Ships with Google **test** ad unit IDs (`isTesting: true`) — replace for production.
- **In-app purchases** — `www/iap.js` (cordova-plugin-purchase / StoreKit). The game provides `window.OMS_IAP_CONFIG`, `OMS_applyEntitlement(productId)`, `OMS_onIapUpdated()`; iap.js exposes `window.OMS_IAP` (`buyTheme`/`buyAll`/`restore`/prices) consumed by `renderShop()`. Products are **non-consumable** theme unlocks; if products aren't configured the shop silently falls back to coin prices and the app still works. Full setup + product IDs: [IAP-SETUP.md](IAP-SETUP.md).
- **Cloud save** — a custom native `CloudSave` plugin is registered via `Capacitor.registerPlugin('CloudSave')` (index.html ~line 363); persists coins/themes/name across reinstalls.
- **Other plugins** — `@capacitor/local-notifications` (6pm daily reminder), `@capacitor/app` (Android back-button exit, app-state listeners).

`PLATFORM = window.Capacitor ? 'mobile' : 'web'` (index.html ~line 1660) drives **separate leaderboards** for web vs. app.

## Updating the game from the web

When the web `index.html` changes, re-copy it into `www/`, **delete the two AdSense `<head>` lines** (AdSense is disallowed in a webview), then `npx cap sync`. A naive re-copy will **clobber mobile-only edits** living in `www/index.html` — preserve or re-apply them (full list in README.md "Updating the game"):
- Safe-area handling (`viewport-fit=cover`, `env(safe-area-inset-*)`, the `safeProbe` insets for notch/Dynamic Island/home indicator).
- Title screen (`#titleScreen`, `titleOpen`, `#toTitleBtn`).
- Shop real-money buttons + Restore + hidden Ko-fi link (web-only Ko-fi shown when `!window.Capacitor`).
- The native plugin loader and all `OMS_*` bridge functions.

## Toolchain gotchas (Mac/iOS)

- System Ruby (2.6) is too old for CocoaPods — install via Homebrew (`brew install cocoapods`) and `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- After adding a new plugin, `npx cap sync` may say *"Skipping pod install because CocoaPods is not installed"* (Homebrew's `pod` isn't on its PATH). Install manually from `ios/App`:
  `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 /opt/homebrew/bin/pod install` (the LANG vars avoid a CocoaPods Unicode crash on newer Ruby).

## Conventions

- Git history was rewritten on 2026-06-13 to clean up commit authorship — don't push from stale clones (re-clone or `git reset --hard origin/main`). Commits are authored by Captain-Nate with **no `Co-Authored-By` trailer**.
- App identity: `appId` `com.captainnate.onemoreswing`, `appName` "1 More Swing" (`capacitor.config.json`).
