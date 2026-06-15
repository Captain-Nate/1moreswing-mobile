#!/usr/bin/env node
/*
 * patch-ios.js — re-applies local-only iOS fixes after the (gitignored) ios/
 * folder is (re)generated. Runs automatically via Capacitor's npm hooks
 * (capacitor:sync:before / capacitor:add:after) — see package.json.
 *
 * Two fixes, both idempotent (safe to run repeatedly):
 *  1. Pin GoogleUserMessagingPlatform to 2.x in the Podfile. CocoaPods otherwise
 *     resolves 3.x, which renamed UMPConsentStatus -> ConsentStatus and breaks
 *     @capacitor-community/admob@6.x at compile time.
 *  2. Add GADApplicationIdentifier (+ ATT usage string) to Info.plist. The AdMob
 *     SDK throws GADInvalidInitializationException on launch without it.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const podfile = path.join(root, 'ios', 'App', 'Podfile');
const podlock = path.join(root, 'ios', 'App', 'Podfile.lock');
const plist = path.join(root, 'ios', 'App', 'App', 'Info.plist');
const storekitSrc = path.join(root, 'storekit', 'OneMoreSwing.storekit');   // source of truth (committed)
const storekitDst = path.join(root, 'ios', 'App', 'OneMoreSwing.storekit');  // copy the Xcode scheme references

const UMP_VERSION = '2.3.0';
// Google's official AdMob *test* App ID for iOS. Replace with your real
// ca-app-pub-XXXX~YYYY (and set isTesting:false in www/mobile-ads.js) for release.
const ADMOB_TEST_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

function patchPodfile() {
  if (!fs.existsSync(podfile)) return; // ios/ not generated yet
  let src = fs.readFileSync(podfile, 'utf8');
  if (src.includes('GoogleUserMessagingPlatform')) return; // already pinned

  const pin =
    "  # Pin UMP SDK to 2.x — admob plugin 6.x uses the old UMPConsentStatus API,\n" +
    "  # renamed in GoogleUserMessagingPlatform 3.0. (auto-applied by scripts/patch-ios.js)\n" +
    `  pod 'GoogleUserMessagingPlatform', '${UMP_VERSION}'\n`;

  // Insert right after `capacitor_pods` inside the app target.
  src = src.replace(/(\n\s*capacitor_pods\n)/, `$1${pin}`);
  fs.writeFileSync(podfile, src);

  // The lockfile may pin a conflicting 3.x; drop it so pod install re-resolves
  // cleanly against the new constraint.
  if (fs.existsSync(podlock)) fs.rmSync(podlock);
  console.log(`[patch-ios] Pinned GoogleUserMessagingPlatform to ${UMP_VERSION}.`);
}

function patchInfoPlist() {
  if (!fs.existsSync(plist)) return;
  let src = fs.readFileSync(plist, 'utf8');
  const before = src;

  // 1. AdMob App ID (+ ATT key) — once
  if (!src.includes('GADApplicationIdentifier')) {
    const keys =
      "\t<!-- Google AdMob App ID — TEST id; replace with your real ca-app-pub-XXXX~YYYY before release. (auto-applied by scripts/patch-ios.js) -->\n" +
      "\t<key>GADApplicationIdentifier</key>\n" +
      `\t<string>${ADMOB_TEST_APP_ID}</string>\n` +
      "\t<key>NSUserTrackingUsageDescription</key>\n" +
      "\t<string>This identifier will be used to deliver personalized ads to you.</string>\n";
    src = src.replace(/(<dict>\n)/, `$1${keys}`); // insert after the opening <dict>
  }

  // 2. Lock orientation to portrait (iPhone + iPad) — the game is portrait-only
  src = src.replace(
    /(<key>UISupportedInterfaceOrientations(?:~ipad)?<\/key>\s*<array>)[\s\S]*?(<\/array>)/g,
    '$1\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t$2'
  );

  if (src !== before) {
    fs.writeFileSync(plist, src);
    console.log('[patch-ios] Info.plist: AdMob id + portrait-only orientation.');
  }
}

// Keep the StoreKit test config the Xcode scheme references in sync with the
// committed source (storekit/OneMoreSwing.storekit), so new IAP products show up
// for local testing without manually re-copying.
function syncStoreKit() {
  if (!fs.existsSync(storekitSrc)) return;
  if (!fs.existsSync(path.dirname(storekitDst))) return;   // ios/ not generated yet
  const src = fs.readFileSync(storekitSrc, 'utf8');
  if (!fs.existsSync(storekitDst) || fs.readFileSync(storekitDst, 'utf8') !== src) {
    fs.writeFileSync(storekitDst, src);
    console.log('[patch-ios] Synced StoreKit config to ios/App/OneMoreSwing.storekit.');
  }
}

patchPodfile();
patchInfoPlist();
syncStoreKit();
