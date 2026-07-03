# iOS Sandbox IAP Testing — checklist

Goal: verify a real StoreKit purchase + **Restore Purchases** round-trip against Apple's
sandbox (not the local .storekit file), before submitting. Themes are non-consumable.

## Prerequisites
- [x] 30 IAP products created in App Store Connect (done earlier — "Ready to Submit" is enough for sandbox)
- [ ] **Paid Applications agreement = Active** (App Store Connect → Business). ⚠️ If not signed, sandbox products silently won't load — you'll think the code is broken. Check this FIRST.
- Economy/build already synced: `www/index.html` → `ios/App/App/public` is current; pods installed clean.

## Steps
1. **Create a sandbox tester** — App Store Connect → *Users and Access → Sandbox → Test Accounts → +*. Use a throwaway email (doesn't need to be real/verified, must not collide with an existing Apple ID). Save the email + password.
2. **Detach the local StoreKit config in Xcode** — Product → Scheme → Edit Scheme → Run → Options → **StoreKit Configuration → None**. (It currently points at `OneMoreSwing.storekit`, which intercepts everything locally and never reaches sandbox.)
3. **Build to a REAL device** (plug in iPhone, select it, Run). Sandbox is most reliable on hardware, and you need it for the restore test.
4. **Sign into the sandbox account on the device** — Settings → Developer → **Sandbox Apple Account** → sign in with the tester from step 1. (If "Developer" isn't there yet, it appears after running a dev build once; otherwise you'll be prompted at purchase — sign in there, NOT with your real Apple ID.)
5. **Test the flows in the app's Shop:**
   - [ ] **Buy a single theme** (e.g. Liftoff $0.99) → sandbox purchase sheet appears, completes, theme unlocks (`OMS_applyEntitlement` fires, `renderShop` updates).
   - [ ] **Buy "Unlock All"** ($7.99) → grants the bundle themes, but NOT `prism` (ultra) or the seasonal themes (bundle excludes ultra + seasonal by design).
   - [ ] **Restore Purchases** → delete + reinstall the app, tap Restore, confirm the unlocks come back. This is the big one for non-consumables.

## After testing
- **Set the scheme StoreKit Configuration back to `OneMoreSwing.storekit`** for fast local dev iteration.
- Do NOT leave the real Apple ID signed into the sandbox slot.

## Reference (where the code lives)
- `www/iap.js` (cordova-plugin-purchase / StoreKit bridge) exposes `window.OMS_IAP` (buyTheme/buyAll/restore/prices).
- `www/index.html`: `OMS_IAP_CONFIG` (productId→theme map), `OMS_applyEntitlement(productId)`, `OMS_onIapUpdated()`. Product IDs: `com.captainnate.onemoreswing.theme.<id>` + `...themes.all`. Full list in `docs/iap-products.md`. See also `IAP-SETUP.md`.
- Still on Google **test** ad IDs / `TESTING_ADS=true` — that's fine for IAP sandbox testing; flip ads to real only for the release build.
