/* mobile-ads.js — loaded only inside the Capacitor app (index.html loads it when
   window.Capacitor exists). Wires AdMob rewarded video into the game's
   window.OMS_showRewarded hook so the Free-Play "Continue · Ad" revive works.
   Requires: npm i @capacitor-community/admob ; npx cap sync.
   Verify event/method names against your installed plugin version's docs. */
(async function () {
  if (!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob)) return;
  const { AdMob } = window.Capacitor.Plugins;
  const platform = window.Capacitor.getPlatform();

  // TODO: replace with your real AdMob Rewarded ad unit IDs (these are Google TEST ids):
  const REWARDED = {
    ios:     'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
  };
  const adId = REWARDED[platform] || REWARDED.android;

  try { await AdMob.initialize({ initializeForTesting: true }); } catch (e) {}

  window.OMS_showRewarded = function () {
    return new Promise(async (resolve) => {
      let rewarded = false, settled = false;
      const finish = (v) => { if (!settled) { settled = true; resolve(v); } };
      try {
        const rewardSub = await AdMob.addListener('onRewardedVideoAdReward',    () => { rewarded = true; });
        const closeSub  = await AdMob.addListener('onRewardedVideoAdDismissed', async () => {
          if (rewardSub && rewardSub.remove) await rewardSub.remove();
          if (closeSub  && closeSub.remove)  await closeSub.remove();
          finish(rewarded);
        });
        await AdMob.prepareRewardVideoAd({ adId, isTesting: true });  // isTesting:false in production
        await AdMob.showRewardVideoAd();
      } catch (e) { finish(false); }
    });
  };
})();
