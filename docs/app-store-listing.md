# App Store Connect — Listing copy + Privacy labels (DRAFT for review)

App: **1 More Swing** · Bundle ID `com.captainnate.onemoreswing`
Status: draft, to review before submission. Screenshots + final AdMob swap still pending.

---

## PART 1 — App Store listing copy

### Names & URLs
- **App Name** (≤30 chars): `1 More Swing`
- **Subtitle** (≤30 chars): `Swing, fling & beat the daily` *(29)*
  - alts: `One-button swing arcade` · `Swing far. Climb the ranks.`
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
swing,fling,arcade,physics,onebutton,daily,leaderboard,casual,highscore,rope,grapple,skill,streak,themes
```
*(review/trim to fit 100 including commas; drop lowest-value ones if over.)*

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

### A. AdMob (Google Mobile Ads) — the big one
The rewarded-ad SDK collects data. ⚠️ **Do not free-hand this** — use **Google's official "AdMob and Apple's App Privacy" disclosure guide** for the exact list of data types/purposes to check; Google maintains the authoritative mapping. Expect to declare roughly:
- **Identifiers → Device ID** (advertising identifier) — Purpose: Third-Party Advertising — **Used to Track You: YES**
- **Usage Data → Product Interaction** — Advertising / Analytics — Tracking: Yes
- **Diagnostics → Crash + Performance Data** — App Functionality/Analytics — Tracking: No
- **Location → Coarse Location** — verify against Google's guide (may or may not apply)

Because AdMob personalized ads = **tracking**, you MUST show the **ATT prompt** (already wired: `NSUserTrackingUsageDescription` in patch-ios). 
- **Simplification option:** if you configure AdMob for **non-personalized ads only**, you can avoid the "tracking" declaration + ATT — at the cost of some ad revenue. Decide before submission.

### B. Leaderboard (our backend at 1moreswing.com)
The app sends a **player-chosen nickname + score + a random device-generated player ID**.
- **Identifiers → User ID** (the pseudonymous playerId) — Purpose: App Functionality — Linked: see note — Tracking: No
- **User Content / Other Data** → nickname + score — App Functionality — Tracking: No
- Note: there's **no real identity** (no email/login/real name), so this is pseudonymous. Reasonable to declare as **App Functionality, not used for tracking**. "Linked to you" is arguable — conservative answer is Yes (persistent ID); many account-less games say No. Pick and be consistent.

### C. iCloud cloud save
Coins/themes/name stored in the user's **own iCloud key-value store** (Apple's `CloudSave`). This stays in the user's iCloud and is generally **NOT declared as developer data collection**. Leave out unless you also send it to your own server (you don't).

### D. Not collected
- No contact info, email, real name, health, financial, contacts, precise location, browsing/search history.
- No account system.

### Summary answers to have ready in App Store Connect
1. Collect data? **Yes**
2. Data used to **track**: **Yes** (AdMob device ID / ad data) — *unless* you switch to non-personalized ads.
3. Data **linked** to user: AdMob advertising data; (leaderboard ID/nickname — your call).
4. Data **not linked**: diagnostics/crash, usage data.
5. ATT prompt required: **Yes** (already implemented).

---

### Open decisions for tomorrow's review
- [ ] Personalized vs non-personalized AdMob ads (drives the whole "tracking" + ATT story)
- [ ] Leaderboard data: declare "linked" Yes or No
- [ ] Final subtitle + keyword trim
- [ ] Confirm age rating after setting AdMob ad content rating
