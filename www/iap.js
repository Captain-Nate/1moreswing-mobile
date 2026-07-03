/* iap.js — native StoreKit in-app purchases via cordova-plugin-purchase (v13).
 *
 * Loaded only inside Capacitor (see index.html). No third-party service: this talks
 * straight to Apple StoreKit. Products are NON-CONSUMABLE theme unlocks:
 *   com.captainnate.onemoreswing.theme.<id>   ($0.99 each)
 *   com.captainnate.onemoreswing.themes.all   ($2.99 — unlocks every theme)
 *
 * The game (index.html) provides window.OMS_IAP_CONFIG, window.OMS_applyEntitlement(),
 * and window.OMS_onIapUpdated(); this file exposes window.OMS_IAP for the shop UI.
 *
 * If the products don't exist yet (App Store Connect not set up, or no StoreKit test
 * config in the Xcode scheme), nothing loads and the shop simply shows coin prices —
 * the app still works. See IAP-SETUP.md.
 */
(function () {
  function init() {
    if (!window.CdvPurchase || !window.OMS_IAP_CONFIG) { setTimeout(init, 300); return; }

    var cfg = window.OMS_IAP_CONFIG;
    var CdvPurchase = window.CdvPurchase;
    var store = CdvPurchase.store;
    var APPLE = CdvPurchase.Platform.APPLE_APPSTORE;
    var NON_CONSUMABLE = CdvPurchase.ProductType.NON_CONSUMABLE;

    var productIds = [cfg.allProduct].concat(Object.keys(cfg.themeProducts));
    var pidForTheme = {};                                   // theme id -> productId
    Object.keys(cfg.themeProducts).forEach(function (pid) { pidForTheme[cfg.themeProducts[pid]] = pid; });

    store.verbosity = CdvPurchase.LogLevel.WARNING;
    store.register(productIds.map(function (id) {
      return { id: id, type: NON_CONSUMABLE, platform: APPLE };
    }));

    function priceOf(id) {
      var p = store.get(id, APPLE);
      var offer = p && p.getOffer && p.getOffer();
      var phase = offer && offer.pricingPhases && offer.pricingPhases[0];
      return phase ? phase.price : null;
    }
    function order(id) {
      var p = store.get(id, APPLE);
      var offer = p && p.getOffer && p.getOffer();
      if (offer) offer.order();
    }
    // Only grant a theme when its transaction is FINISHED (a genuinely completed purchase).
    // store.owned()/isOwned also returns true for an APPROVED-but-unfinished transaction, so polling
    // it mid-purchase would grant + persist a theme that the user then cancels. Gate strictly on FINISHED.
    function grantFinished() {
      var seen = {};
      (store.localReceipts || []).forEach(function (receipt) {
        (receipt.transactions || []).forEach(function (tx) {
          if (!tx || tx.state !== CdvPurchase.TransactionState.FINISHED || tx.isConsumed) return;
          (tx.products || []).forEach(function (p) {
            if (p && p.id && !seen[p.id]) { seen[p.id] = true; if (window.OMS_applyEntitlement) window.OMS_applyEntitlement(p.id); }
          });
        });
      });
    }
    function refresh() { grantFinished(); if (window.OMS_onIapUpdated) window.OMS_onIapUpdated(); }

    store.when()
      .productUpdated(function () { if (window.OMS_onIapUpdated) window.OMS_onIapUpdated(); })  // price/UI refresh only — never grant mid-flow
      .receiptUpdated(refresh)      // restore / launch entitlements surface here (FINISHED only, so cancelled/approved don't leak)
      .approved(function (t) { t.verify(); })
      .verified(function (r) { r.finish(); })
      .finished(refresh);           // a completed purchase reaches FINISHED here -> grant now
    store.error(function (e) { console.warn('[IAP]', (e && e.message) || e); });

    window.OMS_IAP = {
      get ready() { return productIds.some(function (id) { return !!priceOf(id); }); },
      priceForAll: function () { return priceOf(cfg.allProduct); },
      priceForTheme: function (themeId) { var pid = pidForTheme[themeId]; return pid ? priceOf(pid) : null; },
      buyTheme: function (themeId) { var pid = pidForTheme[themeId]; if (pid) order(pid); },
      buyAll: function () { order(cfg.allProduct); },
      restore: function () {
        var r = store.restorePurchases();
        if (r && r.then) r.then(refresh).catch(function () {});
      }
    };

    store.initialize([APPLE]).then(refresh).catch(function () {});
  }
  init();
})();
