# In-App Purchases (StoreKit) — setup & testing

Premium **themes** are sold with real money via Apple StoreKit (no third-party
service, no extra fee). Plugin: `cordova-plugin-purchase`. Integration:
`www/iap.js` + the IAP bridge in `www/index.html`. Players can still unlock themes
with in-game **coins** as before — the real-money buttons are an alternative.

Two purchase types (both **Non-Consumable**):

| Product ID | Price | What it unlocks |
| --- | --- | --- |
| `com.captainnate.onemoreswing.themes.all` | **$4.99** | every premium theme **except Prism** |
| `com.captainnate.onemoreswing.theme.prism` | **$99.99** | Prism — ultra tier, real-money only, NOT in the bundle |
| `com.captainnate.onemoreswing.theme.space` | $0.99 | Deep Space |
| `com.captainnate.onemoreswing.theme.solar` | $0.99 | Solarpunk |
| `com.captainnate.onemoreswing.theme.biopunk` | $0.99 | Biopunk |
| `com.captainnate.onemoreswing.theme.kawaii` | $0.99 | Kawaii Pastel |
| `com.captainnate.onemoreswing.theme.vapor` | $0.99 | Vaporwave |
| `com.captainnate.onemoreswing.theme.twitch` | $0.99 | Streamer |
| `com.captainnate.onemoreswing.theme.y2k` | $0.99 | Y2K Glitch |
| `com.captainnate.onemoreswing.theme.synthwave` | $0.99 | Synthwave |
| `com.captainnate.onemoreswing.theme.cyber` | $0.99 | Cyberpunk |
| `com.captainnate.onemoreswing.theme.unicorn` | $0.99 | Unicorn |
| `com.captainnate.onemoreswing.theme.sman` | $0.99 | Velocity (mobile-exclusive) |
| `com.captainnate.onemoreswing.theme.bman` | $0.99 | Midnight Gold (mobile-exclusive) |
| `com.captainnate.onemoreswing.theme.joker` | $0.99 | Nightshade (mobile-exclusive) |
| `com.captainnate.onemoreswing.theme.harley` | $0.99 | Cotton Candy (mobile-exclusive) |
| `com.captainnate.onemoreswing.theme.dv` | $0.99 | Inferno (mobile-exclusive) |
| `com.captainnate.onemoreswing.theme.ls` | $0.99 | Glacier (mobile-exclusive) |
| `com.captainnate.onemoreswing.theme.juicer` | $0.99 | Juicer (streamer/creator theme) |

> Product IDs are derived in code from the premium themes in `COSMETICS.theme`
> (`<appId>.theme.<id>`, plus `<appId>.themes.all`). If you add a premium theme,
> create a matching `$0.99` product with the same ID pattern.

## Test locally first (no App Store Connect needed)
A ready-made StoreKit config lives at `storekit/OneMoreSwing.storekit`. Point Xcode
at it to buy in the Simulator with fake money:

1. `npx cap open ios`
2. **Product ▸ Scheme ▸ Edit Scheme… ▸ Run ▸ Options**
3. **StoreKit Configuration** → choose `OneMoreSwing.storekit`
   (if it's not listed: the file picker is relative to the project — add it via
   **File ▸ Add Files to "App"…**, selecting `../../storekit/OneMoreSwing.storekit`,
   then pick it in the scheme).
4. Run. Open the **Shop** → you'll see `$0.99` buttons and an **Unlock ALL themes
   $4.99** row; buying unlocks the theme(s). Manage/refund test purchases via
   **Debug ▸ StoreKit ▸ Manage Transactions** while running.

> The Xcode scheme lives in the (gitignored) `ios/` folder, so this StoreKit
> setting is per-machine — redo it after a fresh `npx cap add ios`.

## Go live (App Store Connect)
1. **Apple Developer Program** membership, and sign the **Paid Applications
   Agreement** (App Store Connect ▸ Business) — IAPs won't load until this is active.
2. App Store Connect ▸ your app ▸ **In-App Purchases** → create each product above
   as **Non-Consumable**, using the **exact** Product IDs and prices, with a name +
   description + screenshot. Submit them (they can be reviewed with the app build).
3. Tax/Banking info filled in under Business.
4. Test on a real device with a **Sandbox Apple ID** (App Store Connect ▸ Users and
   Access ▸ Sandbox) before release.

## Notes
- A **Restore purchases** button is in the shop (required by Apple for
  non-consumables). It calls `store.restorePurchases()`.
- The shop hides the Ko-fi link inside the app — external payment links for digital
  goods violate App Store rules. Keep purchases on StoreKit.
- No products created yet? The shop just shows coin prices — the app still works.
