import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { TrackingAuthorizationStatusInterface } from '@capacitor-community/admob/dist/esm/shared/tracking-authorization-status.interface';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdMobBannerSize , AdOptions, AdLoadInfo, InterstitialAdPluginEvents ,RewardAdOptions, RewardAdPluginEvents, AdMobRewardItem, AdMobInitializationOptions   } from '@capacitor-community/admob';
//---
import { AD_CONFIG } from 'src/app/config/device-constants';
import { MockService } from './mock-service';
//---
let isAdRotatingGlobal = false;

@Injectable({
  providedIn: 'root'
})
export class AdService {

  private static readonly _adIdBannerDemoiOS:string     = 'ca-app-pub-3940256099942544/2934735716';   //広告ユニットID(バナー) デモ版
  private static readonly _adIdBannerDemoAnd:string     = 'ca-app-pub-3940256099942544/6300978111';   //広告ユニットID(バナー) デモ版
  private static readonly _adIdRewardDemoiOS:string     = 'ca-app-pub-3940256099942544/1712485313';   //広告ユニットID(リワード) デモ版iOS
  private static readonly _adIdRewardDemoAnd:string     = 'ca-app-pub-3940256099942544/5224354917';   //広告ユニットID(リワード) デモ版Android
  private static readonly _adIdInterstitialDemo:string  = 'ca-app-pub-3940256099942544/4411468910';   //広告ユニットID(インターステイシャル) デモ版


  private adSizeChangedListenerHandle:any = null; 
  private adRewardedListenerHandle:any    = null;
  private adDismissedListenerHandle:any   = null;

  //----
  private _adIdBanner:string              = '';
  private _adIdReward:string              = '';
  private _adInterstitial:string          = '';
  //----
  private _isTestMode:boolean                 = false;      //テストモードか否か。AdMob.Initialize()で送った後は変更できない
  private _isInitializedAdInitialize:boolean  = false;      //AdMob.Initialize()の初回実行
  private _isInitializedAdBanner:boolean      = false;      //AdBannerのためのListener等々の初期化
  private _isInitializedAdReward:boolean      = false;      //AdRewardのためのListener等々の初期化
  public  isAdBannerDisplayed:boolean         = false;      //実際の表示状態
  private isActiveShowAdBannerOption:boolean  = false;      // AdMob.showBanner()を送った状態。AdMob.removeBanner()でクリア
  private reqHideBanner:boolean               = false;      // 上位によるhideBanner()を維持しつづける要求
  private _isReqCancelShowAdReward:boolean    = false;      // 上位によるAdRewardの準備からの再生キャンセル要求
  private timerIdAutoReviveBanner: any        = null;

  private _capacitor_getPlatform:string   = '';
  private readonly _arrDeveloperIdfa:string[] = [
//    DEVICE_CONFIG._idfa_iPhone8plus,
//    DEVICE_CONFIG._idfa_iPhone16plus,
//    DEVICE_CONFIG._idfa_iPadmini4,
//    DEVICE_CONFIG._idfa_SO05K
  ];

