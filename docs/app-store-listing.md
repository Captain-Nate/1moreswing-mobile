# App Store Connect — Listing copy + Privacy labels (DRAFT for review)

App: **1 More Swing** · Bundle ID `com.captainnate.onemoreswing`
Status: **copy + privacy finalized 2026-07-11.** AdMob App ID + iOS ad unit real & wired; ads = non-personalized; privacy labels decided (no tracking / no ATT / not linked); subtitle + keywords locked. Still pending (your side): marketing screenshots, age rating, flip `TESTING_ADS=false` for the release build, Archive + attach Fireworks IAP + submit.

---

## PART 1 — App Store listing copy

### Names & URLs
- **App Name** (≤30 chars): `1 More Swing`
- **Subtitle** (≤30 chars): `Daily one-button arcade` *(23)* — 3 distinct high-value terms (daily, one-button, arcade), none of which repeat the App Name, so Apple auto-indexes all of them for search.
  - alts: `Swing, fling & beat the daily` *(29)* · `One-button arcade, beat daily` *(29)* · `Swing far. Climb the ranks.`
- **Primary Category:** Games → **Arcade**
- **Secondary Category:** Games → Casual
- **Support URL:** `https://1moreswing.com/contact`
- **Marketing URL** (optional): `https://1moreswing.com`
- **Privacy Policy URL:** `https://1moreswing.com/privacy`
- **Age Rating:** likely **4+** (no objectionable content). NOTE: app shows ads — set the **AdMob ad content rating** (in AdMob console) to G/PG so ad content matches a low age rating. Answer Apple's rating questionnaire honestly (no violence/mature themes in the game itself).

### Promotional Text (≤170 chars, editable anytime without review)
```
Time your swings, chain your momentum, and fling as far as you can. A fresh daily challenge every day, a global leaderboard, and 30+ themes to unlock. Free to play.
```

### Keywords (≤100 chars, comma-separated, no spaces)
```
physics,leaderboard,casual,highscore,rope,grapple,timing,reflex,pendulum,addictive,hypercasual
```
*(94 chars — fits.)* ASO rule: words in the **App Name** + **Subtitle** are auto-indexed, so never repeat
them in keywords. With App Name "1 More Swing" + Subtitle "Daily one-button arcade", that means
`swing`, `daily`, `one-button`/`onebutton`, and `arcade` are already covered — so they're intentionally
**left out** of keywords. Dropped low-value `themes`; added high-intent casual terms `addictive` + `hypercasual`.
(If you revert the subtitle to a `swing…daily` variant, add `arcade` + `onebutton` back here.)

### Description (≤4000 chars)
```
One button. One perfect swing. How far can you fling?

1 More Swing is a fast, one-touch arcade game about timing. Grab an anchor, swing, and release at the right moment to launch yourself across the sky. Chain swings and skip anchors to build a bigger multiplier — then bank your points before you fall.

■ A NEW DAILY CHALLENGE, EVERY DAY
Everyone plays the exact same course each day. Post your score to the global leaderboard and see how you stack up. Come back daily to build your streak and earn bonus rewards.

■ EASY TO LEARN, HARD TO MASTER
One tap to grab, release to fly. Simple controls, deep skill ceiling — every point is banked or lost on your next move.

■ 30+ THEMES TO UNLOCK
Earn coins as you play and unlock a huge range of looks — from Deep Space and Liftoff to Synthwave, Cyberpunk, Kawaii Pastel, and more. Or grab your favorites instantly as a one-time purchase.

■ FREE TO PLAY
No account, no signup. Jump straight in.

Time it right. Just one more swing.
```

### What's New (version 1.0 notes)
```
First release! Swing, fling, and climb the daily leaderboard. Thanks for playing 🙏
```

### Assets still needed (not copy — capture later)
- [ ] App icon (already generated via `npm run assets`)
- [ ] iPhone screenshots (6.7" + 6.5" required sizes) — capture from device/simulator
- [ ] iPad screenshots (portrait) — app is portrait-locked
- [ ] (Optional) App preview video

---

## PART 2 — App Privacy ("nutrition labels")

**Does this app collect data? → YES** (driven mainly by AdMob + the leaderboard).

### A. AdMob (Google Mobile Ads) — NON-PERSONALIZED (decided 2026-07-11)
**We serve non-personalized ads only.** The app never requests ATT and never runs the UMP consent
flow, so on iOS the SDK has no IDFA → it serves non-personalized (contextual) ads. This keeps AdMob
**out of "tracking"** and means **no ATT prompt**. Still cross-check Google's official "AdMob and Apple's
App Privacy" disclosure guide, but expect to declare roughly:
- **Identifiers → Device ID** — Purpose: Third-Party Advertising — **Used to Track You: NO** (non-personalized)
- **Usage Data → Product Interaction** — Third-Party Advertising — Tracking: No
- **Diagnostics → Crash + Performance Data** — App Functionality/Analytics — Tracking: No
- **Location → Coarse Location** — verify against Google's guide (may or may not apply); Tracking: No

**No ATT prompt** — we don't request tracking (enforced in `www/mobile-ads.js`, see the comment there).
The unused `NSUserTrackingUsageDescription` string in Info.plist is harmless (only surfaces if you *request*
ATT, which we don't) — optional to remove.

### B. Leaderboard (our backend at 1moreswing.com)
The app sends a **player-chosen nickname + score + a random device-generated player ID**.
- **Identifiers → User ID** (the pseudonymous playerId) — Purpose: App Functionality — **Linked: No** — Tracking: No
- **User Content / Other Data** → nickname + score — App Functionality — **Linked: No** — Tracking: No
- Note: there's **no real identity** (no email/login/real name), so this is pseudonymous. Declared as **App Functionality, Not Linked, not used for tracking** (decided 2026-07-11).

### C. iCloud cloud save
Coins/themes/name stored in the user's **own iCloud key-value store** (Apple's `CloudSave`). This stays in the user's iCloud and is generally **NOT declared as developer data collection**. Leave out unless you also send it to your own server (you don't).

### D. Not collected
- No contact info, email, real name, health, financial, contacts, precise location, browsing/search history.
- No account system.

### Summary answers to have ready in App Store Connect
1. Collect data? **Yes** (AdMob + leaderboard)
2. Data used to **track**: **NO** — non-personalized ads, no ATT, no IDFA.
3. Data **linked** to user: none required (AdMob non-personalized data is not linked to identity; leaderboard ID/nickname — see decision below).
4. Data **not linked**: diagnostics/crash, usage/ad interaction, advertising Device ID.
5. ATT prompt required: **NO**.

---

### Decisions
- [x] **AdMob ads: NON-PERSONALIZED** (decided 2026-07-11) → no tracking, no ATT. Enforced in `www/mobile-ads.js`.
- [x] **Leaderboard data "linked": NO** (decided 2026-07-11) — account-less; a random device playerId + chosen nickname, no real identity = pseudonymous, not linked to a person.
- [ ] Final subtitle + keyword trim
- [ ] Confirm age rating after setting AdMob ad content rating
