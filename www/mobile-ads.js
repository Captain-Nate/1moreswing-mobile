/* mobile-ads.js — loaded only inside the Capacitor app (index.html loads it when
   window.Capacitor exists). Wires AdMob rewarded video into the game's
   window.OMS_showRewarded hook so the Free-Play "Continue · Ad" revive works.
   Requires: npm i @capacitor-community/admob ; npx cap sync.
   Verify event/method names against your installed plugin version's docs. */
(async function () {
  if (!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob)) return;
  const { AdMob } = window.Capacitor.Plugins;
  const platform = window.Capacitor.getPlatform();

  // Flip to false ONLY for the App Store release build. Kept true during development
  // so your own device sees TEST ads — never click live ads on your own AdMob account.
  const TESTING_ADS = false;

  const REWARDED = {
    ios:     'ca-app-pub-4322452976770818/4305833249',   // real iOS rewarded unit
    android: 'ca-app-pub-3940256099942544/5224354917',   // TODO: real Android unit when Android ships (Google TEST id for now)
  };
  const adId = REWARDED[platform] || REWARDED.android;

  // ── Ads are NON-PERSONALIZED by design (privacy decision 2026-07-11) ──
  // We deliberately never call AdMob.requestTrackingAuthorization() or run the UMP consent
  // flow. On iOS, with no ATT authorization the SDK has no IDFA, so it serves non-personalized
  // (contextual) ads → no cross-app "tracking", no ATT prompt, and a clean App Store privacy
  // label ("Data not used to track you"). Do NOT add an ATT / personalized-ads request without
  // revisiting the privacy nutrition labels. (Android, when it ships, has no ATT — it'll need
  // UMP consent or npa=1 to stay non-personalized there.)
  try { await AdMob.initialize({ initializeForTesting: TESTING_ADS }); } catch (e) {}

  // ── Preload + readiness ───────────────────────────────────────────────────
  // Keep one rewarded ad loaded ahead of time and expose OMS_rewardedReady() so the
  // game only offers "Continue · Ad" when an ad is actually available — no dead button
  // on no-fill. After each ad shows we preload the next one; a failed load retries later.
  let ready = false, loading = false, rewarded = false;
  const RETRY_MS = 30000;

  async function loadAd(){
    if (ready || loading) return;
    loading = true;
    try { await AdMob.prepareRewardVideoAd({ adId, isTesting: TESTING_ADS }); }
    catch (e) { loading = false; ready = false; setTimeout(loadAd, RETRY_MS); }
  }

  await AdMob.addListener('onRewardedVideoAdLoaded', () => {
    ready = true; loading = false;
    try { if (window.OMS_onRewardedReady) window.OMS_onRewardedReady(); } catch (e) {}   // let the game reveal the button
  });
  await AdMob.addListener('onRewardedVideoAdFailedToLoad', () => {
    ready = false; loading = false; setTimeout(loadAd, RETRY_MS);   // e.g. no-fill — try again later
  });
  await AdMob.addListener('onRewardedVideoAdReward', () => { rewarded = true; });

  window.OMS_rewardedReady = function(){ return ready; };

  window.OMS_showRewarded = function () {
    return new Promise(async (resolve) => {
      if (!ready){ loadAd(); resolve(false); return; }   // the button is gated on readiness, but stay safe
      let settled = false;
      const finish = (v) => { if (!settled) { settled = true; resolve(v); } };
      rewarded = false;
      const closeSub = await AdMob.addListener('onRewardedVideoAdDismissed', async () => {
        if (closeSub && closeSub.remove) await closeSub.remove();
        // The ad deactivated the iOS audio session — reactivate it before the reward callback runs,
        // so the fanfare + resumed gameplay aren't silent (WebAudio stays 'running' but muted).
        try { if (window.OMS_AudioSession && window.OMS_AudioSession.reactivate) await window.OMS_AudioSession.reactivate(); } catch (e) {}
        ready = false;
        loadAd();          // preload the next one so the button can light up again
        finish(rewarded);
      });
      try { await AdMob.showRewardVideoAd(); }
      catch (e) { ready = false; loadAd(); finish(false); }
    });
  };

  loadAd();   // preload the first ad on startup
})();