  constructor(
    private MockSvc: MockService,
    private platform: Platform,
  ) {
    this._capacitor_getPlatform = Capacitor.getPlatform();
  }
  public async initialize(_isTestMode:boolean){
    console.log('[Ad]initialize')

    this.isAdBannerDisplayed    = false;

    this._isTestMode            = _isTestMode;

    this._adIdBanner  = this.getAdIdBanner(_isTestMode);
    this._adIdReward  = this.getAdIdReward(_isTestMode);
    await this.AdInitialize(_isTestMode,this._arrDeveloperIdfa);
    console.log('[Ad]initialize Done')  
  }
  public isInitialized(){
    return this._isInitializedAdInitialize;
  }
  public adTestModeCur()
  {
    return this._isTestMode
  }
  public adIdBannerCur(){
    return this._adIdBanner;
  }
  public adIdBannerProduct(){
    return this.getAdIdBanner(false);
  }
  public adIdRewardCur(){
    return this._adIdReward;
  }
  private getAdIdBanner(_isTestMode:boolean){
    let _adId:string  = AdService._adIdBannerDemoiOS;
    if ( this.platform.is('ios') ){
      _adId      = _isTestMode ? AdService._adIdBannerDemoiOS : AD_CONFIG._adIdBannerProductiOS;
    } else if ( this.platform.is('android') ){
      _adId      = _isTestMode ? AdService._adIdBannerDemoAnd : AD_CONFIG._adIdBannerProductAnd;
    }
    return _adId;
  }
  private getAdIdReward(_isTestMode:boolean){
    let _adId:string  = AdService._adIdRewardDemoiOS;
    if ( this.platform.is('ios') ){
      _adId      = _isTestMode ? AdService._adIdRewardDemoiOS : AD_CONFIG._adIdRewardProductiOS;
    } else if ( this.platform.is('android') ){
      _adId      = _isTestMode ? AdService._adIdRewardDemoAnd : AD_CONFIG._adIdRewardProductAnd;
    }
    return _adId;
  }
  //===========================================================================
  private async AdInitialize(_isTestMode:boolean, _deviceIds: string[]): Promise<void> {

    let authStatus  = await this.AdMob_trackingAuthorizationStatus();
    if (authStatus.status === 'notDetermined') {
      // iOSにトラッキング許可ダイアログを強制表示させ、結果を待つ
      await this.AdMob_requestTrackingAuthorization();
      authStatus  = await this.AdMob_trackingAuthorizationStatus();
    }
    console.log('[Ad]IDFAs=',_deviceIds, 'Final Status=', authStatus.status);
    await this.AdMob_initialize({
      testingDevices: _deviceIds,
      initializeForTesting: _isTestMode,
    });
    this._isInitializedAdInitialize = true;
  }
  //===========================================================================
  public async loadAdBanner(windowSvc: any){
    if (!this._isInitializedAdInitialize){
      console.log('[Ad]Error:loadAdBanner()...AdMob.initialize() is not being called');
      return;
    }
    if (!this._isInitializedAdBanner){
      await this.initAdBanner(this._isTestMode,this._adIdBanner, windowSvc)
    }
    this.showAdBanner(windowSvc);
  }
  public async unloadAdBanner(windowSvc: any){
    if (this.adSizeChangedListenerHandle) {
      await this.adSizeChangedListenerHandle.remove();
      this.adSizeChangedListenerHandle = null;
    }
    await this.AdMob_removeBanner();
    windowSvc.updateLayout(0);
    this.isActiveShowAdBannerOption = false;
    this._isInitializedAdBanner     = false;  //これをクリアするともう一度loadAdBanner()を実行するまでAdBannerは何もしない
    this.isAdBannerDisplayed        = false;
    console.log('[Ad]unloadAdBanner done');
  }
  private async initAdBanner(_isTestMode:boolean, _adId: string, windowSvc: any): Promise<void>  {
    if (this.adSizeChangedListenerHandle) {
      await this.adSizeChangedListenerHandle.remove();
      this.adSizeChangedListenerHandle = null;
    }
    this.adSizeChangedListenerHandle = await this.AdMob_addListener(BannerAdPluginEvents.SizeChanged, async (size: AdMobBannerSize) => {
      console.log(`[Ad]Listen at AdMob SizeChanged(size:${size.width},${size.height})`);
      if (isAdRotatingGlobal) return;
      if (size && size.height > 0) {
        console.log(`[Ad]AdBanner[SizeChanged] 実測高さ: ${size.height}px`);
        windowSvc.updateLayout(size.height);
      }
    });
    if (this.platform.is('android') ){
      if (windowSvc && windowSvc.orientationOnly$) {
        windowSvc.orientationOnly$.subscribe(async () => {
          // 1. 処理が始まった最初の瞬間の「広告が表示されている（>0）」という事実を退避
          console.log('[Ad]received orientationOnly')
          this.isActiveShowAdBannerOption  = false;
          await this._rotateForAndroid(windowSvc);
        });
      }
    }
    this._isInitializedAdBanner = true;
  }
  private _adBannerBuildOptions(marginValue: number): BannerAdOptions  {
    return {
      adId: this._adIdBanner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: marginValue, 
      isTesting: this._isTestMode, 
      npa: true
    };
  }
  private async _rotateForAndroid(windowSvc: any){
    isAdRotatingGlobal = true;
    const nextAndroidMargin   = windowSvc.navigationBarHeight || 0;
    console.log('[Ad]nextAndroidMargin=navigationBarHeight:',nextAndroidMargin)
    try {
      await this.rebootShowBanner(nextAndroidMargin)
    } catch (e) {
      console.error('[Ad]AdMob.remove/show error:', e);
    } finally {
      isAdRotatingGlobal = false; 
    }
  }
  private async rebootShowBanner(margin:number){
    if (this._isInitializedAdBanner){
      console.log(`[Ad]AdMob.removeBanner/showBanner(margin:${margin})`);
      this.isActiveShowAdBannerOption  = false;
      await this.AdMob_removeBanner();
      await this.sleep(150);
      if (!this.reqHideBanner){
        this.isActiveShowAdBannerOption  = true;
        await this.AdMob_showBanner(this._adBannerBuildOptions(margin));
      }
    }
  }
  public sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  public async requestHideAdBanner(){
    if (this._isInitializedAdBanner){
      this.reqHideBanner  = true;
      await this.hideAdBanner();
    }
  }
  private async hideAdBanner(){
    if (this._isInitializedAdBanner){
      if (this.isAdBannerDisplayed) {
        await this.AdMob_hideBanner();
      }
      this.isAdBannerDisplayed = false;
    }
  }
  public async allowResumeAdBanner(windowSvc:any){
    if (this._isInitializedAdBanner){
      this.reqHideBanner  = false;
      if (this.isActiveShowAdBannerOption){
        await this.resumeAdBanner();
      } else {
        let androidAdMargin = 0;
        if (this.platform.is('android')) {
          androidAdMargin = windowSvc.navigationBarHeight || 0; // 縦起動なら 48px が入る
        }
        await this.rebootShowBanner(androidAdMargin);
      }
    }
  }
  private async resumeAdBanner(){
    if (this._isInitializedAdBanner){
      if (!this.isAdBannerDisplayed) {
        await this.AdMob_resumeBanner(); 
      }
      this.isAdBannerDisplayed    = true;
    }
  }
  private async showAdBanner(windowSvc: any){
    console.log('[Ad]loadAdBanner _isInitializedAdInitialize:',this._isInitializedAdInitialize);
    if (!this._isInitializedAdInitialize)return;
    if (this._isInitializedAdBanner){
      if (!this.isAdBannerDisplayed){
        let androidAdMargin = 0;
        if (this.platform.is('android')) {
          androidAdMargin = windowSvc.navigationBarHeight || 0; // 縦起動なら 48px が入る
        }
        this.isActiveShowAdBannerOption  = true;
        await this.AdMob_showBanner(this._adBannerBuildOptions(androidAdMargin));
        this.isAdBannerDisplayed = true;
        console.log('[Ad]AdMob.showAdBanner done');
      } else {
        console.log('[Ad]Banner already displayed')
      }
    }
  }
  //===========================================================================
  public async showAdReward(callback: any){
    if (!this._isInitializedAdReward){
      this.initAdReward(this._isTestMode,this._adIdReward, callback);
    }
    const isTriggered = await this.showRewardVideoAd(this._isTestMode,this._adIdReward);

    return isTriggered;
  }
  public reqCancelShowAdReward(){
    this._isReqCancelShowAdReward = true;
  }
  private async initAdReward(_isTestMode:boolean, _adId: string, callback: any){

    //----
    if (this.adRewardedListenerHandle) {
      await this.adRewardedListenerHandle.remove();
      this.adRewardedListenerHandle = null;
    }
    this.adRewardedListenerHandle = await this.AdMob_addListener(RewardAdPluginEvents.Rewarded, (reward) => {
      console.log('[Ad]Listen at AdMob Rewarded:リワード獲得', reward);
      callback.setExpireTime();
      this.execAdRewardGrant(callback);
    });
    //----
    if (this.adDismissedListenerHandle) {
      await this.adDismissedListenerHandle.remove();
      this.adDismissedListenerHandle = null;
    }
    this.adDismissedListenerHandle = await this.AdMob_addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('[Ad]Listen at AdMob Dismissed:動画が途中で閉じられました');
    });
    this._isInitializedAdReward = true;
    
  }
  public grantAdRewardDebug(callback: any){
    console.log('[Ad]grantAdRewardDebug()');
    callback.setExpireTime();
    this.execAdRewardGrant(callback);
  }
  private async showRewardVideoAd(_isTestMode:boolean, _adId: string): Promise<boolean> {
    this._isReqCancelShowAdReward = false;
    try {
      console.log('[Ad]リワード動画の事前読み込み（ロード）を開始...');
      const options: RewardAdOptions = {
        adId: _adId,
        isTesting: _isTestMode
      };
      await this.AdMob_prepareRewardVideoAd(options);
      if (!this._isReqCancelShowAdReward){
        await this.AdMob_showRewardVideoAd(); // 全画面にドスンと起動！
      } else {
        console.log('[Ad]Cancel!! showRewardVideoAd()',this._isReqCancelShowAdReward)
      }
      this._isReqCancelShowAdReward = false;
      return true;
    } catch (error) {
      console.error('⚠️ [Ad]リワード広告起動エラー:', error);
      this._isReqCancelShowAdReward = false;
      return false;
    }
  }
  private execAdRewardGrant( callback:any) {
    const _nextChenckSec = callback.execAdRewardGrant();
    console.log('[Ad]チェック予定時間[秒]',_nextChenckSec);
    this.timerIdAutoReviveBanner = setTimeout(() => {
      this.checkAndAutoReviveBanner(callback);
    }, _nextChenckSec * 1000);
  }
  public async checkAndAutoReviveBanner(callback:any){
    const _expireTime:number = callback.getExpireTime();
    const dateText = new Date(_expireTime).toLocaleString('ja-JP');
    console.log('[Ad]有効期限：expireTime',dateText)

    if (_expireTime > 0){
      const now = Date.now();
      if ( now - _expireTime >= 500 ){
        console.log('[Ad]報酬切れ...バナー復帰')
        this.cancelTimerAutoReviveBanner();
        callback.expireAdRewardGrant(callback);

      } else {
        console.log('[Ad]報酬有効...バナー消す')
        this.execAdRewardGrant(callback);
      }
    } else {
        console.log('[Ad]報酬なし...バナー復帰')
        this.cancelTimerAutoReviveBanner();
        callback.expireAdRewardGrant(callback);
    }
  }
  private cancelTimerAutoReviveBanner(){
    if (this.timerIdAutoReviveBanner !== null) {
      clearTimeout(this.timerIdAutoReviveBanner);
      this.timerIdAutoReviveBanner = null;
    }
  }
  //===========================================================================
  private async AdInterstitialInit(_isTestMode:boolean, _adId: string, windowSvc: any): Promise<void> {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      // Subscribe prepared interstitial
    });

    let _setAdId =  _adId;
    if (_isTestMode){
      _setAdId = AdService._adIdInterstitialDemo;
    }
    const options: AdOptions = {
      adId: _setAdId,
      isTesting: _isTestMode,
      npa: true
    };
    await this.AdMob_prepareInterstitial(options);
    await this.AdMob_showInterstitial();
  }
  private displayInterstitial(windowSvc: any){
    console.log('[Ad]displayInterstitial')
    const _adId = this._adInterstitial; 
    this.AdInterstitialInit(this._isTestMode, _adId, windowSvc);
  }
  //===========================================================================
  private async AdMob_trackingAuthorizationStatus() : Promise<TrackingAuthorizationStatusInterface>{
    if (this._capacitor_getPlatform === 'web'){
      return await this.MockSvc.trackingAuthorizationStatus();
    } else {
      console.log('[Ad]AdMob.trackingAuthorizationStatus()');
      return await AdMob.trackingAuthorizationStatus();
    }
  }
  private async AdMob_requestTrackingAuthorization(): Promise<void>{
    if (this._capacitor_getPlatform === 'web'){
      this.MockSvc.requestTrackingAuthorization();
    } else {
      console.log('[Ad]AdMob.requestTrackingAuthorization()');
      await AdMob.requestTrackingAuthorization();
    }
  }
  private AdMob_addListener( eventName: string, listenerFunc: (event: any) => void ): Promise<PluginListenerHandle> {
    if (this._capacitor_getPlatform === 'web'){
      return this.MockSvc.addListener(eventName,listenerFunc);
    } else {
      console.log(`[Ad]AdMob.addListener(eventName:${eventName})`);
      return AdMob.addListener(eventName as any, listenerFunc);
    }
  }
  private async AdMob_initialize(options?: AdMobInitializationOptions): Promise<void>{
    if (this._capacitor_getPlatform === 'web'){
      this.MockSvc.initialize(options);
    } else {
      console.log(`[Ad]AdMob.initialize(isTestMode:${options?.initializeForTesting})`)
      await AdMob.initialize(options);
    }
  }
  private async AdMob_removeBanner(){
    if (this._capacitor_getPlatform === 'web'){
      this.MockSvc.removeBanner()
    } else {
      console.log('[Ad]AdMob.removeBanner()');
      await AdMob.removeBanner();      
    }
  }
  private async AdMob_showBanner(options: BannerAdOptions): Promise<void>{
    if (this._capacitor_getPlatform === 'web'){
      this.MockSvc.showBanner(options)
    } else {
      console.log(`[Ad]AdMob.showBanner(margin:${options.margin})`);
      await AdMob.showBanner(options);
    }
  }
  private async AdMob_hideBanner(){
    if (this._capacitor_getPlatform === 'web'){
      this.MockSvc.hideBanner()
    } else {
      console.log('[Ad]AdMob.hideBanner()');
      await AdMob.hideBanner();
    }
  }
  private async AdMob_resumeBanner(): Promise<void>{
    if (this._capacitor_getPlatform === 'web'){
      this.MockSvc.resumeBanner()
    } else {
      console.log('[Ad]AdMob.resumeBanner()');
      await AdMob.resumeBanner();
    }
  }
  private async AdMob_prepareRewardVideoAd(options: RewardAdOptions): Promise<AdLoadInfo>{
    if (this._capacitor_getPlatform === 'web'){
      return this.MockSvc.prepareRewardVideoAd(options)
    } else {
      console.log('[Ad]AdMob.prepareRewardVideoAd(options:',options);
      return await AdMob.prepareRewardVideoAd(options);
    }
  }
  private async AdMob_showRewardVideoAd(): Promise<AdMobRewardItem>{
    if (this._capacitor_getPlatform === 'web'){
      return this.MockSvc.showRewardVideoAd()
    } else {
      console.log('[Ad]AdMob.showRewardVideoAd()');
      return await AdMob.showRewardVideoAd();
    }
  }
  private async AdMob_prepareInterstitial(options: AdOptions): Promise<AdLoadInfo>{
    if (this._capacitor_getPlatform === 'web'){
      return this.MockSvc.prepareInterstitial(options)
    } else {
      console.log(`[Ad]AdMob.prepareInterstitial(adId:${options.adId})`);
      return await AdMob.prepareInterstitial(options);
    }
  }
  private async AdMob_showInterstitial(): Promise<void>{
    if (this._capacitor_getPlatform === 'web'){
      this.MockSvc.showInterstitial()
    } else {
      console.log('[Ad]AdMob.showInterstitial()');
      await AdMob.showInterstitial();
    }
  }
  //===========================================================================
}

