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
const appSwiftDir  = path.join(root, 'ios', 'App', 'App');
const storyboard   = path.join(root, 'ios', 'App', 'App', 'Base.lproj', 'Main.storyboard');
const entitlements = path.join(root, 'ios', 'App', 'App', 'App.entitlements');
const pbxproj      = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

const UMP_VERSION = '2.3.0';
// Real AdMob App ID for iOS (1 More Swing). Ad serving is still gated by the
// TESTING_ADS flag in www/mobile-ads.js until the App Store release build.
const ADMOB_APP_ID = 'ca-app-pub-4322452976770818~6029978450';

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
      "\t<!-- Google AdMob App ID (real, 1 More Swing). (auto-applied by scripts/patch-ios.js) -->\n" +
      "\t<key>GADApplicationIdentifier</key>\n" +
      `\t<string>${ADMOB_APP_ID}</string>\n` +
      "\t<key>NSUserTrackingUsageDescription</key>\n" +
      "\t<string>This identifier will be used to deliver personalized ads to you.</string>\n";
    src = src.replace(/(<dict>\n)/, `$1${keys}`); // insert after the opening <dict>
  }

  // 2. Lock orientation to portrait (iPhone + iPad) — the game is portrait-only
  src = src.replace(
    /(<key>UISupportedInterfaceOrientations(?:~ipad)?<\/key>\s*<array>)[\s\S]*?(<\/array>)/g,
    '$1\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t$2'
  );

  // 3. Portrait-only iPad apps must opt OUT of iPad multitasking (Split View), or App Store
  // upload fails with "Invalid bundle … include all orientations to support iPad multitasking".
  if (!src.includes('UIRequiresFullScreen')) {
    src = src.replace(
      /(<key>UISupportedInterfaceOrientations<\/key>)/,
      '<key>UIRequiresFullScreen</key>\n\t<true/>\n\t$1'
    );
  }

  // 4. Only standard OS encryption (HTTPS) is used — auto-answer export compliance so every
  // uploaded build skips the "Missing Compliance" manage step in App Store Connect.
  if (!src.includes('ITSAppUsesNonExemptEncryption')) {
    src = src.replace(
      /(<key>UIRequiresFullScreen<\/key>)/,
      '<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n\t$1'
    );
  }

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

// ── Cloud save: iCloud Key-Value Store ──────────────────────────────────────
// Creates a tiny Capacitor plugin (CloudSavePlugin.swift) that wraps
// NSUbiquitousKeyValueStore, a MainViewController subclass to register it,
// patches Main.storyboard to use that subclass, and adds the iCloud KV
// entitlement so signed builds can access iCloud.

function createCloudSavePlugin() {
  if (!fs.existsSync(appSwiftDir)) return;
  const dst = path.join(appSwiftDir, 'CloudSavePlugin.swift');
  if (fs.existsSync(dst)) return;
  fs.writeFileSync(dst,
`import Foundation
import Capacitor

@objc(CloudSavePlugin)
public class CloudSavePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CloudSavePlugin"
    public let jsName = "CloudSave"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
    ]

    override public func load() {
        // iCloud KV downloads asynchronously — a fresh install's first read almost
        // always precedes the value landing. Kick a sync at launch and notify JS when
        // cloud data actually arrives so it can re-merge (otherwise reinstalls restore nothing).
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(cloudChanged(_:)),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: NSUbiquitousKeyValueStore.default)
        NSUbiquitousKeyValueStore.default.synchronize()
    }

    @objc func cloudChanged(_ note: Notification) {
        notifyListeners("cloudChanged", data: [:])
    }

    @objc func get(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? ""
        guard !key.isEmpty else { call.reject("key required"); return }
        NSUbiquitousKeyValueStore.default.synchronize()
        let val = NSUbiquitousKeyValueStore.default.string(forKey: key)
        call.resolve(["value": val as Any])
    }

    @objc func set(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? ""
        guard !key.isEmpty else { call.reject("key required"); return }
        let val = call.getString("value") ?? ""
        if val.isEmpty {
            NSUbiquitousKeyValueStore.default.removeObject(forKey: key)
        } else {
            NSUbiquitousKeyValueStore.default.set(val, forKey: key)
        }
        NSUbiquitousKeyValueStore.default.synchronize()
        call.resolve()
    }
}
`);
  console.log('[patch-ios] Created CloudSavePlugin.swift (iCloud KV Store).');
}

