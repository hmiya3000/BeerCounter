import { Injectable } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Platform } from '@ionic/angular/standalone';
import { AdLoadInfo, AdMobInitializationOptions, AdMobRewardItem, AdOptions, BannerAdOptions, RewardAdOptions, } from '@capacitor-community/admob';
import { TrackingAuthorizationStatusInterface } from '@capacitor-community/admob/dist/esm/shared/tracking-authorization-status.interface';

@Injectable({
  providedIn: 'root',
})
export class MockService {

  private mockBannerElement: HTMLElement | null = null;
  private mockVideoScreenElement: HTMLElement | null = null;

  private sizeChangedListenerFunc:              ((event: any) => void) | null = null;
  private rewardedVideoAdRewardListenerFunc:    ((event: any) => void) | null = null;
  private rewardedVideoAdDismissedListenerFunc: ((event: any) => void) | null = null;

  private adBannerHeight:number         = 0;
  private bannerAdOptions:any;

  constructor(
    private platform: Platform,
  ) {
  }

  //===========================================================================
  public async trackingAuthorizationStatus() : Promise<TrackingAuthorizationStatusInterface>{
    console.log('[Mock]trackingAuthorizationStatus()');
    const status:TrackingAuthorizationStatusInterface = {status:'authorized'};
    return status;
  }
  public async requestTrackingAuthorization(): Promise<TrackingAuthorizationStatusInterface>{
    console.log('[Mock]requestTrackingAuthorization()');
    const status:TrackingAuthorizationStatusInterface = {status:'authorized'};
    return status;
  }
  public addListener( eventName: string, listenerFunc: (event: any) => void ): Promise<PluginListenerHandle> & PluginListenerHandle{
    console.log('[Mock]addListener(eventName:',eventName);

    if (eventName === 'bannerAdSizeChanged') {
      this.sizeChangedListenerFunc = listenerFunc;
      console.log('[Mock]「 bannerAdSizeChanged 」の関数を金庫へ完璧に人質としてホールドしました！');

    } else if (eventName === 'onRewardedVideoAdReward') {
      this.rewardedVideoAdRewardListenerFunc    = listenerFunc;
      console.log('[Mock]「 onRewardedVideoAdReward 」の関数を金庫へ完璧に人質としてホールドしました！');

    } else if (eventName === 'onRewardedVideoAdDismissed') {
      this.rewardedVideoAdDismissedListenerFunc = listenerFunc;
      console.log('[Mock]「 onRewardedVideoAdDismissed 」の関数を金庫へ完璧に人質としてホールドしました！');
    }
    //----------
    const handle: PluginListenerHandle = {
      remove: async () => {
        console.log(`[Mock] remove listener for: ${eventName}`);
        if (eventName === 'bannerAdSizeChanged') {
          this.sizeChangedListenerFunc = null;
        } else if (eventName === 'onRewardedVideoAdReward') {
          this.rewardedVideoAdRewardListenerFunc = null;
        } else if (eventName === 'onRewardedVideoAdDismissed') {
          this.rewardedVideoAdDismissedListenerFunc = null;
        }
      }
    }
    return Object.assign(Promise.resolve(handle), handle);  
  }  
  public async initialize(options?: AdMobInitializationOptions): Promise<void>{
    console.log('[Mock]initialize(initializeForTesting:',options?.initializeForTesting,'testingDevices:',options?.testingDevices);
  }
  //===========================================================================
  public async showBanner(options: BannerAdOptions): Promise<void>{
    console.log('[Mock]showBanner(margin:',options.margin,'isTesting:',options.isTesting,'adId',options.adId);
    this.bannerAdOptions  = options;
    if (this.platform.is('android')) {
      this.adBannerHeight = 56;
    } else if (this.platform.is('ios')) {
      this.adBannerHeight = 65;
    } else {
      this.adBannerHeight = 20;
    }
    setTimeout(() => {
      this.emitMockSizeChangedEvent(this.adBannerHeight, this.bannerAdOptions.margin);
    }, 1 * 1000); // ➔ 1秒（お好みの時間に変更して大正解です）待ってから電波を大射出します！    
  }
  private createMockBannerElement(height: number, margin:number) {
    // すでに存在している場合は二重生成を防ぐために引き算（削除）
    if (this.mockBannerElement) {
      this.mockBannerElement.remove();
    }
    const div = document.createElement('div');
    div.id = 'admob-mock-banner-container';
    Object.assign(div.style, {
      position: 'fixed',
      bottom: `${margin}px`,
      left: '0px',
      width: '100%',
      height: `${height}px`,
      backgroundColor: '#ffe019',
      borderTop: '2px solid #e0e0e0',
      zIndex: '99999', // ➔ タブバーや物件リストよりも絶対に一番上に大出現させる法律です
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#666666',
      fontSize: '12px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    });
    div.innerHTML = `<b>[AdMob Mock Banner (Height: ${height}px / Margin: ${margin}px)]</b> ➔ ナビバーの上に浮き上がっています`;
    document.body.appendChild(div);
    this.mockBannerElement = div;
  }
  private emitMockSizeChangedEvent(height: number, margin:number) {
    console.log(`[Mock] 🕒一定時間が経過しました。AdMob.addListener へ向けて「 bannerSizeChanged 」の偽装イベント電波を大射出します！`);
    const mockEventData = {
      width: window.innerWidth, // 📐 現在のChromeの横幅を全自動で取得
      height: height            // 📐 引数で渡された正確なバナー高さ（56pxなど）を代入
    };
    if (this.sizeChangedListenerFunc != null){
      this.createMockBannerElement(height,margin);
      this.sizeChangedListenerFunc(mockEventData);
    }
  }  
  public hideBanner(){
    console.log('[Mock]hideBanner()');
    if (this.mockBannerElement) {
      this.mockBannerElement.remove();
      this.mockBannerElement = null;
      console.log('[Mock] Dummy banner element removed.');
    }    
  }
  public removeBanner(){
    console.log('[Mock]removeBanner()');
    if (this.mockBannerElement) {
      this.mockBannerElement.remove();
      this.mockBannerElement = null;
      console.log('[Mock] Dummy banner element removed.');
    }
    this.adBannerHeight = 0;
  }
  public resumeBanner(){
    console.log('[Mock]resumeBanner()');
    this.createMockBannerElement(this.adBannerHeight, this.bannerAdOptions.margin)
  }
  //===========================================================================
  public async prepareRewardVideoAd(options: RewardAdOptions): Promise<AdLoadInfo>{
    console.log('[Mock]prepareRewardVideoAd(isTesting:',options.isTesting,'adId:',options.adId);
    await this.sleep(3*1000);
    const loadInfo:AdLoadInfo = {adUnitId:options.adId};
    return loadInfo;
  }
  public async showRewardVideoAd(): Promise<AdMobRewardItem>{
    console.log('[Mock]showRewardVideoAd()');
    const item:AdMobRewardItem = {type:'coins', amount:1};
    this.createMockVideoScreen();

    setTimeout(() => {
      if (this.rewardedVideoAdRewardListenerFunc != null){
        this.rewardedVideoAdRewardListenerFunc(item);
      }
      this.dismissMockVideoScreen();
    }, 10 * 1000); // ➔ 10秒（お好みの時間に変更して大正解です）待ってから電波を大射出します！    
    console.log('[Mock]AdMobRewardItem:',item);
    return item;
  }
  private createMockVideoScreen() {

    if (this.mockVideoScreenElement) { this.mockVideoScreenElement.remove(); }

    // ① 新しいコンテナ（器）をDOMの世界に動的生成します
    const div = document.createElement('div');
    div.id = 'admob-mock-video-screen';
    
    // ② 🌟【これぞ実機の動画広告画面を200%完璧に再現する全画面 fixed スタイルです！】
    // 画面の上下左右の端（0px）をガチッとホールドし、アプリの裏画面を完全に隠蔽（目隠し）します。
    Object.assign(div.style, {
      position: 'fixed', top: '0px', left: '0px',
      width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)', // 🎥 映画館のように美しい90%透過の漆黒スクリーン
      zIndex: '999999', // ➔ アプリ内のあらゆるパーツやAdMobバナーよりも絶対に上に居座る法律です
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box'
    });

    // ③ 目隠しの中身に、ド派手なカウントダウン文字盤を足し算します
    div.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 32px; font-weight: bold; margin-bottom: 12px; color: #ff9800;">🎥 [AdMob Reward Video Playing]</div>
        <div style="font-size: 16px; color: #dddddd;">10秒間、画面の裏側へのタップは完全に強制遮断（ロック）されています...</div>
        <div style="margin-top: 24px; font-size: 13px; color: #888888;">※10秒後に自動で報酬が手渡され、この目隠しは消滅します</div>
      </div>
    `;
    document.body.appendChild(div);
    this.mockVideoScreenElement = div;
  }
  private dismissMockVideoScreen() {
    if (this.mockVideoScreenElement) {
      this.mockVideoScreenElement.remove();
      this.mockVideoScreenElement = null;
      console.log('[Mock] 全画面目隠しスクリーンの引き算（完全消去）が完了いたしました！');
    }
  }
  //===========================================================================
  public async prepareInterstitial(options: AdOptions): Promise<AdLoadInfo>{
    console.log('[Mock]prepareInterstitial(adId:',options.adId);
    const loadInfo:AdLoadInfo = {adUnitId:options.adId};
    return loadInfo;
  }
  public async showInterstitial(): Promise<void>{
    console.log('[Mock]showInterstitial()');
  }
  //===========================================================================
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }  

}
