# Paste this to Claude Code on the Mac

(Prereqs on the Mac: **Xcode**, **Node.js** — nodejs.org. CocoaPods can be
installed by Claude.)

---

I'm continuing a project from another machine. I have a **Capacitor** mobile
wrapper for my web game **"1 More Swing"** on GitHub:
`https://github.com/Captain-Nate/1moreswing-mobile`. I'm on a MacBook Pro and just
installed **Xcode** and **Node.js**. I want to build and run the **iOS** app on the
Simulator.

Please:
1. Clone `https://github.com/Captain-Nate/1moreswing-mobile` (or `cd` into it if I
   already cloned it) and read **README.md** for context.
2. Run `npm install`, then `npx cap add ios`, then `npx cap sync`. Install
   **CocoaPods** if it's missing.
3. Run `npx cap open ios` and walk me through building & running it on the **iOS
   Simulator** in Xcode (tell me exactly what to click).
4. Context: the game is `www/index.html` (a web canvas game); `www/mobile-ads.js`
   wires **AdMob** rewarded video into `window.OMS_showRewarded` (the "Continue ·
   Ad" revive) using Google **test** ad IDs (fine for now). App id is
   `com.captainnate.onemoreswing`. The leaderboard calls the live
   `https://1moreswing.com/api/*` backend, so no local server is needed.
5. We'll handle App Store signing / real AdMob IDs / StoreKit purchases later — for
   now just get it running on the Simulator.