// Creates a tiny Capacitor plugin (AudioSessionPlugin.swift) that reactivates the
// shared AVAudioSession. AdMob rewarded video (and the StoreKit purchase sheet)
// deactivate the app's audio session; the WebAudio context stays 'running' but goes
// silent until the session is reactivated. JS calls AudioSession.reactivate() after ads.
function createAudioSessionPlugin() {
  if (!fs.existsSync(appSwiftDir)) return;
  const dst = path.join(appSwiftDir, 'AudioSessionPlugin.swift');
  if (fs.existsSync(dst)) return;
  fs.writeFileSync(dst,
`import Foundation
import Capacitor
import AVFoundation

@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioSessionPlugin"
    public let jsName = "AudioSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "reactivate", returnType: CAPPluginReturnPromise),
    ]

    // AdMob (and the StoreKit sheet) deactivate the session, and AdMob tears it down
    // asynchronously AFTER the ad dismisses — so reactivate now and again a few times over ~1s
    // to win the race. .ambient keeps respecting the silent switch and mixes with other audio.
    @objc func reactivate(_ call: CAPPluginCall) {
        activateSession()
        for delay in [0.2, 0.5, 1.0] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { self.activateSession() }
        }
        call.resolve()
    }

    private func activateSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.ambient, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {}
    }
}
`);
  console.log('[patch-ios] Created AudioSessionPlugin.swift.');
}

// Register AudioSessionPlugin in an existing MainViewController.swift (created before this plugin existed).
function ensureAudioSessionRegistered() {
  const dst = path.join(appSwiftDir, 'MainViewController.swift');
  if (!fs.existsSync(dst)) return;
  let src = fs.readFileSync(dst, 'utf8');
  if (src.includes('AudioSessionPlugin')) return;
  src = src.replace(
    'bridge?.registerPluginInstance(CloudSavePlugin())',
    'bridge?.registerPluginInstance(CloudSavePlugin())\n        bridge?.registerPluginInstance(AudioSessionPlugin())'
  );
  fs.writeFileSync(dst, src);
  console.log('[patch-ios] MainViewController.swift: registered AudioSessionPlugin.');
}

