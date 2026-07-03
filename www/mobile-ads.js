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
  const TESTING_ADS = true;

  const REWARDED = {
    ios:     'ca-app-pub-4322452976770818/4305833249',   // real iOS rewarded unit
    android: 'ca-app-pub-3940256099942544/5224354917',   // TODO: real Android unit when Android ships (Google TEST id for now)
  };
  const adId = REWARDED[platform] || REWARDED.android;

  try { await AdMob.initialize({ initializeForTesting: TESTING_ADS }); } catch (e) {}

  window.OMS_showRewarded = function () {
    return new Promise(async (resolve) => {
      let rewarded = false, settled = false;
      const finish = (v) => { if (!settled) { settled = true; resolve(v); } };
      try {
        const rewardSub = await AdMob.addListener('onRewardedVideoAdReward',    () => { rewarded = true; });
        const closeSub  = await AdMob.addListener('onRewardedVideoAdDismissed', async () => {
          if (rewardSub && rewardSub.remove) await rewardSub.remove();
          if (closeSub  && closeSub.remove)  await closeSub.remove();
          // The ad deactivated the iOS audio session — reactivate it before the reward callback runs,
          // so the fanfare + resumed gameplay aren't silent (WebAudio stays 'running' but muted).
          try { if (window.OMS_AudioSession && window.OMS_AudioSession.reactivate) await window.OMS_AudioSession.reactivate(); } catch (e) {}
          finish(rewarded);
        });
        await AdMob.prepareRewardVideoAd({ adId, isTesting: TESTING_ADS });
        await AdMob.showRewardVideoAd();
      } catch (e) { finish(false); }
    });
  };
})();