// Add AudioSessionPlugin.swift to the Xcode build (idempotent; separate from the CloudSave add).
function addAudioSessionToPbxproj() {
  if (!fs.existsSync(pbxproj)) return;
  let pb = fs.readFileSync(pbxproj, 'utf8');
  if (pb.includes('AudioSessionPlugin.swift')) return;
  const ref = 'A1B2C3D4E5F60005AABBCCDD', build = 'A1B2C3D4E5F60006AABBCCDD';
  pb = pb.replace('/* End PBXBuildFile section */',
    `\t\t${build} /* AudioSessionPlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${ref} /* AudioSessionPlugin.swift */; };\n/* End PBXBuildFile section */`);
  pb = pb.replace('/* End PBXFileReference section */',
    `\t\t${ref} /* AudioSessionPlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AudioSessionPlugin.swift; sourceTree = "<group>"; };\n/* End PBXFileReference section */`);
  pb = pb.replace('504EC3071FED79650016851F /* AppDelegate.swift */,',
    `504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\t${ref} /* AudioSessionPlugin.swift */,`);
  pb = pb.replace('504EC3081FED79650016851F /* AppDelegate.swift in Sources */,',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\t${build} /* AudioSessionPlugin.swift in Sources */,`);
  fs.writeFileSync(pbxproj, pb);
  console.log('[patch-ios] pbxproj: added AudioSessionPlugin.swift to build.');
}

function createMainViewController() {
  if (!fs.existsSync(appSwiftDir)) return;
  const dst = path.join(appSwiftDir, 'MainViewController.swift');
  if (fs.existsSync(dst)) return;
  fs.writeFileSync(dst,
`import Capacitor

// Subclass of CAPBridgeViewController used to register local Capacitor plugins.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CloudSavePlugin())
        bridge?.registerPluginInstance(AudioSessionPlugin())
    }
}
`);
  console.log('[patch-ios] Created MainViewController.swift.');
}

function patchStoryboard() {
  if (!fs.existsSync(storyboard)) return;
  let src = fs.readFileSync(storyboard, 'utf8');
  if (src.includes('MainViewController')) return;
  src = src.replace(
    'customClass="CAPBridgeViewController" customModule="Capacitor"',
    'customClass="MainViewController" customModule="App"'
  );
  fs.writeFileSync(storyboard, src);
  console.log('[patch-ios] Main.storyboard: switched root VC to MainViewController.');
}

function patchEntitlements() {
  if (!fs.existsSync(appSwiftDir)) return;

  // Create App.entitlements if missing
  if (!fs.existsSync(entitlements)) {
    fs.writeFileSync(entitlements,
`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.developer.ubiquity-kvstore-identifier</key>
\t<string>$(TeamIdentifierPrefix)$(CFBundleIdentifier)</string>
</dict>
</plist>
`);
    console.log('[patch-ios] Created App.entitlements with iCloud KV entitlement.');
  }

  // Wire the entitlements file into the App target's build settings
  if (!fs.existsSync(pbxproj)) return;
  let pb = fs.readFileSync(pbxproj, 'utf8');
  if (pb.includes('CODE_SIGN_ENTITLEMENTS')) return;
  pb = pb.replace(
    /PRODUCT_BUNDLE_IDENTIFIER = com\.captainnate\.onemoreswing;/g,
    'PRODUCT_BUNDLE_IDENTIFIER = com.captainnate.onemoreswing;\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;'
  );
  fs.writeFileSync(pbxproj, pb);
  console.log('[patch-ios] pbxproj: added CODE_SIGN_ENTITLEMENTS for App target.');
}

// Add CloudSavePlugin.swift + MainViewController.swift to the Xcode project's
// build phase so Xcode actually compiles them (just copying files to the
// directory isn't enough — they must appear in the pbxproj).
function addSwiftFilesToPbxproj() {
  if (!fs.existsSync(pbxproj)) return;
  let pb = fs.readFileSync(pbxproj, 'utf8');
  if (pb.includes('CloudSavePlugin.swift')) return; // already done

  // Stable UUIDs for the two new files (24 uppercase hex chars each, Xcode format)
  const pluginRef   = 'A1B2C3D4E5F60001AABBCCDD';
  const vcRef       = 'A1B2C3D4E5F60002AABBCCDD';
  const pluginBuild = 'A1B2C3D4E5F60003AABBCCDD';
  const vcBuild     = 'A1B2C3D4E5F60004AABBCCDD';

  // PBXBuildFile entries
  pb = pb.replace(
    '/* End PBXBuildFile section */',
    `\t\t${pluginBuild} /* CloudSavePlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${pluginRef} /* CloudSavePlugin.swift */; };\n` +
    `\t\t${vcBuild} /* MainViewController.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${vcRef} /* MainViewController.swift */; };\n` +
    '/* End PBXBuildFile section */'
  );

  // PBXFileReference entries
  pb = pb.replace(
    '/* End PBXFileReference section */',
    `\t\t${pluginRef} /* CloudSavePlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = CloudSavePlugin.swift; sourceTree = "<group>"; };\n` +
    `\t\t${vcRef} /* MainViewController.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MainViewController.swift; sourceTree = "<group>"; };\n` +
    '/* End PBXFileReference section */'
  );

  // Add to App group (alongside AppDelegate.swift)
  pb = pb.replace(
    '504EC3071FED79650016851F /* AppDelegate.swift */,',
    `504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\t${pluginRef} /* CloudSavePlugin.swift */,\n\t\t\t\t${vcRef} /* MainViewController.swift */,`
  );

  // Add to Sources build phase
  pb = pb.replace(
    '504EC3081FED79650016851F /* AppDelegate.swift in Sources */,',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\t${pluginBuild} /* CloudSavePlugin.swift in Sources */,\n\t\t\t\t${vcBuild} /* MainViewController.swift in Sources */,`
  );

  fs.writeFileSync(pbxproj, pb);
  console.log('[patch-ios] pbxproj: added CloudSavePlugin.swift + MainViewController.swift to build.');
}

patchPodfile();
patchInfoPlist();
syncStoreKit();
createCloudSavePlugin();
createAudioSessionPlugin();
createMainViewController();
ensureAudioSessionRegistered();
patchStoryboard();
patchEntitlements();
addSwiftFilesToPbxproj();
addAudioSessionToPbxproj();
